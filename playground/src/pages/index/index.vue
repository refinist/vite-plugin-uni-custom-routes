<script setup lang="ts">
import { computed } from 'vue'

const origin = computed(() =>
  typeof window === 'undefined' ? '' : window.location.origin,
)

function goAbout() {
  uni.navigateTo({ url: '/pages/about/about' })
}
function goDetail() {
  uni.navigateTo({ url: '/pages/detail/detail' })
}
function goMine() {
  uni.switchTab({ url: '/pages/mine/mine' })
}
function goLegacyAbout() {
  // 业务代码（或站外旧分享链接里的指引代码）仍在用旧路径
  // → 插件拦截器把它翻译到新短路由 /about
  uni.navigateTo({ url: '/pages/legacy-about/legacy-about' })
}
</script>

<template>
  <view class="page">
    <text class="title">首页（tab1）</text>
    <text class="desc">
      业务代码继续使用 <text class="code">pages/xxx/xxx</text> 调用 uni 跳转 API（跨端兼容），
      插件会拦截并把浏览器地址改写为短路由。
    </text>

    <text class="section">短路由改写</text>
    <button @click="goAbout">
      navigateTo('/pages/about/about') → 地址栏 /about
    </button>
    <button @click="goDetail">
      navigateTo('/pages/detail/detail') → 地址栏 /detail
    </button>
    <button @click="goMine">
      switchTab('/pages/mine/mine') → 地址栏 /mine
    </button>

    <text class="section">旧路径过渡兼容（redirects）</text>
    <text class="desc">
      vite.config 里配置了
      <text class="code">'/pages/legacy-about/legacy-about' → '/about'</text>。
      不只是按钮点击，浏览器地址栏直接输入
      <text class="code">{{ origin }}/pages/legacy-about/legacy-about</text>
      也会自动跳到 <text class="code">/about</text> —— 旧分享链接 / 书签 / SEO 收录不会 404。
    </text>
    <button @click="goLegacyAbout">
      navigateTo('/pages/legacy-about/legacy-about') → 地址栏 /about
    </button>
  </view>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 32rpx;
}
.title {
  font-size: 36rpx;
  font-weight: bold;
}
.desc {
  font-size: 26rpx;
  color: #333;
  line-height: 1.6;
}
.code {
  color: #007aff;
  font-family: monospace;
}
.section {
  margin-top: 16rpx;
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
}
</style>
