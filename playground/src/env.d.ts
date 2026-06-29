/// <reference types="vite/client" />
/// <reference types="vite-plugin-uni-custom-routes/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<object, object, unknown>
  export default component
}
