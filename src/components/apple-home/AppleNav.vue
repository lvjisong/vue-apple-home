<template>
  <div class="apple-nav-root">
    <!-- 展开下拉时的暗色毛玻璃幕布（置于 header 外，backdrop-filter 才能模糊页面） -->
    <!-- hover 导航下拉 / PC 购物袋下拉 共用；点击幕布收起 -->
    <transition name="curtain">
      <div v-show="showPanel" class="apple-nav__curtain" @click="closeOverlay"></div>
    </transition>

    <header
      class="apple-nav"
      :class="{
        'is-open': showPanel && !isClosing,
        'is-closing': isClosing,
      }"
      @mouseleave="scheduleClose"
    >
      <div class="apple-nav__inner">
        <!-- Apple Logo（官网 SVG）：hover 时收起下拉面板 -->
        <a
          class="apple-nav__logo"
          :href="APPLE_URL"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Apple"
          @mouseenter="scheduleClose"
        >
          <svg height="44" viewBox="0 0 14 44" width="14" aria-hidden="true">
            <path :d="ICONS.apple" />
          </svg>
        </a>

        <nav class="apple-nav__menu">
          <div
            v-for="(item, index) in menus"
            :key="item.label"
            class="apple-nav__item"
            @mouseenter="openMenu(index)"
          >
            <a
              class="apple-nav__link"
              :href="topLink(item.label)"
              target="_blank"
              rel="noopener noreferrer"
              >{{ item.label }}</a
            >
          </div>
        </nav>

        <div class="apple-nav__actions">
          <a
            class="apple-nav__icon"
            :href="SEARCH_URL"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="搜索"
            @mouseenter="scheduleClose"
          >
            <svg height="44" viewBox="0 0 15 44" width="15" aria-hidden="true">
              <path :d="ICONS.search" />
            </svg>
          </a>
          <button
            class="apple-nav__icon"
            aria-label="购物袋"
            @click="toggleCart"
            @mouseenter="onCartIconHover"
          >
            <svg height="44" viewBox="0 0 14 44" width="14" aria-hidden="true">
              <path :d="ICONS.bag" />
            </svg>
          </button>
          <button class="apple-nav__hamburger" @click="onHamburgerClick" aria-label="菜单">
            <span></span><span></span>
          </button>
        </div>
      </div>

      <!-- PC端下拉面板（hover 导航 / 购物袋共用，按 panelMode 切换内容） -->
      <transition name="flyout" @after-leave="afterLeave">
        <div
          v-show="showPanel"
          class="apple-nav__flyout"
          :class="{ 'apple-nav__flyout--cart': panelMode === 'cart' }"
          @mouseenter="cancelClose"
          @mouseleave="scheduleClose"
        >
          <!-- 导航下拉内容 -->
          <div v-if="panelMode === 'nav'" class="apple-nav__flyout-inner">
            <div v-for="(col, gi) in dropColumns" :key="col.heading" class="apple-nav__col">
              <p class="apple-nav__col-head" :style="stagger(0, gi)">
                {{ col.heading }}
              </p>
              <!-- 第一列：28px 大链接 -->
              <template v-if="gi === 0">
                <a
                  v-for="(link, li) in col.links"
                  :key="link"
                  class="apple-nav__biglink"
                  :style="stagger(li, gi)"
                  :href="linkUrl(link)"
                  target="_blank"
                  rel="noopener noreferrer"
                  >{{ link }}</a
                >
              </template>
              <!-- 第二三列：中号链接 -->
              <template v-else>
                <a
                  v-for="(link, li) in col.links"
                  :key="link"
                  class="apple-nav__midlink"
                  :style="stagger(li, gi)"
                  :href="linkUrl(link)"
                  target="_blank"
                  rel="noopener noreferrer"
                  >{{ link }}</a
                >
              </template>
              <a
                v-for="(link, fi) in col.footLinks || []"
                :key="'f-' + link"
                class="apple-nav__footlink"
                :style="stagger(col.links.length + fi, gi)"
                :href="linkUrl(link)"
                target="_blank"
                rel="noopener noreferrer"
                >{{ link }}</a
              >
            </div>
          </div>

          <!-- 购物袋内容 -->
          <div v-else class="apple-nav__cart">
            <p class="apple-nav__cart-title">{{ cartMenu.title }}</p>
            <p class="apple-nav__cart-sub">
              <a :href="cartMenu.sub.linkUrl" target="_blank" rel="noopener noreferrer">{{
                cartMenu.sub.linkText
              }}</a
              >{{ cartMenu.sub.text }}
            </p>
            <p class="apple-nav__cart-heading">{{ cartMenu.heading }}</p>
            <a
              v-for="link in cartMenu.links"
              :key="link.label"
              class="apple-nav__cart-link"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              @click="showPanel = false"
            >
              <svg
                v-if="link.icon === 'order'"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <path :d="ICONS.box" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              <svg
                v-else-if="link.icon === 'favorites'"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <path :d="ICONS.home" />
              </svg>
              <svg
                v-else-if="link.icon === 'account'"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <circle cx="12" cy="12" r="3" />
                <path :d="ICONS.settings" />
              </svg>
              <svg
                v-else-if="link.icon === 'login'"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <path :d="ICONS.user" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {{ link.label }}
            </a>
          </div>
        </div>
      </transition>
    </header>

    <!-- 移动端全屏面板（root 级，汉堡菜单 / 购物袋共用，按 mobileMode 切换内容） -->
    <transition name="mobile-fade">
      <div
        v-show="mobileOpen"
        class="apple-nav__mobile"
        :class="{
          'is-closing': mobileClosing,
          'apple-nav__mobile--cart': mobileMode === 'cart',
        }"
      >
        <!-- ===== 购物袋内容 ===== -->
        <template v-if="mobileMode === 'cart'">
          <button class="apple-nav__mobile-close" @click="closeMobile" aria-label="关闭">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <path :d="ICONS.close" />
            </svg>
          </button>
          <div class="apple-nav__cart-mobile">
            <p class="apple-nav__cart-title">{{ cartMenu.title }}</p>
            <p class="apple-nav__cart-sub">
              <a :href="cartMenu.sub.linkUrl" target="_blank" rel="noopener noreferrer">{{
                cartMenu.sub.linkText
              }}</a
              >{{ cartMenu.sub.text }}
            </p>
            <p class="apple-nav__cart-heading">{{ cartMenu.heading }}</p>
            <a
              v-for="link in cartMenu.links"
              :key="link.label"
              class="apple-nav__cart-link"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              @click="mobileOpen = false"
            >
              <svg
                v-if="link.icon === 'order'"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <path :d="ICONS.box" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              <svg
                v-else-if="link.icon === 'favorites'"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <path :d="ICONS.home" />
              </svg>
              <svg
                v-else-if="link.icon === 'account'"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <circle cx="12" cy="12" r="3" />
                <path :d="ICONS.settings" />
              </svg>
              <svg
                v-else-if="link.icon === 'login'"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <path :d="ICONS.user" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {{ link.label }}
            </a>
          </div>
        </template>

        <!-- ===== 汉堡导航内容 ===== -->
        <template v-else>
          <template v-if="mobileIndex === -1">
            <button class="apple-nav__mobile-close" @click="closeMobile" aria-label="关闭">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                <path :d="ICONS.close" />
              </svg>
            </button>
            <nav class="apple-nav__mobile-list">
              <a
                v-for="(item, index) in menus"
                :key="item.label"
                class="apple-nav__mobile-top"
                @click="mobileIndex = index"
                >{{ item.label }}</a
              >
            </nav>
          </template>
          <template v-else>
            <button class="apple-nav__mobile-back" @click="mobileIndex = -1" aria-label="返回">
              <svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor">
                <path :d="ICONS.back" />
              </svg>
            </button>
            <button class="apple-nav__mobile-close" @click="closeMobile" aria-label="关闭">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                <path :d="ICONS.close" />
              </svg>
            </button>
            <nav class="apple-nav__mobile-sub">
              <template v-for="(col, ci) in menus[mobileIndex].columns">
                <p v-if="ci === 0" :key="'h-' + ci" class="apple-nav__mobile-heading">
                  {{ col.heading }}
                </p>
                <a
                  v-for="l in col.links"
                  :key="l"
                  :href="topLink(l)"
                  target="_blank"
                  rel="noopener noreferrer"
                  @click="mobileOpen = false"
                  >{{ l }}</a
                >
                <p v-if="ci > 0" :key="'h-' + ci" class="apple-nav__mobile-heading">
                  {{ col.heading }}
                </p>
              </template>
            </nav>
          </template>
        </template>
      </div>
    </transition>
  </div>
</template>

<script>
import { APPLE, CART_LINKS, NAV_TOP, NAV_FLYOUT } from "@/constants/urls";
// SVG path d 属性统一从 @/constants/icons 引入
import { ICONS } from "@/constants/icons";
// 防抖：hover 切换面板用，防止快速划过导航项时面板闪来闪去
import debounce from "@/utils/debounce";

// 移动端断点（和 styles/_variables.scss 里的 $breakpoint-mobile 保持一致，改的时候两边一起改）
const MOBILE_BREAKPOINT = 734;

/**
 * AppleNav —— 严格按 apple.com.cn globalnav 样式还原
 *
 * PC 端（>734px）：
 *   - 44px 高，rgba(22,22,23,.8) + saturate(180%) blur(20px) 毛玻璃
 *   - 横排 11 个一级项，hover 展开三列下拉面板（#161617 底）
 *   - 面板动画：scaleY(0→1) .38s cubic-bezier(.4,0,.6,1)，内容错峰淡入
 *   - 关闭时先清空文案（is-closing），面板再上收
 *
 * 移动端（≤734px）：
 *   - 隐藏横排链接，只留 Apple logo 左 + 搜索/购物袋/汉堡右
 *   - 点汉堡弹出全屏菜单（#1d1d1f，z-index 3000）：
 *       · 一级：竖向列出 11 个分类，右上角 X 关闭
 *       · 二级：点一级进入子链接视图，左上角返回箭头 + 右上角 X
 *   - 关闭时先隐藏内容（is-closing），面板再 scaleY 上收
 *
 * 购物袋（点击触发，非 hover）：
 *   - PC：点购物袋图标在同一个 flyout 里切换到购物袋内容（深色，内容左对齐）
 *       · hover 其他导航项时直接换内容（同一个 flyout，无残影）
 *       · 再 hover 回购物袋图标则关闭面板
 *   - 移动端：点购物袋图标在同一个全屏面板里切换到购物袋内容
 *
 * 互斥规则：
 *   - PC：导航 hover / 购物袋共用一个 flyout + 一个 curtain
 *   - 移动端：汉堡菜单 / 购物袋共用一个全屏面板
 *
 * 数据：menus 数组为官网抓取的三列分类结构；topLink(label) 映射一级项到官网 URL
 */
export default {
  name: "AppleNav",
  data() {
    return {
      // ===== SVG 图标 path（从 @/constants/icons 引入，模板里用）=====
      ICONS,

      // ===== 官网外链（从 @/constants/urls 引入，模板里用）=====
      APPLE_URL: APPLE, // logo 点击跳官网首页
      SEARCH_URL: `${APPLE}/cn/search`, // 搜索图标跳转

      // ===== PC hover 下拉面板状态（导航 / 购物袋共用一个 flyout）=====
      activeIndex: -1, // 当前 hover 的导航项下标，-1 表示无（仅 nav 模式用）
      showPanel: false, // flyout 是否可见
      panelMode: "nav", // 'nav' 三列导航 | 'cart' 购物袋
      isClosing: false, // 关闭动画中（内容先消失，面板再上收）

      // ===== 移动端全屏面板状态（汉堡菜单 / 购物袋共用一个面板）=====
      mobileOpen: false, // 全屏面板是否可见
      mobileMode: "menu", // 当前面板内容：'menu' 汉堡导航 | 'cart' 购物袋
      mobileIndex: -1, // 汉堡二级分类下标，-1 表示一级列表（仅 menu 模式用）
      mobileClosing: false, // 面板关闭动画中

      // ===== 共享 =====
      closeTimer: null, // 鼠标移出后延迟关闭面板的 setTimeout 句柄

      /**
       * 购物袋下拉面板内容（PC flyout 与移动端全屏面板共用一份数据）
       * links[].icon 用于在模板里匹配对应 SVG 图标：order / favorites / account / login
       */
      cartMenu: {
        title: "你的购物袋是空的。",
        sub: {
          linkText: "登录",
          linkUrl: CART_LINKS.signIn,
          text: "查看你是否有收藏商品",
        },
        heading: "个人资料",
        links: [
          {
            icon: "order",
            label: "订单",
            url: CART_LINKS.orderList,
          },
          {
            icon: "favorites",
            label: "你的收藏",
            url: CART_LINKS.favorites,
          },
          {
            icon: "account",
            label: "账户",
            url: CART_LINKS.account,
          },
          {
            icon: "login",
            label: "登录",
            url: CART_LINKS.login,
          },
        ],
      },

      menus: [
        {
          label: "商店",
          columns: [
            {
              heading: "选购",
              links: [
                "选购最新产品",
                "Mac",
                "iPad",
                "iPhone",
                "Apple Watch",
                "Apple Vision Pro",
                "AirPods",
                "配件",
              ],
            },
            {
              heading: "快速链接",
              links: [
                "查找零售店",
                "订单状态",
                "Apple Trade In 换购计划",
                "分期付款",
                "个人设置辅导",
              ],
            },
            {
              heading: "专属商店选购",
              links: ["认证的翻新产品", "教育", "商务"],
            },
          ],
        },
        {
          label: "Mac",
          columns: [
            {
              heading: "探索 Mac",
              links: [
                "探索全部 Mac 机型",
                "MacBook Neo",
                "MacBook Air",
                "MacBook Pro",
                "iMac",
                "Mac mini",
                "Mac Studio",
                "显示器",
              ],
              footLinks: ["Mac 机型比较", "从 PC 换成 Mac"],
            },
            {
              heading: "选购 Mac",
              links: [
                "选购 Mac",
                "Mac 配件",
                "Apple Trade In 换购计划",
                "分期付款",
                "个人设置辅导",
              ],
            },
            {
              heading: "Mac 相关",
              links: [
                "Mac 支持",
                "AppleCare",
                "OS 27",
                "Apple 打造的 App",
                "Apple 创作坊",
                "配合 iPhone 更好用",
                "iCloud+",
                "Mac 商务应用",
                "教育",
                "Apple at Work",
              ],
            },
          ],
        },
        {
          label: "iPad",
          columns: [
            {
              heading: "探索 iPad",
              links: [
                "探索全部 iPad 机型",
                "iPad Pro",
                "iPad Air",
                "iPad",
                "iPad mini",
                "Apple Pencil",
                "键盘",
              ],
              footLinks: ["iPad 机型比较"],
            },
            {
              heading: "选购 iPad",
              links: [
                "选购 iPad",
                "iPad 配件",
                "Apple Trade In 换购计划",
                "分期付款",
                "个人设置辅导",
              ],
            },
            {
              heading: "iPad 相关",
              links: [
                "iPad 支持",
                "AppleCare",
                "OS 27",
                "Apple 打造的 App",
                "Apple 创作坊",
                "iCloud+",
                "教育",
                "Apple at Work",
              ],
            },
          ],
        },
        {
          label: "iPhone",
          columns: [
            {
              heading: "探索 iPhone",
              links: [
                "探索全部 iPhone 机型",
                "iPhone Duo",
                "iPhone 18 Pro",
                "iPhone Air",
                "iPhone 17",
                "iPhone 17e",
                "iPhone 16",
              ],
              footLinks: ["iPhone 机型比较", "换成 iPhone"],
            },
            {
              heading: "选购 iPhone",
              links: [
                "选购 iPhone",
                "iPhone 配件",
                "Apple Trade In 换购计划",
                "分期付款",
                "个人设置辅导",
              ],
            },
            {
              heading: "iPhone 相关",
              links: [
                "iPhone 支持",
                "AppleCare",
                "OS 27",
                "Apple 打造的 App",
                "iPhone 隐私保护",
                "配合 Mac 更好用",
                "iCloud+",
                "Apple Pay",
                "Siri",
                "Apple at Work",
              ],
            },
          ],
        },
        {
          label: "Watch",
          columns: [
            {
              heading: "探索 Apple Watch",
              links: [
                "探索全部 Apple Watch 表款",
                "Apple Watch Series 12",
                "Apple Watch Ultra 4",
                "Apple Watch SE 3",
                "Apple Watch Nike",
                "Apple Watch Hermès",
              ],
              footLinks: ["Apple Watch 表款比较", "Apple Watch 哪里好"],
            },
            {
              heading: "选购 Apple Watch",
              links: [
                "选购 Apple Watch",
                "Apple Watch 表带",
                "Apple Watch 配件",
                "Apple Trade In 换购计划",
                "分期付款",
                "个人设置辅导",
              ],
            },
            {
              heading: "Apple Watch 相关",
              links: ["Apple Watch 支持", "AppleCare", "OS 27", "Apple 打造的 App", "教育"],
            },
          ],
        },
        {
          label: "Vision",
          columns: [
            {
              heading: "探索 Apple Vision Pro",
              links: ["探索 Apple Vision Pro"],
              footLinks: ["技术规格"],
            },
            {
              heading: "选购 Apple Vision Pro",
              links: [
                "选购 Apple Vision Pro",
                "Apple Vision Pro 配件",
                "预约演示试用",
                "分期付款",
                "个人设置辅导",
              ],
            },
            {
              heading: "Apple Vision Pro 相关",
              links: ["Apple Vision Pro 支持", "AppleCare", "OS 27"],
            },
          ],
        },
        {
          label: "AirPods",
          columns: [
            {
              heading: "探索 AirPods",
              links: ["探索全部 AirPods 机型", "AirPods 5", "AirPods Pro 3", "AirPods Max 2"],
              footLinks: ["AirPods 机型比较"],
            },
            {
              heading: "选购 AirPods",
              links: ["选购 AirPods 5", "选购 AirPods Pro 3", "选购 AirPods Max 2", "AirPods 配件"],
            },
            {
              heading: "AirPods 相关",
              links: ["AirPods 支持", "AppleCare", "Apple Music"],
            },
          ],
        },
        {
          label: "家居",
          columns: [
            {
              heading: "探索家居",
              links: ["探索家居项目", "HomePod", "HomePod mini"],
            },
            {
              heading: "选购家居设备",
              links: ["选购 HomePod", "选购 HomePod mini", "家居配件"],
            },
            {
              heading: "家居相关",
              links: ["HomePod 支持", "AppleCare", "家庭 App", "Apple Music", "Siri", "隔空播放"],
            },
          ],
        },
        {
          label: "娱乐",
          columns: [
            {
              heading: "探索娱乐",
              links: ["探索娱乐内容", "Apple Music", "Apple 播客", "App Store"],
            },
            { heading: "技术支持", links: ["Apple Music 支持"] },
          ],
        },
        {
          label: "配件",
          columns: [
            {
              heading: "选购配件",
              links: [
                "选购所有配件",
                "Mac",
                "iPad",
                "iPhone",
                "Apple Watch",
                "Apple Vision Pro",
                "AirPods",
                "家居",
              ],
            },
            {
              heading: "探索配件",
              links: ["来自 Apple 的配件", "Beats", "AirTag"],
            },
          ],
        },
        {
          label: "技术支持",
          columns: [
            {
              heading: "探索技术支持",
              links: ["iPhone", "Mac", "iPad", "Watch", "Apple Vision Pro", "AirPods", "Music"],
              footLinks: ["探索各类技术支持"],
            },
            {
              heading: "获取帮助",
              links: ["社区", "查看保修服务", "Genius Bar 天才吧", "维修"],
            },
            {
              heading: "实用主题",
              links: ["获取 AppleCare", "Apple 账户和密码", "账单和订阅", "无障碍使用"],
            },
          ],
        },
      ],
    };
  },
  computed: {
    dropColumns() {
      const item = this.menus[this.activeIndex];
      return item ? item.columns : [];
    },
  },
  methods: {
    /**
     * 关闭移动端全屏菜单
     * 流程：先标记 closing（隐藏内容）→ 延迟 20ms 收起面板 → 400ms 后重置状态
     * 对应模板里的 transition leave 动画
     */
    closeMobile() {
      this.mobileClosing = true;
      this.$nextTick(() => {
        setTimeout(() => {
          this.mobileOpen = false;
        }, 20);
      });
      setTimeout(() => {
        this.mobileClosing = false;
        this.mobileIndex = -1;
      }, 400);
    },
    /**
     * 顶部导航一级标签 -> 官网 URL
     * @param {string} label 如 "Mac"、"iPhone"
     * @returns {string} 完整 URL
     */
    /**
     * 顶部一级导航点击跳转
     * 链接映射统一在 @/constants/urls 的 NAV_TOP，未匹配到的跳首页
     */
    topLink(label) {
      return NAV_TOP[label] || `${APPLE}/`;
    },
    /**
     * 下拉菜单链接文本 -> 官网 URL 映射
     * 链接映射统一在 @/constants/urls 的 NAV_FLYOUT，未匹配到的默认跳首页
     * @param {string} text 链接文案
     * @returns {string} 完整 URL
     */
    linkUrl(text) {
      return NAV_FLYOUT[text] || `${APPLE}/`;
    },
    /**
     * 下拉面板内链接错峰动画延迟
     * 第 li 个链接 * 20ms + 第 gi 列 * 80ms，形成从上到下逐行淡入效果
     */
    stagger(li, gi) {
      return { transitionDelay: `${li * 20 + (gi + 1) * 80}ms` };
    },
    /**
     * 鼠标移入某个一级菜单：
     * 1. 立刻取消关闭计时（防止面板关掉）
     * 2. 立刻显示面板（触发 enter 动画）
     * 3. 切换内容加 50ms 防抖：鼠标快速划过导航项时，只有最后停住的才真正切换内容，不闪烁
     */
    openMenu(index) {
      // 立刻清掉关闭计时器：鼠标移进来了，不要关
      clearTimeout(this.closeTimer);
      this.isClosing = false;
      this.panelMode = "nav";
      // 立刻显示面板，触发 transition enter 动画
      this.showPanel = true;
      // 防抖：50ms 内连续 hover 不同项，只切换最后一次的内容
      this.switchPanelContent(index);
    },
    // 面板内容切换防抖（50ms，只切换 activeIndex，不控制显隐）
    switchPanelContent: debounce(function (index) {
      this.activeIndex = index;
    }, 50),
    /** 鼠标移出导航栏：延迟 200ms 后先隐藏内容再收起面板，避免鼠标快速划过抖动 */
    scheduleClose() {
      clearTimeout(this.closeTimer);
      this.closeTimer = setTimeout(() => {
        this.isClosing = true;
        this.showPanel = false;
      }, 200);
    },
    /**
     * 鼠标 hover 到购物袋图标：
     * - 购物袋面板本身是 click 触发（不是 hover），hover 不重新打开
     * - 若购物袋面板开着 → 直接关闭
     * - 若当前展开的是导航 hover 面板 → 启动关闭计时（等同离开导航栏）
     */
    onCartIconHover() {
      if (this.showPanel && this.panelMode === "cart") {
        clearTimeout(this.closeTimer);
        this.isClosing = true;
        this.showPanel = false;
      } else if (this.showPanel && this.panelMode === "nav") {
        this.scheduleClose();
      }
    },
    /** 鼠标又移回导航栏：取消待执行的关闭 */
    cancelClose() {
      clearTimeout(this.closeTimer);
    },
    /** 下拉面板收起动画结束后：重置激活项，恢复 closing 标记 */
    afterLeave() {
      this.activeIndex = -1;
      this.isClosing = false;
    },
    /**
     * 点击 header 上的汉堡图标：
     * - 面板关着 → 打开汉堡导航
     * - 购物袋面板开着 → 切回汉堡导航
     * - 汉堡面板开着 → 直接关闭（和原 mobileOpen=!mobileOpen 行为一致）
     */
    onHamburgerClick() {
      if (!this.mobileOpen) {
        this.mobileMode = "menu";
        this.mobileIndex = -1;
        this.mobileOpen = true;
      } else if (this.mobileMode === "cart") {
        // 购物袋开着时点汉堡：切到菜单，不做关闭动画
        this.mobileMode = "menu";
        this.mobileIndex = -1;
      } else {
        // 菜单开着时点汉堡：直接关闭（无动画，和原行为一致）
        this.mobileOpen = false;
      }
    },
    /**
     * 点击购物袋图标：按视口宽度分发到 PC 下拉 / 移动端全屏
     * - PC：和 hover 导航共用一个 flyout，按 panelMode 切换内容
     * - 移动端：和汉堡菜单共用一个全屏面板
     */
    toggleCart() {
      const isMobile = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
      if (isMobile) {
        if (this.mobileOpen && this.mobileMode === "cart") {
          // 购物袋面板已开 → 带动画关闭
          this.closeMobile();
        } else {
          // 切到购物袋内容（面板本来开着就直接切，关着就打开）
          this.mobileMode = "cart";
          this.mobileIndex = -1;
          this.mobileOpen = true;
        }
      } else {
        if (this.showPanel && this.panelMode === "cart") {
          // 购物袋面板已开 → 关闭
          clearTimeout(this.closeTimer);
          this.isClosing = true;
          this.showPanel = false;
        } else {
          // 切到购物袋内容（面板本来开着就直接换内容，关着就打开）
          this.isClosing = false;
          this.panelMode = "cart";
          this.showPanel = true;
        }
      }
    },
    /** 点击暗色幕布：收起下拉面板 */
    closeOverlay() {
      if (this.showPanel) {
        this.isClosing = true;
        this.showPanel = false;
      }
    },
  },
  beforeDestroy() {
    // 组件销毁前清掉未执行的计时器，避免内存泄漏
    clearTimeout(this.closeTimer);
  },
};
</script>

<style lang="scss" scoped>
/* ============================================================
 * AppleNav 组件样式
 * ------------------------------------------------------------
 * 分类：
 *   1. 导航条基础样式（fixed 定位 + 毛玻璃背景）
 *   2. 顶部导航菜单项（Logo / 菜单链接 / 搜索 / 购物袋）
 *   3. PC 端下拉面板（flyout）
 *   4. 移动端汉堡菜单按钮
 *   5. 移动端全屏面板
 *   6. Vue Transition 动画
 *   7. 响应式媒体查询（PC / 移动端切换）
 * ============================================================ */

/* ======== 1. 导航条基础样式 ======== */
.apple-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2000;
  height: 44px;
  background: rgba(22, 22, 23, 1);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  color: rgba(255, 255, 255, 0.8);
  font-family: $font-stack-text;
}
/* 展开下拉面板时，导航条本体变为不透明深色 */
.apple-nav.is-open {
  background: #161617;
}

/* ======== 2. 顶部导航菜单项（Logo / 菜单链接 / 搜索 / 购物袋） ======== */
.apple-nav__inner {
  max-width: $content-max-width;
  height: 44px;
  margin: 0 auto;
  padding: 0 22px;
  display: flex;
  align-items: center;
}
.apple-nav__logo {
  display: flex;
  align-items: center;
  opacity: 0.8;
  color: rgba(255, 255, 255, 0.8);
}
.apple-nav__logo:hover {
  opacity: 1;
}
.apple-nav__logo svg {
  display: block;
  width: 16px;
  height: auto;
  margin-right: 28px;
  fill: currentColor;
}

.apple-nav__menu {
  flex: 1;
  display: flex;
  justify-content: space-between;
}
.apple-nav__item {
  display: flex;
  align-items: center;
}
/* 官网：12px / 400 / letter-spacing 0（中文） */
.apple-nav__link {
  font-size: 12px;
  line-height: 1;
  font-weight: 400;
  letter-spacing: 0em;
  color: rgba(255, 255, 255, 0.8);
  padding: 0 8px;
  white-space: nowrap;
  transition: color 0.32s cubic-bezier(0.4, 0, 0.6, 1);
}
.apple-nav__link:hover {
  color: #fff;
}

.apple-nav__actions {
  display: flex;
  align-items: center;
}
.apple-nav__icon {
  display: flex;
  align-items: center;
  opacity: 0.8;
  margin-left: 28px;
  padding: 0 10px;
  color: rgba(255, 255, 255, 0.8);
  background: none;
  border: 0;
  cursor: pointer;
  font: inherit;
}
.apple-nav__icon:hover {
  opacity: 1;
}
.apple-nav__icon svg {
  display: block;
  width: 15px;
  height: auto;
  fill: currentColor;
}

/* 暗色幕布：遮罩面板下方页面，展开时淡入、收起时淡出 */
.apple-nav__curtain {
  position: fixed;
  top: 44px;
  left: 0;
  right: 0;
  height: calc(100vh - 44px);
  background: rgba(0, 0, 0, 0.4);
  -webkit-backdrop-filter: saturate(180%) blur(40px);
  backdrop-filter: saturate(180%) blur(40px);
  z-index: 1999;
}

/* 下拉面板 #161617 */
/* ======== 3. PC 端下拉面板（flyout） ======== */
.apple-nav__flyout {
  position: fixed;
  top: 44px;
  left: 0;
  right: 0;
  background: #161617;
  z-index: 2;
}
.apple-nav__flyout-inner {
  max-width: $content-max-width;
  margin: 0 auto;
  padding: 40px 22px 56px;
  display: flex;
  gap: 64px;
}
.apple-nav__col {
  min-width: 150px;
}
.apple-nav__col-head {
  margin: 0 0 16px;
  font-size: 12px;
  line-height: 1.2;
  font-weight: 400;
  letter-spacing: -0.01em;
  color: rgb(110, 110, 115);
  /* 错峰淡入 */
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.32s cubic-bezier(0.4, 0, 0.6, 1),
    transform 0.32s cubic-bezier(0.4, 0, 0.6, 1);
}
/* 展开态：全部淡入 */
.apple-nav.is-open .apple-nav__col-head,
.apple-nav.is-open .apple-nav__biglink,
.apple-nav.is-open .apple-nav__footlink {
  opacity: 1;
  transform: translateY(0);
}
/* 官网：首列大链接 24px / 600 */
.apple-nav__biglink {
  display: block;
  font-size: 24px;
  line-height: 1.16;
  font-weight: 600;
  letter-spacing: 0.007em;
  color: #f5f5f7;
  margin-bottom: 10px;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.32s cubic-bezier(0.4, 0, 0.6, 1),
    transform 0.32s cubic-bezier(0.4, 0, 0.6, 1), color 0.2s;
}
.apple-nav__biglink:hover {
  color: #2997ff;
}
/* 第二三列中号链接：17px / 600 */
.apple-nav__midlink {
  display: block;
  font-size: 17px;
  line-height: 1.4;
  font-weight: 600;
  color: #f5f5f7;
  margin-bottom: 6px;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.32s cubic-bezier(0.4, 0, 0.6, 1),
    transform 0.32s cubic-bezier(0.4, 0, 0.6, 1), color 0.2s;
}
.apple-nav.is-open .apple-nav__midlink {
  opacity: 1;
  transform: translateY(0);
}
.apple-nav__midlink:hover {
  color: #2997ff;
}
/* 列底部小字链接（如 Mac 机型比较） */
.apple-nav__footlink {
  display: block;
  font-size: 12px;
  line-height: 1.33;
  font-weight: 400;
  color: #f5f5f7;
  margin-top: 14px;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.32s cubic-bezier(0.4, 0, 0.6, 1),
    transform 0.32s cubic-bezier(0.4, 0, 0.6, 1), color 0.2s;
}
.apple-nav__footlink:hover {
  color: #2997ff;
}

/* ============================================================
 * Vue Transition 动画 - PC 端下拉面板（flyout）
 * ------------------------------------------------------------
 * 模板里：<transition name="flyout">
 * Vue 自动加的类，不用手动写在 DOM 里：
 *   - 进入：先加 .flyout-enter-from + .flyout-enter-active，下一帧移除 from，动画开始
 *   - 离开：先加 .flyout-leave-to + .flyout-leave-active，动画结束移除
 * ============================================================ */
/* 进入/离开动画持续时间 + 缩放原点（从上往下展开） */
.flyout-enter-active,
.flyout-leave-active {
  transition: transform 0.38s cubic-bezier(0.4, 0, 0.6, 1);
  transform-origin: top;
}
/* 进入前 / 离开后：高度为 0，看不见 */
.flyout-enter-from,
.flyout-leave-to {
  transform: scaleY(0);
}

/* 收起瞬间文案立即清空，只剩空面板上收 */
.apple-nav.is-closing .apple-nav__col-head,
.apple-nav.is-closing .apple-nav__biglink,
.apple-nav.is-closing .apple-nav__midlink,
.apple-nav.is-closing .apple-nav__footlink {
  transition-delay: 0ms !important;
  transition-duration: 0s;
}

/* ============================================================
 * Vue Transition 动画 - 暗色幕布（curtain）
 * ------------------------------------------------------------
 * 模板里：<transition name="curtain">
 * 作用：下拉面板打开时，整个页面变暗（毛玻璃背景）
 * 动画：淡入淡出（opacity）
 * ============================================================ */
.curtain-enter-active,
.curtain-leave-active {
  transition: opacity 0.32s ease;
}
.curtain-enter-from,
.curtain-leave-to {
  opacity: 0;
}

/* ======== 4. 移动端汉堡菜单按钮（默认隐藏，媒体查询里显示） ======== */
.apple-nav__hamburger {
  display: none;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
}
.apple-nav__hamburger span {
  display: block;
  width: 16px;
  height: 1px;
  background: #f5f5f7;
  margin: 4px 0;
}
/* ======== 5. 移动端全屏面板（默认隐藏，媒体查询里显示） ======== */
.apple-nav__mobile {
  display: none;
}

/* ============================================================
 * 7. 响应式媒体查询：移动端（≤734px）
 * ------------------------------------------------------------
 * 切换内容：
 *   - 隐藏 PC 端导航菜单
 *   - 显示汉堡菜单按钮
 *   - 显示移动端全屏面板
 * ============================================================ */
@media (max-width: $breakpoint-mobile) {
  .apple-nav__menu {
    display: none;
  }
  .apple-nav__inner {
    max-width: none;
    padding: 0 22px;
    justify-content: space-between;
  }
  .apple-nav__actions {
    gap: 28px;
    margin-left: auto;
  }
  .apple-nav__hamburger {
    display: block;
  }
  .apple-nav__mobile {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #1d1d1f;
    z-index: 3000;
    padding: 0 36px 40px;
    overflow-y: auto;
  }
  .apple-nav__mobile-close {
    background: none;
    border: 0;
    color: #f5f5f7;
    position: absolute;
    top: 14px;
    right: 22px;
    cursor: pointer;
    padding: 8px;
    z-index: 2;
  }
  .apple-nav__mobile-back {
    background: none;
    border: 0;
    color: #f5f5f7;
    position: absolute;
    top: 16px;
    left: 22px;
    cursor: pointer;
    padding: 8px;
    z-index: 2;
  }
  .apple-nav__mobile-list {
    padding-top: 60px;
  }
  .apple-nav__mobile-top {
    color: #f5f5f7;
    font-size: 26px;
    font-weight: 600;
    padding: 12px 0;
    display: block;
    cursor: pointer;
    text-decoration: none;
    line-height: 1.15;
  }
  .apple-nav__mobile-sub {
    padding-top: 60px;
  }
  .apple-nav__mobile-heading {
    color: #86868b;
    font-size: 17px;
    margin: 20px 0 6px;
    font-weight: 400;
  }
  .apple-nav__mobile-sub a {
    display: block;
    color: #f5f5f7;
    font-size: 21px;
    font-weight: 600;
    padding: 6px 0;
    text-decoration: none;
  }
  .apple-nav__icon {
    margin-left: 0;
  }
}
/* ============================================================
 * Vue Transition 动画 - 移动端全屏面板（mobile-fade）
 * ------------------------------------------------------------
 * 模板里：<transition name="mobile-fade">
 * 作用：移动端汉堡菜单 / 购物袋全屏面板的展开收起动画
 * 动画：从上往下展开（scaleY），和 PC 端 flyout 一样
 * ============================================================ */
.mobile-fade-enter-active,
.mobile-fade-leave-active {
  transition: transform 0.38s cubic-bezier(0.4, 0, 0.6, 1);
  transform-origin: top;
}
.mobile-fade-enter-from,
.mobile-fade-leave-to {
  transform: scaleY(0);
}
.apple-nav__mobile.is-closing .apple-nav__mobile-list,
.apple-nav__mobile.is-closing .apple-nav__mobile-sub,
.apple-nav__mobile.is-closing .apple-nav__mobile-close,
.apple-nav__mobile.is-closing .apple-nav__mobile-back {
  visibility: hidden;
}

/* ===== 购物袋下拉（PC）：复用 flyout 全宽深色面板，内容左对齐窄列 ===== */
.apple-nav__flyout--cart {
  /* 继承 .apple-nav__flyout 的 fixed 定位与 #161617 底色 */
}
.apple-nav__cart {
  max-width: $content-max-width;
  margin: 0 auto;
  padding: 48px 22px 80px;
}
.apple-nav__cart-title {
  margin: 0 0 20px;
  font-size: 28px;
  line-height: 1.15;
  font-weight: 600;
  letter-spacing: 0.007em;
  color: #f5f5f7;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.32s cubic-bezier(0.4, 0, 0.6, 1),
    transform 0.32s cubic-bezier(0.4, 0, 0.6, 1);
}
.apple-nav__cart-sub {
  margin: 0 0 32px;
  font-size: 14px;
  line-height: 1.47;
  color: #86868b;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.32s cubic-bezier(0.4, 0, 0.6, 1),
    transform 0.32s cubic-bezier(0.4, 0, 0.6, 1);
}
.apple-nav__cart-sub a {
  color: #2997ff;
  text-decoration: none;
}
.apple-nav__cart-sub a:hover {
  text-decoration: underline;
}
.apple-nav__cart-heading {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.2;
  color: #6e6e73;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.32s cubic-bezier(0.4, 0, 0.6, 1),
    transform 0.32s cubic-bezier(0.4, 0, 0.6, 1);
}
.apple-nav__cart-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  font-size: 17px;
  line-height: 1.4;
  font-weight: 400;
  color: #f5f5f7;
  text-decoration: none;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.32s cubic-bezier(0.4, 0, 0.6, 1),
    transform 0.32s cubic-bezier(0.4, 0, 0.6, 1), color 0.2s;
}
.apple-nav__cart-link svg {
  flex: none;
  color: #86868b;
}
.apple-nav__cart-link:hover {
  color: #2997ff;
}
/* 展开态：购物袋内容淡入（与导航下拉同一套 is-open 触发） */
.apple-nav.is-open .apple-nav__cart-title,
.apple-nav.is-open .apple-nav__cart-sub,
.apple-nav.is-open .apple-nav__cart-heading,
.apple-nav.is-open .apple-nav__cart-link {
  opacity: 1;
  transform: translateY(0);
}
/* 收起瞬间：内容立即消失，只剩空面板上收 */
.apple-nav.is-closing .apple-nav__cart-title,
.apple-nav.is-closing .apple-nav__cart-sub,
.apple-nav.is-closing .apple-nav__cart-heading,
.apple-nav.is-closing .apple-nav__cart-link {
  transition-delay: 0ms !important;
  transition-duration: 0s;
}

/* ===== 购物袋全屏面板（移动端）：复用 .apple-nav__mobile 容器，仅定制内容 ===== */
.apple-nav__mobile--cart .apple-nav__cart-mobile {
  padding-top: 60px;
}
/* 移动端全屏面板里的内容直接可见，不依赖 PC 端 .apple-nav.is-open 触发淡入 */
.apple-nav__mobile--cart .apple-nav__cart-title,
.apple-nav__mobile--cart .apple-nav__cart-sub,
.apple-nav__mobile--cart .apple-nav__cart-heading,
.apple-nav__mobile--cart .apple-nav__cart-link {
  opacity: 1;
  transform: none;
  transition: none;
}
.apple-nav__mobile--cart .apple-nav__cart-title {
  font-size: 28px;
  font-weight: 600;
  color: #f5f5f7;
  margin: 0 0 16px;
}
.apple-nav__mobile--cart .apple-nav__cart-sub {
  font-size: 17px;
  color: #86868b;
  margin: 0 0 32px;
}
.apple-nav__mobile--cart .apple-nav__cart-heading {
  font-size: 17px;
  color: #86868b;
  margin: 20px 0 6px;
}
.apple-nav__mobile--cart .apple-nav__cart-link {
  font-size: 21px;
  font-weight: 600;
  color: #f5f5f7;
  padding: 6px 0;
}
.apple-nav__mobile--cart.is-closing .apple-nav__cart-mobile,
.apple-nav__mobile--cart.is-closing .apple-nav__mobile-close {
  visibility: hidden;
}
</style>
