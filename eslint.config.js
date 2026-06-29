import antfu from '@antfu/eslint-config'

export default antfu()
  // 本项目使用 trustPolicy: off（关闭 pnpm 供应链降级校验），
  // 关闭 antfu 对 pnpm-workspace 设置的强制校验以避免与之冲突。
  .append({
    files: ['pnpm-workspace.yaml'],
    rules: {
      'pnpm/yaml-enforce-settings': 'off',
    },
  })
