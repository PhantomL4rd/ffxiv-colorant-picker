<script lang="ts">
import { Heart, Shuffle } from '@lucide/svelte';
import type { Favorite } from '$lib/types';
import { favoritesStore, restoreFavorite } from '$lib/stores/favorites';
import FavoriteItem from './FavoriteItem.svelte';
import ShareModal from './ShareModal.svelte';

interface Props {
  onSelectFavorite?: (favorite: Favorite) => void;
}

const { onSelectFavorite }: Props = $props();

// ShareModal の状態管理
let shareModalOpen = $state(false);
let selectedFavoriteForShare = $state<Favorite | null>(null);

// お気に入り一覧（作成日時順、新しい順）
const favorites = $derived($favoritesStore);
const sortedFavorites = $derived(
  favorites.slice().sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  })
);

// 件数
const favoriteCount = $derived(favorites.length);

// お気に入りが選択された時の処理
function handleSelectFavorite(favorite: Favorite) {
  try {
    // お気に入りを復元（ピッカーに適用）
    restoreFavorite(favorite);

    // 親コンポーネントにも通知（タブ切り替えなど）
    onSelectFavorite?.(favorite);
  } catch (error) {
    console.error('お気に入りの復元に失敗しました:', error);
  }
}

// シェア機能
function handleShare(favorite: Favorite) {
  selectedFavoriteForShare = favorite;
  shareModalOpen = true;
}

function closeShareModal() {
  shareModalOpen = false;
  selectedFavoriteForShare = null;
}
</script>

<div class="container mx-auto px-4 pb-20 pt-4">
  <!-- ヘッダー -->
  <div class="mb-6">
    <div class="flex items-center gap-3 mb-2">
      <Heart class="w-6 h-6 text-primary" />
      <h1 class="text-2xl font-bold">お気に入り</h1>
    </div>
    
    {#if favoriteCount > 0}
      <p class="text-base-content/60 text-sm">
        {favoriteCount}件のお気に入りがあります
      </p>
    {/if}
  </div>

  <!-- コンテンツ -->
  {#if sortedFavorites.length === 0}
    <!-- 空状態 -->
    <div class="card bg-base-200 shadow-md">
      <div class="card-body text-center py-16">
        <div class="text-base-content/40 mb-6">
          <Heart class="w-20 h-20 mx-auto mb-4" />
        </div>
        <h2 class="text-xl font-semibold mb-4 text-base-content/70">
          まだお気に入りがありません
        </h2>
        <div class="text-base-content/60 space-y-2">
          <p>カララントピッカーで気に入った組み合わせを見つけたら、</p>
          <p>「お気に入りに追加」ボタンで保存しましょう。</p>
        </div>
        <div class="mt-6">
          <div class="badge badge-outline">
            <Shuffle class="w-3 h-3 mr-1" />
            ピッカータブで組み合わせを探してみましょう
          </div>
        </div>
      </div>
    </div>
  {:else}
    <!-- お気に入り一覧 -->
    <div class="space-y-4">
      {#each sortedFavorites as favorite (favorite.id)}
        <FavoriteItem 
          {favorite}
          onSelect={handleSelectFavorite}
          onShare={handleShare}
        />
      {/each}
    </div>

    <!-- ページ下部の余白確保メッセージ -->
    {#if favoriteCount >= 5}
      <div class="text-center mt-8 mb-4">
        <p class="text-base-content/40 text-sm">
          {favoriteCount}件のお気に入りを表示中
        </p>
      </div>
    {/if}
  {/if}
</div>

<!-- ShareModal -->
<ShareModal 
  isOpen={shareModalOpen}
  favorite={selectedFavoriteForShare}
  onClose={closeShareModal}
/>

<style>
  /* スムーズなスクロール */
  .container {
    scroll-behavior: smooth;
  }
  
  /* お気に入り項目のアニメーション */
  .space-y-4 > :global(*) {
    animation: fadeInUp 0.3s ease-out;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>