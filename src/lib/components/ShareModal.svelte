<script lang="ts">
import { X, Copy, Check } from '@lucide/svelte';
import type { Favorite } from '$lib/types';
import { generateShareUrl, generateShareText, copyToClipboard } from '$lib/utils/shareUtils';
import CombinationPreview from './CombinationPreview.svelte';

interface Props {
  isOpen: boolean;
  favorite: Favorite | null;
  onClose: () => void;
}

const { isOpen, favorite, onClose }: Props = $props();

let copySuccess = $state(false);
let copyError = $state('');
let iscopying = $state(false);

// シェア用データの計算（derivedで直接計算 - 関数構文なし）
const shareUrl = $derived(favorite ? generateShareUrl(favorite) : '');
const shareText = $derived(favorite && shareUrl ? generateShareText(favorite, shareUrl) : '');

// 個別のderived変数でアクセス（関数構文なし）
const primaryDye = $derived(favorite?.primaryDye || null);
const suggestedDyes = $derived(favorite?.suggestedDyes || []);
const suggestedDye1 = $derived(suggestedDyes[0] || null);
const suggestedDye2 = $derived(suggestedDyes[1] || null);

// コピー機能
async function handleCopy() {
  if (!shareText || iscopying) return;

  iscopying = true;
  copyError = '';
  copySuccess = false;

  try {
    const success = await copyToClipboard(shareText);
    if (success) {
      copySuccess = true;
      // 2秒後にリセット
      setTimeout(() => {
        copySuccess = false;
      }, 2000);
    } else {
      copyError = 'コピーに失敗しました。手動でコピーしてください。';
    }
  } catch (error) {
    copyError = 'コピーに失敗しました。手動でコピーしてください。';
  } finally {
    iscopying = false;
  }
}

// モーダル外クリック時の処理
function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    onClose();
  }
}

// Escapeキーでモーダルを閉じる
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    onClose();
  }
}
</script>

<!-- モーダル -->
{#if isOpen && favorite}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <dialog 
    class="modal modal-open" 
    onkeydown={handleKeydown}
    aria-labelledby="share-modal-title"
    aria-describedby="share-modal-description"
  >
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-backdrop" onclick={handleBackdropClick} role="button" tabindex="-1">
      <div class="modal-box w-11/12 max-w-2xl" onclick={(e) => e.stopPropagation()}>
        <!-- ヘッダー -->
        <div class="flex items-center justify-between mb-6">
          <h3 id="share-modal-title" class="text-lg font-bold">パレットをシェア</h3>
          <button
            type="button"
            class="btn btn-sm btn-ghost"
            onclick={onClose}
            aria-label="モーダルを閉じる"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- パレットプレビュー -->
        <div class="mb-6">
          <div class="grid grid-cols-3 gap-4">
            <!-- 主色 -->
            {#if primaryDye}
              <div class="text-center">
                <div 
                  class="w-full h-16 rounded-lg border-2 border-base-300 mb-2"
                  style="background-color: {primaryDye.hex};"
                  title={primaryDye.name}
                ></div>
                <h4 class="font-medium text-sm text-base-content">{primaryDye.name}</h4>
              </div>
            {/if}
            
            <!-- 提案色1 -->
            {#if suggestedDye1}
              <div class="text-center">
                <div 
                  class="w-full h-16 rounded-lg border-2 border-base-300 mb-2"
                  style="background-color: {suggestedDye1.hex};"
                  title={suggestedDye1.name}
                ></div>
                <h4 class="font-medium text-sm text-base-content">{suggestedDye1.name}</h4>
              </div>
            {/if}
            
            <!-- 提案色2 -->
            {#if suggestedDye2}
              <div class="text-center">
                <div 
                  class="w-full h-16 rounded-lg border-2 border-base-300 mb-2"
                  style="background-color: {suggestedDye2.hex};"
                  title={suggestedDye2.name}
                ></div>
                <h4 class="font-medium text-sm text-base-content">{suggestedDye2.name}</h4>
              </div>
            {/if}
          </div>
        </div>

        <!-- シェア用テキスト -->
        <div class="mb-6">
          <label for="share-text" class="label">
            <span class="label-text font-medium">シェア用テキスト</span>
          </label>
          
          <textarea
            id="share-text"
            class="textarea textarea-bordered w-full h-32 resize-none text-base-content"
            readonly
            value={shareText}
            onclick={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target?.select();
            }}
          ></textarea>
          
          {#if copyError}
            <div class="label">
              <span class="label-text-alt text-error">{copyError}</span>
            </div>
          {/if}
        </div>

        <!-- ボタン群 -->
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="btn btn-soft"
            onclick={onClose}
          >
            閉じる
          </button>
          <button
            type="button"
            class="btn btn-primary gap-2"
            onclick={handleCopy}
            disabled={iscopying || !shareText}
            class:btn-success={copySuccess}
          >
            {#if copySuccess}
              <Check class="w-4 h-4" />
              コピー完了！
            {:else if iscopying}
              <span class="loading loading-spinner loading-xs"></span>
              コピー中...
            {:else}
              <Copy class="w-4 h-4" />
              コピー
            {/if}
          </button>
        </div>
      </div>
    </div>
  </dialog>
{/if}