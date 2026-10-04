<template>
  <!-- main 标签语义化：标识页面主要内容区域，SEO/无障碍识别用 -->
  <main class="apple-home">
    <!-- 顶部导航（PC 毛玻璃 + 下拉，移动端汉堡全屏菜单） -->
    <AppleNav />

    <!-- Hero 横幅（数组循环渲染） -->
    <AppleHero v-for="hero in heroes" :key="hero.title" v-bind="hero" />

    <!-- ======== 路由传参测试区（演示用，正式上线可删） ======== -->
    <section class="route-demo" v-if="isDemo">
      <h3>路由传参测试</h3>
      <div class="route-demo__buttons">
        <!-- 方式 1：路径参数 /product/xxx -->
        <button class="btn btn--primary" @click="goProduct">去产品详情页（路径参数）</button>
        <!-- 方式 2：查询参数 /search?q=xxx -->
        <button class="btn btn--primary" @click="goSearch">去搜索页（查询参数）</button>
      </div>
      <p class="route-demo__tip">
        Vuex 购物车：当前 <strong>{{ cartCount }}</strong> 件商品
        <!-- <router-link to="/cart">购物袋</router-link> 看看 -->
      </p>
    </section>

    <!-- 双列磁贴 -->
    <AppleTileGrid :tiles="tiles" />

    <!-- 页脚（固定在底部） -->
    <AppleFooter />
  </main>
</template>

<script>
/**
 * AppleHome.vue —— apple.com.cn 首页复刻（组装入口）
 *
 * 页面结构（自上而下）：
 *   1. AppleNav       顶部导航（PC 毛玻璃 + 下拉，移动端汉堡全屏菜单）
 *   2. AppleHero × 3  首屏大横幅（iPhone 18 Pro / iPhone Duo / Watch S12）
 *   3. AppleTileGrid  下方双列（移动端单列）磁贴 promo 区
 *   4. AppleFooter    页脚
 *
 * 图片资源规范（严格对齐官网 CDN）：
 *   - CDN 前缀统一为 https://www.apple.com.cn
 *   - Hero 背景图 PC 端用 largetall_2x.jpg（高屏适配），移动端用 small_2x.jpg（734px 以下）
 *   - 磁贴图片 PC 端用 large_2x.jpg，移动端用 small_2x.jpg
 *   - 所有外链按钮均 target="_blank" 新窗口打开
 *
 * 维护提示：
 *   - 新增 Hero：复制一个 <AppleHero> 块，按官网 picture source 规则配 image / image-mobile
 *   - 新增磁贴：往 tiles 数组加一项，title/subtitle/theme/background/image/imageMobile/links 字段必填
 *   - 链接地址必须从官网 DOM 抓取，不要凭经验编造
 */
import AppleNav from "./AppleNav.vue";
import AppleHero from "./AppleHero.vue";
import AppleTileGrid from "./AppleTileGrid.vue";
import AppleFooter from "./AppleFooter.vue";
import { ICLOUD_OFFER, HOME_LINKS, SHOP } from "@/constants/urls";

/** 图片本地前缀（public/images/，由 .env 配置） */
const IMG = process.env.VUE_APP_IMAGE_BASE || "/images";

export default {
  name: "AppleHome",
  components: { AppleNav, AppleHero, AppleTileGrid, AppleFooter },
  data() {
    return {
      // 是否显示路由传参测试区（正式上线改成 false）
      isDemo: false,
      /**
       * Hero 横幅配置数组（按官网首页顺序）
       * 字段同 AppleHero props：title/subtitle/theme/image/imageMobile/fallbackBg/
       *   showLogo/contentPosition/infoLines/links/parallax
       */
      heroes: [
        {
          title: "iPhone 18 Pro",
          subtitle: "Pro 再超前",
          theme: "dark",
          image: `${IMG}/heroes/iphone-18-pro_largetall_2x.jpg`,
          imageMobile: `${IMG}/heroes/iphone-18-pro_small_2x.jpg`,
          fallbackBg: "#000",
          parallax: 0.15,
          links: [
            {
              text: "进一步了解",
              type: "primary",
              url: HOME_LINKS.iphone18Pro.learn,
            },
            {
              text: "购买",
              type: "outline",
              url: HOME_LINKS.iphone18Pro.buy,
            },
          ],
        },
        {
          title: "iPhone Duo",
          subtitle: "Hello, hello。",
          theme: "light",
          image: `${IMG}/heroes/iphone-duo_largetall_2x.jpg`,
          imageMobile: `${IMG}/heroes/iphone-duo_small_2x.jpg`,
          fallbackBg: "#f5f5f7",
          contentPosition: "top",
          parallax: 0.12,
          infoLines: ["10 月 16 日晚 8 点接受预购", "10 月 23 日发售"],
          links: [
            { text: "进一步了解", type: "primary", url: HOME_LINKS.iphoneDuo.learn },
            {
              text: "查看价格",
              type: "outline",
              url: HOME_LINKS.iphoneDuo.buy,
            },
          ],
        },
        {
          title: "WATCH SERIES 12",
          subtitle: "拥有 Apple Watch 迄今最先进的心率感测技术",
          theme: "dark",
          showLogo: true,
          contentPosition: "bottom",
          image: `${IMG}/heroes/watch-s12_largetall_2x.jpg`,
          imageMobile: `${IMG}/heroes/watch-s12_small_2x.jpg`,
          fallbackBg: "#000",
          parallax: 0.15,
          links: [
            {
              text: "进一步了解",
              type: "primary",
              url: HOME_LINKS.watchSeries12.learn,
            },
            {
              text: "购买",
              type: "outline",
              url: HOME_LINKS.watchSeries12.buy,
            },
          ],
        },
      ],
      /**
       * 磁贴（promo）配置数组
       * 字段说明：
       *   title       主标题文字；titleAccent 为斜体强调词（如 iPad air 中的 air）
       *   showLogo    是否在标题前显示 Apple logo
       *   subtitle    副标题文案
       *   theme       'dark' 深色底（白字）/ 'light' 浅色底（黑字）
       *   background  磁贴底色（与官网取色一致）
       *   image       PC 端背景图（large_2x.jpg）
       *   imageMobile 移动端背景图（small_2x.jpg，≤734px 切换）
       *   links       按钮数组：text 文案 / type 'primary' 蓝底 / 'outline' 描边 / url 链接
       */
      tiles: [
        {
          title: "WATCH ULTRA 4",
          showLogo: true,
          subtitle: "飙电力，联手野到底。",
          theme: "dark",
          background: "#000",
          image: `${IMG}/promos/watch-ultra-4_large_2x.jpg`,
          imageMobile: `${IMG}/promos/watch-ultra-4_small_2x.jpg`,
          links: [
            {
              text: "进一步了解",
              type: "primary",
              url: HOME_LINKS.watchUltra4.learn,
            },
            {
              text: "购买",
              type: "outline",
              url: HOME_LINKS.watchUltra4.buy,
            },
          ],
        },
        {
          title: "iCloud+",
          subtitle: "激活新 iPhone、iPad 或 Mac，可免费试用 3 个月 iCloud+ 服务¹。",
          theme: "light",
          background: "#f5f5f7",
          image: `${IMG}/promos/icloud_large_2x.jpg`,
          imageMobile: `${IMG}/promos/icloud_small_2x.jpg`,
          links: [
            {
              text: "进一步了解",
              type: "primary",
              url: ICLOUD_OFFER,
            },
          ],
        },
        {
          title: "Mac mini",
          subtitle: "现搭载 M6 或 M5 Pro",
          theme: "light",
          background: "#f5f5f7",
          image: `${IMG}/promos/mac-mini_large_2x.jpg`,
          imageMobile: `${IMG}/promos/mac-mini_small_2x.jpg`,
          links: [
            { text: "进一步了解", type: "primary", url: HOME_LINKS.macMini.learn },
            {
              text: "购买",
              type: "outline",
              url: HOME_LINKS.macMini.buy,
            },
          ],
        },
        {
          title: "MacBook Air",
          subtitle: "强势动力现来自 M5",
          theme: "light",
          background: "#e0f0fa",
          image: `${IMG}/promos/macbook-air_large_2x.jpg`,
          imageMobile: `${IMG}/promos/macbook-air_small_2x.jpg`,
          links: [
            { text: "进一步了解", type: "primary", url: HOME_LINKS.macbookAir.learn },
            {
              text: "购买",
              type: "outline",
              url: HOME_LINKS.macbookAir.buy,
            },
          ],
        },
        {
          title: "iPad ",
          titleAccent: "air",
          subtitle: "强势动力现来自 M4",
          theme: "light",
          background: "#d6eefc",
          image: `${IMG}/promos/ipad-air_large_2x.jpg`,
          imageMobile: `${IMG}/promos/ipad-air_small_2x.jpg`,
          links: [
            { text: "进一步了解", type: "primary", url: HOME_LINKS.ipadAir.learn },
            {
              text: "购买",
              type: "outline",
              url: HOME_LINKS.ipadAir.buy,
            },
          ],
        },
        {
          title: "Trade In 换购计划",
          showLogo: true,
          subtitle: "用 iPhone 13 或后续机型来换购，可享预计为 RMB 900 至 RMB 8300 的折抵优惠²。",
          theme: "light",
          background: "#f5f5f7",
          image: `${IMG}/promos/trade-in_large_2x.jpg`,
          imageMobile: `${IMG}/promos/trade-in_small_2x.jpg`,
          links: [
            {
              text: "获取折抵估价",
              type: "primary",
              url: SHOP.tradeIn,
            },
          ],
        },
      ],
    };
  },

  // ======== 路由传参测试区用到的 ========
  computed: {
    /** 从 Vuex 读取购物车商品总数 */
    cartCount() {
      return this.$store.getters.cartCount;
    },
  },

  methods: {
    /** 跳产品详情页（路径参数方式） */
    goProduct() {
      this.$router.push({
        name: "Product",
        params: { id: "iPhone-18-Pro" },
      });
    },
    /** 跳搜索页（查询参数方式） */
    goSearch() {
      this.$router.push({
        path: "/search",
        query: { q: "iPhone 18", page: 1, category: "iPhone" },
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.apple-home {
  padding-top: 44px;
  background: #fff;
}

/* ======== 路由传参测试区样式（演示用，正式上线可删） ======== */
.route-demo {
  max-width: 1024px;
  margin: 40px auto;
  padding: 30px;
  background: #f5f5f7;
  border-radius: 12px;

  h3 {
    margin: 0 0 20px;
    font-size: 20px;
  }

  &__buttons {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;

    button {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      background: #0071e3;
      color: #fff;
      font-size: 15px;
      cursor: pointer;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.85;
      }
    }
  }

  &__tip {
    color: #666;
    font-size: 14px;
    margin: 0;

    strong {
      color: #1d1d1f;
    }

    a {
      color: #0071e3;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>
