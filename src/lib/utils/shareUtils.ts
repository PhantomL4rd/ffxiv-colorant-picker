import type { Dye, Favorite, HarmonyPattern } from '$lib/types';
import { getPatternLabel } from '$lib/constants/patterns';
import { setPaletteDirectly } from '$lib/stores/selection';
import LZString from 'lz-string';

interface SharePaletteData {
  p: string; // primary dye id
  s: [string, string]; // secondary dye ids
  pt: HarmonyPattern; // pattern type
}

/**
 * お気に入りからシェア用URLを生成
 */
export function generateShareUrl(favorite: Favorite): string {
  const data: SharePaletteData = {
    p: favorite.primaryDye.id,
    s: [favorite.suggestedDyes[0].id, favorite.suggestedDyes[1].id],
    pt: favorite.pattern,
  };

  try {
    const jsonString = JSON.stringify(data);
    const compressedData = LZString.compressToEncodedURIComponent(jsonString);
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('palette', compressedData);
    return currentUrl.toString();
  } catch (error) {
    console.error('Failed to generate share URL:', error);
    return window.location.href;
  }
}

/**
 * シェア用テキストを生成
 */
export function generateShareText(favorite: Favorite, shareUrl: string): string {
  const patternLabel = getPatternLabel(favorite.pattern);
  
  return `主色：${favorite.primaryDye.name}
提案色：${favorite.suggestedDyes[0].name} / ${favorite.suggestedDyes[1].name}
配色パターン：${patternLabel}

#FF14カララントピッカー
${shareUrl}`;
}

/**
 * URLからパレットデータを復元
 */
export function decodePaletteFromUrl(url: string): SharePaletteData | null {
  try {
    const urlObj = new URL(url);
    const paletteParam = urlObj.searchParams.get('palette');
    
    if (!paletteParam) {
      return null;
    }

    // 圧縮されたデータを解凍
    const jsonString = LZString.decompressFromEncodedURIComponent(paletteParam);
    
    if (!jsonString) {
      console.warn('Failed to decompress palette data');
      return null;
    }

    const data = JSON.parse(jsonString) as SharePaletteData;

    // 必須フィールドの検証
    if (!data.p || !Array.isArray(data.s) || data.s.length !== 2 || !data.pt) {
      console.warn('Invalid palette data structure');
      return null;
    }

    return data;
  } catch (error) {
    console.warn('Failed to decode palette from URL:', error);
    return null;
  }
}

/**
 * クリップボードにコピー（フォールバック付き）
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Modern Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return success;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * URLパラメータからパレットを復元してストアに設定
 */
export function restorePaletteFromUrl(dyes: Dye[]): boolean {
  try {
    const data = decodePaletteFromUrl(window.location.href);
    if (!data) {
      return false;
    }

    // 染料IDから実際のDyeオブジェクトを検索
    const primaryDye = dyes.find(dye => dye.id === data.p);
    const secondaryDye1 = dyes.find(dye => dye.id === data.s[0]);
    const secondaryDye2 = dyes.find(dye => dye.id === data.s[1]);

    if (!primaryDye || !secondaryDye1 || !secondaryDye2) {
      console.warn('Some dyes not found:', { 
        primary: data.p, 
        secondary: data.s,
        found: { primaryDye, secondaryDye1, secondaryDye2 }
      });
      return false;
    }

    // ストアに設定（保存された提案色をそのまま復元）
    setPaletteDirectly(primaryDye, [secondaryDye1, secondaryDye2], data.pt);

    // URLパラメータをクリーンアップ
    const url = new URL(window.location.href);
    url.searchParams.delete('palette');
    window.history.replaceState({}, '', url.toString());

    return true;
  } catch (error) {
    console.error('Failed to restore palette from URL:', error);
    return false;
  }
}