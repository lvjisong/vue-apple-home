/**
 * ============================================================
 * 应用入口 main.js（Vue 3 写法）
 * ------------------------------------------------------------
 * Vue 3 用 createApp 创建应用实例，替代 Vue 2 的 new Vue()。
 * 每个 app 实例独立，不再共享全局 Vue 对象。
 * ============================================================
 */
import { createApp } from "vue";
import App from "./App.vue";
import router from "@/router";
import store from "@/store";

// Element Plus（Vue 3 版组件库，替代 Element UI）
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

// 全局样式入口（reset + 变量 + mixins）
import "@/styles/main.scss";
// 主题变量（跟随系统深浅色，组件里用 var(--xxx) 引用）
import "@/styles/theme.scss";

const app = createApp(App);

// ======== 全局错误捕获（生产环境必备） ========
// 作用：组件渲染出错、事件处理出错、生命周期出错，都会被这里捕获
// 没有这个：用户看到白屏，开发不知道哪里错了
// 有了这个：至少能在控制台看到错误，线上可以上报到监控系统（Sentry）
app.config.errorHandler = (err, vm, info) => {
  // err：错误对象
  // vm：出错的组件实例（this）
  // info：出错的具体位置（比如 "render function" / "event handler" / "created hook"）
  console.error("【全局错误】", err);
  console.error("【出错位置】", info);

  // TODO-PRODUCTION: 接后端后，这里上报到错误监控系统
  // 例如：Sentry.captureException(err, { extra: { info, component: vm.$options.name } });
};

// 全局警告也打出来（开发环境有用，生产环境可以删掉）
app.config.warnHandler = (msg, vm, trace) => {
  console.warn("【Vue 警告】", msg);
  console.warn("【组件栈】", trace);
};

app.use(router);
app.use(store);
app.use(ElementPlus);

app.mount("#app");
