import { writable, get } from 'svelte/store';
import type {
  CustomColor,
  CustomColorsData,
  StoredCustomColor,
  RGBColor,
  HSVColor,
} from '$lib/types';
import { rgbToHsv, hydrateCustomColor, extractStoredCustomColor } from '$lib/utils/colorConversion';
import { loadFromStorage, saveToStorage as saveStorageUtil } from '$lib/utils/storageService';

const STORAGE_KEY = 'ffxiv-colorant-picker:custom-colors';
const VERSION = '1.0.0';

// カスタムカラーストア
export const customColorsStore = writable<CustomColor[]>([]);

/**
 * LocalStorageからカスタムカラーを読み込み
 */
export function loadCustomColors(): void {
  try {
    // ブラウザ環境チェック
    if (typeof localStorage === 'undefined') {
      customColorsStore.set([]);
      return;
    }

    const data: CustomColorsData = loadFromStorage<CustomColorsData>(STORAGE_KEY, {
      colors: [],
      version: VERSION,
      lastUpdated: new Date().toISOString(),
    });

    // ハイドレーション + 日付文字列をDateオブジェクトに変換
    const colors = data.colors.map((color) => {
      const hydratedColor = hydrateCustomColor(color);
      return {
        ...hydratedColor,
        createdAt: new Date(hydratedColor.createdAt),
        updatedAt: new Date(hydratedColor.updatedAt),
      };
    });

    customColorsStore.set(colors);
  } catch (error) {
    console.error('Failed to load custom colors:', error);
    customColorsStore.set([]);
  }
}

/**
 * LocalStorageにカスタムカラーを保存
 */
function saveToStorage(colors: CustomColor[]): void {
  try {
    // 新形式（軽量）で保存
    const storedColors: StoredCustomColor[] = colors.map((color) =>
      extractStoredCustomColor(color)
    );

    const data = {
      colors: storedColors,
      version: VERSION,
      lastUpdated: new Date().toISOString(),
    };

    saveStorageUtil(STORAGE_KEY, data);
  } catch (error) {
    console.error('Failed to save custom colors:', error);
    throw new Error('カスタムカラーの保存に失敗しました');
  }
}

/**
 * 新しいカスタムカラーを保存
 */
export function saveCustomColor(colorData: { name: string; rgb: RGBColor }): void {
  const newColor: CustomColor = {
    id: crypto.randomUUID(),
    name: colorData.name.trim(),
    rgb: colorData.rgb,
    hsv: rgbToHsv(colorData.rgb),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  customColorsStore.update((colors) => {
    const updated = [...colors, newColor];
    saveToStorage(updated);
    return updated;
  });
}

/**
 * カスタムカラーを更新
 */
export function updateCustomColor(
  id: string,
  updates: Partial<Pick<CustomColor, 'name' | 'rgb'>>
): void {
  customColorsStore.update((colors) => {
    const updated = colors.map((color) => {
      if (color.id !== id) return color;

      const updatedColor = {
        ...color,
        ...updates,
        updatedAt: new Date(),
      };

      // RGB値が更新された場合はHSV値も再計算
      if (updates.rgb) {
        updatedColor.hsv = rgbToHsv(updates.rgb);
      }

      return updatedColor;
    });

    saveToStorage(updated);
    return updated;
  });
}

/**
 * カスタムカラーを削除
 */
export function deleteCustomColor(id: string): void {
  customColorsStore.update((colors) => {
    const updated = colors.filter((color) => color.id !== id);
    saveToStorage(updated);
    return updated;
  });
}

/**
 * カスタムカラーを名前で検索
 */
export function findCustomColorByName(
  name: string,
  colors: CustomColor[]
): CustomColor | undefined {
  return colors.find((color) => color.name === name.trim());
}

/**
 * カスタムカラー名の重複チェック
 */
export function isNameDuplicate(name: string, excludeId?: string): boolean {
  const colors = get(customColorsStore);
  const trimmedName = name.trim();
  return colors.some((color) => color.name === trimmedName && color.id !== excludeId);
}

// 初期化時にカスタムカラーを読み込み
loadCustomColors();
