import type { Plugin } from 'vite'
import { describe, expect, it } from 'vitest'
import VitePluginUniCustomRoutes, {
  RESOLVED_VIRTUAL_MODULE_ID,
  VIRTUAL_MODULE_ID,
} from '../src/index'

// Vite 的 hook 类型是 function | { handler, ... }，本插件直接定义为 function
type Fn = (...args: any[]) => any
function asFn(hook: unknown): Fn {
  return (typeof hook === 'function' ? hook : (hook as { handler: Fn }).handler) as Fn
}

describe('vitePluginUniCustomRoutes', () => {
  it('返回 Vite 插件对象（带正确 name / enforce）', () => {
    const plugin = VitePluginUniCustomRoutes() as Plugin
    expect(plugin.name).toBe('vite-plugin-uni-custom-routes')
    expect(plugin.enforce).toBe('pre')
  })

  it('resolveId 命中虚拟模块时返回 resolved id；未命中返回 undefined', () => {
    const plugin = VitePluginUniCustomRoutes() as Plugin
    const resolveId = asFn(plugin.resolveId)
    expect(resolveId(VIRTUAL_MODULE_ID)).toBe(RESOLVED_VIRTUAL_MODULE_ID)
    expect(resolveId('some-other-id')).toBeUndefined()
  })

  it('load 命中 resolved id 时返回运行时代码并注入选项；未命中返回 undefined', () => {
    const plugin = VitePluginUniCustomRoutes({
      manualRoutes: { '/pages/foo/foo': '/foo' },
      redirects: { '/pages/old-foo/old-foo': '/foo' },
    }) as Plugin
    const load = asFn(plugin.load)

    const code = load(RESOLVED_VIRTUAL_MODULE_ID)
    expect(typeof code).toBe('string')
    expect(code).toContain('setupCustomRoutes')
    // 选项透传到运行时代码字符串
    expect(code).toContain('/pages/foo/foo')
    expect(code).toContain('/pages/old-foo/old-foo')

    expect(load('some-other-id')).toBeUndefined()
  })
})
