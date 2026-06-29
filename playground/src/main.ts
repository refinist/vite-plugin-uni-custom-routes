import { setupCustomRoutes } from 'virtual:uni-custom-routes'
import { createSSRApp } from 'vue'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)

  // 1) 启用短路由
  setupCustomRoutes()

  // 2) 业务层拦截器示例：和插件 invoke 共存（uni 允许同一 api 注册多个 invoke）
  //    - args.url         插件改写后的【短路径】（如 /about）
  //    - args.originalUrl 业务调用时传入的【原始长路径】（如 /pages/about/about）
  //    业务需要按长路径做鉴权 / 埋点时读 originalUrl，能保持和小程序端的一致写法
  //    打开浏览器 console 点首页任一跳转按钮即可看到 log
  ;(['navigateTo', 'switchTab'] as const).forEach((api) => {
    uni.addInterceptor(api, {
      invoke(args: { url: string, originalUrl?: string }) {
        // eslint-disable-next-line no-console
        console.log(`[业务拦截器] ${api}：url=${args.url} originalUrl=${args.originalUrl}`)
      },
    })
  })

  return {
    app,
  }
}
