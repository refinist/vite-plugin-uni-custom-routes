import type { Plugin } from 'vite'
import type { UniCustomRoutesOptions } from './types'
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
      if (id === RESOLVED_VIRTUAL_MODULE_ID)
        return createRuntimeModule(options)
    },
  }
}

export default VitePluginUniCustomRoutes
