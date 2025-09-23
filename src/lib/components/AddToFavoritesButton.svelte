<script lang="ts">
import { Heart } from '@lucide/svelte';
import { selectionStore } from '$lib/stores/selection';
import { saveFavorite } from '$lib/stores/favorites';

interface Props {
  disabled?: boolean;
}

const { disabled = false }: Props = $props();

// 保存状態
let isSaving = $state(false);
let saveError = $state('');

// 現在の選択状態
const currentSelection = $derived($selectionStore);

// プライマリ染料が選択されていない場合は無効
const isDisabled = $derived(disabled || !currentSelection.primaryDye || !currentSelection.suggestedDyes);

async function openModal() {
  if (isDisabled) return;
  
  // 即座にお気に入りに追加（モーダルを表示せずに）
  await handleSave();
}

async function handleSave() {
  if (!currentSelection.primaryDye || !currentSelection.suggestedDyes) {
    saveError = '組み合わせが選択されていません。';
    return;
  }

  try {
    isSaving = true;
    saveError = '';

    await saveFavorite({
      name: undefined, // 自動生成される名前を使用
      primaryDye: currentSelection.primaryDye,
      suggestedDyes: currentSelection.suggestedDyes,
      pattern: currentSelection.pattern
    });

    // 成功を示すトーストを表示（モーダルなしで）
    showToast();
    
  } catch (error) {
    saveError = error instanceof Error ? error.message : 'お気に入りの保存に失敗しました。';
    // エラーの場合はアラートで表示
    alert(saveError);
  } finally {
    isSaving = false;
  }
}

// 成功トーストを表示
function showToast() {
  const toast = document.createElement('div');
  toast.className = 'toast toast-top toast-end z-50';
  toast.innerHTML = `
    <div class="alert alert-success">
      <span>お気に入りに追加しました！</span>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // 3秒後に削除
  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
  }, 3000);
}

</script>

<!-- お気に入り追加ボタン -->
<button
  class="btn btn-primary btn-sm"
  class:btn-disabled={isDisabled}
  class:loading={isSaving}
  onclick={openModal}
  disabled={isDisabled || isSaving}
  aria-label="お気に入りに追加"
>
  {#if isSaving}
    保存中...
  {:else}
    <Heart class="w-4 h-4" />
    お気に入りに追加
  {/if}
</button>