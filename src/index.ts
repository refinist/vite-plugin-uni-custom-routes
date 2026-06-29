import type { Plugin } from 'vite'
import type { UniCustomRoutesOptions } from './types'
import process from 'node:process'
import { RESOLVED_VIRTUAL_MODULE_ID, VIRTUAL_MODULE_ID } from './constant'
import { createRuntimeModule } from './runtime'

export { RESOLVED_VIRTUAL_MODULE_ID, VIRTUAL_MODULE_ID } from './constant'
export type { RouteMatcher, UniCustomRoutesOptions } from './types'

export function VitePluginUniCustomRoutes(
  options: UniCustomRoutesOptions = {},
): Plugin {
  return {
    name: 'vite-plugin-uni-custom-routes',
    enforce: 'pre',
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID)
        return RESOLVED_VIRTUAL_MODULE_ID
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_MODULE_ID)
        return
      // 非 H5 平台返回空实现，让小程序等产物不夹带任何运行时
      // process.env.UNI_PLATFORM 由 @dcloudio/vite-plugin-uni 在构建期注入；
      // 未设置时（如直接用 vite 跑 / 单元测试）fallback 为完整运行时
      const platform = process.env.UNI_PLATFORM
      if (platform && platform !== 'h5')
        return 'export function setupCustomRoutes() {}'
      return createRuntimeModule(options)
    },
  }
}

export default VitePluginUniCustomRoutes
