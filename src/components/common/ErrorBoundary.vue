<template>
  <!--
    ErrorBoundary.vue —— 错误边界组件
    ------------------------------------------------------------
    作用：子组件渲染出错时，显示友好的错误提示，不让整个页面白屏。

    用法：
      <ErrorBoundary>
        <YourComponent />
      </ErrorBoundary>

    原理：Vue 3 用 onErrorCaptured() 钩子捕获子组件的错误，
         捕获到后切换到错误 UI，而不是让错误冒泡到整个应用。
  -->
  <div v-if="hasError">
    <!-- 出错了显示这个 -->
    <div class="error-boundary">
      <h2>页面出了点问题</h2>
      <p>抱歉，这个模块加载失败了，请刷新页面试试。</p>
      <button @click="handleRefresh">刷新页面</button>
      <button @click="handleReset">返回上一页</button>
    </div>
  </div>
  <div v-else>
    <!-- 正常情况：渲染插槽里的内容 -->
    <slot />
  </div>
</template>

<script>
/**
 * ErrorBoundary.vue —— 错误边界
 * 捕获子组件渲染错误，显示友好提示，不白屏
 */
export default {
  name: "ErrorBoundary",
  data() {
    return {
      // 是否出错了
      hasError: false,
    };
  },
  // Vue 3 捕获子组件错误的钩子
  // 比 onErrorCaptured 更简单的写法：直接在组件选项里定义
  errorCaptured(err, vm, info) {
    console.error("【ErrorBoundary】捕获到错误：", err);
    console.error("【出错组件】", vm?.$options?.name);
    console.error("【出错位置】", info);
    // 切换到错误 UI
    this.hasError = true;
    // 返回 false 阻止错误继续向上冒泡（避免触发全局 errorHandler 两次）
    return false;
  },
  methods: {
    /** 刷新页面 */
    handleRefresh() {
      window.location.reload();
    },
    /** 返回上一页 */
    handleReset() {
      this.hasError = false;
      this.$router.back();
    },
  },
};
</script>

<style lang="scss" scoped>
.error-boundary {
  max-width: 600px;
  margin: 100px auto;
  padding: 40px;
  text-align: center;

  h2 {
    font-size: 24px;
    margin: 0 0 16px;
    color: #1d1d1f;
  }

  p {
    color: #666;
    line-height: 1.6;
    margin: 0 0 24px;
  }

  button {
    padding: 10px 24px;
    margin: 0 8px;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    cursor: pointer;
    transition: opacity 0.2s;

    &:first-of-type {
      background: #0071e3;
      color: #fff;
    }

    &:last-of-type {
      background: #f5f5f7;
      color: #1d1d1f;
    }

    &:hover {
      opacity: 0.85;
    }
  }
}
</style>
