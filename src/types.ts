export type RouteMatcher
  = | string
    | RegExp
    | ((pagePath: string) => boolean)

export interface UniCustomRoutesOptions {
  /**
   * 排除规则，匹配的页面不会被短化
   * 字符串：精确匹配（支持带 / 不带 `pages/` 前缀）；`xxx/**` 表示前缀通配
   * 正则 / 函数：自定义匹配；函数会被序列化注入运行时，**不要使用闭包变量**
   * @default []
   */
  exclude?: RouteMatcher[]

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
