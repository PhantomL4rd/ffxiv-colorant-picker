<script lang="ts">
import { page } from '$app/stores';
import { base } from '$app/paths';
import { SwatchBook, Heart, ExternalLink } from 'lucide-svelte';

const currentPath = $derived($page.url.pathname);

// 要望/感想リンク
const feedbackUrl = 'https://jp.finalfantasyxiv.com/lodestone/character/27344914/blog/5609012/';

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
        <a 
          href="{base}/" 
          class="flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 min-w-[80px]"
          class:bg-primary={currentPath === base + '/' || currentPath === base}
          class:text-primary-content={currentPath === base + '/' || currentPath === base}
          class:text-base-content={currentPath !== base + '/' && currentPath !== base}
          class:hover:bg-base-300={currentPath !== base + '/' && currentPath !== base}
          aria-label="カララントピッカー"
        >
          <SwatchBook class="w-6 h-6 mb-1" />
          <span class="text-xs font-medium">ピッカー</span>
        </a>

        <!-- お気に入りタブ -->
        <a 
          href="{base}/favorites" 
          class="flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 min-w-[80px]"
          class:bg-primary={currentPath === base + '/favorites'}
          class:text-primary-content={currentPath === base + '/favorites'}
          class:text-base-content={currentPath !== base + '/favorites'}
          class:hover:bg-base-300={currentPath !== base + '/favorites'}
          aria-label="お気に入り"
        >
          <Heart class="w-6 h-6 mb-1" />
          <span class="text-xs font-medium">お気に入り</span>
        </a>

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
  a, button {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }
  
  a:active, button:active {
    transform: scale(0.95);
  }
  
  /* フォーカス時のアウトライン */
  a:focus-visible, button:focus-visible {
    outline: 2px solid hsl(var(--p));
    outline-offset: 2px;
  }
</style>