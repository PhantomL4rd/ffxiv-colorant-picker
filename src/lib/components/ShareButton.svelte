<script lang="ts">
import { Share } from '@lucide/svelte';
import { selectionStore } from '$lib/stores/selection';
import ShareModal from './ShareModal.svelte';
import type { Favorite } from '$lib/types';

interface Props {
  disabled?: boolean;
  favorite?: Favorite;
  onShare?: (favorite: Favorite) => void;
}

const { disabled = false, favorite, onShare }: Props = $props();

// モーダルの状態
let shareModalOpen = $state(false);
let tempFavorite = $state<Favorite | null>(null);

// 現在の選択状態
const currentSelection = $derived($selectionStore);

// プライマリ染料が選択されていない場合は無効（favoriteがない場合）
const isDisabled = $derived(
  disabled || (!favorite && (!currentSelection.primaryDye || !currentSelection.suggestedDyes))
);

function handleShare() {
  if (favorite && onShare) {
    // Favoriteが渡されている場合（FavoriteItemから使用）
    onShare(favorite);
  } else {
    // 現在の選択から一時的なFavoriteを作成（プレビューから使用）
    openShareModal();
  }
}

function openShareModal() {
  if (isDisabled) return;
  
  if (!currentSelection.primaryDye || !currentSelection.suggestedDyes) {
    return;
  }

  // 一時的なFavoriteオブジェクトを作成（保存はしない）
  tempFavorite = {
    id: `temp-${Date.now()}`,
    name: `${currentSelection.primaryDye.name}の組み合わせ`,
    primaryDye: currentSelection.primaryDye,
    suggestedDyes: currentSelection.suggestedDyes,
    pattern: currentSelection.pattern,
    createdAt: new Date().toISOString()
  };
  
  shareModalOpen = true;
}

function closeShareModal() {
  shareModalOpen = false;
  tempFavorite = null;
}
</script>

{#if favorite}
  <!-- FavoriteItem用（従来の動作） -->
  <button
    type="button"
    class="btn btn-outline btn-sm"
    onclick={handleShare}
    title="パレットをシェア"
  >
    <Share class="w-4 h-4" />
    シェア
  </button>
{:else}
  <!-- プレビュー用（新規） -->
  <button
    class="btn btn-outline btn-sm"
    class:btn-disabled={isDisabled}
    onclick={handleShare}
    disabled={isDisabled}
    aria-label="パレットをシェア"
  >
    <Share class="w-4 h-4" />
    シェア
  </button>
  
  <!-- ShareModal -->
  <ShareModal 
    isOpen={shareModalOpen}
    favorite={tempFavorite}
    onClose={closeShareModal}
  />
{/if}