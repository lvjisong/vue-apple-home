<template>
  <section
    ref="root"
    class="apple-hero"
    :class="[
      theme === 'dark' ? 'apple-hero--dark' : 'apple-hero--light',
      contentPosition === 'bottom' ? 'apple-hero--split' : '',
    ]"
    :style="{ backgroundColor: fallbackBg }"
  >
    <div
      v-if="image"
      ref="bg"
      class="apple-hero__bg"
      :style="{ backgroundImage: `url(${image})` }"
    ></div>
    <div v-if="imageMobile" class="apple-hero__image-wrapper">
      <!-- 移动端背景图（alt 用产品标题，有利于图片搜索 SEO） -->
      <!-- loading="lazy"：原生懒加载，首屏视口外的图片滚动到附近才加载 -->
      <img :src="imageMobile" :alt="`${title} 产品图`" loading="lazy" />
    </div>

    <!-- 顶部标题 -->
    <div ref="top" class="apple-hero__top">
      <h2 class="apple-hero__title">
        <svg
          v-if="showLogo"
          class="apple-hero__logo"
          viewBox="0 0 14 44"
          height="44"
          aria-hidden="true"
        >
          <path :d="ICONS.apple" />
        </svg>
        {{ title }}
      </h2>
      <!-- 顶部布局：副标题、小字、按钮都在标题下 -->
      <template v-if="contentPosition === 'top'">
        <p v-if="subtitle" class="apple-hero__subtitle">{{ subtitle }}</p>
        <p v-for="(line, i) in infoLines" :key="i" class="apple-hero__info">
          {{ line }}
        </p>
        <div v-if="links.length" class="apple-hero__cta">
          <a
            v-for="link in links"
            :key="link.text"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="apple-hero__btn"
            :class="
              link.type === 'primary' ? 'apple-hero__btn--primary' : 'apple-hero__btn--outline'
            "
            >{{ link.text }}</a
          >
        </div>
      </template>
    </div>

    <!-- 底部分栏：副标题、小字、按钮沉到底部 -->
    <div v-if="contentPosition === 'bottom'" ref="bottom" class="apple-hero__bottom">
      <p v-if="subtitle" class="apple-hero__subtitle">{{ subtitle }}</p>
      <p v-for="(line, i) in infoLines" :key="i" class="apple-hero__info">
        {{ line }}
      </p>
      <div v-if="links.length" class="apple-hero__cta">
        <a
          v-for="link in links"
          :key="link.text"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="apple-hero__btn"
          :class="link.type === 'primary' ? 'apple-hero__btn--primary' : 'apple-hero__btn--outline'"
          >{{ link.text }}</a
        >
      </div>
    </div>
  </section>
</template>

<script>
import { ICONS } from "@/constants/icons";
export default {
  name: "AppleHero",
  /**
   * Props
   * title          主标题（如 "iPhone 18 Pro"）
   * subtitle       副标题
   * infoLines      发售信息等多行小字（iPhone Duo 用）
   * links          按钮数组：{ text, type: 'primary'|'outline', url }
   * theme          'light' 浅底黑字 / 'dark' 黑底白字
   * image          PC 端背景图（largetall_2x.jpg）
   * imageMobile    移动端背景图（small_2x.jpg，≤734px 用 <img> 渲染）
   * fallbackBg     图片未加载时的底色
   * showLogo       标题前是否显示 Apple logo（Watch 用）
   * contentPosition 'top' 文字在上 / 'bottom' 文字在下（split 模式）
   * parallax       预留：视差系数（当前未启用）
   */
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    infoLines: { type: Array, default: () => [] },
    links: { type: Array, default: () => [] },
    theme: { type: String, default: "light" },
    image: { type: String, default: "" },
    imageMobile: { type: String, default: "" },
    fallbackBg: { type: String, default: "#fbfbfd" },
    showLogo: { type: Boolean, default: false },
    contentPosition: { type: String, default: "top" }, // top | bottom
    parallax: { type: Number, default: 0.15 },
  },
  data() {
    return { ICONS };
  },
};
</script>

<style lang="scss" scoped>
/* ============================================================
 * AppleHero 组件样式
 * ------------------------------------------------------------
 * 分类：
 *   1. Hero 容器布局（全屏宽度 + 最小高度）
 *   2. 背景图（PC 端 CSS 背景 / 移动端 img 标签）
 *   3. 文字内容区（标题 / 副标题 / 按钮）
 *   4. 响应式媒体查询（移动端高度调整）
 * ============================================================ */

/* ======== 1. Hero 容器布局 ======== */
.apple-hero {
  position: relative;
  width: 100%;
  min-height: 692px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  font-family: $font-stack;
  overflow: hidden;
}
.apple-hero--light {
  color: #1d1d1f;
  background: #f5f5f7;
}
.apple-hero--dark {
  color: #f5f5f7;
}

/* ======== 2. 背景图（PC 端 CSS 背景） ======== */
.apple-hero__bg {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  background-position: center bottom;
  background-repeat: no-repeat;
  background-size: cover;
  will-change: transform;
  z-index: 0;
}

/* ======== 3. 文字内容区（标题 / 副标题 / 按钮） ======== */
.apple-hero__top {
  padding: 56px 22px 0;
  position: relative;
  z-index: 2;
  will-change: transform, opacity;
}
.apple-hero__title {
  margin: 0;
  font-size: 56px;
  font-weight: 600;
  letter-spacing: -0.005em;
  line-height: 1.07;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.apple-hero__logo {
  height: 120px;
  width: auto;
  fill: currentColor;
}
.apple-hero__subtitle {
  margin: 4px 0 0;
  font-size: 28px;
  font-weight: 400;
  line-height: 1.2;
}
.apple-hero__info {
  margin: 10px 0 0;
  font-size: 17px;
  line-height: 1.5;
  color: #6e6e73;
}
.apple-hero__cta {
  margin-top: 22px;
  display: flex;
  gap: 18px;
  justify-content: center;
}
/* 引入全局_mixins.scss 中的按钮样式 */
.apple-hero__btn--primary {
  @include btn-primary;
}
.apple-hero__btn--outline {
  @include btn-outline;
}

/* 分栏布局：底部文字块 */
.apple-hero__bottom {
  margin-top: auto;
  padding: 0 22px 56px;
  position: relative;
  z-index: 2;
}
.apple-hero--split .apple-hero__subtitle {
  margin: 0 0 18px;
  font-size: 21px;
}

.apple-hero__image-wrapper {
  display: none;
}

/* ======== 4. 响应式媒体查询（移动端 ≤734px） ======== */
@media (max-width: $breakpoint-mobile) {
  .apple-hero {
    height: 500px;
    min-height: 0;
    padding: 39px 0 43px;
    box-sizing: border-box;
    margin-bottom: 12px;
  }
  .apple-hero__bg {
    display: none;
  }
  .apple-hero__image-wrapper {
    display: block;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 500px;
    width: 100%;
    z-index: 0;
  }
  .apple-hero__image-wrapper img {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: auto;
    height: 90%;
  }
  .apple-hero__top {
    padding: 0 22px;
    position: relative;
    z-index: 2;
  }
  .apple-hero__title {
    font-size: 28px;
  }
  .apple-hero--split .apple-hero__top {
    padding-top: 0;
    margin-top: -15px;
  }
  .apple-hero--split .apple-hero__title {
    font-size: 21px;
  }
  .apple-hero__subtitle {
    font-size: 17px;
    margin-top: 6px;
  }
  .apple-hero__subtitle.apple-hero__subtitle--large {
    font-size: 15px;
  }
  .apple-hero__info {
    font-size: 13px;
  }
  .apple-hero__cta {
    margin-top: 11px;
    gap: 14px;
  }
  .apple-hero__bottom {
    padding-bottom: 0px;
  }
  .apple-hero__bottom .apple-hero__subtitle {
    font-size: 19px;
    max-width: 320px;
    margin: 0 auto;
  }
}
</style>
