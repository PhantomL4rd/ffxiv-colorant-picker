<script lang="ts">
import { Edit2, Trash2, Check, X, Calendar, MousePointer } from '@lucide/svelte';
import type { Favorite } from '$lib/types';
import CombinationPreview from './CombinationPreview.svelte';
import { deleteFavorite, renameFavorite } from '$lib/stores/favorites';
import { getPatternLabel } from '$lib/constants/patterns';

interface Props {
  favorite: Favorite;
  onSelect: (favorite: Favorite) => void;
}

let { favorite, onSelect }: Props = $props();

// 編集状態
let isEditing = $state(false);
let editingName = $state('');
let isDeleting = $state(false);
let isRenaming = $state(false);
let error = $state('');


// 作成日時のフォーマット
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return '日時不明';
  }
}

function startEditing() {
  isEditing = true;
  editingName = favorite.name;
  error = '';
}

function cancelEditing() {
  isEditing = false;
  editingName = '';
  error = '';
}

async function saveEdit() {
  try {
    if (!editingName.trim()) {
      error = '名前は空にできません。';
      return;
    }

    isRenaming = true;
    error = '';
    
    await renameFavorite(favorite.id, editingName.trim());
    
    isEditing = false;
    editingName = '';
  } catch (err) {
    error = err instanceof Error ? err.message : '名前の変更に失敗しました。';
  } finally {
    isRenaming = false;
  }
}

async function handleDelete() {
  if (!isDeleting) {
    isDeleting = true;
    return;
  }

  try {
    await deleteFavorite(favorite.id);
  } catch (err) {
    error = err instanceof Error ? err.message : '削除に失敗しました。';
    isDeleting = false;
  }
}

function cancelDelete() {
  isDeleting = false;
}

function handleSelect() {
  onSelect(favorite);
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && isEditing) {
    saveEdit();
  } else if (event.key === 'Escape' && isEditing) {
    cancelEditing();
  }
}

// フォーカス管理
let nameInput = $state<HTMLInputElement>();
$effect(() => {
  if (isEditing && nameInput) {
    nameInput.focus();
    nameInput.select();
  }
});
</script>

<div class="card bg-base-100 shadow-md border border-base-300 transition-shadow hover:shadow-lg">
  <div class="card-body p-4">
    <!-- ヘッダー部分：名前と操作ボタン -->
    <div class="flex justify-between items-start mb-4">
      <div class="flex-1 min-w-0">
        {#if isEditing}
          <!-- 編集モード -->
          <div class="flex gap-2 items-center">
            <input
              bind:this={nameInput}
              bind:value={editingName}
              type="text"
              class="input input-sm input-bordered flex-1"
              maxlength="100"
              disabled={isRenaming}
              onkeydown={handleKeydown}
              placeholder="お気に入りの名前"
            />
            <button
              class="btn btn-ghost btn-sm btn-circle"
              onclick={saveEdit}
              disabled={isRenaming}
              class:loading={isRenaming}
              aria-label="保存"
            >
              {#if !isRenaming}
                <Check class="w-4 h-4 text-success" />
              {/if}
            </button>
            <button
              class="btn btn-ghost btn-sm btn-circle"
              onclick={cancelEditing}
              disabled={isRenaming}
              aria-label="キャンセル"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        {:else}
          <!-- 表示モード -->
          <div class="flex items-center gap-2">
            <h3 class="font-semibold text-base truncate" title={favorite.name}>
              {favorite.name}
            </h3>
            <button
              class="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100 transition-opacity"
              onclick={startEditing}
              aria-label="名前を編集"
            >
              <Edit2 class="w-3 h-3" />
            </button>
          </div>
        {/if}
        
        <!-- 作成日時 -->
        <div class="flex items-center gap-1 text-xs text-base-content/60 mt-1">
          <Calendar class="w-3 h-3" />
          {formatDate(favorite.createdAt)}
        </div>
      </div>

      <!-- 操作ボタン -->
      {#if !isEditing}
        <div class="flex gap-1 ml-2">
          {#if isDeleting}
            <!-- 削除確認 -->
            <div class="flex gap-1">
              <button
                class="btn btn-error btn-xs"
                onclick={handleDelete}
                aria-label="削除を確認"
              >
                削除
              </button>
              <button
                class="btn btn-ghost btn-xs"
                onclick={cancelDelete}
                aria-label="削除をキャンセル"
              >
                <X class="w-3 h-3" />
              </button>
            </div>
          {:else}
            <!-- 通常の操作ボタン -->
            <button
              class="btn btn-ghost btn-xs btn-circle"
              onclick={handleDelete}
              aria-label="削除"
            >
              <Trash2 class="w-3 h-3 text-error" />
            </button>
          {/if}
        </div>
      {/if}
    </div>

    <!-- エラーメッセージ -->
    {#if error}
      <div class="alert alert-error alert-sm mb-4">
        <span class="text-xs">{error}</span>
      </div>
    {/if}

    <!-- カラープレビュー -->
    <div class="mb-4">
      <div class="grid grid-cols-3 gap-2">
        <!-- プライマリ染料 -->
        <div class="text-center">
          <div 
            class="w-full h-12 rounded border border-base-300"
            style="background-color: {favorite.primaryDye.hex};"
            title={favorite.primaryDye.name}
          ></div>
          <div class="text-xs mt-1 truncate" title={favorite.primaryDye.name}>
            {favorite.primaryDye.name}
          </div>
        </div>
        
        <!-- 提案染料1 -->
        <div class="text-center">
          <div 
            class="w-full h-12 rounded border border-base-300"
            style="background-color: {favorite.suggestedDyes[0].hex};"
            title={favorite.suggestedDyes[0].name}
          ></div>
          <div class="text-xs mt-1 truncate" title={favorite.suggestedDyes[0].name}>
            {favorite.suggestedDyes[0].name}
          </div>
        </div>
        
        <!-- 提案染料2 -->
        <div class="text-center">
          <div 
            class="w-full h-12 rounded border border-base-300"
            style="background-color: {favorite.suggestedDyes[1].hex};"
            title={favorite.suggestedDyes[1].name}
          ></div>
          <div class="text-xs mt-1 truncate" title={favorite.suggestedDyes[1].name}>
            {favorite.suggestedDyes[1].name}
          </div>
        </div>
      </div>
    </div>

    <!-- 選択ボタン -->
    <button
      class="btn btn-primary btn-sm w-full"
      onclick={handleSelect}
      disabled={isEditing || isDeleting}
    >
      <MousePointer class="w-4 h-4" />
      この組み合わせを選択
    </button>

    <!-- パターン表示 -->
    <div class="text-center mt-2">
      <span class="badge badge-outline badge-sm">{getPatternLabel(favorite.pattern)}</span>
    </div>
  </div>
</div>

<style>
  .card:hover .group-hover\:opacity-100 {
    opacity: 1;
  }
</style>