<script lang="ts">
import { onMount } from 'svelte';
import FavoritesList from '$lib/components/FavoritesList.svelte';
import { loadDyes } from '$lib/stores/dyes';

let isLoading = $state(true);

onMount(async () => {
  try {
    await loadDyes();
    isLoading = false;
  } catch (error) {
    console.error('カララントデータの読み込みに失敗しました:', error);
    isLoading = false;
  }
});
</script>

<svelte:head>
  <title>お気に入り | FF14 カララントピッカー</title>
</svelte:head>

{#if isLoading}
  <div class="flex justify-center items-center min-h-[400px]">
    <span class="loading loading-spinner loading-lg"></span>
  </div>
{:else}
  <FavoritesList />
{/if}