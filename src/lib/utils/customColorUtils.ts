import type { CustomColor, Dye, ExtendedDye, RGBColor } from '$lib/types';
import { rgbToHex } from '$lib/utils/colorConversion';

/**
 * CustomColorをDyeライクオブジェクトに変換
 */
export function customColorToDye(customColor: CustomColor): Dye {
  return {
    id: `custom-${customColor.id}`,
    name: customColor.name,
    category: '白系', // カスタムカラーは仮にwhite系に分類
    hsv: customColor.hsv,
    rgb: customColor.rgb,
    hex: rgbToHex(customColor.rgb),
    tags: ['custom'],
  };
}

/**
 * CustomColorをExtendedDyeに変換
 */
export function createCustomDye(customColor: CustomColor): ExtendedDye {
  return {
    ...customColorToDye(customColor),
    source: 'custom',
    customColor,
  };
}

/**
 * RGB値のバリデーション
 */
export function validateRgbInput(rgb: RGBColor): boolean {
  return (
    Number.isInteger(rgb.r) &&
    rgb.r >= 0 &&
    rgb.r <= 255 &&
    Number.isInteger(rgb.g) &&
    rgb.g >= 0 &&
    rgb.g <= 255 &&
    Number.isInteger(rgb.b) &&
    rgb.b >= 0 &&
    rgb.b <= 255
  );
}

/**
 * カスタムカラー名のバリデーション
 */
export function validateCustomColorName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();

  if (!trimmed) {
    return { valid: false, error: '名前を入力してください' };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: '名前は50文字以内で入力してください' };
  }

  return { valid: true };
}

/**
 * RGB文字列パース（例: "120,85,45" または "120, 85, 45"）
 */
export function parseRgbString(input: string): RGBColor | null {
  try {
    const parts = input.split(',').map((part) => part.trim());

    if (parts.length !== 3) {
      return null;
    }

    const r = parseInt(parts[0], 10);
    const g = parseInt(parts[1], 10);
    const b = parseInt(parts[2], 10);

    const rgb: RGBColor = { r, g, b };

    return validateRgbInput(rgb) ? rgb : null;
  } catch {
    return null;
  }
}

/**
 * RGB値を文字列として表示（例: "120, 85, 45"）
 */
export function formatRgbDisplay(rgb: RGBColor): string {
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
}

/**
 * Dyeがカスタムカラーかどうかを判定
 */
export function isCustomDye(dye: Dye | ExtendedDye): dye is ExtendedDye & { source: 'custom' } {
  return (dye as ExtendedDye).source === 'custom';
}

/**
 * ExtendedDyeからCustomColorを抽出
 */
export function extractCustomColor(dye: ExtendedDye): CustomColor | null {
  return isCustomDye(dye) ? dye.customColor || null : null;
}
