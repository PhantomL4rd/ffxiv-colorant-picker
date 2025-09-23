<script lang="ts">
import { Palette, Heart, ExternalLink } from '@lucide/svelte';

interface Props {
  activeTab: 'picker' | 'favorites';
  onTabChange: (tab: 'picker' | 'favorites') => void;
}

let { activeTab, onTabChange }: Props = $props();

// 要望/感想リンク
const feedbackUrl = 'https://jp.finalfantasyxiv.com/lodestone/character/27344914/blog/5609012/';

function handleTabClick(tab: 'picker' | 'favorites') {
  onTabChange(tab);
}

function openFeedbackLink() {
  window.open(feedbackUrl, '_blank', 'noopener,noreferrer');
}
</script>

<!-- フッター固定タブナビゲーション -->
<div class="fixed bottom-0 left-0 right-0 z-50 bg-base-200 border-t border-base-300">
  <div class="container mx-auto px-4">
    <div class="flex justify-center items-center h-16">
      <!-- タブボタン群 -->
      <div class="flex space-x-8">
        <!-- カララントピッカータブ -->
        <button 
          class="flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 min-w-[80px]"
          class:bg-primary={activeTab === 'picker'}
          class:text-primary-content={activeTab === 'picker'}
          class:text-base-content={activeTab !== 'picker'}
          class:hover:bg-base-300={activeTab !== 'picker'}
          onclick={() => handleTabClick('picker')}
          aria-label="カララントピッカー"
        >
          <Palette class="w-6 h-6 mb-1" />
          <span class="text-xs font-medium">ピッカー</span>
        </button>

        <!-- お気に入りタブ -->
        <button 
          class="flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 min-w-[80px]"
          class:bg-primary={activeTab === 'favorites'}
          class:text-primary-content={activeTab === 'favorites'}
          class:text-base-content={activeTab !== 'favorites'}
          class:hover:bg-base-300={activeTab !== 'favorites'}
          onclick={() => handleTabClick('favorites')}
          aria-label="お気に入り"
        >
          <Heart class="w-6 h-6 mb-1" />
          <span class="text-xs font-medium">お気に入り</span>
        </button>

        <!-- 要望/感想リンク -->
        <button 
          class="flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 min-w-[80px] text-base-content hover:bg-base-300"
          onclick={openFeedbackLink}
          aria-label="要望・感想を送る"
        >
          <ExternalLink class="w-6 h-6 mb-1" />
          <span class="text-xs font-medium">要望・感想</span>
        </button>
      </div>
    </div>
  </div>
</div>

<!-- フッター分の余白確保 -->
<div class="h-16"></div>

<style>
  /* タブボタンのアクティブ状態アニメーション */
  button {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }
  
  button:active {
    transform: scale(0.95);
  }
  
  /* フォーカス時のアウトライン */
  button:focus-visible {
    outline: 2px solid hsl(var(--p));
    outline-offset: 2px;
  }
</style>