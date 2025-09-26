import type { 
  HSVColor, 
  RGBColor,
  OklabColor,
  Dye, 
  CustomColor, 
  StoredDye, 
  StoredCustomColor
} from '$lib/types';

// HSVからRGBに変換
export function hsvToRgb(hsv: HSVColor): RGBColor {
  const h = hsv.h / 360;
  const s = hsv.s / 100;
  const v = hsv.v / 100;

  const c = v * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = v - c;

  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 1 / 6) {
    r = c;
    g = x;
    b = 0;
  } else if (1 / 6 <= h && h < 2 / 6) {
    r = x;
    g = c;
    b = 0;
  } else if (2 / 6 <= h && h < 3 / 6) {
    r = 0;
    g = c;
    b = x;
  } else if (3 / 6 <= h && h < 4 / 6) {
    r = 0;
    g = x;
    b = c;
  } else if (4 / 6 <= h && h < 5 / 6) {
    r = x;
    g = 0;
    b = c;
  } else if (5 / 6 <= h && h < 1) {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

// RGBからHSVに変換
export function rgbToHsv(rgb: RGBColor): HSVColor {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : Math.round((delta / max) * 100);
  const v = Math.round(max * 100);

  return { h, s, v };
}

// RGBからHEXに変換
export function rgbToHex(rgb: RGBColor): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * StoredDyeをDyeにハイドレート（hsv/hexを動的に追加）
 */
export function hydrateDye(stored: StoredDye | Dye): Dye {
  return {
    ...stored,
    hsv: rgbToHsv(stored.rgb),
    hex: rgbToHex(stored.rgb),
    oklab: rgbToOklab(stored.rgb)
  };
}

/**
 * StoredCustomColorをCustomColorにハイドレート
 */
export function hydrateCustomColor(stored: StoredCustomColor | CustomColor): CustomColor {
  return {
    ...stored,
    hsv: rgbToHsv(stored.rgb)
  };
}

/**
 * DyeからStoredDyeを抽出（保存用）
 */
export function extractStoredDye(dye: Dye): StoredDye {
  const { hsv, hex, ...stored } = dye;
  return stored;
}

/**
 * CustomColorからStoredCustomColorを抽出（保存用）
 */
export function extractStoredCustomColor(color: CustomColor): StoredCustomColor {
  const { hsv, ...stored } = color;
  return stored;
}

// HEXからRGBに変換
export function hexToRgb(hex: string): RGBColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Converts an RGB color to Oklab space.
 * 
 * @param rgb a color in RGB space
 * @returns a color in Oklab space
 */
export function rgbToOklab(rgb: RGBColor): OklabColor {
  const toLinear = (c: number) => {
    const cs = c / 255;
    return cs <= 0.04045 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  };
  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);

  const l = r * 0.4122214708 + g * 0.5363325363 + b * 0.0514459929;
  const m = r * 0.2119034982 + g * 0.6806995451 + b * 0.1073969566;
  const s = r * 0.0883024619 + g * 0.2817188376 + b * 0.6299787005;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return {
    L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  };
}

/**
 * Converts an Oklab color to RGB space.
 * 
 * @param oklab a color in Oklab space
 * @returns a color in RGB space
 */
export function oklabToRgb(oklab: OklabColor): RGBColor {
  const l_ = oklab.L + 0.3963377774 * oklab.a + 0.2158037573 * oklab.b;
  const m_ = oklab.L - 0.1055613458 * oklab.a - 0.0638541728 * oklab.b;
  const s_ = oklab.L - 0.0894841775 * oklab.a - 1.2914855480 * oklab.b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const r = l * +4.0767416621 + m * -3.3077115913 + s * +0.2309699292;
  const g = l * -1.2684380046 + m * +2.6097574011 + s * -0.3413193965;
  const b = l * -0.0041960863 + m * -0.7034186147 + s * +1.7076147010;

  const toSRGB = (c: number) => {
    const cs = Math.max(0, Math.min(1, c));
    return cs < 0.0031308
      ? Math.round(cs * 12.92 * 255)
      : Math.round((1.055 * Math.pow(cs, 1 / 2.4) - 0.055) * 255);
  };

  return {
    r: toSRGB(r),
    g: toSRGB(g),
    b: toSRGB(b),
  };
}

// sRGBクリップ処理（色相を保持）
export function clipOklabColor(oklab: OklabColor): OklabColor {
  const rgb = oklabToRgb(oklab);
  const clippedRgb = {
    r: Math.round(Math.max(0, Math.min(255, rgb.r))),
    g: Math.round(Math.max(0, Math.min(255, rgb.g))),
    b: Math.round(Math.max(0, Math.min(255, rgb.b)))
  };
  return rgbToOklab(clippedRgb);
}

/**
 * Calculates color difference (ΔE) between two colors in Oklab space.
 *
 * @param c1 a color in Oklab color space
 * @param c2 a color in Oklab color space
 * @returns the distance between the two colors
 */
export function deltaEOklab(c1: OklabColor, c2: OklabColor): number {
  const deltaL = c1.L - c2.L;
  const deltaA = c1.a - c2.a;
  const deltaB = c1.b - c2.b;

  // Euclidean distance in Oklab space
  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

