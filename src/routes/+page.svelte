<script lang="ts">
import { onMount } from 'svelte';
import type { Dye, HarmonyPattern, Favorite } from '$lib/types';
import { loadDyes, dyeStore } from '$lib/stores/dyes';
import { selectionStore, selectPrimaryDye, updatePattern, regenerateSuggestions } from '$lib/stores/selection';
import { filterStore, filteredDyes, toggleCategory, resetFilters, toggleExcludeMetallic } from '$lib/stores/filter';
import { restorePaletteFromUrl } from '$lib/utils/shareUtils';
import { PaintBucket, Blend, SwatchBook } from '@lucide/svelte';

import DyeGrid from '$lib/components/DyeGrid.svelte';
import CombinationPreview from '$lib/components/CombinationPreview.svelte';
import PatternSelector from '$lib/components/PatternSelector.svelte';
import CategoryFilter from '$lib/components/CategoryFilter.svelte';
import RandomPickButton from '$lib/components/RandomPickButton.svelte';
import TabNavigation from '$lib/components/TabNavigation.svelte';
import AddToFavoritesButton from '$lib/components/AddToFavoritesButton.svelte';
import ShareButton from '$lib/components/ShareButton.svelte';
import FavoritesList from '$lib/components/FavoritesList.svelte';
import CustomColorManager from '$lib/components/CustomColorManager.svelte';

let isLoading = $state(true);

// タブ状態管理
let activeTab = $state<'picker' | 'favorites'>('picker');

// カスタムカラー表示モード管理
let showCustomColors = $state(false);

// ストアから状態を取得
const selectedDye = $derived($selectionStore.primaryDye);
const suggestedDyes = $derived($selectionStore.suggestedDyes);
const selectedPattern = $derived($selectionStore.pattern);
const filteredDyesList = $derived($filteredDyes);
const selectedCategory = $derived($filterStore.categories);
const excludeMetallic = $derived($filterStore.excludeMetallic);

onMount(async () => {
  try {
    await loadDyes();
    
    // URL復元処理
    const dyes = $dyeStore;
    if (dyes.length > 0) {
      const restored = restorePaletteFromUrl(dyes);
      if (restored) {
        // パレットが復元された場合、ピッカータブに切り替え
        activeTab = 'picker';
      }
    }
    
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
  showCustomColors = false; // カテゴリ選択時はカスタムカラーを非表示
  toggleCategory(category as any);
}

function handleClearCategories() {
  resetFilters();
}

function handleRandomPick(randomDyes: [Dye, Dye, Dye]) {
  const [primary] = randomDyes;
  
  // 配色パターンもランダムに選択
  const patterns: HarmonyPattern[] = [
    'triadic',
    'split-complementary',
    'analogous',
    'monochromatic',
    'similar',
    'contrast'
  ];
  const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
  
  // 配色パターンを先に設定
  updatePattern(randomPattern);
  
  // その後、主色を選択（提案は自動生成される）
  selectPrimaryDye(primary);
}

function handleExcludeMetallicChange() {
  toggleExcludeMetallic();
  // メタリック除外フィルターが変更されたら配色候補を再生成
  regenerateSuggestions();
}

// タブ切り替えハンドラー
function handleTabChange(tab: 'picker' | 'favorites') {
  activeTab = tab;
}

// お気に入り選択ハンドラー
function handleSelectFavorite(favorite: Favorite) {
  // お気に入りが選択されたらピッカータブに切り替え
  activeTab = 'picker';
}

// カスタムカラー選択ハンドラー
function handleSelectCustomColors() {
  showCustomColors = true;
  resetFilters(); // 通常カテゴリをクリア
}

// カテゴリまたはクリアボタンクリック時にカスタムカラーも非表示に
function handleClearAll() {
  showCustomColors = false;
  handleClearCategories();
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
          <SwatchBook class="w-6 h-6" />
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
      <!-- タブコンテンツ -->
      {#if activeTab === 'picker'}
        <!-- ピッカータブ：メインコンテンツ -->
        <div class="space-y-8">
        <!-- フィルターとコントロール -->
        <div class="space-y-6">
          
          <!-- 配色パターン選択 -->
          <div class="card bg-base-200 shadow-md">
            <div class="card-body">
              <PatternSelector 
                {selectedPattern}
                onPatternChange={handlePatternChange}
                {excludeMetallic}
                onExcludeMetallicChange={handleExcludeMetallicChange}
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
                <div class="flex justify-between items-center mb-4">
                  <h2 class="card-title text-lg">プレビュー</h2>
                  <div class="flex gap-2">
                    <AddToFavoritesButton disabled={!selectedDye || !suggestedDyes} />
                    <ShareButton disabled={!selectedDye || !suggestedDyes} />
                  </div>
                </div>
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
                  <Blend class="h-16 w-16 mx-auto mb-4 opacity-50" />
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
              onClearCategories={handleClearAll}
              onSelectCustomColors={handleSelectCustomColors}
              isCustomColorsSelected={showCustomColors}
            />
          </div>
        </div>
        
        <!-- カララント一覧またはカスタムカラー管理 -->
        <div>
          <div class="card bg-base-200 shadow-md">
            <div class="card-body">
              {#if showCustomColors}
                <!-- カスタムカラー管理表示 -->
                <div class="max-h-[600px] overflow-y-auto">
                  <CustomColorManager />
                </div>
              {:else}
                <!-- 通常のカララント一覧表示 -->
                <h2 class="card-title text-lg mb-4 flex items-center gap-2">
                  <PaintBucket class="w-5 h-5" />
                  カララント一覧
                </h2>
                <div class="max-h-[600px] overflow-y-auto">
                  <DyeGrid 
                    dyes={filteredDyesList}
                    {selectedDye}
                    onDyeSelect={handleDyeSelect}
                  />
                </div>
              {/if}
            </div>
          </div>
        </div>
        </div>
      {:else if activeTab === 'favorites'}
        <!-- お気に入りタブ -->
        <FavoritesList onSelectFavorite={handleSelectFavorite} />
      {/if}
    {/if}
    
    <!-- 著作権表示 -->
    <div class="text-xs text-gray-400 text-center py-4 mt-8">
      FINAL FANTASYは、株式会社スクウェア・エニックス・ホールディングスの登録商標です。
    </div>
  </div>
  
  <!-- タブナビゲーション（フッター固定） -->
  <TabNavigation 
    {activeTab}
    onTabChange={handleTabChange}
  />
</div>
<div class="text-xs text-gray-400 text-center py-2">FINAL FANTASYは、株式会社スクウェア・エニックス・ホールディングスの登録商標です。</div>
<style>
  :global(body) {
    margin: 0;
  }
</style>