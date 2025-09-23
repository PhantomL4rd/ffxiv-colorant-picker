import { writable, derived } from 'svelte/store';
import type { Dye, DyeCategory, FilterOptions } from '$lib/types';
import { dyeStore } from './dyes';

// フィルター設定ストア
export const filterStore = writable<FilterOptions>({
  categories: null,
  hueRange: [0, 360],
  saturationRange: [0, 100],
  valueRange: [0, 100],
});

// フィルタリングされたカララント一覧
export const filteredDyes = derived([dyeStore, filterStore], ([$dyes, $filter]) => {
  return $dyes.filter((dye) => {
    // カテゴリフィルター
    if ($filter.categories && $filter.categories !== dye.category) {
      return false;
    }

    // 色相範囲フィルター
    if (dye.hsv.h < $filter.hueRange[0] || dye.hsv.h > $filter.hueRange[1]) {
      return false;
    }

    // 彩度範囲フィルター
    if (dye.hsv.s < $filter.saturationRange[0] || dye.hsv.s > $filter.saturationRange[1]) {
      return false;
    }

    // 明度範囲フィルター
    if (dye.hsv.v < $filter.valueRange[0] || dye.hsv.v > $filter.valueRange[1]) {
      return false;
    }

    return true;
  });
});

// カテゴリフィルターを設定
export function setCategory(category: DyeCategory | null): void {
  filterStore.update((filter) => ({ ...filter, categories: category }));
}

// カテゴリフィルターをトグル
export function toggleCategory(category: DyeCategory): void {
  filterStore.update((filter) => {
    const newCategory = filter.categories === category ? null : category;
    return { ...filter, categories: newCategory };
  });
}

// 色相範囲を設定
export function setHueRange(range: [number, number]): void {
  filterStore.update((filter) => ({ ...filter, hueRange: range }));
}

// 彩度範囲を設定
export function setSaturationRange(range: [number, number]): void {
  filterStore.update((filter) => ({ ...filter, saturationRange: range }));
}

// 明度範囲を設定
export function setValueRange(range: [number, number]): void {
  filterStore.update((filter) => ({ ...filter, valueRange: range }));
}

// フィルターをリセット
export function resetFilters(): void {
  filterStore.set({
    categories: null,
    hueRange: [0, 360],
    saturationRange: [0, 100],
    valueRange: [0, 100],
  });
}
