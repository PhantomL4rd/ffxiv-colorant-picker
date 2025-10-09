/**
 * LocalStorage操作のための共通ユーティリティ
 * 型安全なlocalStorageの読み書きを提供します
 */

/**
 * LocalStorageから値を読み込む
 * @param key ストレージキー
 * @param defaultValue デフォルト値
 * @returns パースされた値またはデフォルト値
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return defaultValue;
    }
    return JSON.parse(stored) as T;
  } catch (error) {
    console.error(`Failed to load from localStorage (${key}):`, error);
    return defaultValue;
  }
}

/**
 * LocalStorageに値を保存する
 * @param key ストレージキー
 * @param value 保存する値
 * @returns 保存に成功したかどうか
 */
export function saveToStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to save to localStorage (${key}):`, error);
    return false;
  }
}

/**
 * LocalStorageから値を削除する
 * @param key ストレージキー
 * @returns 削除に成功したかどうか
 */
export function removeFromStorage(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove from localStorage (${key}):`, error);
    return false;
  }
}

/**
 * LocalStorageにキーが存在するかチェック
 * @param key ストレージキー
 * @returns キーが存在するかどうか
 */
export function existsInStorage(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null;
  } catch (error) {
    console.error(`Failed to check localStorage (${key}):`, error);
    return false;
  }
}