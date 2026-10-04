<template>
  <div id="app">
    <!-- 路由切换顶部进度条（页面切换时顶部显示一条蓝色进度条） -->
    <div v-if="routeLoading" class="route-progress-bar"></div>

    <!-- 路由出口：首页 / 购物车 / 登录 -->
    <router-view v-slot="{ Component }">
      <!-- 6. 错误边界组件：某个页面崩了显示错误提示，不白屏 -->
      <ErrorBoundary>
        <component :is="Component" />
      </ErrorBoundary>
    </router-view>

    <!-- Apple 风格文件上传组件（保留挂载，可按需打开） -->
    <!-- <apple-file-upload :uploadParams="uploadParams" /> -->
  </div>
</template>

<script>
import auth from "@/utils/auth";
import ErrorBoundary from "@/components/common/ErrorBoundary.vue";
// TODO-UPLOAD: Apple 风格文件上传组件（保留挂载，可按需打开）
// import AppleFileUpload from '@/components/common/AppleFileUpload.vue'
export default {
  name: "App",
  components: {
    ErrorBoundary,
    // AppleFileUpload
  },
  data() {
    return {
      // 路由切换 loading 状态：true 时显示顶部进度条
      routeLoading: false,
      // TODO-UPLOAD: 按需打开下面的上传参数配置
      // uploadParams: {
      //   multiple: true, // 是否多选
      //   fileTypes: ".jpg,.jpeg,.png,.gif", // 文件类型（空字符串表示不限）
      //   uploadUrl: "https://www.xxx.com:8080", // 真实上传接口地址
      //   webkitdirectory: false, // 是否上传文件夹
      //   sliceSize: 0, // 切片大小（0 表示不切片）
      //   md5: false, // 是否计算 MD5
      //   maxFileSize: 100 * 1024 * 1024, // 单个文件大小上限（0 表示不限）
      //   maxFileCount: 4, // 最多可选文件数（0 表示不限）
      //   simulate: true, // 是否模拟上传（true 预览动画，false 走真实接口）
      //   mockError: false, // 模拟接口是否返回错误（true 演示报错弹窗）
      // },
    };
  },
  async created() {
    // 启动时：如果 Cookie 里有 token，尝试拉用户信息
    // TODO-AUTH: 接后端后 fetchUser() 会真正调 /api/user/me
    if (auth.isLoggedIn()) {
      try {
        await auth.fetchUser();
      } catch {
        auth.logout();
      }
    }
  },
  mounted() {
    // 监听路由切换：切换前显示进度条，切换完成隐藏
    this.$router.beforeEach((to, from, next) => {
      this.routeLoading = true;
      next();
    });
    this.$router.afterEach(() => {
      // 延迟 200ms 隐藏，避免太快闪一下
      setTimeout(() => {
        this.routeLoading = false;
      }, 200);
    });
  },
};
</script>

<style lang="scss">
/* 去掉浏览器默认 body 边距，让 Hero 紧贴浏览器边缘 */
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
}
#app {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #1d1d1f;
}
/* 全局去掉所有链接下划线 */
a,
a:hover,
a:focus,
a:active {
  text-decoration: none;
}

/* ======== 路由切换顶部进度条 ======== */
.route-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  z-index: 9999;
  background: linear-gradient(90deg, #0071e3, #42a5f5);
  /* 动画：从左到右滑入 */
  animation: route-progress 0.3s ease-out;
}

@keyframes route-progress {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}
</style>
