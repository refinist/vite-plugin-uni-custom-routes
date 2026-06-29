export type RouteMatcher
  = | string
    | RegExp
    | ((pagePath: string) => boolean)

export interface UniCustomRoutesOptions {
  /** 额外排除规则：字符串 / 正则 / 函数 / `xxx/**` 前缀通配 */
  exclude?: RouteMatcher[]
  /** 手动映射，覆盖自动生成；键值会自动补前导 `/` */
  manualRoutes?: Record<string, string>
  /**
   * 旧路径过渡兼容：键为已废弃的旧长路径，值为重定向目标（短路由）。
   * 页面改名 / 短路由调整后，让旧 URL（含浏览器地址栏直接访问、旧分享链接）
   * 仍可访问并自动 301 风格重定向到新短路由。键值会自动补前导 `/`。
   * @example { '/pages/foo/foo': '/foo' }
   */
  redirects?: Record<string, string>
}
