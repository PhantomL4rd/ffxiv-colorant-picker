<script lang="ts">
import { onMount } from 'svelte';
import type { Dye, HarmonyPattern } from '$lib/types';
import { dyeStore, loadDyes } from '$lib/stores/dyes';
import { selectionStore, selectPrimaryDye, updatePattern } from '$lib/stores/selection';
import { filterStore, filteredDyes, toggleCategory, resetFilters } from '$lib/stores/filter';
import { generateSuggestedDyes } from '$lib/utils/colorHarmony';
import { Palette, SwatchBook, Shuffle } from '@lucide/svelte';

import DyeGrid from '$lib/components/DyeGrid.svelte';
import CombinationPreview from '$lib/components/CombinationPreview.svelte';
import PatternSelector from '$lib/components/PatternSelector.svelte';
import CategoryFilter from '$lib/components/CategoryFilter.svelte';
import RandomPickButton from '$lib/components/RandomPickButton.svelte';

let isLoading = $state(true);

// ストアから状態を取得
const selectedDye = $derived($selectionStore.primaryDye);
const suggestedDyes = $derived($selectionStore.suggestedDyes);
const selectedPattern = $derived($selectionStore.pattern);
const dyes = $derived($dyeStore);
const filteredDyesList = $derived($filteredDyes);
const selectedCategory = $derived($filterStore.categories);

onMount(async () => {
  try {
    await loadDyes();
    isLoading = false;
  } catch (error) {
    console.error('カララントデータの読み込みに失敗しました:', error);
    isLoading = false;
  }
});

function handleDyeSelect(dye: Dye) {
  selectPrimaryDye(dye);
}

function handlePatternChange(pattern: HarmonyPattern) {
  updatePattern(pattern);
}


function handleToggleCategory(category: string) {
  toggleCategory(category);
}

function handleClearCategories() {
  resetFilters();
}

function handleRandomPick(randomDyes: [Dye, Dye, Dye]) {
  const [primary, ...suggestions] = randomDyes;
  selectPrimaryDye(primary);
  // 提案は自動生成されるので、ここでは設定しない
}
</script>

<svelte:head>
  <title>FF14 カララントピッカー</title>
</svelte:head>

<div class="min-h-screen bg-base-100">
  <!-- ヘッダー -->
  <div class="navbar bg-primary text-primary-content mb-8">
    <div class="container mx-auto">
      <div class="flex-1">
        <h1 class="text-xl font-bold flex items-center gap-2">
          <Palette class="w-6 h-6" />
          FF14 カララントピッカー
        </h1>
      </div>
    </div>
  </div>
  
  <div class="container mx-auto px-4 pb-8">
    {#if isLoading}
      <div class="flex justify-center items-center h-64">
        <span class="loading loading-spinner loading-lg"></span>
        <span class="ml-2">カララントデータを読み込み中...</span>
      </div>
    {:else}
      <!-- メインコンテンツ -->
      <div class="space-y-8">
        <!-- フィルターとコントロール -->
        <div class="space-y-6">
          
          <!-- 配色パターン選択 -->
          <div class="card bg-base-200 shadow-md">
            <div class="card-body">
              <PatternSelector 
                {selectedPattern}
                onPatternChange={handlePatternChange}
              />
            </div>
          </div>
          
          <!-- ランダムピック -->
          <div class="card bg-base-200 shadow-md">
            <div class="card-body">
              <RandomPickButton 
                dyes={filteredDyesList}
                onRandomPick={handleRandomPick}
              />
            </div>
          </div>
        </div>
        
        <!-- プレビュー -->
        <div class="space-y-6">
          {#if selectedDye && suggestedDyes}
            <!-- 組み合わせプレビュー -->
            <div class="card bg-base-200 shadow-md">
              <div class="card-body">
                <h2 class="card-title text-lg mb-4">プレビュー</h2>
                <CombinationPreview 
                  selectedDye={selectedDye}
                  suggestedDyes={suggestedDyes}
                  pattern={selectedPattern}
                />
              </div>
            </div>
          {:else}
            <!-- 未選択時のメッセージ -->
            <div class="card bg-base-200 shadow-md">
              <div class="card-body text-center">
                <div class="text-base-content/60">
                  <Shuffle class="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p class="text-lg font-medium mb-2">カララントを選択してください</p>
                  <p class="text-sm">
                    カララント一覧から気に入った色を選ぶか、<br />
                    ランダムピックボタンで自動選択してみましょう。
                  </p>
                </div>
              </div>
            </div>
          {/if}
        </div>
        
        <!-- カテゴリフィルター -->
        <div class="card bg-base-200 shadow-md">
          <div class="card-body">
            <CategoryFilter 
              selectedCategory={selectedCategory}
              onToggleCategory={handleToggleCategory}
              onClearCategories={handleClearCategories}
            />
          </div>
        </div>
        
        <!-- カララント一覧 -->
        <div>
          <div class="card bg-base-200 shadow-md">
            <div class="card-body">
              <h2 class="card-title text-lg mb-4 flex items-center gap-2">
                <SwatchBook class="w-5 h-5" />
                カララント一覧
              </h2>
              <div class="max-h-[600px] overflow-y-auto">
                <DyeGrid 
                  dyes={filteredDyesList}
                  {selectedDye}
                  onDyeSelect={handleDyeSelect}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
<div class="text-xs text-gray-400 text-center py-2">FINAL FANTASYは、株式会社スクウェア・エニックス・ホールディングスの登録商標です。</div>
<style>
  :global(body) {
    margin: 0;
  }
</style>