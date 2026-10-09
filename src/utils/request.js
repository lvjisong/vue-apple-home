/**
 * ============================================================
 * utils/request.js —— 统一 axios 实例（全项目请求唯一出口）
 * ------------------------------------------------------------
 * 职责：
 *   1. 请求拦截器：自动注入 Bearer token；FormData 上传时放开 Content-Type。
 *   2. 响应拦截器：解包 {code,data,msg} 业务结构；业务错误弹中文提示。
 *   3. 401 自动刷新 token（单飞 + 排队重试，并发只刷一次）。
 *   4. GET 失败自动重试最多 2 次（指数退避 1s/2s），POST 默认不重试。
 * 用法：import request from '@/utils/request'; request.get/post(...)。
 * 接后端需改：REFRESH_URL、token 结构、redirectToLogin（可改 router.push）。
 * ============================================================
 */
import axios from "axios";
// Element Plus 消息提示（Vue 3 版，替代 element-ui）
import { ElMessage as Message } from "element-plus";
import auth from "@/utils/auth";

/**
 * request —— 项目统一的 axios 封装（生产可用）
 *
 * 【能力】
 *  1. baseURL 统一基地址：默认空串，可用环境变量 VUE_APP_BASE_API 覆盖；
 *     调用方传入完整 url 时会自动忽略 baseURL。
 *  2. 请求拦截器：自动注入 token（Authorization: Bearer）；处理 FormData 的 Content-Type。
 *  3. 响应拦截器：解包业务结构 { code, data, msg }，code 0 / 200 视为成功并返回 data；
 *     非成功自动 reject 并（默认）弹错提示。
 *  4. 自动刷新 token：收到 401 时自动调用刷新接口、更新 token 并重试原请求；
 *     并发 401 去重（单飞）+ 排队重试；刷新失败则清 token 并跳转登录。
 *  5. 统一错误处理：HTTP 状态 / 超时 / 网络异常映射为中文提示（Element UI Message）。
 *  6. 支持上传进度：config.onUploadProgress 即可拿到进度（axios 浏览器端底层即 XHR）。
 *  7. 支持局部静默：config.silentError = true 时跳过全局错误提示，由调用方自行处理。
 *
 * 【用法】
 *   import request from '@/utils/request'
 *   request.get(url, { params }) / request.post(url, data, config)
 *   request.post(uploadUrl, formData, { onUploadProgress, timeout, silentError: true })
 *
 * 【接入前需按项目调整的配置】见下方 REFRESH_URL / token 存取 / redirectToLogin 注释。
 */

// ==================== Token 存取 ====================
// 统一走 @/utils/auth.js（Cookie + Vuex），不要在本文件直接读写
/** 读取访问 token */
function getToken() {
  return auth.getToken() || "";
}

/** 读取刷新 token（走 auth.js；后端不支持时 auth.getRefreshToken 返回空串） */
function getRefreshToken() {
  return auth.getRefreshToken() || "";
}

/** 写入新 token（登录成功时由 auth.setToken 处理） */
function setTokens(accessToken) {
  auth.setToken(accessToken);
}

/** 清除全部 token（登出/续期失败时调用） */
function clearTokens() {
  auth.logout();
}

// ==================== 自动刷新 token 配置 ====================
// 刷新 token 的接口地址（按项目实际调整）
const REFRESH_URL = "/auth/refresh";
// 是否正在刷新：标志位防止并发 401 触发多次刷新（单飞去重）
let isRefreshing = false;
// 刷新期间到达的 401 请求排队，等拿到新 token 后统一重试
let waitQueue = [];

/**
 * 跳转登录页。
 * 项目未引入 router，直接用 location 跳转；
 * 若接入 vue-router，可改为 router.push('/login')。
 */
function redirectToLogin() {
  // 避免在登录页上重复跳转造成死循环
  if (window.location && !window.location.pathname.includes("/login")) {
    window.location.href = "/login";
  }
}

/**
 * 调用刷新接口获取新 token。
 * 注意：这里使用【原始 axios】而非本实例 service，
 *      避免重新进入本实例拦截器造成无限递归。
 * 约定后端返回 { code, data: { token, refresh_token } }；可按项目实际结构调整。
 * @returns {Promise<string>} 新 access token
 */
async function requestNewToken() {
  const res = await axios.post(REFRESH_URL, {
    refresh_token: getRefreshToken(),
  });
  const data = res && res.data;
  const payload = data && data.data;
  if (!payload || !payload.token) {
    throw new Error("刷新 token 响应结构异常");
  }
  setTokens(payload.token);
  return payload.token;
}

/** 业务成功码：0 或 200 均视为成功（可按后端约定扩展） */
function isBizOk(code) {
  return code === 0 || code === 200;
}

/** 从后端响应中提取可读错误信息 */
function getBizMsg(res) {
  return (res && (res.msg || res.message)) || "业务处理失败";
}

// ==================== 实例创建 ====================
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API || "", // 空串时用相对路径或调用方传入的完整 url
  timeout: 120000, // 默认 120s，可在单次请求用 config.timeout 覆盖
});

// ==================== 请求拦截器 ====================
service.interceptors.request.use(
  (config) => {
    // 注入 token：有 token 才加，避免未登录时发出带空头请求
    const token = getToken();
    if (token) {
      config.headers.Authorization = "Bearer " + token;
    }
    // FormData 上传：Content-Type 必须由浏览器自动携带 multipart boundary，
    // 若沿用 axios 默认的 application/json 会导致上传失败，这里显式移除
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error) // 请求配置阶段错误，直接透传
);

// ==================== 响应拦截器 ====================
service.interceptors.response.use(
  // ---------- 成功分支：解包业务数据 ----------
  (response) => {
    const config = response.config || {};
    const res = response.data;

    // 二进制流（文件下载等）不按业务结构解析，原样返回
    if (config.responseType === "blob" || config.responseType === "arraybuffer") {
      return res;
    }

    // 约定业务结构 { code, data, msg }
    if (res && typeof res === "object" && "code" in res) {
      if (!isBizOk(res.code)) {
        // 业务失败：提取 msg，默认弹错提示；silentError 时静默
        const bizMsg = getBizMsg(res);
        if (!config.silentError) {
          Message.error(bizMsg);
        }
        return Promise.reject(new Error(bizMsg));
      }
      // 成功：返回业务 data（无 data 时原样返回）
      return res.data !== undefined ? res.data : res;
    }
    // 非业务结构（如普通 json / 纯文本），原样返回
    return res;
  },
  // ---------- 失败分支：自动重试 + 自动刷新 token + 统一错误映射 ----------
  async (error) => {
    const config = error.config || {};
    const status = error.response && error.response.status;

    // ======== 分支零：GET 请求自动重试（网络抖动/5xx 临时故障） ========
    // 规则：
    //   - 默认只重试 GET 请求（POST/PUT/DELETE 有副作用，不自动重试，防止重复提交）
    //   - 最多重试 2 次，每次间隔 1 秒（指数退避）
    //   - 4xx 客户端错误不重试（参数错/没权限/不存在，重试也没用）
    //   - 401 不在这里重试（下面有专门的刷新 token 逻辑）
    //   - 想关闭：请求时加 config.retry = false
    //   - 想开启 POST 重试：请求时加 config.retry = true（谨慎，确认接口幂等）
    const defaultRetry = config.method === "get"; // 默认只有 GET 重试
    const shouldRetry = config.retry !== false && (config.retry === true || defaultRetry);
    const maxRetries = 2; // 最多重试 2 次
    const retryCount = config._retryCount || 0;

    if (
      shouldRetry &&
      retryCount < maxRetries &&
      !status // 没有响应 = 网络错误/超时
    ) {
      config._retryCount = retryCount + 1;
      // 指数退避：第 1 次重试等 1s，第 2 次等 2s
      const delay = 1000 * config._retryCount;
      await new Promise((r) => setTimeout(r, delay));
      console.log(`[retry] GET 请求失败，第 ${config._retryCount} 次重试...`);
      return service(config); // 重新发一次请求
    }

    // ======== 分支一：401 且未重试过且非刷新接口本身 → 尝试自动刷新 ========
    if (
      status === 401 &&
      !config._retried &&
      !(config.url && config.url.indexOf(REFRESH_URL) > -1)
    ) {
      // 没有 refresh_token：无法续期，直接按过期处理（清 token + 跳登录）
      if (!getRefreshToken()) {
        clearTokens();
        redirectToLogin();
        if (!config.silentError) {
          Message.error("登录已过期，请重新登录");
        }
        return Promise.reject(error);
      }

      // 已有刷新正在进行：把本次请求入队，等新 token 后统一重试
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          waitQueue.push((tokenOrErr, isErr) => {
            // 刷新成功 → 用新 token 重试；刷新失败 → reject
            if (isErr) {
              reject(tokenOrErr);
              return;
            }
            config._retried = true;
            resolve(service(config)); // 重新走一遍完整拦截器，自动带上新 token
          });
        });
      }

      // 触发一次刷新（单飞）：同一时刻只允许一个刷新请求在途
      isRefreshing = true;
      return requestNewToken()
        .then((token) => {
          isRefreshing = false;
          const pending = waitQueue;
          waitQueue = [];
          // 唤醒所有排队请求，用新 token 重试
          pending.forEach((cb) => cb(token, false));
          config._retried = true;
          return service(config); // 重试当前请求
        })
        .catch((err) => {
          isRefreshing = false;
          const pending = waitQueue;
          waitQueue = [];
          // 刷新失败：拒绝所有排队请求，并整体登出
          pending.forEach((cb) => cb(err, true));
          clearTokens();
          redirectToLogin();
          if (!config.silentError) {
            Message.error("登录已过期，请重新登录");
          }
          return Promise.reject(err);
        });
    }

    // ======== 分支二：其余错误 → 映射为中文提示 ========
    let msg = "";
    if (error.response) {
      // 有 HTTP 响应：按状态码映射通用文案
      switch (status) {
        case 400:
          msg = "请求参数错误";
          break;
        case 401:
          msg = "登录已过期，请重新登录";
          break;
        case 403:
          msg = "没有权限访问该资源";
          break;
        case 404:
          msg = "请求的资源不存在";
          break;
        case 405:
          msg = "请求方法不被允许";
          break;
        case 429:
          msg = "请求过于频繁，请稍后再试";
          break;
        case 500:
          msg = "服务器内部错误";
          break;
        case 502:
          msg = "网关错误";
          break;
        case 503:
          msg = "服务暂不可用";
          break;
        case 504:
          msg = "网关超时";
          break;
        default:
          msg = "请求失败（HTTP " + status + "）";
      }
    } else if (error.code === "ECONNABORTED" || /timeout/i.test(error.message || "")) {
      // 超时（axios 超时会以 ECONNABORTED 抛出）
      msg = "请求超时，请稍后重试";
    } else if (error.request) {
      // 已发出请求但未收到响应：多半是网络断开
      msg = "网络异常，请检查网络连接";
    } else {
      // 请求配置阶段 / 其他原因
      msg = (error && error.message) || "未知错误";
    }

    // 默认统一提示；silentError=true 时静默，由调用方自己展示
    if (!config.silentError) {
      Message.error(msg);
    }
    return Promise.reject(new Error(msg));
  }
);

export default service;
