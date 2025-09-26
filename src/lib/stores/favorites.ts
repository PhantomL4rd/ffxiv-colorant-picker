import { writable } from 'svelte/store';
import type {
  Favorite,
  FavoritesData,
  Dye,
  HarmonyPattern,
  ExtendedDye,
  CustomColor,
} from '$lib/types';
import { selectionStore, selectPrimaryDye, updatePattern, setPaletteDirectly } from './selection';
import { isCustomDye, extractCustomColor } from '$lib/utils/customColorUtils';

// お気に入りストア
export const favoritesStore = writable<Favorite[]>([]);

// LocalStorageキー
const STORAGE_KEY = 'ffxiv-colorant-favorites';
const STORAGE_VERSION = '1.0.0';
const MAX_FAVORITES = 100;

// UUIDを生成（ブラウザ標準APIまたはfallback）
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// LocalStorageからお気に入りを読み込み
export function loadFavorites(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      favoritesStore.set([]);
      return;
    }

    const data: FavoritesData = JSON.parse(stored);

    // データバージョンチェック
    if (data.version !== STORAGE_VERSION) {
      console.warn('お気に入りデータのバージョンが異なります。初期化します。');
      favoritesStore.set([]);
      return;
    }

    // データ検証
    const validFavorites = data.favorites.filter((favorite) => {
      return (
        favorite.id &&
        favorite.name &&
        favorite.primaryDye &&
        favorite.suggestedDyes &&
        favorite.pattern &&
        favorite.createdAt
      );
    });

    favoritesStore.set(validFavorites);
  } catch (error) {
    console.error('お気に入りの読み込みに失敗しました:', error);
    favoritesStore.set([]);
  }
}

// LocalStorageにお気に入りを保存
function saveFavoritesToStorage(favorites: Favorite[]): void {
  try {
    const data: FavoritesData = {
      favorites,
      version: STORAGE_VERSION,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    if (error instanceof DOMException && error.code === 22) {
      // QuotaExceededError - ストレージ容量不足
      throw new Error('ストレージ容量が不足しています。古いお気に入りを削除してください。');
    }
    throw error;
  }
}

// お気に入りを保存（カスタムカラー対応）
export function saveFavorite(input: {
  name?: string;
  primaryDye: Dye | ExtendedDye;
  suggestedDyes: [Dye, Dye];
  pattern: HarmonyPattern;
}): void {
  try {
    favoritesStore.update((favorites) => {
      // 最大件数チェック
      if (favorites.length >= MAX_FAVORITES) {
        throw new Error(`お気に入りは最大${MAX_FAVORITES}件まで保存できます。`);
      }

      // 名前の生成（デフォルトまたは重複チェック）
      let name = input.name?.trim() || '';
      if (!name) {
        name = `組み合わせ #${favorites.length + 1}`;
      } else {
        // 重複チェックと連番追加
        let counter = 1;
        const baseName = name;
        while (favorites.some((f) => f.name === name)) {
          name = `${baseName} (${counter})`;
          counter++;
        }
      }

      // カスタムカラーの場合は通常のDyeとして保存
      let primaryDyeForStorage: Dye;
      if (isCustomDye(input.primaryDye)) {
        // カスタムカラーの場合は簡易的なDyeオブジェクトとして保存
        primaryDyeForStorage = {
          id: input.primaryDye.id,
          name: input.primaryDye.name,
          category: input.primaryDye.category,
          hsv: input.primaryDye.hsv,
          rgb: input.primaryDye.rgb,
          hex: input.primaryDye.hex,
          oklab: input.primaryDye.oklab,
          tags: ['custom'],
        };
      } else {
        primaryDyeForStorage = input.primaryDye;
      }

      const newFavorite: Favorite = {
        id: generateId(),
        name,
        primaryDye: primaryDyeForStorage,
        suggestedDyes: input.suggestedDyes,
        pattern: input.pattern,
        createdAt: new Date().toISOString(),
      };

      const updated = [...favorites, newFavorite];
      saveFavoritesToStorage(updated);
      return updated;
    });
  } catch (error) {
    console.error('お気に入りの保存に失敗しました:', error);
    throw error;
  }
}

// お気に入りを削除
export function deleteFavorite(favoriteId: string): void {
  try {
    favoritesStore.update((favorites) => {
      const updated = favorites.filter((f) => f.id !== favoriteId);
      saveFavoritesToStorage(updated);
      return updated;
    });
  } catch (error) {
    console.error('お気に入りの削除に失敗しました:', error);
    throw error;
  }
}

// お気に入りの名前を変更
export function renameFavorite(favoriteId: string, newName: string): void {
  try {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      throw new Error('お気に入りの名前は空にできません。');
    }

    if (trimmedName.length > 100) {
      throw new Error('お気に入りの名前は100文字以内で入力してください。');
    }

    favoritesStore.update((favorites) => {
      // 重複チェック（自分以外）
      const existingNames = favorites.filter((f) => f.id !== favoriteId).map((f) => f.name);
      let finalName = trimmedName;
      let counter = 1;
      while (existingNames.includes(finalName)) {
        finalName = `${trimmedName} (${counter})`;
        counter++;
      }

      const updated = favorites.map((f) => {
        if (f.id === favoriteId) {
          return {
            ...f,
            name: finalName,
            updatedAt: new Date().toISOString(),
          };
        }
        return f;
      });

      saveFavoritesToStorage(updated);
      return updated;
    });
  } catch (error) {
    console.error('お気に入りの名前変更に失敗しました:', error);
    throw error;
  }
}

// お気に入りを復元（選択状態に設定、カスタムカラー対応）
export function restoreFavorite(favorite: Favorite): void {
  try {
    // カスタムカラーかチェック（tagsにcustomが含まれている場合）
    if (favorite.primaryDye.tags?.includes('custom')) {
      // カスタムカラーの場合はExtendedDyeとして扱う
      const extendedDye: ExtendedDye = {
        ...favorite.primaryDye,
        source: 'custom',
      };
      // 直接パレットを設定（カスタムカラーの場合は提案色も保存されている）
      setPaletteDirectly(extendedDye, favorite.suggestedDyes, favorite.pattern);
    } else {
      // 通常のカララントの場合
      selectPrimaryDye(favorite.primaryDye);
      updatePattern(favorite.pattern);
    }
  } catch (error) {
    console.error('お気に入りの復元に失敗しました:', error);
    throw error;
  }
}

// 初期化時にお気に入りを読み込み
if (typeof window !== 'undefined') {
  loadFavorites();
}
