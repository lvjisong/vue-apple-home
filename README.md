# Vue Apple Home

复刻 apple.com.cn 首页（导航 / Hero / 磁贴 / 页脚），Vue 3 + Element Plus + Vuex + Vue Router。

---

## 🚀 快速启动

```bash
# 安装依赖
npm install

# 本地开发（自动打开浏览器）
npm run serve          # http://localhost:8081

# 生产打包
npm run build

# 打包体积分析（看哪个包大）
npm run build:report

# Staging 环境打包
npm run build:staging

# Prettier 格式化所有代码
npm run format

# ESLint 检查
npm run lint
```

---

## 📁 目录结构

```
src/
├── components/
│   ├── apple-home/          # 首页专用组件（只给首页用）
│   │   ├── AppleNav.vue     # 导航栏（PC 毛玻璃 + 移动端汉堡菜单）
│   │   ├── AppleHero.vue    # Hero 横幅
│   │   ├── AppleTileGrid.vue # 双列磁贴
│   │   ├── AppleFooter.vue  # 页脚
│   │   └── AppleHome.vue    # 首页组装入口
│   └── common/              # 通用组件（所有页面都能用）
│       ├── ErrorBoundary.vue # 错误边界（页面崩了不白屏）
│       └── AppleFileUpload.vue # Apple 风格文件上传
├── constants/
│   ├── urls.js              # 所有外链常量（SHOP/PRODUCT/NAV 等）
│   └── icons.js             # 所有 SVG path d 常量
├── router/
│   └── index.js             # 路由配置 + 全局守卫（SEO 动态 meta）
├── store/
│   └── index.js             # Vuex 全局状态（auth + cart 购物车持久化）
├── styles/
│   ├── variables.scss       # SCSS 全局变量（断点/宽度/字体）
│   ├── mixins.scss          # SCSS mixins
│   └── main.scss            # 全局样式入口
├── utils/
│   ├── request.js           # axios 封装（拦截器/401 刷新/GET 自动重试）
│   ├── auth.js              # 登录态 Cookie+Vuex 封装
│   ├── debounce.js          # 防抖函数工具
│   └── throttle.js          # 节流函数工具
└── views/                   # 页面级组件
    ├── Home.vue / Cart.vue / Login.vue
    ├── ProductPage.vue      # 路径参数传参示例
    ├── SearchPage.vue        # 查询参数传参示例
    └── NotFound.vue          # 404 页面

public/
├── images/                  # 本地图片资源
├── robots.txt               # SEO 爬虫配置
└── sitemap.xml              # SEO 网站地图
```

---

## ⚙️ 生产环境部署清单

**搜 TODO 就能找到所有要改的地方，按顺序改：**

### 1. 环境变量（`.env.production`）

```env
# 生产环境 API 地址（改成你的后端域名）
VUE_APP_BASE_API=https://api.your-domain.com

# 网站根域名（SEO/分享用）
VUE_APP_SITE_URL=https://your-domain.com

# 图片 CDN 地址（如果图片走 CDN，改成 CDN 域名）
VUE_APP_IMAGE_BASE=https://cdn.your-domain.com/images
```

### 2. SEO 文件（`public/`）

| 文件                 | 改什么                                           |
| -------------------- | ------------------------------------------------ |
| `public/robots.txt`  | sitemap 地址改成你的域名                         |
| `public/sitemap.xml` | 所有 `<loc>` 里的 `your-domain.com` 改成真实域名 |

### 3. Nginx 配置（`nginx.conf`）

| 配置项           | 说明                                          |
| ---------------- | --------------------------------------------- |
| `server_name`    | 改成你的域名                                  |
| `gzip_static on` | 开启预压缩（项目打包已生成 .gz 文件）         |
| `expires 1y`     | 静态资源缓存一年，文件名带 hash，改了自动更新 |

### 4. Docker 部署

```bash
# 构建镜像
docker build -t vue-apple-home .

# 启动（一条命令）
docker-compose up -d

# 访问 http://localhost:8080
```

### 5. 错误监控（Sentry 预留）

在 `src/main.js` 里搜 `TODO-PRODUCTION`，接入 Sentry：

```js
// app.config.errorHandler 里加：
Sentry.captureException(err, { extra: { info, component: vm.$options.name } });
```

---

## 🔧 常用配置速查

### 导航栏配置（`src/constants/urls.js`）

所有外链都在这里，改一处全站生效：

```js
export const NAV_TOP = [
  { label: "Store", url: SHOP.store },
  { label: "Mac", url: PRODUCT.mac },
  // ... 新增导航项在这里加
];
```

### 响应式断点（`src/styles/_variables.scss`）

```scss
$breakpoint-mobile: 734px; // 移动端断点
$content-max-width: 1024px; // 内容最大宽度
$font-stack: -apple-system, BlinkMacSystemFont, ...; // 字体栈
```

### 请求重试（`src/utils/request.js`）

- 默认 GET 请求失败自动重试 2 次（指数退避：1s → 2s）
- POST/PUT/DELETE 默认不重试（防止重复提交）
- 想关闭重试：请求时加 `{ retry: false }`

---

## 🛡️ 已有的生产环境优化

| 优化项          | 位置                                      | 说明                                 |
| --------------- | ----------------------------------------- | ------------------------------------ |
| gzip 压缩       | `vue.config.js`                           | 打包自动生成 .gz 文件                |
| 代码分包        | `vue.config.js`                           | vendor / element-plus 拆成独立 chunk |
| console 清理    | `vue.config.js`                           | 生产环境删除 console.log/info/debug  |
| source map 关闭 | `vue.config.js`                           | 防止源码泄露                         |
| 全局错误捕获    | `src/main.js`                             | 所有组件错误都能捕获                 |
| 错误边界组件    | `src/components/common/ErrorBoundary.vue` | 页面崩了不白屏                       |
| 路由切换进度条  | `src/App.vue`                             | 切路由顶部显示蓝色进度条             |
| 首屏加载动画    | `public/index.html`                       | JS 加载完之前显示转圈                |
| SEO 动态 meta   | `src/router/index.js`                     | 每个页面独立 title/description       |
| 图片懒加载      | `AppleHero.vue`                           | 原生 `loading="lazy"`                |
| 购物车持久化    | `src/store/index.js`                      | localStorage 存购物车，刷新不丢      |
| 防抖/节流工具   | `src/utils/`                              | debounce.js / throttle.js            |

---

## 📝 Git 提交规范（husky + lint-staged）

**VPN 开了以后跑这两行初始化：**

```bash
npm install --save-dev husky lint-staged
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

做完以后，每次 `git commit` 自动：

1. Prettier 格式化
2. ESLint 检查
3. 有问题不让提交

---

## ❓ 常见问题

**Q: 打包后打开 index.html 白屏 / 资源 404？**
A: 检查 `vue.config.js` 里的 `publicPath`：

- 部署在域名根目录（`https://xxx.com/`）→ 用 `'/'`
- 部署在子路径（`https://xxx.com/admin/`）→ 用 `'/admin/'`
- 不确定 → 用 `'./'`（相对路径，支持任意子路径）

---

**Q: 打包后刷新页面 404？**
A: nginx 配置了 `try_files $uri $uri/ /index.html;`，确保开了。
Vue Router history 模式必须配这个，不然刷新 `/cart` 这种路径会 404。

---

**Q: 本地开发跨域？**
A: `vue.config.js` 里配了 proxy，详细说明：

```js
// vue.config.js → devServer.proxy
"/api": {
  target: "http://localhost:3000",  // ← 后端地址，改成你本地后端端口
  changeOrigin: true,
  pathRewrite: { "^/api": "" },     // 去掉 /api 前缀
}
```

**原理**：前端发 `/api/user/me` → dev server 偷偷转发给后端 `http://localhost:3000/user/me`，浏览器以为同源，没有跨域。

**改法**：

1. 后端跑在 8000 端口 → `target` 改成 `http://localhost:8000`
2. 后端路由本身带 `/api`（如 `/api/user/me`）→ 把 `pathRewrite` 那行注释掉
3. 改完必须**重启 dev server**（Ctrl+C → npm run serve）

**验证**：F12 → Network → 请求 `/api/xxx` → 状态 200 = 配好了

---

**Q: 动态引入图片路径不对（`src="./images/xxx.jpg"` 打包后 404）？**
A: Vue CLI 里动态路径要用 `require` 或 `new URL`：

```js
/* ❌ 打包后 404 */
<img :src="./images/iphone.jpg" />

/* ✅ 用 require */
<img :src="require(`@/assets/${imageName}.jpg`)" />

/* ✅ 或用 public 目录（直接放 public/images/，用绝对路径） */
<img src="/images/iphone.jpg" />
```

---

**Q: Vuex 里的数据刷新页面就没了？**
A: Vuex 是内存状态，刷新当然丢。需要持久化：

- 简单场景：存 localStorage（项目里购物车就是这么做的，见 `src/store/index.js`）
- 复杂场景：用 `vuex-persistedstate` 插件

---

**Q: 路由跳转后页面没回到顶部？**
A: 检查 `router/index.js` 里的 `scrollBehavior`，已经配好了：

```js
scrollBehavior(to, from, savedPosition) {
  if (savedPosition) return savedPosition; // 浏览器前进后退保留位置
  return { x: 0, y: 0 }; // 普通跳转回到顶部
}
```

---

**Q: 移动端 1px 边框显示太粗？**
A: 高 DPR 屏幕下 1px CSS 实际是 2-3 物理像素。解决方案：

```scss
.border-1px {
  position: relative;
  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 1px;
    background: #e5e5e5;
    transform: scaleY(0.5); /* 缩小一半 */
  }
}
```

---

**Q: 打包体积太大怎么优化？**
A: 跑 `npm run build:report` 看哪个包大，常见优化：

1. Element Plus 按需引入（现在是全量引入）
2. 路由懒加载（已经做了）
3. 图片压缩（imagemin-webpack-plugin）
4. 把大依赖换成 CDN 引入

---

**Q: Git push 报错 / 连不上 GitHub？**
A: 国内网络问题，配置代理：

```bash
git config --global http.proxy http://127.0.0.1:1082
git config --global https.proxy http://127.0.0.1:1082
git config --global http.version HTTP/1.1  # 解决 HTTP/2 framing 错误
```

---

**Q: 怎么加新页面？**
A: 三步：

1. `src/views/` 新建 `XxxPage.vue`
2. `src/router/index.js` 加路由（懒加载写法）
3. `meta` 里加 `title` 和 `description`（SEO 用）

---

**Q: 怎么加新导航项？**
A: 改 `src/constants/urls.js` 里的 `NAV_TOP` 和 `NAV_FLYOUT`，模板里自动循环。

---

### Vue 3 常见坑

**Q: Vue 3 里解构 props 后不响应了？**
A: Vue 3 直接 `const { title } = props` 解构会丢失响应式。要用 `toRefs`：

```js
import { toRefs } from "vue";

export default {
  props: { title: String },
  setup(props) {
    // ❌ 这样不响应
    // const { title } = props;

    // ✅ 这样才响应
    const { title } = toRefs(props);
  },
};
```

---

**Q: Vue 3 里 `this.$xxx` 怎么用？**
A: 如果用 Options API（现在项目的写法），`this.$router` / `this.$store` / `this.$refs` 都能用。
如果用 `<script setup>`，要 import：

```js
import { useRouter, useStore } from "vue-router";
import { useStore } from "vuex";

const router = useRouter();
const store = useStore();
```

---

**Q: v-for 和 v-if 能不能一起用？**
A: 不要！v-for 优先级比 v-if 高，会先循环再判断，性能差。
用 computed 先过滤：

```html
<!-- ❌ 不推荐 -->
<li v-for="item in list" v-if="item.show" :key="item.id"></li>
<!-- ✅ 推荐 -->
<li v-for="item in visibleList" :key="item.id"></li>
<script>
  computed: {
    visibleList() {
      return this.list.filter(item => item.show);
    }
  }
</script>
```

---

**Q: v-for 的 key 用 index 有什么问题？**
A: 列表会增删排序的时候，用 index 做 key 会导致 DOM 复用错误，出现奇怪的 bug。
用唯一 id 做 key：

```html
<!-- ❌ 列表会变的时候不要用 index -->
<li v-for="(item, index) in list" :key="index"></li>
<!-- ✅ 用唯一 id -->
<li v-for="item in list" :key="item.id"></li>
```

---

**Q: 定时器 setInterval 没清，页面切走还在跑？**
A: 组件卸载前一定要清定时器，不然内存泄漏。

```js
mounted() {
  this.timer = setInterval(() => { ... }, 1000);
},
beforeUnmount() {
  clearInterval(this.timer); // 别忘了清！
}
```

---

### Element Plus 常见坑

---

**Q: scoped 样式改不了 Element Plus 组件？**
A: scoped 样式只能改当前组件的元素，改第三方组件要用深度选择器：

```scss
/* ❌ 不生效 */
:deep(.el-button) {
  padding: 0;
}

/* ✅ 用深度选择器 */
::v-deep .el-button {
  padding: 0;
}
```

---

**Q: 怎么改 Element Plus 主题颜色？**
A: 在 `src/styles/` 里加个覆盖文件：

```scss
/* src/styles/element-override.scss */
:root {
  --el-color-primary: #0071e3; /* 改成 Apple 蓝 */
}
```

然后在 `main.js` 里 import。

---

**Q: ElMessage 弹出两次？**
A: 检查是不是请求拦截器里弹了一次，业务代码又弹了一次。
不需要全局弹错的话，请求时加 `{ silentError: true }`。

---

**Q: ElTable 表格宽度不对 / 横向滚动？**
A: 列太多的时候，给 table 加 `width="100%"`，或者固定某些列宽度。

---

### 样式相关

**Q: SCSS 变量和 CSS 变量有什么区别？**
A:

- **SCSS 变量**（`$breakpoint-mobile`）：编译时就替换死了，运行时不能改
- **CSS 变量**（`--el-color-primary`）：运行时可以用 JS 改，支持动态主题

**什么时候用哪个？**

- 固定不变的设计规范（断点、字体、宽度）→ SCSS 变量
- 需要动态切换的（主题色、深浅色）→ CSS 变量

---

**Q: 样式 scoped 了，全局样式怎么写？**
A: scoped 样式只作用于当前组件。要写全局样式：

1. 去掉 scoped，写在专门的全局样式文件里（`src/styles/main.scss`）
2. 或者用 `:global(.xxx)`

---

### 路由传参常见坑

**Q: 路由 params 传参，刷新页面就没了？**
A: 正常！params 是存在内存里的，刷新就丢。
要刷新还在的，用 query 或者路径参数（`/product/:id`）。

```js
// ❌ 刷新丢
this.$router.push({ name: "Product", params: { id: 123 } });

// ✅ 刷新还在（路径参数，路由配 path: "/product/:id"）
this.$router.push({ name: "Product", params: { id: 123 } });

// ✅ 刷新还在（query 参数）
this.$router.push({ path: "/product", query: { id: 123 } });
```

---

### 移动端常见坑

**Q: iOS 上输入框 focus 自动放大页面？**
A: iOS 会自动放大小于 16px 的输入框字体。把输入框字体设成 16px 以上就行。

---

**Q: 弹窗打开了，背景还能滚动（滚动穿透）？**
A: 弹窗打开的时候锁住 body 滚动：

```js
openDialog() {
  document.body.style.overflow = "hidden"; // 锁住
},
closeDialog() {
  document.body.style.overflow = ""; // 解锁
}
```

---

**Q: 移动端 100vh 不对（底部被导航栏挡住）？**
A: 手机浏览器地址栏会占高度。用 `100dvh`（动态视口高度）替代：

```scss
.full-screen {
  height: 100vh; /* 老浏览器 */
  height: 100dvh; /* 新浏览器，自动算地址栏高度 */
}
```

---

### 工程化常见坑

**Q: 打包后 `process.env.VUE_APP_XXX` 读不到？**
A:

1. 变量必须以 `VUE_APP_` 开头（Vue CLI 规定）
2. 改了 `.env` 文件必须重启 dev server
3. 生产环境要重新 `npm run build`

---

**Q: 跨域请求不带 Cookie？**
A: axios 请求加 `withCredentials: true`，后端也要配 `Access-Control-Allow-Credentials: true`。

---

**Q: mounted 里拿不到 DOM 元素？**
A: DOM 还没渲染完。用 `$nextTick` 等一下：

```js
mounted() {
  this.$nextTick(() => {
    console.log(this.$refs.box.clientHeight);
  });
}
```

---

**Q: 字体加载完前显示空白（FOIT）？**
A: 加 `font-display: swap`，先用系统字体，加载完再切换。

---

### JavaScript 常见坑

**Q: `==` 和 `===` 有什么区别？**
A:

- `==` 会自动类型转换（`0 == ''` → true，`null == undefined` → true）
- `===` 不转类型，必须值和类型都相等

**永远用 `===`**，除非你明确知道要做类型转换。

---

**Q: 异步代码里 `this` 丢了？**
A: 普通函数里的 `this` 是调用时决定的，异步回调里会变成 `undefined`。
用箭头函数（继承外层 this）或者存个 `const self = this`：

```js
// ❌ this 丢了
setTimeout(function () {
  console.log(this); // undefined
}, 1000);

// ✅ 箭头函数继承外层 this
setTimeout(() => {
  console.log(this); // 还是组件实例
}, 1000);
```

---

**Q: 深拷贝和浅拷贝的区别？**
A:

- **浅拷贝**（`Object.assign` / `...扩展运算符`）：只复制第一层，嵌套对象还是引用
- **深拷贝**（`JSON.parse(JSON.stringify())`）：完全复制一份，互不影响

```js
const obj = { a: 1, b: { c: 2 } };

// 浅拷贝：改 b.c 会影响原对象
const shallow = { ...obj };
shallow.b.c = 999; // obj.b.c 也变了！

// 深拷贝：完全独立
const deep = JSON.parse(JSON.stringify(obj));
deep.b.c = 999; // obj.b.c 不变
```

---

**Q: 深拷贝用在什么场景？**
A: 只要你不想让改副本的时候影响到原数据，就用深拷贝：

| 场景 | 为什么要深拷贝 |
|---|---|
| **表单编辑** | 编辑用户信息，点"取消"要还原成原来的样子 |
| **改 Vuex state** | 不能直接改 state，拷贝一份改完再 commit |
| **数组排序** | sort 会改原数组，拷贝一份再排序 |
| **复制默认配置** | 改用户配置时不污染全局默认值 |
| **传数据给子组件** | 防止子组件瞎改影响父组件 |

```js
// 示例：编辑表单，取消要还原
data() {
  return {
    // 深拷贝一份，改 form 不影响原数据
    form: structuredClone(this.rowData),
  }
},
handleCancel() {
  // 取消直接丢掉 form，原数据没动
}
```

**深拷贝方法怎么选？**

| 场景 | 用什么 |
|---|---|
| 现代浏览器（95% 用户） | `structuredClone()` |
| 简单对象，没函数没 Date | `JSON.parse(JSON.stringify())` |
| 复杂数据（有函数 / 循环引用） | `lodash.cloneDeep` |

---

**Q: `typeof null` 为什么是 `'object'`？**
A: JS 的历史遗留 bug，别问了，记住就行。
判断 null 用 `x === null`。

---

**Q: 数组方法 map / forEach / filter / find 有什么区别？**
A:

| 方法      | 干什么             | 返回什么                         |
| --------- | ------------------ | -------------------------------- |
| `map`     | 每个元素都改一遍   | 新数组（长度和原数组一样）       |
| `filter`  | 过滤符合条件的     | 新数组（长度可能变短）           |
| `find`    | 找第一个符合条件的 | 那个元素（找不到返回 undefined） |
| `forEach` | 循环做事情         | 啥都不返回                       |
| `some`    | 有没有符合条件的   | true / false                     |
| `every`   | 是不是全部符合     | true / false                     |

---

#### 数组方法大全（按用途分类）

**增删改（会改原数组）**

| 方法 | 干什么 | 返回什么 |
|---|---|---|
| `push()` | 末尾加元素 | 新长度 |
| `pop()` | 末尾删元素 | 被删的元素 |
| `unshift()` | 开头加元素 | 新长度 |
| `shift()` | 开头删元素 | 被删的元素 |
| `splice(start, count, ...items)` | 任意位置增删改 | 被删的数组 |
| `sort()` | 排序 | 原数组（改了顺序） |
| `reverse()` | 反转 | 原数组（倒过来了） |
| `fill(value)` | 全部填充成同一个值 | 原数组 |

```js
const arr = [1, 2, 3];

arr.push(4);        // [1, 2, 3, 4]
arr.pop();          // [1, 2, 3]，返回 4
arr.unshift(0);     // [0, 1, 2, 3]
arr.shift();        // [1, 2, 3]，返回 0
arr.splice(1, 1);   // [1, 3]，删掉第 2 个
arr.splice(1, 0, 2); // [1, 2, 3]，在第 2 个位置插入 2
```

---

**查询（不改原数组）**

| 方法 | 干什么 | 返回什么 |
|---|---|---|
| `indexOf(x)` | 找 x 的下标 | 下标（找不到 -1） |
| `includes(x)` | 有没有 x | true / false |
| `find(fn)` | 找第一个符合的元素 | 那个元素 / undefined |
| `findIndex(fn)` | 找第一个符合的下标 | 下标 / -1 |

```js
const arr = [10, 20, 30, 40];

arr.indexOf(30);     // 2
arr.includes(50);    // false
arr.find(x => x > 25); // 30
arr.findIndex(x => x > 25); // 2
```

---

**遍历 / 转换（不改原数组）**

| 方法 | 干什么 | 返回什么 |
|---|---|---|
| `map(fn)` | 每个元素都改一遍 | 新数组 |
| `filter(fn)` | 过滤符合条件的 | 新数组 |
| `forEach(fn)` | 循环做事情 | 啥都不返回 |
| `some(fn)` | 有没有符合的 | true / false |
| `every(fn)` | 是不是全部符合 | true / false |
| `reduce(fn, init)` | 累加 / 折叠 | 最终值 |
| `flat(depth)` | 拍平嵌套数组 | 新数组 |
| `flatMap(fn)` | map + flat 二合一 | 新数组 |

```js
// reduce 求和
const nums = [1, 2, 3, 4];
const sum = nums.reduce((sum, x) => sum + x, 0); // 10

// flat 拍平嵌套数组
const nested = [1, [2, 3], [4, [5, 6]]];
nested.flat();      // [1, 2, 3, 4, [5, 6]]（拍平一层）
nested.flat(2);     // [1, 2, 3, 4, 5, 6]（拍平两层）
```

---

**拼接 / 截取（不改原数组）**

| 方法 | 干什么 | 返回什么 |
|---|---|---|
| `concat(arr2)` | 拼接两个数组 | 新数组 |
| `slice(start, end)` | 截取一段 | 新数组 |
| `join(separator)` | 数组转字符串 | 字符串 |

```js
const a = [1, 2];
const b = [3, 4];

a.concat(b);       // [1, 2, 3, 4]
[1, 2, 3, 4].slice(1, 3); // [2, 3]（从第 1 个到第 3 个之前）
[1, 2, 3].join("-"); // "1-2-3"
```

---

**其他常用**

| 方法 | 干什么 |
|---|---|
| `Array.isArray(x)` | 判断是不是数组 |
| `Array.from(xxx)` | 把类数组 / Set 转成真数组 |
| `arr.at(-1)` | 取最后一个元素（负数从后数） |

```js
[1, 2, 3].at(-1);  // 3（最后一个）
[1, 2, 3].at(-2);  // 2（倒数第二个）
```

---

#### 对象数组常用操作（找相同 / 找不同 / 合并去重）

```js
const arr1 = [
  { id: 1, name: "iPhone" },
  { id: 2, name: "Mac" },
  { id: 3, name: "iPad" },
];

const arr2 = [
  { id: 2, name: "Mac" },
  { id: 3, name: "iPad" },
  { id: 4, name: "Watch" },
];
```

**1. 找两个数组的交集（都有的）**

```js
// 按 id 找相同的
const common = arr1.filter((item1) => arr2.some((item2) => item2.id === item1.id));
// 结果：[{id:2, name:"Mac"}, {id:3, name:"iPad"}]
```

**2. 找 arr1 独有的（arr2 没有的）**

```js
const onlyArr1 = arr1.filter((item1) => !arr2.some((item2) => item2.id === item1.id));
// 结果：[{id:1, name:"iPhone"}]
```

**3. 找 arr2 独有的（arr1 没有的）**

```js
const onlyArr2 = arr2.filter((item2) => !arr1.some((item1) => item1.id === item2.id));
// 结果：[{id:4, name:"Watch"}]
```

**4. 合并两个数组 + 按 id 去重**

```js
const merged = [...arr1, ...arr2.filter((item2) => !arr1.some((item1) => item1.id === item2.id))];
// 结果：4 个，id 1/2/3/4 都有，没有重复
```

**5. 按某个字段去重（单个数组）**

```js
const list = [
  { id: 1, name: "A" },
  { id: 2, name: "B" },
  { id: 1, name: "A 重复" },
];

const unique = list.filter(
  (item, index, self) => index === self.findIndex((t) => t.id === item.id)
);
// 结果：id 1 和 2，重复的 id 1 被去掉了
```

**6. 数组求和 / 求平均值**

```js
const prices = [{ price: 999 }, { price: 1999 }, { price: 2999 }];

// 求和
const total = prices.reduce((sum, item) => sum + item.price, 0);
// 结果：5997

// 求平均值
const avg = total / prices.length;
```

---

#### 进阶高频坑

**Q: 事件循环：setTimeout / Promise / async await 谁先执行？**
A: 记住一句话：**同步代码先跑，然后微任务（Promise），最后宏任务（setTimeout）**。

```js
console.log("1"); // 同步

setTimeout(() => console.log("2")); // 宏任务，最后跑

Promise.resolve().then(() => console.log("3")); // 微任务，中间跑

console.log("4"); // 同步

// 输出顺序：1 → 4 → 3 → 2
```

**为什么？**
- 同步代码直接跑
- 微任务（Promise.then / await）在同步代码后立刻跑
- 宏任务（setTimeout / setInterval）要等下一轮事件循环

---

**Q: for 循环里用 var，异步回调全拿到最后一个值？**
A: `var` 没有块级作用域，循环结束后 `i` 变成最后一个值。
用 `let` 或者闭包解决：

```js
// ❌ 全输出 3
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}

// ✅ 用 let（有块级作用域）
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // 输出 0, 1, 2
}
```

---

**Q: Promise 没写 catch，报错了你都不知道？**
A: `.then` 后面必须跟 `.catch`，不然错误被吞了。

```js
// ❌ 请求失败，控制台啥都没有
api.getUser().then(data => {
  console.log(data);
});

// ✅ 加 catch
api.getUser()
  .then(data => console.log(data))
  .catch(err => console.error("请求失败：", err));
```

---

**Q: async/await 怎么处理错误？**
A: 用 `try/catch`，不然错误直接抛到全局：

```js
// ❌ 不捕获，报错直接白屏
async function loadData() {
  const data = await api.getUser();
  console.log(data);
}

// ✅ try/catch 包起来
async function loadData() {
  try {
    const data = await api.getUser();
    console.log(data);
  } catch (err) {
    console.error("加载失败：", err);
  }
}
```

---

**Q: 内存泄漏怎么产生的？怎么排查？**
A: 常见原因：

| 原因 | 例子 | 怎么解决 |
|---|---|---|
| 定时器没清 | `setInterval` 忘了 `clearInterval` | `beforeUnmount` 里清掉 |
| 事件监听没移除 | `window.addEventListener` 忘了 `removeEventListener` | `beforeUnmount` 里移除 |
| 闭包持有大对象 | 闭包引用了大数组，GC 回收不了 | 不用的时候置 null |
| 全局变量越积越多 | 随便往 window 上挂东西 | 少用全局变量 |

```js
// ✅ 正确写法
mounted() {
  window.addEventListener("resize", this.onResize);
  this.timer = setInterval(() => {}, 1000);
},
beforeUnmount() {
  // 组件卸载前清掉，不然内存泄漏
  window.removeEventListener("resize", this.onResize);
  clearInterval(this.timer);
}
```

---

**Q: 什么是重排（Reflow）？什么是重绘（Repaint）？**
A:

- **重排**：元素位置 / 尺寸变了，浏览器要重新算布局（代价大）
  - 改 width / height / padding / margin / top / left
  - 新增 / 删除 DOM 元素
  - 改 font-size

- **重绘**：元素外观变了，但位置没变（代价小）
  - 改 color / background / border-color / visibility

**优化建议**：
- 不要频繁改样式，合并成一次改（用 class 切换）
- 动画用 `transform` 和 `opacity`（不触发重排，走 GPU 加速）

```css
/* ❌ 触发重排 */
.box {
  width: 100px;
  height: 100px;
}

/* ✅ 用 transform，不触发重排 */
.box {
  transform: scale(1);
}
```

---

**Q: 跨域 CORS 预检请求（OPTIONS）是什么？**
A: 不是所有跨域请求都直接发，"复杂请求"会先发一个 OPTIONS 询问：

- **简单请求**（GET / POST + 常见 header）：直接发
- **复杂请求**（PUT / DELETE / 自定义 header / Content-Type: application/json）：先发 OPTIONS 问后端"允不允许"，允许了才发真正的请求

**常见报错**：
```
Access to fetch at 'xxx' from origin 'xxx' has been blocked by CORS policy
```

**解决**：后端配 CORS 头，或者前端用 proxy 代理（开发环境）。

---

**Q: HTTP 缓存：强缓存 vs 协商缓存？**
A: 改了代码线上还是旧的？多半是缓存没配好。

| 缓存类型 | 怎么触发 | 什么时候失效 |
|---|---|---|
| **强缓存** | `Cache-Control: max-age=31536000` | 一年内直接用本地缓存，不发请求 |
| **协商缓存** | `ETag` / `Last-Modified` | 发请求问服务器"变了没"，没变就用本地 |

**项目里已经配好了**：带 hash 的 JS / CSS 缓存一年，文件名变了自动重新下载。

**线上改了代码还是旧的？**
- 强缓存太狠了？改 nginx 配置，缩短缓存时间
- index.html 不要缓存（不然用户永远看到旧的入口）

---

### CSS 常见坑

**Q: 居中的几种方式？**
A:

```css
/* 水平居中（行内元素） */
.text {
  text-align: center;
}

/* 水平居中（块级元素） */
.box {
  margin: 0 auto;
}

/* 水平垂直都居中（Flex，最常用） */
.parent {
  display: flex;
  justify-content: center; /* 水平 */
  align-items: center; /* 垂直 */
}

/* 水平垂直都居中（绝对定位 + transform） */
.box {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
```

---

**Q: z-index 不生效？**
A: z-index 只对**定位元素**（position 不是 static）生效。
检查：

1. 元素有没有 `position: relative/absolute/fixed`
2. 父元素是不是创建了新的层叠上下文

---

**Q: 两个相邻元素的 margin 合并了（margin 塌陷）？**
A: 块级元素上下 margin 会合并成一个（取大的那个）。
解决：给其中一个加 `display: inline-block` 或者用 padding 替代。

---

**Q: 文字溢出省略号？**
A: 三行代码：

```css
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap; /* 单行省略 */
}

/* 多行省略（比如 2 行） */
.ellipsis-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

---

**Q: 盒模型 `content-box` 和 `border-box` 区别？**
A:

- `content-box`（默认）：width 只是内容宽度，padding 和 border 另外加，实际宽度 = width + padding + border
- `border-box`：width 包含 padding 和 border，实际宽度就是 width

**推荐全局用 `border-box`**：

```scss
* {
  box-sizing: border-box;
}
```

---

### DOM 常见坑

**Q: `event.target` 和 `event.currentTarget` 区别？**
A:

- `event.target`：真正触发事件的元素（点到谁就是谁）
- `event.currentTarget`：绑定事件的元素（事件绑在谁身上就是谁）

```html
<ul @click="handleClick">
  <li>1</li>
  <!-- 点这个 -->
  <li>2</li>
</ul>
```

```js
handleClick(e) {
  e.target;        // <li>1</li>（真正点的）
  e.currentTarget;  // <ul>（绑定事件的）
}
```

---

**Q: 怎么阻止冒泡 / 阻止默认行为？**
A:

```js
// 阻止事件冒泡（不让父元素收到）
e.stopPropagation();

// 阻止默认行为（比如 a 标签不跳转、表单不提交）
e.preventDefault();
```

---

**Q: 动态添加的元素，事件不生效？**
A: 事件绑早了，元素还没出来。用**事件委托**（绑在父元素上）：

```html
<ul id="list">
  <!-- JS 动态加 <li> -->
</ul>
```

```js
// ❌ 直接绑 li，新加的 li 没事件
// document.querySelectorAll("li").forEach(li => li.onclick = ...);

// ✅ 绑在 ul 上，动态加的 li 也有事件
document.getElementById("list").addEventListener("click", (e) => {
  if (e.target.tagName === "LI") {
    console.log("点了：", e.target.textContent);
  }
});
```

---

**Q: `offsetWidth` / `clientWidth` / `scrollWidth` 区别？**
A:

| 属性          | 包含什么                                   |
| ------------- | ------------------------------------------ |
| `clientWidth` | 内容宽度 + padding（不含 border / 滚动条） |
| `offsetWidth` | 内容宽度 + padding + border + 滚动条       |
| `scrollWidth` | 内容实际宽度（包括看不见的溢出部分）       |

简单记：**client 是看得到的，offset 是盒子本身大小，scroll 是内容总大小**。
