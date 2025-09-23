import { writable, get } from 'svelte/store';
import type { Dye, HarmonyPattern } from '$lib/types';
import { generateSuggestedDyes } from '$lib/utils/colorHarmony';
import { filteredDyes } from './filter';

// 選択状態ストア
export const selectionStore = writable<{
  primaryDye: Dye | null;
  suggestedDyes: [Dye, Dye] | null;
  pattern: HarmonyPattern;
}>({
  primaryDye: null,
  suggestedDyes: null,
  pattern: 'triadic',
});


// 基本カララントを選択
export function selectPrimaryDye(dye: Dye): void {
  selectionStore.update((state) => {
    // フィルター済みのdyesを取得（メタリック除外適用済み）
    const currentDyes = get(filteredDyes);

    const suggested = currentDyes.length > 0 
      ? generateSuggestedDyes(dye, state.pattern, currentDyes)
      : null;

    return {
      ...state,
      primaryDye: dye,
      suggestedDyes: suggested
    };
  });
}

// 配色パターンを変更
export function updatePattern(pattern: HarmonyPattern): void {
  selectionStore.update((state) => {
    let suggested = state.suggestedDyes;
    
    // 基本カララントが選択されている場合、提案を再生成
    if (state.primaryDye) {
      // フィルター済みのdyesを取得（メタリック除外適用済み）
      const currentDyes = get(filteredDyes);
      
      suggested = currentDyes.length > 0 
        ? generateSuggestedDyes(state.primaryDye, pattern, currentDyes)
        : null;
    }

    return {
      ...state,
      pattern,
      suggestedDyes: suggested
    };
  });
}

// 提案カララントを再生成
export function regenerateSuggestions(): void {
  selectionStore.update((state) => {
    if (!state.primaryDye) return state;

    // フィルター済みのdyesを取得（メタリック除報適用済み）
    const currentDyes = get(filteredDyes);

    const suggested = currentDyes.length > 0 
      ? generateSuggestedDyes(state.primaryDye, state.pattern, currentDyes)
      : null;

    return {
      ...state,
      suggestedDyes: suggested
    };
  });
}

// 選択をクリア
export function clearSelection(): void {
  selectionStore.set({
    primaryDye: null,
    suggestedDyes: null,
    pattern: 'triadic',
  });
}
