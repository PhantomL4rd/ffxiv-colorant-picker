import { writable, get } from 'svelte/store';
import type { Dye, HarmonyPattern, ExtendedDye, CustomColor } from '$lib/types';
import { generateSuggestedDyes } from '$lib/utils/colorHarmony';
import { filterStore } from './filter';
import { dyeStore } from './dyes';
import { isCustomDye } from '$lib/utils/customColorUtils';
import { rgbToOklab } from '$lib/utils/colorConversion';
import { paletteEventBus } from './paletteEvents';

// 選択状態ストア
export const selectionStore = writable<{
  primaryDye: Dye | ExtendedDye | null;
  suggestedDyes: [Dye, Dye] | null;
  pattern: HarmonyPattern;
  harmonySeed: number;
}>({
  primaryDye: null,
  suggestedDyes: null,
  pattern: 'triadic',
  harmonySeed: Date.now(),
});

// 提案生成用の染料リストを取得する共通関数
function getDyesForSuggestion(): Dye[] {
  const allDyes = get(dyeStore);
  const currentFilter = get(filterStore);
  return currentFilter.excludeMetallic
    ? allDyes.filter((d) => !d.tags?.includes('metallic'))
    : allDyes;
}

// 基本カララント（またはカスタムカラー）を選択
export function selectPrimaryDye(dye: Dye | ExtendedDye): void {
  selectionStore.update((state) => {
    // 提案生成用のdyesを取得
    // カテゴリフィルターは適用せず、メタリック除外のみ適用
    const dyesForSuggestion = getDyesForSuggestion();

    // 新しいシード値を生成（毎回異なる組み合わせ）
    const newSeed = Date.now();
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
        suggested = generateSuggestedDyes(dyeForHarmony, state.pattern, dyesForSuggestion, newSeed);
      } else {
        suggested = generateSuggestedDyes(dye, state.pattern, dyesForSuggestion, newSeed);
      }
    }

    return {
      ...state,
      primaryDye: dye,
      harmonySeed: newSeed,
      suggestedDyes: suggested,
    };
  });
}

// 配色パターンを変更
export function updatePattern(pattern: HarmonyPattern): void {
  selectionStore.update((state) => {
    let suggested = state.suggestedDyes;
    let newSeed = state.harmonySeed;

    // 基本カララントが選択されている場合、提案を再生成
    if (state.primaryDye) {
      // 提案生成用のdyesを取得
      // カテゴリフィルターは適用せず、メタリック除外のみ適用
      const dyesForSuggestion = getDyesForSuggestion();

      // 新しいシード値を生成（配色パターン変更時も異なる組み合わせ）
      newSeed = Date.now();

      suggested =
        dyesForSuggestion.length > 0
          ? generateSuggestedDyes(state.primaryDye, pattern, dyesForSuggestion, newSeed)
          : null;
    }

    return {
      ...state,
      pattern,
      harmonySeed: newSeed,
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
    const dyesForSuggestion = getDyesForSuggestion();

    // 新しいシード値を生成（Vivid/Mutedモード時のみ効果的）
    const newSeed = Date.now();

    const suggested =
      dyesForSuggestion.length > 0
        ? generateSuggestedDyes(state.primaryDye, state.pattern, dyesForSuggestion, newSeed)
        : null;

    return {
      ...state,
      harmonySeed: newSeed,
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
    harmonySeed: Date.now(),
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
    harmonySeed: Date.now(),
  });
}

// パレット復元イベントをリッスン
if (typeof window !== 'undefined') {
  paletteEventBus.on('restore-palette', (event) => {
    setPaletteDirectly(
      event.data.primaryDye,
      event.data.suggestedDyes,
      event.data.pattern
    );
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
