<script lang="ts">
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import { base } from '$app/paths';
import type { Favorite } from '$lib/types';
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

function handleSelectFavorite(favorite: Favorite) {
  // お気に入りが選択されたらピッカーページに遷移
  goto(`${base}/`);
}
</script>

<svelte:head>
  <title>お気に入り | FF14 カララントピッカー</title>
</svelte:head>

{#if isLoading}
  <div class="flex justify-center items-center min-h-[400px]">
    <span class="loading loading-spinner loading-lg"></span>
  </div>
{:else}
  <FavoritesList onSelectFavorite={handleSelectFavorite} />
{/if}