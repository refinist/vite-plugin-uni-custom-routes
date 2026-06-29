import type { UniCustomRoutesOptions } from '../src/types'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createRuntimeModule,
  normalizeRouteMap,
  shortenPath,
  withLeadingSlash,
} from '../src/runtime'

describe('shortenPath', () => {
  it('取末段', () => expect(shortenPath('pages/about/about')).toBe('about'))
  it('末段为 index 时退一层取父目录', () => expect(shortenPath('pages/foo/index')).toBe('foo'))
  it('容忍前导斜杠', () => expect(shortenPath('/pages/bar/bar')).toBe('bar'))
})

describe('normalizeRouteMap', () => {
  it('补全前导斜杠', () => expect(normalizeRouteMap({ a: 'b' })).toEqual({ '/a': '/b' }))
  it('已带斜杠保持不变', () => expect(normalizeRouteMap({ '/a': '/b' })).toEqual({ '/a': '/b' }))
  it('未传时返回空对象', () => expect(normalizeRouteMap()).toEqual({}))
})

describe('withLeadingSlash', () => {
  it('未带 / 时补充', () => expect(withLeadingSlash('foo')).toBe('/foo'))
  it('已带 / 时保持', () => expect(withLeadingSlash('/foo')).toBe('/foo'))
})

interface UniRoute {
  path: string
  meta?: Record<string, any>
  redirect?: (target: any) => any
}

interface Interceptor { invoke: (args: any) => void }

interface UniMock {
  addInterceptor: (api: string, handler: Interceptor) => void
}

function runRuntime(options: UniCustomRoutesOptions, uniRoutes: UniRoute[]) {
  // 模拟 uni 实际行为：同一个 api 可以注册多个 invoke 共存（按注册顺序依次执行）
  const interceptors = new Map<string, Interceptor[]>()
  const uni: UniMock = {
    addInterceptor: (api, handler) => {
      const list = interceptors.get(api) ?? []
      list.push(handler)
      interceptors.set(api, list)
    },
  }
  vi.stubGlobal('__uniRoutes', uniRoutes)
  vi.stubGlobal('uni', uni)
  // 去掉 export 关键字以便用 Function 包裹执行；通过 return 拿到 setupCustomRoutes
  const code = createRuntimeModule(options).replace(/export\s+function/g, 'function')
  // eslint-disable-next-line no-new-func
  const factory = new Function(`${code}\nreturn { setupCustomRoutes };`) as () => {
    setupCustomRoutes: () => void
  }
  factory().setupCustomRoutes()
  return { uniRoutes, interceptors, uni }
}

function fire(interceptors: Map<string, Interceptor[]>, api: string, args: any) {
  interceptors.get(api)?.forEach(h => h.invoke(args))
}

afterEach(() => vi.unstubAllGlobals())

describe('setupCustomRoutes', () => {
  it('改写 __uniRoutes 上的页面路径为短路由', () => {
    const { uniRoutes } = runRuntime({}, [
      { path: '/pages/about/about' },
      { path: '/pages/detail/detail' },
    ])
    expect(uniRoutes.map(r => r.path).sort()).toEqual(['/about', '/detail'])
  })

  it('入口页由 uni 自动编译为 / 并被守卫跳过，不会错误短化任何 /pages/xxx/xxx', () => {
    // uni h5 把 pages.json 第一项编译成 path === '/'，原始 /pages/xxx/xxx 不会出现在 __uniRoutes
    // 其他普通页面（包括同名的 /pages/index/index 若不是第一项）应正常短化
    const { uniRoutes } = runRuntime({}, [
      { path: '/' },
      { path: '/pages/index/index' },
      { path: '/pages/about/about' },
    ])
    expect(uniRoutes.some(r => r.path === '/')).toBe(true)
    expect(uniRoutes.some(r => r.path === '/index')).toBe(true)
    expect(uniRoutes.some(r => r.path === '/about')).toBe(true)
  })

  it('tabBar 页也会参与短路由改写（uni h5 内部用 __uniRoutes 匹配 switchTab，不依赖 tabBar.list）', () => {
    const { uniRoutes } = runRuntime({}, [
      { path: '/pages/home/home', meta: { isTabBar: true } },
      { path: '/pages/about/about' },
    ])
    expect(uniRoutes.some(r => r.path === '/home')).toBe(true)
    expect(uniRoutes.some(r => r.path === '/about')).toBe(true)
  })

  it('exclude 支持字符串/正则/glob/函数', () => {
    const r1 = runRuntime(
      { exclude: ['about/about'] },
      [{ path: '/pages/about/about' }, { path: '/pages/detail/detail' }],
    )
    expect(r1.uniRoutes.some(r => r.path === '/pages/about/about')).toBe(true)
    expect(r1.uniRoutes.some(r => r.path === '/detail')).toBe(true)

    const r2 = runRuntime(
      { exclude: [/detail/] },
      [{ path: '/pages/about/about' }, { path: '/pages/detail/detail' }],
    )
    expect(r2.uniRoutes.some(r => r.path === '/about')).toBe(true)
    expect(r2.uniRoutes.some(r => r.path === '/pages/detail/detail')).toBe(true)

    const r3 = runRuntime(
      { exclude: ['pages/**'] },
      [{ path: '/pages/about/about' }],
    )
    expect(r3.uniRoutes[0].path).toBe('/pages/about/about')

    const r4 = runRuntime(
      { exclude: [(p: string) => p.includes('about')] },
      [{ path: '/pages/about/about' }, { path: '/pages/detail/detail' }],
    )
    expect(r4.uniRoutes.some(r => r.path === '/detail')).toBe(true)
    expect(r4.uniRoutes.some(r => r.path === '/pages/about/about')).toBe(true)
  })

  it('manualRoutes 覆盖自动生成（键值自动补斜杠）', () => {
    const { uniRoutes } = runRuntime(
      { manualRoutes: { 'pages/foo/foo': 'custom' } },
      [{ path: '/pages/foo/foo' }],
    )
    expect(uniRoutes[0].path).toBe('/custom')
  })

  it('redirects 注入纯重定向路由用于旧路径兼容', () => {
    const { uniRoutes } = runRuntime(
      { redirects: { 'pages/old/old': '/foo' } },
      [{ path: '/pages/about/about' }],
    )
    const redirect = uniRoutes.find(r => r.path === '/pages/old/old')
    expect(redirect).toBeTruthy()
    expect(typeof redirect!.redirect).toBe('function')
    expect(redirect!.redirect!({ query: { id: 1 }, hash: '#x' })).toEqual({
      path: '/foo',
      query: { id: 1 },
      hash: '#x',
    })
  })

  it('redirects 旧路径若仍是真实页面则不注入重复条目', () => {
    // about 被 exclude 排除 → 不参与短路由改写，path 保留 /pages/about/about
    const { uniRoutes } = runRuntime(
      { exclude: ['about/about'], redirects: { '/pages/about/about': '/foo' } },
      [{ path: '/pages/about/about' }],
    )
    expect(uniRoutes.length).toBe(1)
    expect(uniRoutes[0].path).toBe('/pages/about/about')
  })

  it('注册全部导航 API 拦截器并改写 url', () => {
    const { interceptors } = runRuntime({}, [{ path: '/pages/about/about' }])
    for (const api of ['navigateTo', 'redirectTo', 'reLaunch', 'switchTab', 'preloadPage'])
      expect(interceptors.get(api)).toBeTruthy()

    const args: any = { url: '/pages/about/about?id=1' }
    fire(interceptors, 'navigateTo', args)
    expect(args.url).toBe('/about?id=1')
  })

  it('跳过 __uniRoutes 中 path 缺失/无效的项（兼容 uni h5 内部占位 route）', () => {
    const { uniRoutes } = runRuntime({}, [
      { path: '/pages/about/about' },
      // 模拟 uni h5 内部 tabBar layout / catch-all / 根路径占位 等无有效页面路径的 route
      { meta: { isTabBar: true } } as any,
      undefined as any,
      { path: '/' }, // 根路径 layout 父 route：shortenPath 会得到空，必须跳过
      { path: '' },
    ])
    expect(uniRoutes.some(r => r && r.path === '/about')).toBe(true)
    // 根路径不应该被错误地短化或修改
    expect(uniRoutes.some(r => r && r.path === '/')).toBe(true)
  })

  it('拦截器对 redirects 的旧路径也生效', () => {
    const { interceptors } = runRuntime(
      { redirects: { '/pages/old/old': '/foo' } },
      [{ path: '/pages/about/about' }],
    )
    const args: any = { url: '/pages/old/old' }
    fire(interceptors, 'navigateTo', args)
    expect(args.url).toBe('/foo')
  })

  it('和业务层后注册的 invoke 共存，args.url 改写依然生效', () => {
    const { interceptors, uni } = runRuntime({}, [{ path: '/pages/about/about' }])

    // 模拟业务代码：setupCustomRoutes 之后注册自己的拦截器（鉴权 / 埋点等）
    const businessSawUrls: string[] = []
    uni.addInterceptor('navigateTo', {
      invoke(args) {
        businessSawUrls.push(args.url)
      },
    })

    // navigateTo 触发：插件 invoke 与业务 invoke 都应执行
    expect(interceptors.get('navigateTo')!.length).toBe(2)
    const args: any = { url: '/pages/about/about' }
    fire(interceptors, 'navigateTo', args)

    expect(args.url).toBe('/about')
    // 插件先注册 → 先执行 → 业务 invoke 看到的是已改写的短路径
    expect(businessSawUrls).toEqual(['/about'])
  })

  it('args.originalUrl 始终保留业务调用时传入的原始 url', () => {
    const { interceptors, uni } = runRuntime(
      { redirects: { '/pages/old/old': '/foo' } },
      [{ path: '/pages/about/about' }],
    )

    const seen: Array<{ url: string, originalUrl: string }> = []
    uni.addInterceptor('navigateTo', {
      invoke(args) {
        seen.push({ url: args.url, originalUrl: args.originalUrl })
      },
    })

    // ① 短路由改写
    const a: any = { url: '/pages/about/about?id=1' }
    fire(interceptors, 'navigateTo', a)
    expect(a).toMatchObject({ url: '/about?id=1', originalUrl: '/pages/about/about?id=1' })

    // ② 旧路径走 redirects
    const b: any = { url: '/pages/old/old' }
    fire(interceptors, 'navigateTo', b)
    expect(b).toMatchObject({ url: '/foo', originalUrl: '/pages/old/old' })

    // 业务 invoke 读到的应是改写后 url + 原始 originalUrl
    expect(seen).toEqual([
      { url: '/about?id=1', originalUrl: '/pages/about/about?id=1' },
      { url: '/foo', originalUrl: '/pages/old/old' },
    ])
  })

  it('未发生改写的 url 也会写入 originalUrl（业务侧统一读法）', () => {
    const { interceptors } = runRuntime(
      { exclude: ['pages/skip/skip'] },
      [{ path: '/pages/about/about' }],
    )
    // /pages/skip/skip 不在 customRoutes / redirects 中（被排除），不会改写
    const args: any = { url: '/pages/skip/skip' }
    fire(interceptors, 'navigateTo', args)
    expect(args.url).toBe('/pages/skip/skip')
    expect(args.originalUrl).toBe('/pages/skip/skip')
  })

  it('业务层 invoke 可以在插件改写之后追加自己的修改（链式叠加）', () => {
    const { interceptors, uni } = runRuntime({}, [{ path: '/pages/about/about' }])

    // 业务侧：在已改写的 url 后追加 query
    uni.addInterceptor('navigateTo', {
      invoke(args) {
        args.url = `${args.url}${args.url.includes('?') ? '&' : '?'}from=biz`
      },
    })

    const args: any = { url: '/pages/about/about?id=1' }
    fire(interceptors, 'navigateTo', args)
    expect(args.url).toBe('/about?id=1&from=biz')
  })
})

describe('createRuntimeModule（字符串形态）', () => {
  it('内嵌 NAV_APIS 包含全部五个导航 API', () => {
    const code = createRuntimeModule({})
    for (const api of ['navigateTo', 'redirectTo', 'reLaunch', 'switchTab', 'preloadPage'])
      expect(code).toContain(`'${api}'`)
  })

  it('内嵌 OPTIONS 包含规范化后的 manualRoutes / redirects', () => {
    const code = createRuntimeModule({
      manualRoutes: { 'pages/foo/foo': '/foo' },
      redirects: { 'pages/old/old': '/foo' },
    })
    expect(code).toContain('"/pages/foo/foo":"/foo"')
    expect(code).toContain('"/pages/old/old":"/foo"')
  })

  it('exclude 中的正则与函数序列化为字面量', () => {
    const code = createRuntimeModule({
      exclude: [/detail/, (p: string) => p.includes('x')],
    })
    expect(code).toContain('/detail/')
    expect(code).toContain('p.includes')
  })
})
