import { writable, get } from 'svelte/store';
import type { Dye, HarmonyPattern, ExtendedDye, CustomColor } from '$lib/types';
import { generateSuggestedDyes } from '$lib/utils/colorHarmony';
import { filterStore } from './filter';
import { dyeStore } from './dyes';
import { isCustomDye } from '$lib/utils/customColorUtils';
import { rgbToOklab } from '$lib/utils/colorConversion';

// 選択状態ストア
export const selectionStore = writable<{
  primaryDye: Dye | ExtendedDye | null;
  suggestedDyes: [Dye, Dye] | null;
  pattern: HarmonyPattern;
}>({
  primaryDye: null,
  suggestedDyes: null,
  pattern: 'triadic',
});

// 基本カララント（またはカスタムカラー）を選択
export function selectPrimaryDye(dye: Dye | ExtendedDye): void {
  selectionStore.update((state) => {
    // 提案生成用のdyesを取得
    // カテゴリフィルターは適用せず、メタリック除外のみ適用
    const allDyes = get(dyeStore);
    const currentFilter = get(filterStore);
    const dyesForSuggestion = currentFilter.excludeMetallic
      ? allDyes.filter((d) => !d.tags?.includes('metallic'))
      : allDyes;

    let suggested: [Dye, Dye] | null = null;

    if (dyesForSuggestion.length > 0) {
      if (isCustomDye(dye)) {
        // カスタムカラーの場合は通常のDyeとして扱って提案生成
        const dyeForHarmony: Dye = {
          id: dye.id,
          name: dye.name,
          category: dye.category,
          hsv: dye.hsv,
          rgb: dye.rgb,
          hex: dye.hex,
          oklab: dye.oklab,
          tags: dye.tags,
        };
        suggested = generateSuggestedDyes(dyeForHarmony, state.pattern, dyesForSuggestion);
      } else {
        suggested = generateSuggestedDyes(dye, state.pattern, dyesForSuggestion);
      }
    }

    return {
      ...state,
      primaryDye: dye,
      suggestedDyes: suggested,
    };
  });
}

// 配色パターンを変更
export function updatePattern(pattern: HarmonyPattern): void {
  selectionStore.update((state) => {
    let suggested = state.suggestedDyes;

    // 基本カララントが選択されている場合、提案を再生成
    if (state.primaryDye) {
      // 提案生成用のdyesを取得
      // カテゴリフィルターは適用せず、メタリック除外のみ適用
      const allDyes = get(dyeStore);
      const currentFilter = get(filterStore);
      const dyesForSuggestion = currentFilter.excludeMetallic
        ? allDyes.filter((d) => !d.tags?.includes('metallic'))
        : allDyes;

      suggested =
        dyesForSuggestion.length > 0
          ? generateSuggestedDyes(state.primaryDye, pattern, dyesForSuggestion)
          : null;
    }

    return {
      ...state,
      pattern,
      suggestedDyes: suggested,
    };
  });
}

// 提案カララントを再生成
export function regenerateSuggestions(): void {
  selectionStore.update((state) => {
    if (!state.primaryDye) return state;

    // 提案生成用のdyesを取得
    // カテゴリフィルターは適用せず、メタリック除外のみ適用
    const allDyes = get(dyeStore);
    const currentFilter = get(filterStore);
    const dyesForSuggestion = currentFilter.excludeMetallic
      ? allDyes.filter((d) => !d.tags?.includes('metallic'))
      : allDyes;

    const suggested =
      dyesForSuggestion.length > 0
        ? generateSuggestedDyes(state.primaryDye, state.pattern, dyesForSuggestion)
        : null;

    return {
      ...state,
      suggestedDyes: suggested,
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

// 主色と提案色を直接設定（シェア復元用）
export function setPaletteDirectly(
  primaryDye: Dye | ExtendedDye,
  suggestedDyes: [Dye, Dye],
  pattern: HarmonyPattern
): void {
  selectionStore.set({
    primaryDye,
    suggestedDyes,
    pattern,
  });
}

// カスタムカラーを選択（便利関数）
export function selectCustomColor(customColor: CustomColor): void {
  // CustomColorをExtendedDyeに変換してから選択
  const customDye: ExtendedDye = {
    id: `custom-${customColor.id}`,
    name: customColor.name,
    category: '白系',
    hsv: customColor.hsv,
    rgb: customColor.rgb,
    hex: `#${customColor.rgb.r.toString(16).padStart(2, '0')}${customColor.rgb.g.toString(16).padStart(2, '0')}${customColor.rgb.b.toString(16).padStart(2, '0')}`,
    oklab: rgbToOklab(customColor.rgb),
    tags: ['custom'],
    source: 'custom',
    customColor,
  };

  selectPrimaryDye(customDye);
}
