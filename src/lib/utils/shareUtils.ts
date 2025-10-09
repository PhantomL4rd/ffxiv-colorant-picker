import type {
  Dye,
  Favorite,
  HarmonyPattern,
  ExtendedDye,
  CustomColorShare,
  ExtendedSharePaletteData,
} from '$lib/types';
import { getPatternLabel } from '$lib/constants/patterns';
import { isCustomDye } from '$lib/utils/customColorUtils';
import { rgbToHsv, rgbToHex } from '$lib/utils/colorConversion';
import LZString from 'lz-string';
import { rgbToOklab } from './colorConversion';
import { emitRestorePalette } from '$lib/stores/paletteEvents';

// セキュリティ定数
const MAX_QUERY_LENGTH = 2048; // URLクエリパラメータの最大長
const MAX_JSON_LENGTH = 10000; // 解凍後JSONの最大長
const MAX_NAME_LENGTH = 50; // カスタムカラー名の最大長
const BASE_URL_FOR_SHARE = 'https://ffxiv-colorant-picker.vercel.app/share'

// 検証ヘルパー関数
function isValidRgbValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 255;
}

function isValidString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength;
}

function isValidRgbObject(rgb: unknown): rgb is { r: number; g: number; b: number } {
  return (
    typeof rgb === 'object' &&
    rgb !== null &&
    'r' in rgb &&
    'g' in rgb &&
    'b' in rgb &&
    isValidRgbValue(rgb.r) &&
    isValidRgbValue(rgb.g) &&
    isValidRgbValue(rgb.b)
  );
}

interface SharePaletteData {
  p: string; // primary dye id
  s: [string, string]; // secondary dye ids
  pt: HarmonyPattern; // pattern type
}

/**
 * お気に入りからシェア用URLを生成（カスタムカラー対応）
 */
export function generateShareUrl(favorite: Favorite): string {
  // カスタムカラーか通常のカララントか判定
  const isCustom = favorite.primaryDye.tags?.includes('custom');

  // ベースURLを取得（favoritesパスを除外）
  const shareUrl = new URL(BASE_URL_FOR_SHARE);

  if (isCustom) {
    // カスタムカラーの場合は拡張データ形式で保存（rgb のみ）
    const customColorShare: CustomColorShare = {
      type: 'custom',
      name: favorite.primaryDye.name,
      rgb: favorite.primaryDye.rgb,
      // hsvは削除（必要時に計算）
    };

    const extendedData: ExtendedSharePaletteData = {
      p: customColorShare,
      s: [favorite.suggestedDyes[0].id, favorite.suggestedDyes[1].id],
      pt: favorite.pattern,
    };

    try {
      const jsonString = JSON.stringify(extendedData);
      const compressedData = LZString.compressToEncodedURIComponent(jsonString);
      shareUrl.searchParams.set('custom-palette', compressedData);
      return shareUrl.toString();
    } catch (error) {
      console.error('Failed to generate custom share URL:', error);
      return window.location.href;
    }
  } else {
    // 通常のカララントの場合は既存の形式
    const data: SharePaletteData = {
      p: favorite.primaryDye.id,
      s: [favorite.suggestedDyes[0].id, favorite.suggestedDyes[1].id],
      pt: favorite.pattern,
    };

    try {
      const jsonString = JSON.stringify(data);
      const compressedData = LZString.compressToEncodedURIComponent(jsonString);
      shareUrl.searchParams.set('palette', compressedData);
      return shareUrl.toString();
    } catch (error) {
      console.error('Failed to generate share URL:', error);
      return window.location.href;
    }
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

    // 長さ制限チェック
    if (!paletteParam || paletteParam.length > MAX_QUERY_LENGTH) {
      return null;
    }

    // 圧縮されたデータを解凍
    const jsonString = LZString.decompressFromEncodedURIComponent(paletteParam);

    // 解凍後の長さ制限チェック
    if (!jsonString || jsonString.length > MAX_JSON_LENGTH) {
      console.warn('Failed to decompress or decompressed data too large');
      return null;
    }

    const data = JSON.parse(jsonString) as SharePaletteData;

    // 厳密な型・構造チェック
    if (
      !isValidString(data.p, 100) ||
      !Array.isArray(data.s) ||
      data.s.length !== 2 ||
      !isValidString(data.s[0], 100) ||
      !isValidString(data.s[1], 100) ||
      !isValidString(data.pt, 50)
    ) {
      console.warn('Invalid palette data structure or value');
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
 * カスタムカラーを含むURLからパレットデータを復元
 */
export function decodeCustomPaletteFromUrl(url: string): ExtendedSharePaletteData | null {
  try {
    const urlObj = new URL(url);
    const paletteParam = urlObj.searchParams.get('custom-palette');

    // 長さ制限チェック
    if (!paletteParam || paletteParam.length > MAX_QUERY_LENGTH) {
      return null;
    }

    // 圧縮されたデータを解凍
    const jsonString = LZString.decompressFromEncodedURIComponent(paletteParam);

    // 解凍後の長さ制限チェック
    if (!jsonString || jsonString.length > MAX_JSON_LENGTH) {
      console.warn('Failed to decompress or decompressed custom data too large');
      return null;
    }

    const data = JSON.parse(jsonString) as ExtendedSharePaletteData;

    // カスタムデータの厳密な検証（hsvは除外）
    if (
      !data.p ||
      typeof data.p !== 'object' ||
      !('type' in data.p) ||
      data.p.type !== 'custom' ||
      !('name' in data.p) ||
      !isValidString(data.p.name, MAX_NAME_LENGTH) ||
      !('rgb' in data.p) ||
      !isValidRgbObject(data.p.rgb) ||
      !Array.isArray(data.s) ||
      data.s.length !== 2 ||
      !isValidString(data.s[0], 100) ||
      !isValidString(data.s[1], 100) ||
      !isValidString(data.pt, 50)
    ) {
      console.warn('Invalid custom palette data structure or value');
      return null;
    }

    return data;
  } catch (error) {
    console.warn('Failed to decode custom palette from URL:', error);
    return null;
  }
}

/**
 * URLパラメータからパレットを復元してストアに設定（カスタムカラー対応）
 */
export function restorePaletteFromUrl(dyes: Dye[]): boolean {
  try {
    // まずカスタムパレットを確認
    const customData = decodeCustomPaletteFromUrl(window.location.href);
    if (customData) {
      // カスタムカラーの場合
      if (typeof customData.p === 'object' && customData.p.type === 'custom') {
        // カスタムカラーからExtendedDyeを作成（hsv/hexは動的に計算）
        const customDye: ExtendedDye = {
          id: `custom-temp-${Date.now()}`, // 一時的なID
          name: customData.p.name,
          category: '白系',
          hsv: rgbToHsv(customData.p.rgb), // rgbから計算
          rgb: customData.p.rgb,
          hex: rgbToHex(customData.p.rgb), // rgbから計算
          oklab: rgbToOklab(customData.p.rgb),
          tags: ['custom'],
          source: 'custom',
        };

        // 提案色を取得
        const secondaryDye1 = dyes.find((dye) => dye.id === customData.s[0]);
        const secondaryDye2 = dyes.find((dye) => dye.id === customData.s[1]);

        if (!secondaryDye1 || !secondaryDye2) {
          console.warn('Secondary dyes not found');
          return false;
        }

        // ストアに設定
        // イベントを発火してパレットを復元
        emitRestorePalette({
          primaryDye: customDye,
          suggestedDyes: [secondaryDye1, secondaryDye2],
          pattern: customData.pt,
        });

        // URLパラメータをクリーンアップ
        const url = new URL(window.location.href);
        url.searchParams.delete('custom-palette');
        window.history.replaceState({}, '', url.toString());

        return true;
      }
    }

    // 通常のパレットを確認
    const data = decodePaletteFromUrl(window.location.href);
    if (!data) {
      return false;
    }

    // 染料IDから実際のDyeオブジェクトを検索
    const primaryDye = dyes.find((dye) => dye.id === data.p);
    const secondaryDye1 = dyes.find((dye) => dye.id === data.s[0]);
    const secondaryDye2 = dyes.find((dye) => dye.id === data.s[1]);

    if (!primaryDye || !secondaryDye1 || !secondaryDye2) {
      console.warn('Some dyes not found:', {
        primary: data.p,
        secondary: data.s,
        found: { primaryDye, secondaryDye1, secondaryDye2 },
      });
      return false;
    }

    // ストアに設定（保存された提案色をそのまま復元）
    // イベントを発火してパレットを復元
    emitRestorePalette({
      primaryDye,
      suggestedDyes: [secondaryDye1, secondaryDye2],
      pattern: data.pt,
    });

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
