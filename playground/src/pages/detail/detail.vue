<script setup lang="ts">
function back() {
  uni.navigateBack()
}
</script>

<template>
  <view class="page">
    <text class="title">detail 页</text>
    <text class="desc">/pages/detail/detail → /detail</text>
    <button @click="back">
      返回
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
  color: #8f8f94;
}
</style>
