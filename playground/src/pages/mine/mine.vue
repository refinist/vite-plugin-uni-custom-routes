<script setup lang="ts">
function backHome() {
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<template>
  <view class="page">
    <text class="title">我的（tab2）</text>
    <text class="desc">
      浏览器地址栏现在是 <text class="code">/mine</text>，
      但代码里仍然写 <text class="code">switchTab('/pages/mine/mine')</text> 即可。
    </text>
    <button @click="backHome">
      switchTab 回首页
    </button>
  </view>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
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
</style>
