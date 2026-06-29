import uni from '@dcloudio/vite-plugin-uni'
import { defineConfig } from 'vite'
import VitePluginUniCustomRoutes from 'vite-plugin-uni-custom-routes'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 1173,
    open: true,
  },
  plugins: [
    VitePluginUniCustomRoutes({
      // 旧路径过渡兼容：假设 about 页过去叫 pages/legacy-about/legacy-about（现已重命名），
      // 但旧 URL 在分享链接 / SEO 收录里还在用 —— 用 redirects 把它们自动重定向到新短路由。
      redirects: {
        '/pages/legacy-about/legacy-about': '/about',
      },
    }),
    uni(),
  ],
})
