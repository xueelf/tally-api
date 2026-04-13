<script setup lang="ts">
import { onMounted, ref } from 'vue';

const API = 'https://tally.yuki.sh/hits/docs/tally-api';
const count = ref<number | null>(null);
const isFailed = ref(false);

onMounted(async () => {
  try {
    const response = await fetch(API);

    if (!response.ok) {
      throw new Error('Request failed');
    }
    const data: { count: number } = await response.json();

    count.value = data.count;
  } catch {
    isFailed.value = true;
  }
});
</script>

<template>
  <div class="count-card">
    <span v-if="isFailed">Failed to fetch count.</span>
    <span v-else-if="count === null">Loading...</span>
    <span v-else>Total API Hits: {{ count }}</span>
  </div>
</template>

<style scoped>
.count-card {
  padding: 20px 24px;
  border-radius: 8px;
  background-color: var(--vp-code-block-bg);
}
</style>
