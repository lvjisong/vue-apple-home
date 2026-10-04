<!--
  AppleFileUpload —— Apple 风格文件上传组件（上传逻辑 + 上传动画封装为一体）

  【特性】
  - 原生隐藏 <input> 选择文件/文件夹，由 el-button 触发（不依赖 el-upload 私有内部 API，生产更稳健）
  - 多文件列表（Apple 毛玻璃卡片），上传前可逐个删除；超大 / 超量 / 重复文件自动拦截并提示
  - 支持切片上传（sliceSize>0）与 MD5 加密（md5:true），使用 spark-md5 计算
  - 真实上传走统一 axios 封装（自动注入 token / 业务码解包 / 自动刷新 / 统一错误 / 上传进度）
  - 内置 Apple 风格上传动画（环形进度 + 弹簧回弹 + 文件名切换过渡 + 成功对勾描边）
  - 上传期间锁定删除 / 选择 / 开始按钮；成功或失败后自动清空列表，可重新选择

  【用法】
  <apple-file-upload :uploadParams="uploadParams" />

  【uploadParams 常用配置】（见下方 props 说明，未传项使用默认值）
  接真实后端时：simulate 设为 false，并填入真实 uploadUrl；
  其余（切片 / MD5 / 大小上限 / 数量上限 / 类型限制）均可按需开启。
-->
<template>
  <div>
    <!-- 原生隐藏文件选择框：不依赖 el-upload 私有内部 API，由 el-button 触发，生产环境更稳健 -->
    <input
      ref="fileInput"
      type="file"
      class="native-file-input"
      :multiple="uploadParams.multiple"
      :accept="uploadParams.fileTypes"
      @change="handleFileChange"
    />

    <!-- 按钮行 + 文件列表包在相对定位容器里：列表用绝对定位浮在按钮下方，不挤占页面流 -->
    <div class="apple-upload-area">
      <div class="upload-row">
        <!-- 次级按钮：选择文件/文件夹（上传中禁用） -->
        <el-button
          class="apple-btn apple-btn-secondary"
          :disabled="uploading"
          @click="chooseFile($event)"
          >选择{{ uploadParams.webkitdirectory ? "文件夹" : "文件" }}</el-button
        >
        <!-- 主按钮：开始上传（上传中或处理中禁用） -->
        <el-button
          class="apple-btn apple-btn--gap"
          type="primary"
          :disabled="uploading || processingAny"
          @click="submitUpload($event)"
          >开始上传</el-button
        >
        <!-- 大小上限提示（未配置时不显示） -->
        <span v-if="maxSizeText" class="apple-upload-limit">单个文件不超过 {{ maxSizeText }}</span>
      </div>

      <!-- Apple 风格已选文件列表：多文件卡片，上传前可逐个删除（上传中禁用删除） -->
      <div v-if="pendingFiles.length" class="apple-file-list">
        <div v-for="file in pendingFiles" :key="file.uid" class="apple-file-card">
          <!-- 文件类型图标 -->
          <div class="apple-file-card__icon">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                :d="ICONS.file"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linejoin="round"
              />
              <path
                :d="ICONS.fileNew"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <!-- 文件名 + 大小 / 处理状态 -->
          <div class="apple-file-card__info">
            <p class="apple-file-card__name" :title="file.name">
              {{ file.name }}
            </p>
            <p class="apple-file-card__size">
              {{ formatSize(file.size) }}
              <span v-if="file.processing"> · 处理中…</span>
              <span v-else-if="file.sliced"> · {{ file.chunks.length }} 分片 · 已就绪</span>
              <span v-else-if="uploadParams.md5 && file.md5"> · MD5 已就绪</span>
            </p>
          </div>
          <!-- 单文件删除按钮（上传中禁用） -->
          <button
            type="button"
            class="apple-file-card__delete"
            :disabled="uploading"
            :title="'删除 ' + file.name"
            @click="removeFile(file.uid)"
          >
            <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
              <path
                :d="ICONS.closeX"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 内联 Apple 风格文件上传动画：环形进度 + 弹簧回弹 + 对勾描边，与上传逻辑同在一个组件 -->
    <transition name="upload-fade">
      <div
        v-if="uploadState.visible"
        class="apple-upload"
        :style="{ transform: `scale(${cardScale})` }"
        role="status"
        :aria-label="uploadState.message"
      >
        <!-- 环形进度（Apple 风格：iOS 下载进度环） -->
        <div class="apple-upload__ring-wrap">
          <svg class="apple-upload__ring" viewBox="0 0 64 64">
            <circle class="apple-upload__ring-track" cx="32" cy="32" :r="RADIUS" />
            <circle
              class="apple-upload__ring-bar"
              cx="32"
              cy="32"
              :r="RADIUS"
              :stroke-dasharray="CIRCUMFERENCE"
              :stroke-dashoffset="ringOffset"
            />
          </svg>
          <div class="apple-upload__center">
            <!-- 成功：弹簧弹出的对勾 -->
            <template v-if="uploadState.status === 'success'">
              <svg
                viewBox="0 0 28 28"
                class="apple-upload__check"
                :style="{ transform: `scale(${checkScale})` }"
              >
                <path
                  :d="ICONS.check"
                  fill="none"
                  stroke="#34c759"
                  stroke-width="3.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  :style="{
                    strokeDasharray: CHECK_LEN,
                    strokeDashoffset: checkOffset,
                  }"
                />
              </svg>
            </template>
            <!-- 失败：醒目的感叹号 -->
            <template v-else-if="uploadState.status === 'error'">
              <span class="apple-upload__fail">!</span>
            </template>
            <!-- 上传中：百分比（由弹簧平滑驱动） -->
            <template v-else>
              <span class="apple-upload__percent">{{ Math.round(smoothProgress) }}%</span>
            </template>
          </div>
        </div>

        <!-- 文件信息 -->
        <div class="apple-upload__meta">
          <p class="apple-upload__title" :style="titleStyle">
            {{ uploadState.title }}
          </p>
          <p class="apple-upload__message">{{ uploadState.message }}</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ICONS } from "@/constants/icons";
import SparkMD5 from "spark-md5"; // MD5 计算库
import { animateSpring } from "../utils/spring"; // 共享弹簧物理引擎（rAF 驱动，可打断）
import request from "../utils/request"; // 统一 axios 封装（token / 业务码 / 自动刷新 / 错误处理 / 上传进度）

// 真实上传请求超时（毫秒）：网络挂起时避免无限等待
const UPLOAD_TIMEOUT = 120000;

export default {
  name: "AppleFileUpload",
  props: {
    /**
     * 上传配置项。
     * 仅传需要覆盖默认值的字段即可，其余自动使用 default 中的默认值。
     * @type {Object}
     * @property {boolean}  multiple        是否允许多选
     * @property {string}   fileTypes       允许的文件类型（accept 语法，如 '.jpg,.png'；空串表示不限）
     * @property {string}   uploadUrl       真实上传接口地址（POST / multipart-form-data）
     * @property {boolean}  webkitdirectory 是否上传文件夹（true 时按目录结构选择）
     * @property {number}   sliceSize       切片大小（字节），0 表示不切片
     * @property {boolean}  md5             是否计算并上传文件 MD5
     * @property {number}   maxFileSize     单个文件大小上限（字节），0 表示不限
     * @property {number}   maxFileCount    最多可选文件数，0 表示不限
     * @property {boolean}  simulate        是否模拟上传（true 预览动画；false 走真实接口）
     * @property {boolean}  mockError       模拟接口是否返回错误（true 演示报错弹窗）
     */
    uploadParams: {
      type: Object,
      default: () => ({
        multiple: true, // 默认允许多选
        fileTypes: "", // 默认文件类型为空
        uploadUrl: "", // 默认上传地址为空
        webkitdirectory: false, // 默认不上传文件夹
        sliceSize: 0, // 默认不切片
        md5: false, // 默认不加密
        maxFileSize: 100 * 1024 * 1024, // 默认单个文件最大 100MB，超过不予上传
        maxFileCount: 0, // 默认不限文件数量；>0 表示最多可选多少个文件
        simulate: true, // 默认模拟上传，便于预览动画；接真实后端时设为 false
        mockError: false, // 模拟接口是否返回错误（true 演示报错弹窗）
      }),
    },
  },

  data() {
    return {
      // ---- SVG 图标 path（从 @/constants/icons 引入）----
      ICONS,

      // ---- 上传业务状态 ----
      // 待上传文件列表，每个文件独立持有处理状态：
      // { uid, raw, name, size, sliced, md5, chunks, processing }
      pendingFiles: [],
      uidSeed: 0, // 自增序号，用于生成文件唯一 uid
      uploading: false, // 是否正在上传（上传期间锁定删除 / 选择 / 开始按钮）
      hideTimer: null, // 成功后自动隐藏动画的定时器句柄
      simTimer: null, // 模拟上传推进进度的定时器句柄

      // ---- Apple 上传动画对外状态 ----
      uploadState: {
        visible: false, // 是否显示动画浮层
        status: "uploading", // uploading | success | error
        title: "", // 标题：当前上传的文件名，或结束时的"上传完成/上传失败"
        message: "正在上传…", // 副文案：进度说明 / 结果说明
        progress: 0, // 整体上传进度 0-100
      },

      // ---- 动画内部弹簧驱动状态 ----
      RADIUS: 26, // 进度环半径
      CHECK_LEN: 22, // 对勾路径长度（用于 stroke-dasharray 描边动画）
      CIRCUMFERENCE: 0, // 进度环周长（挂载时计算）
      smoothProgress: 0, // 弹簧平滑后的进度（驱动环与百分比）
      cardScale: 0.92, // 卡片进入缩放
      checkScale: 0.4, // 成功对勾弹出缩放
      checkOffset: 22, // 对勾描边偏移（22 → 0 为绘制动画）
      // 文件名切换的弹簧过渡（切换时轻微放大 + 上浮 + 淡入）
      titleScale: 1,
      titleTranslateY: 0,
      titleOpacity: 1,
    };
  },
  mounted() {
    // 初始化进度环周长；并让初始进度与父级传入值对齐
    this.CIRCUMFERENCE = 2 * Math.PI * this.RADIUS;
    this.smoothProgress = Math.max(0, Math.min(100, this.uploadState.progress));
  },
  beforeDestroy() {
    // 清理定时器，避免组件销毁后仍有回调
    clearTimeout(this.hideTimer);
    clearInterval(this.simTimer);
    // 取消进行中的弹簧动画，避免 rAF 泄漏
    this._progressSpring && this._progressSpring.cancel();
    this._titleSpring && this._titleSpring.cancel();
  },

  computed: {
    // 是否有文件正在切片 / MD5 处理中
    processingAny() {
      return this.pendingFiles.some((f) => f.processing);
    },
    // 单个文件大小上限的友好文案（未配置时不显示）
    maxSizeText() {
      const max = Number(this.uploadParams.maxFileSize) || 0;
      return max > 0 ? this.formatSize(max) : "";
    },
    // 环形进度偏移：由弹簧平滑后的进度驱动
    ringOffset() {
      const c = this.CIRCUMFERENCE || 2 * Math.PI * this.RADIUS;
      const p = Math.max(0, Math.min(100, this.smoothProgress));
      return c * (1 - p / 100);
    },
    // 文件名标题样式：由弹簧驱动，切换文件时轻微放大 + 上浮 + 淡入
    titleStyle() {
      return {
        transform: `translateY(${this.titleTranslateY}px) scale(${this.titleScale})`,
        opacity: this.titleOpacity,
        transformOrigin: "left center",
        willChange: "transform, opacity",
      };
    },
  },

  watch: {
    // 进入：卡片弹簧缩放回弹；新一轮上传进度必须从 0 起步
    "uploadState.visible"(val) {
      if (val) {
        this.smoothProgress = 0;
        if (this._progressSpring) {
          this._progressSpring.cancel();
          this._progressSpring = null;
        }
        // 标题动画复位，等首次 title 变化再播放
        if (this._titleSpring) {
          this._titleSpring.cancel();
          this._titleSpring = null;
        }
        this.titleScale = 1;
        this.titleTranslateY = 0;
        this.titleOpacity = 1;
        this.$nextTick(() => {
          animateSpring({
            from: 0.92,
            to: 1,
            stiffness: 190,
            damping: 20,
            onUpdate: (v) => {
              this.cardScale = v;
            },
          });
        });
      }
    },
    // 文件名切换：用弹簧过渡，轻微放大 + 上浮 + 淡入，带轻微回弹
    "uploadState.title"() {
      this.animateTitle();
    },
    // 进度：用弹簧平滑，避免进度条跳变
    "uploadState.progress"(val) {
      const target = Math.max(0, Math.min(100, val));
      this._progressSpring && this._progressSpring.cancel();
      this._progressSpring = animateSpring({
        from: this.smoothProgress,
        to: target,
        stiffness: 200,
        damping: 24,
        onUpdate: (v) => {
          this.smoothProgress = v;
        },
      });
    },
    // 成功：对勾描边 + 弹簧弹出
    "uploadState.status"(val) {
      if (val === "success") {
        this.checkOffset = 22;
        this.$nextTick(() => {
          this.checkOffset = 0;
          animateSpring({
            from: 0.4,
            to: 1,
            stiffness: 260,
            damping: 16,
            onUpdate: (v) => {
              this.checkScale = v;
            },
          });
        });
      }
    },
  },

  methods: {
    // ==================== 文件选择与校验 ====================

    /**
     * 打开原生文件选择框。
     * 每次打开前清空 input.value，从而允许删除后再次选择同一个文件。
     * @param {Event} [event] 触发按钮的点击事件，用于按钮自动失焦
     */
    chooseFile(event) {
      // 上传期间不允许选择
      if (this.uploading) {
        return;
      }
      // 按钮自动失焦（避免点击后残留焦点样式）
      if (event && event.currentTarget) {
        event.currentTarget.blur();
      }
      const input = this.$refs.fileInput;
      if (!input) {
        return;
      }
      input.webkitdirectory = this.uploadParams.webkitdirectory;
      input.value = ""; // 清空值，允许删除后重新选择同一个文件
      input.click();
    },

    /**
     * 原生 input 的 change：把选中的文件加入列表，并做数量/大小/重复校验。
     * 每个文件独立进入切片或 MD5 处理流程（processing 置位，处理完复位）。
     * @param {Event} e 原生 change 事件，取 e.target.files
     */
    handleFileChange(e) {
      const files = e.target.files;
      if (!files || !files.length) {
        return;
      }
      for (const raw of Array.from(files)) {
        // 数量上限拦截：已选满 maxFileCount 时停止加入
        const maxCount = Number(this.uploadParams.maxFileCount) || 0;
        if (maxCount > 0 && this.pendingFiles.length >= maxCount) {
          this.$message.warning("最多选择 " + maxCount + " 个文件，已达上限");
          break;
        }
        // 超大文件拦截：超过 maxFileSize 不予加入
        const max = Number(this.uploadParams.maxFileSize) || 0;
        if (max > 0 && raw.size > max) {
          this.$message.warning(
            "「" +
              raw.name +
              "」大小 " +
              this.formatSize(raw.size) +
              "，超过单个文件上限 " +
              this.formatSize(max) +
              "，已跳过"
          );
          continue;
        }
        // 重复检测（文件夹上传按相对路径区分，避免误伤）
        if (this.pendingFiles.some((f) => this.isSameFile(f.raw, raw))) {
          this.$message.info("该文件已选择，请勿重复添加：" + raw.name);
          continue;
        }
        // 单文件模式下，选择新文件前先清空旧列表
        if (!this.uploadParams.multiple) {
          this.pendingFiles = [];
        }
        // 生成该文件的独立状态条目
        const entry = {
          uid: this.getUid(),
          raw: raw,
          data() {
            return { ICONS };
          },
          name: raw.name,
          size: raw.size,
          sliced: false,
          md5: "",
          chunks: [],
          processing: false,
        };
        this.pendingFiles.push(entry);
        // 需要切片则切片，否则如需 MD5 则计算 MD5（各自异步处理，不阻塞其他文件）
        if (this.uploadParams.sliceSize > 0) {
          entry.processing = true;
          this.fileSlice(entry).finally(() => {
            entry.processing = false;
          });
        } else if (this.uploadParams.md5) {
          entry.processing = true;
          this.fileMD5Fun(entry).finally(() => {
            entry.processing = false;
          });
        }
      }
    },

    /**
     * 判断两个 File 是否为同一个文件（名称、大小、修改时间、文件夹相对路径一致）。
     * @param {File} a 参照文件
     * @param {File} b 待比较文件
     * @returns {boolean} 是否相同
     */
    isSameFile(a, b) {
      return (
        !!a &&
        !!b &&
        a.name === b.name &&
        a.size === b.size &&
        a.lastModified === b.lastModified &&
        (a.webkitRelativePath || "") === (b.webkitRelativePath || "")
      );
    },

    /** 生成文件唯一 uid（时间戳 + 自增序号） */
    getUid() {
      this.uidSeed += 1;
      return "file_" + Date.now() + "_" + this.uidSeed;
    },

    /**
     * 文件大小格式化：B / KB / MB，自动去掉多余的 0（如 100.00 MB → 100 MB）。
     * @param {number} size 字节数
     * @returns {string} 格式化后的可读大小
     */
    formatSize(size) {
      if (!size) {
        return "0 B";
      }
      if (size < 1024) {
        return size + " B";
      }
      if (size < 1024 * 1024) {
        return Number((size / 1024).toFixed(1)) + " KB";
      }
      return Number((size / (1024 * 1024)).toFixed(2)) + " MB";
    },

    // ==================== 上传流程 ====================

    /**
     * 开始上传入口：先做前置校验，再按模拟/真实分发。
     * 模拟模式先调模拟接口，成功才展示动画；接口报错则弹窗并解锁。
     * @param {Event} [event] 触发按钮的点击事件，用于按钮自动失焦
     */
    submitUpload(event) {
      // 按钮自动失焦
      if (event && event.currentTarget) {
        event.currentTarget.blur();
      }
      // 未选择文件
      if (!this.pendingFiles.length) {
        this.$message.error("请先选择文件");
        return;
      }
      // 需切片但仍有文件未切片完成
      if (this.uploadParams.sliceSize > 0 && this.pendingFiles.some((f) => !f.sliced)) {
        this.$message.error("文件尚未处理完成，请稍候");
        return;
      }
      // 需 MD5 但仍有文件未计算完成
      if (this.uploadParams.md5 && this.pendingFiles.some((f) => !f.md5)) {
        this.$message.error("文件尚未处理完成，请稍候");
        return;
      }
      // 校验通过：锁定交互（上传期间不可删除/选择/重复开始）
      this.uploading = true;
      // 模拟模式：先调模拟接口，成功才展示上传动画；失败弹窗告知并解锁
      if (this.uploadParams.simulate) {
        this.callMockApi()
          .then(() => {
            this.startUpload();
          })
          .catch((err) => {
            this.uploading = false; // 接口失败解锁
            this.$alert(
              "模拟接口返回错误：" + (err && err.message ? err.message : "未知错误"),
              "上传失败",
              { type: "error", confirmButtonText: "知道了" }
            );
          });
        return;
      }
      // 真实模式：直接启动上传
      this.startUpload();
    },

    /**
     * 模拟后端接口。mockError 为 true 时返回失败，用于演示报错弹窗。
     * @returns {Promise<Object>} 600ms 后 resolve {code:0} 或 reject
     */
    callMockApi() {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (this.uploadParams.mockError) {
            reject(new Error("服务暂不可用，请稍后重试"));
          } else {
            resolve({ code: 0, msg: "ok" });
          }
        }, 600);
      });
    },

    /**
     * 启动上传：初始化动画（从 0% 起、首个文件名），按模拟/真实分发。
     */
    startUpload() {
      const total = this.pendingFiles.length;
      this.uploadState.visible = true;
      this.uploadState.status = "uploading";
      this.uploadState.title = total ? this.pendingFiles[0].name : "正在上传";
      // 多文件时展示"正在上传 1/N"，让用户清楚整体进度
      this.uploadState.message = total > 1 ? "正在上传 1/" + total : "正在上传…";
      this.uploadState.progress = 0;
      if (this.uploadParams.simulate) {
        this.simulateUpload(); // 模拟上传：便于预览动画效果
      } else {
        // 真实上传：逐个文件串行；中途某个文件失败不中断整批，
        // 全部跑完后统一汇总成败
        this.uploadAllFiles().then(({ successCount, failList }) => {
          if (failList.length) {
            this.onUploadPartialFail(successCount, failList);
          } else {
            this.onUploadSuccess(successCount);
          }
        });
      }
    },

    /**
     * 模拟上传：逐个文件推进进度，整体累计到 100 后触发成功。
     * 仅用于没有后端时预览动画效果。
     */
    async simulateUpload() {
      const entries = [].concat(this.pendingFiles);
      const total = entries.length;
      for (let i = 0; i < total; i++) {
        this.uploadState.title = entries[i].name;
        this.uploadState.message = total > 1 ? "正在上传 " + (i + 1) + "/" + total : "正在上传…";
        await new Promise((resolve) => {
          clearInterval(this.simTimer);
          let sub = 0;
          const base = (i / total) * 100;
          this.simTimer = setInterval(() => {
            sub = Math.min(100, sub + Math.random() * 6 + 2);
            this.uploadState.progress = Math.round(base + sub / total);
            if (sub >= 100) {
              clearInterval(this.simTimer);
              this.simTimer = null;
              resolve();
            }
          }, 120);
        });
      }
      this.onUploadSuccess(total);
    },

    /**
     * 真实上传：逐个文件串行上传（整文件或切片），整体进度累计。
     * 【容错策略】中途某个文件失败不会中断整批——
     * 跳过失败文件继续上传剩余文件，全部结束后统一汇总"成功数 + 失败明细"，
     * 由调用方根据结果决定展示成功或部分失败。
     * @returns {Promise<{successCount: number, failList: Array<{name: string, message: string}>}>}
     *          成功数 + 失败文件明细（名称与原因）
     */
    async uploadAllFiles() {
      const entries = [].concat(this.pendingFiles);
      const total = entries.length;
      let successCount = 0; // 已成功上传的文件数
      const failList = []; // 失败的文件明细（名称 + 原因）
      for (let i = 0; i < total; i++) {
        const entry = entries[i];
        this.uploadState.title = entry.name;
        this.uploadState.message = total > 1 ? "正在上传 " + (i + 1) + "/" + total : "正在上传…";
        const base = (i / total) * 100;
        try {
          await this.uploadOne(entry, (fileLocal) => {
            this.uploadState.progress = Math.round(base + fileLocal / total);
          });
          successCount += 1;
        } catch (err) {
          // 单个文件失败：记录原因后继续上传剩余文件，不让一个失败拖垮整批
          failList.push({
            data() {
              return { ICONS };
            },
            name: entry.name,
            message: (err && err.message) || "上传失败",
          });
        }
      }
      return { successCount, failList };
    },

    /**
     * 上传单个文件：有切片则切片上传，否则整文件上传。
     * 通过统一 axios 封装请求（自动 token / 业务码 / 自动刷新 / 错误处理）；
     * silentError=true 让错误由本组件统一展示，避免与全局提示重复。
     * @param {Object} entry      文件状态条目（含 raw / chunks / md5 等）
     * @param {Function} onProgress 该文件内进度回调 0-100
     * @returns {Promise<void>} 成功 resolve，失败 reject(Error)
     */
    uploadOne(entry, onProgress) {
      if (this.uploadParams.sliceSize > 0 && entry.sliced) {
        return this.uploadChunks(entry, onProgress);
      }
      const formData = new FormData();
      formData.append("file", entry.raw);
      // 如需 MD5，则随请求一并上传
      if (this.uploadParams.md5) {
        formData.append("md5", entry.md5);
      }
      return request.post(this.uploadParams.uploadUrl, formData, {
        timeout: UPLOAD_TIMEOUT,
        silentError: true, // 错误由本组件统一汇总展示
        onUploadProgress: (e) => {
          if (e.lengthComputable) {
            onProgress((e.loaded / e.total) * 100);
          }
        },
      });
    },

    /**
     * 切片上传：逐个切片顺序发送，全部成功 resolve。
     * 分片字段含 filename / chunkNumber / totalChunks，供后端重组。
     * @param {Object} entry      文件状态条目（chunks 为切片数组）
     * @param {Function} onProgress 该文件内累计进度回调 0-100
     * @returns {Promise<void>} 全部切片成功 resolve，任一片失败 reject
     */
    uploadChunks(entry, onProgress) {
      return new Promise((resolve, reject) => {
        const total = entry.chunks.length;
        let uploaded = 0;
        const next = () => {
          if (uploaded >= total) {
            resolve();
            return;
          }
          const chunk = entry.chunks[uploaded];
          const formData = new FormData();
          formData.append("file", chunk);
          formData.append("filename", entry.name); // 供后端重组分片
          formData.append("chunkNumber", uploaded);
          formData.append("totalChunks", total);
          // 如需 MD5，则随请求一并上传
          if (this.uploadParams.md5) {
            formData.append("md5", entry.md5);
          }
          request
            .post(this.uploadParams.uploadUrl, formData, {
              timeout: UPLOAD_TIMEOUT,
              silentError: true, // 错误由本组件统一汇总展示
              onUploadProgress: (e) => {
                if (e.lengthComputable) {
                  const local = ((uploaded + e.loaded / e.total) / total) * 100;
                  onProgress(local);
                }
              },
            })
            .then(() => {
              uploaded++;
              next();
            })
            .catch((err) => {
              reject(err);
            });
        };
        next();
      });
    },

    /**
     * 全部成功：动画切到对勾状态，展示整体结果，短暂停留后自动隐藏并清空列表。
     * @param {number} [successCount] 成功上传的文件数（缺省取当前列表长度，模拟模式使用）
     */
    onUploadSuccess(successCount) {
      this.uploading = false; // 解锁
      // 记录本次成功上传的文件数（在清空列表前）
      const total = typeof successCount === "number" ? successCount : this.pendingFiles.length;
      // 结束时不展示单个文件名，改为整体结果，避免用户疑惑"为什么停在最后一个文件"
      this.uploadState.status = "success";
      this.uploadState.title = "上传完成";
      this.uploadState.progress = 100;
      this.uploadState.message = total > 1 ? total + " 个文件上传成功" : "文件上传成功";
      // 文件已消费，清除，避免再次点击"开始上传"复用
      this.resetFileState();
      clearTimeout(this.hideTimer);
      this.hideTimer = setTimeout(() => {
        this.uploadState.visible = false;
      }, 2500);
    },

    /**
     * 部分失败（至少一个文件上传失败）：动画切到错误状态并汇总结果。
     * 已成功的文件不浪费，失败文件在弹窗中逐个列出原因；
     * 文件列表照常清空，等待用户重新选择。
     * @param {number} successCount 成功上传的文件数
     * @param {Array<{name: string, message: string}>} failList 失败文件明细
     */
    onUploadPartialFail(successCount, failList) {
      this.uploading = false; // 解锁
      this.uploadState.status = "error";
      // 结束时不展示单个文件名，改为整体结果
      this.uploadState.title = "上传未完成";
      this.uploadState.message = "成功 " + successCount + " 个，失败 " + failList.length + " 个";
      // 弹窗逐个列出失败文件及原因，方便用户确认后重新上传
      this.$alert(
        "以下文件上传失败：\n" + failList.map((f) => f.name + "（" + f.message + "）").join("\n"),
        "上传未完成",
        { type: "error", confirmButtonText: "知道了" }
      );
      this.resetFileState();
    },

    /** 清除已选择的旧文件，等待用户重新选择 */
    resetFileState() {
      this.pendingFiles = [];
    },

    /**
     * 上传前删除单个已选文件。
     * @param {string} uid 文件状态条目的唯一标识
     */
    removeFile(uid) {
      // 上传期间不允许删除
      if (this.uploading) {
        return;
      }
      const idx = this.pendingFiles.findIndex((f) => f.uid === uid);
      if (idx > -1) {
        this.pendingFiles.splice(idx, 1);
      }
      this.$message.info("已移除该文件");
    },

    // ==================== 文件预处理（切片 / MD5） ====================

    /**
     * 对单个文件切片；如需 MD5 则同步计算整体 MD5。
     * 处理完成后把结果写入 entry.chunks / entry.md5 / entry.sliced。
     * @param {Object} entry 文件状态条目
     */
    async fileSlice(entry) {
      const chunkSize = this.uploadParams.sliceSize;
      const chunks = [];
      let currentChunk = 0;
      // 按 chunkSize 循环切片
      while (currentChunk < entry.raw.size) {
        chunks.push(
          entry.raw.slice(currentChunk, Math.min(entry.raw.size, currentChunk + chunkSize))
        );
        currentChunk += chunkSize;
      }
      entry.chunks = chunks;
      // 不需要加密则直接标记已切片
      if (!this.uploadParams.md5) {
        entry.sliced = true;
        return;
      }
      // 需要加密：逐个切片累加计算整体 MD5
      entry.md5 = "";
      const fileReader = new FileReader();
      const spark = new SparkMD5.ArrayBuffer();
      for (let chunk of chunks) {
        await new Promise((resolve) => {
          fileReader.onload = (e) => {
            spark.append(e.target.result); // 把切片内容累加进 spark
            resolve();
          };
          fileReader.readAsArrayBuffer(chunk); // 以 ArrayBuffer 读取切片
        });
      }
      entry.md5 = spark.end(false); // 获取整体文件 MD5
      entry.sliced = true; // 标记已切片并完成 MD5
    },

    /**
     * 对单个文件计算 MD5（整文件一次性读取）。
     * @param {Object} entry 文件状态条目，完成后写入 entry.md5
     */
    async fileMD5Fun(entry) {
      entry.md5 = "";
      const fileReader = new FileReader();
      const spark = new SparkMD5.ArrayBuffer();
      await new Promise((resolve) => {
        fileReader.onload = (e) => {
          spark.append(e.target.result); // 把文件内容累加进 spark
          resolve();
        };
        fileReader.readAsArrayBuffer(entry.raw); // 以 ArrayBuffer 读取整个文件
      });
      entry.md5 = spark.end(false); // 获取文件 MD5
    },

    // ==================== 动画辅助 ====================

    /** 文件名切换时的弹簧过渡：从淡出态回弹到稳定态 */
    animateTitle() {
      if (this._titleSpring) {
        this._titleSpring.cancel();
      }
      // 从淡出态出发，弹簧回弹到稳定
      this.titleScale = 0.88;
      this.titleTranslateY = 8;
      this.titleOpacity = 0.2;
      this._titleSpring = animateSpring({
        from: 0,
        to: 1,
        stiffness: 260,
        damping: 20,
        onUpdate: (p) => {
          this.titleScale = 0.88 + 0.12 * p;
          this.titleTranslateY = (1 - p) * 8;
          this.titleOpacity = Math.min(1, 0.2 + 0.8 * p);
        },
      });
    },
  },
};
</script>

<style lang="scss">
/* 按钮行：默认居左展示，组件可在任意页面容器中靠左调用（width/max-width 由使用方容器决定） */
.upload-row {
  display: flex;
  align-items: center;
  margin: 0;
  width: 100%;
  max-width: 350px;
}

/* ---- Apple 风格按钮：参考 apple.com 按钮的方形圆角 + 主/次级层次 ---- */
.upload-row .apple-btn {
  border-radius: 8px; /* 方形圆角，参照 apple.com 按钮样式 */
  font-family: $font-stack-text;
  font-weight: 500;
  letter-spacing: -0.01em;
  transition: transform 100ms ease-out, background-color 150ms ease-out, border-color 150ms ease-out,
    box-shadow 200ms ease-out;
}
/* 按压反馈：按下时轻微缩小，回应在 pointer-down 立即发生 */
.upload-row .apple-btn:not(.is-disabled):active {
  transform: scale(0.97);
}

/* 次级按钮（选择文件）：Apple 浅色玻璃底 */
.upload-row .apple-btn-secondary {
  background: rgba(255, 255, 255, 0.82);
  border-color: rgba(60, 60, 67, 0.2);
  color: #1d1d1f;
}

/* 主按钮与选择按钮之间的间距 */
.upload-row .apple-btn--gap {
  margin-left: 10px;
}
.upload-row .apple-btn-secondary:not(.is-disabled):hover,
.upload-row .apple-btn-secondary:not(.is-disabled):focus {
  background: rgba(255, 255, 255, 0.98);
  border-color: rgba(60, 60, 67, 0.28);
  color: #1d1d1f;
}

/* 主按钮（开始上传）：Apple 系统蓝 */
.upload-row .el-button--primary {
  background: #0a84ff;
  border-color: #0a84ff;
  color: #ffffff;
}
.upload-row .el-button--primary:not(.is-disabled):hover,
.upload-row .el-button--primary:not(.is-disabled):focus {
  background: #0071e3;
  border-color: #0071e3;
  color: #ffffff;
}

/* 禁用态：柔化置灰，弱化视觉干扰 */
.upload-row .apple-btn.is-disabled {
  opacity: 0.45;
}

/* Apple 风格大小上限提示 */
.apple-upload-limit {
  margin-left: 12px;
  font-size: 12px;
  color: #6e6e73;
  font-family: $font-stack-text;
}

/* 原生文件选择框隐藏，仅由按钮触发 */
.native-file-input {
  display: none;
}

/* 按钮行 + 文件列表的定位锚点：列表绝对定位浮在按钮下方，本身只占按钮高度，不挤占页面流 */
.apple-upload-area {
  position: relative;
}

/* ---- Apple 风格已选文件列表 ----
   绝对定位浮在上传按钮正下方（top:100% = 按钮行高度），left:0 与按钮左对齐；
   脱离文档流，不撑高页面、不挤压下方内容，浮在页面上层。 */
.apple-file-list {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 100; /* 浮在页面其他内容之上 */
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 10px 0 0; /* 与按钮保持原间距 */
  width: 100%;
  max-width: 350px;
  /* 外层高度限制：超出后在列表内部滚动 */
  max-height: 260px;
  overflow-y: auto;
  padding-right: 4px; /* 预留滚动条空间，避免遮挡卡片 */
}

/* Apple 风格细滚动条 */
.apple-file-list::-webkit-scrollbar {
  width: 6px;
}
.apple-file-list::-webkit-scrollbar-thumb {
  background: rgba(120, 120, 128, 0.32);
  border-radius: 3px;
}
.apple-file-list::-webkit-scrollbar-track {
  background: transparent;
}

/* ---- Apple 风格已选文件卡片 ----
   去掉整体区域的毛玻璃背景（background + backdrop-filter），使列表区域透明；
   每条文件卡片外框改用清晰的层级阴影来勾勒，弱化玻璃感、强化卡片边界。 */
.apple-file-card {
  display: flex;
  align-items: center;
  gap: 10px;
  box-sizing: border-box;
  padding: 10px 12px;
  border-radius: 14px;
  background: transparent;
  /* box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04),
                0 4px 12px rgba(0, 0, 0, 0.08),
                0 12px 28px rgba(0, 0, 0, 0.06); */
  font-family: $font-stack-text;
  text-align: left;
  border: 1px solid rgba(60, 60, 67, 0.18);
}

.apple-file-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 10px;
  background: rgba(10, 132, 255, 0.14);
  color: #0a84ff;
}

.apple-file-card__info {
  min-width: 0;
  flex: 1;
}

.apple-file-card__name {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #1d1d1f;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.apple-file-card__size {
  margin: 2px 0 0;
  font-size: 12px;
  color: #6e6e73;
}

.apple-file-card__delete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  margin-left: 2px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(120, 120, 128, 0.12);
  color: #48484a;
  cursor: pointer;
  transition: background 120ms ease-out, transform 120ms ease-out, color 120ms ease-out;
}
.apple-file-card__delete:hover {
  background: rgba(255, 59, 48, 0.15);
  color: #ff3b30;
}
.apple-file-card__delete:active {
  transform: scale(0.9);
}
.apple-file-card__delete[disabled] {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

/* ---- 内联上传动画：Apple 毛玻璃浮层卡片 ---- */
.apple-upload {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 2100;
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 280px;
  max-width: 360px;
  box-sizing: border-box;
  padding: 18px 20px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  backdrop-filter: blur(30px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.08);
  font-family: $font-stack-text;
  will-change: transform, opacity;
}

/* ---- 环形进度 ---- */
.apple-upload__ring-wrap {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
}

.apple-upload__ring {
  width: 64px;
  height: 64px;
  transform: rotate(-90deg);
}

.apple-upload__ring-track {
  fill: none;
  stroke: rgba(120, 120, 128, 0.18);
  stroke-width: 5;
}

.apple-upload__ring-bar {
  fill: none;
  stroke: #0a84ff; /* Apple 系统蓝 */
  stroke-width: 5;
  stroke-linecap: round;
  transition: stroke 200ms ease;
}

.apple-upload__center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.apple-upload__percent {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #1d1d1f;
}

.apple-upload__fail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #ff3b30;
  color: #ffffff;
  font-size: 17px;
  font-weight: 700;
}

.apple-upload__check {
  width: 30px;
  height: 30px;
  will-change: transform;
}
/* 对勾描边绘制动画：stroke-dashoffset 需 CSS transition 才能平滑过渡 */
.apple-upload__check path {
  transition: stroke-dashoffset 360ms ease 40ms;
}

/* ---- 文本信息 ---- */
.apple-upload__meta {
  min-width: 0;
  flex: 1;
}

.apple-upload__title {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #1d1d1f;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.apple-upload__message {
  margin: 0;
  font-size: 13px;
  color: #6e6e73;
}

/* ============================================================
 * Vue Transition 动画 - 文件上传弹窗（upload-fade）
 * ------------------------------------------------------------
 * 模板里：<transition name="upload-fade">
 * 作用：文件上传弹窗的淡入淡出
 * 动画：opacity 渐变
 * ============================================================ */
.upload-fade-enter-active,
.upload-fade-leave-active {
  transition: opacity 180ms ease;
}
.upload-fade-enter-from,
.upload-fade-leave-to {
  opacity: 0;
}

/* ---- 减弱动态效果：关闭弹簧与模糊 ---- */
@media (prefers-reduced-motion: reduce) {
  .apple-upload {
    transform: none !important;
  }
}
@media (prefers-reduced-transparency: reduce) {
  .apple-upload {
    background: #ffffff;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}
</style>
