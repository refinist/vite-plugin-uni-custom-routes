# vite-plugin-uni-custom-routes

<a href="https://www.npmjs.com/package/vite-plugin-uni-custom-routes"><img src="https://img.shields.io/npm/v/vite-plugin-uni-custom-routes" alt="NPM version"></a>

为 uni-app **H5** 页面提供「自定义短路由」的 Vite 插件：把形如 `/pages/foo/foo` 的长路径在运行时改写成 `/foo` 这样的短路由，同时拦截 `navigateTo` 等导航 API，无需改动业务代码。

## ✨ Features

- ⚡️ **纯运行时** —— 不读 / 不解析 `pages.json`，直接基于 uni-app 编译产物 `__uniRoutes` 改写路由
- 🪶 **零配置** —— 开箱即用，按"取末段"规则自动生成短路由，业务代码 0 改动
- 🌐 **跨端友好** —— 同一份 `/pages/xxx/xxx` 调用在 H5 / 小程序两端都正常工作，小程序端自动 no-op
- 🔄 **旧路径过渡** —— `redirects` 让改名前的旧 URL 自动重定向到新短路由（vue-router 层 + 拦截器双重生效）
- 🔌 **拦截器无侵入** —— 与业务 `invoke` 共存，并通过 `args.originalUrl` 透传原始长路径
- 🎛 **灵活控制** —— `exclude`（字符串 / 正则 / 函数 / glob）+ `manualRoutes` 手动覆盖，应对深层嵌套与冲突
- 🛡 **TypeScript 友好** —— 配置项 `UniCustomRoutesOptions` 与虚拟模块 `virtual:uni-custom-routes` 均有完整类型，开箱即享 IDE 补全

## 安装

```bash
pnpm i -D vite-plugin-uni-custom-routes
```

## 使用

```ts
// vite.config.ts
import Uni from '@dcloudio/vite-plugin-uni'
import { defineConfig } from 'vite'
import UniCustomRoutes from 'vite-plugin-uni-custom-routes'

// 建议放在 Uni 之前
export default defineConfig({
  plugins: [UniCustomRoutes(), Uni()],
})
```

在应用入口启用：

```ts
// src/main.ts
import { setupCustomRoutes } from 'virtual:uni-custom-routes'
import { createSSRApp } from 'vue'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  setupCustomRoutes()
  return { app }
}
```

引用虚拟模块的客户端类型（`env.d.ts`）：

```ts
/// <reference types="vite-plugin-uni-custom-routes/client" />
```

业务代码无需任何改动，继续按 `/pages/xxx/xxx` 调用 uni 跳转 API（保持跨端兼容），浏览器地址栏会自动变成短路由。

## 短路由规则

短路由取自页面路径的**末段**；末段为 `index` 时退一层取父目录名：

| `pages.json` 中的页面路径 | 短路由 |
| --- | --- |
| `pages/foo/foo` | `/foo` |
| `pages/bar/bar` | `/bar` |
| `pages/baz/index` | `/baz` |

> 插件**不读取、不生成、不修改 `pages.json`**，只在运行时基于 uni-app 已编译产物 `__uniRoutes` 改写路由；页面仍由你在 `pages.json` 中正常声明，主包与分包都会自然包含。

## 插件配置

```ts
interface UniCustomRoutesOptions {
  /**
   * 排除规则，匹配的页面不会被短化
   * 字符串：精确匹配（支持带 / 不带 `pages/` 前缀）；`xxx/**` 表示前缀通配
   * 正则 / 函数：自定义匹配；函数会被序列化注入运行时，**不要使用闭包变量**
   * @default []
   */
  exclude?: (string | RegExp | ((pagePath: string) => boolean))[]

  /**
   * 手动追加 / 覆盖短路由映射，键值会自动补全前导 `/`
   * 适合处理深层嵌套（如 pages/foo/bar/baz）或自动规则产生冲突的页面
   * @default {}
   */
  manualRoutes?: Record<string, string>

  /**
   * 旧路径过渡兼容：旧长路径 → 新短路由的重定向，键值自动补 `/`
   * 同时作用于 vue-router 路由层（浏览器地址栏直访也生效）和导航拦截器（业务调用也生效）
   * @example { '/pages/old-foo/old-foo': '/foo' }
   * @default {}
   */
  redirects?: Record<string, string>
}
```

### 配置示例

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import UniCustomRoutes from 'vite-plugin-uni-custom-routes'

export default defineConfig({
  plugins: [
    UniCustomRoutes({
      exclude: [
        '/pages/foo/**', // 整个分支不做自动短化
        /^\/pages\/bar/,
        pagePath => pagePath.endsWith('-baz'),
      ],
      manualRoutes: {
        '/pages/foo/bar/baz': '/foo-bar',
        '/pages/qux/bar/baz': '/qux-baz',
      },
      redirects: {
        '/pages/old-foo/old-foo': '/foo',
      },
    }),
  ],
})
```

### 完整类型定义

请查看 [types.ts](./src/types.ts) 获取完整定义。

## 业务侧也注册了 invoke 时

uni 允许同一个 api 注册多个 `invoke`，插件不会影响业务自己的拦截器。**插件先注册 → 业务 invoke 后跑**，所以业务侧读取时：

- `args.url` —— 插件改写后的**短路径**（如 `/foo`），用于按页面身份做事
- `args.originalUrl` —— 业务调用时传入的**原始长路径**（如 `/pages/foo/foo`），用于跨端共用按长路径写的鉴权 / 埋点规则

```ts
uni.addInterceptor('navigateTo', {
  invoke(args) {
    // H5 端读 originalUrl 拿原始长路径；小程序端没有本插件，args.url 就是原始长路径
    const path = args.originalUrl ?? args.url
    if (path.startsWith('/pages/foo'))
      doSomething()
  },
})
```

> 业务调用 `uni.removeInterceptor('navigateTo')` **不传第二个参数**时会连带删掉插件的 invoke，导致短路由改写失效。要只删自己的拦截器，必须传入对应 handler。

## 旧路径过渡兼容（redirects）

页面改名或短路由调整后，旧的 `/pages/old-foo/old-foo` 长路径会从路由表里消失，**旧分享链接、用户书签、搜索引擎收录的旧 URL 直接 404**。`redirects` 用来在迁移期内保留这些旧路径：

```ts
UniCustomRoutes({
  redirects: {
    '/pages/old-foo/old-foo': '/foo',
  },
})
```

- 重定向落在 **vue-router 路由层**（向 `__uniRoutes` 注入纯重定向记录），因此**浏览器地址栏直接访问旧 URL 也生效**，而不仅是 `navigateTo` 等 API 调用
- 自动透传 query 与 hash：访问 `/pages/old-foo/old-foo?id=1` 会重定向到 `/foo?id=1`
- 仅对显式列出的旧路径生效；若旧路径仍是某个真实页面，则不会覆盖其正常渲染

## FAQ

### 短路由冲突会怎样？

多个长路径映射到同一短路由时（如 `pages/foo/bar/baz` 与 `pages/qux/bar/baz` 都被短化为 `/baz`），会在浏览器 console 输出 warning。用 `manualRoutes` 显式区分即可。

### 小程序端需要做什么吗？

不需要。短路由是浏览器 URL 层面的优化，小程序没有"地址栏"概念。插件在**构建期**检测 `process.env.UNI_PLATFORM`：

- H5 编译时 → 注入完整运行时
- 小程序 / App 等编译时 → 注入**空实现** `export function setupCustomRoutes() {}`

所以小程序产物几乎不夹带本插件代码（仅一个空函数），也不影响任何 uni API 行为。业务代码继续按 `/pages/xxx/xxx` 调用 uni API 即可，**同一份代码 H5 / 小程序两端都正常工作**。

### 支持 hash 模式吗？

支持。H5 的 hash / history 模式都会改写 `__uniRoutes`，hash 模式下浏览器地址栏看到的是 `/#/foo` 这种短形式。

### 如何调试当前的短路由映射？

在调用 `setupCustomRoutes()` 之后加一行：

```ts
console.log((globalThis as any).__uniRoutes.map((r: any) => r?.path))
```

打开浏览器 console 即可看到所有 route 当前的 path（短路由 / 长路径 / 重定向条目都在）。

## License

[MIT](./LICENSE)
