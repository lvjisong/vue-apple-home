<template>
  <!-- section 语义化：标识这是页面里一个独立的产品区块 -->
  <section class="apple-tiles">
    <div
      v-for="tile in tiles"
      :key="tile.title"
      class="apple-tile"
      :class="tile.theme === 'dark' ? 'apple-tile--dark' : 'apple-tile--light'"
      :style="{ backgroundColor: tile.background }"
    >
      <div
        v-if="tile.image"
        class="apple-tile__bg"
        :style="{ backgroundImage: `url(${tile.image})` }"
      ></div>
      <div
        v-if="tile.imageMobile"
        class="apple-tile__bg apple-tile__bg--mobile"
        :style="{ backgroundImage: `url(${tile.imageMobile})` }"
      ></div>
      <div class="apple-tile__text">
        <h3 class="apple-tile__title">
          <svg
            v-if="tile.showLogo"
            class="apple-tile__logo"
            viewBox="0 0 14 44"
            height="44"
            aria-hidden="true"
          >
            <path :d="ICONS.apple" />
          </svg>
          {{ tile.title
          }}<em v-if="tile.titleAccent" class="apple-tile__accent">{{ tile.titleAccent }}</em>
        </h3>
        <p v-if="tile.subtitle" class="apple-tile__subtitle">
          {{ tile.subtitle }}
        </p>
        <div class="apple-tile__cta">
          <a
            v-for="link in tile.links"
            :key="link.text"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="apple-tile__btn"
            :class="
              link.type === 'primary' ? 'apple-tile__btn--primary' : 'apple-tile__btn--outline'
            "
            >{{ link.text }}</a
          >
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { ICONS } from "@/constants/icons";
/**
 * AppleTileGrid.vue —— 首页下方磁贴（promo）网格
 *
 * PC 端：双列网格，gap 12px，白底容器
 * 移动端（≤734px）：单列，无边距，gap 12px，
 *   每个磁贴切换为 small_2x.jpg 移动版图片，background-size: auto 100% 居中底部
 *
 * tiles 数据结构见 AppleHome.vue 中 tiles 字段注释
 */
export default {
  name: "AppleTileGrid",
  props: {
    /** 磁贴配置数组，每项字段见 AppleHome.tiles 注释 */
    tiles: { type: Array, default: () => [] },
  },
  data() {
    return { ICONS };
  },
};
</script>

<style lang="scss" scoped>
.apple-tiles {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  background: #fff;
  padding: 12px;
  font-family: $font-stack;
}
.apple-tile {
  position: relative;
  min-height: 580px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  overflow: hidden;
}
.apple-tile--light {
  color: #1d1d1f;
}
.apple-tile--dark {
  color: #f5f5f7;
}
.apple-tile__bg {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  background-position: center bottom;
  background-repeat: no-repeat;
  background-size: cover;
  z-index: 0;
}
.apple-tile__text {
  padding: 56px 20px 0;
  position: relative;
  z-index: 2;
}
.apple-tile__title {
  margin: 0;
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
}
.apple-tile__logo {
  height: 72px;
  width: auto;
  fill: currentColor;
}
.apple-tile__accent {
  font-style: italic;
  color: #0071e3;
  font-weight: 400;
}
.apple-tile__subtitle {
  margin: 8px auto 0;
  font-size: 21px;
  line-height: 1.4;
  max-width: 332px;
}
.apple-tile__cta {
  margin-top: 20px;
  display: flex;
  gap: 16px;
  justify-content: center;
}
.apple-tile__btn {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  padding: 8px 20px;
  border-radius: 999px;
  transition: transform 120ms ease-out, background-color 150ms ease-out;
}
.apple-tile__btn--primary {
  background: #0071e3;
  color: #fff;
}
.apple-tile__btn--outline {
  border: 1px solid #0071e3;
  color: #0071e3;
}
.apple-tile__btn--outline:hover {
  background: #0071e3;
  color: #fff;
}
.apple-tile__btn:active {
  transform: scale(0.97);
}
@media (max-width: $breakpoint-mobile) {
  .apple-tiles {
    grid-template-columns: 1fr;
    padding: 0;
    gap: 12px;
    background: #fff;
  }
  .apple-tile {
    min-height: 500px;
  }
  .apple-tile__bg {
    display: none;
  }
  .apple-tile__bg--mobile {
    display: block;
    background-size: auto 100%;
    background-position: center bottom;
  }
  .apple-tile__text {
    padding: 24px 22px 0;
  }
  .apple-tile__title {
    font-size: 24px;
  }
  .apple-tile__subtitle {
    font-size: 15px;
  }
  .apple-tile__cta {
    margin-top: 12px;
  }
}
</style>
