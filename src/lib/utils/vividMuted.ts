import type { OklabColor } from '$lib/types';
import { hexToRgb, rgbToOklab, oklabToRgb, rgbToHex, clipOklabColor } from './colorConversion';

// Vivid/Mutedパラメータ
export const VIVID_MUTED_PARAMS = {
  hueOffsetRange: [0, 360] as const,  // 全色相をカバー（赤系も含む）
  vividDeltaC: 0.12,
  mutedDeltaC: 0.12,
  bridgeT: 0.5,
  bridgeJitter: 0.08,
  minContrastOnBg: 1.8,
  clamp: true,
  adaptiveThreshold: {
    lowChroma: 0.08,
    highChroma: 0.25,
  }
};
// オプション用の型定義
export interface VividMutedOptions {
  backgroundHex?: string;
  hueOffsetRange?: readonly [number, number];
}

// シード付き擬似乱数生成器
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// 色相の正規化（0-360度）
function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360;
}

// 補色を優遇した色相オフセット生成
function generateComplementaryBiasedHue(random: () => number): number {
  const r = random();
  
  // 30%の確率で補色（180°付近）を生成
  if (r < 0.3) {
    // 150°-210°の範囲（補色±30°）
    return 150 + random() * 60;
  }
  
  // 20%の確率でトライアド（120°, 240°付近）を生成
  if (r < 0.5) {
    return random() < 0.5 ? 
      (100 + random() * 40) :  // 100°-140° (120°±20°)
      (220 + random() * 40);   // 220°-260° (240°±20°)
  }
  
  // 残り50%で全色相からランダム
  return random() * 360;
}

// Muted用：近似色を優遇した色相オフセット生成
function generateAnalogousBiasedHue(random: () => number): number {
  const r = random();
  
  // 25%の確率で近似色（±30°以内）を生成
  if (r < 0.25) {
    // -30°〜+30°の範囲（類似色）
    return -30 + random() * 60;
  }
  
  // 25%の確率で中程度の距離（60°-120°付近）
  if (r < 0.5) {
    return random() < 0.5 ? 
      (60 + random() * 60) :   // 60°-120°
      (-120 + random() * 60);  // -120°〜-60°
  }
  
  // 残り50%で全色相からランダム（実用性重視）
  return random() * 360;
}

// 値をクランプ
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Oklabで色相を回転
function rotateHue(oklab: OklabColor, angleDegrees: number): OklabColor {
  const angle = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  // a, b座標を回転
  const newA = oklab.a * cos - oklab.b * sin;
  const newB = oklab.a * sin + oklab.b * cos;
  
  return {
    L: oklab.L,
    a: newA,
    b: newB,
  };
}

// Oklabで彩度を調整
function adjustChroma(oklab: OklabColor, factor: number): OklabColor {
  return {
    L: oklab.L,
    a: oklab.a * factor,
    b: oklab.b * factor,
  };
}

// Oklabの彩度を取得
function getChroma(oklab: OklabColor): number {
  return Math.sqrt(oklab.a * oklab.a + oklab.b * oklab.b);
}

// WCAGコントラスト比計算
function getLuminance(rgb: { r: number; g: number; b: number }): number {
  const toLinear = (c: number): number => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);
}

function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);
  const brighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (brighter + 0.05) / (darker + 0.05);
}


// コントラスト微調整
function nudgeForContrast(hex: string, bgHex: string, minContrast: number): string {
  let currentColor = hex;
  let tries = 0;
  const maxTries = 6;
  const adjustStep = 0.06;

  while (getContrastRatio(currentColor, bgHex) < minContrast && tries < maxTries) {
    const rgb = hexToRgb(currentColor);
    let oklab = rgbToOklab(rgb);
    
    // 背景との関係で明度を調整
    const bgLum = getLuminance(hexToRgb(bgHex));
    if (bgLum > 0.5) {
      // 明るい背景：色を暗くする
      oklab.L = clamp(oklab.L - adjustStep, 0, 1);
    } else {
      // 暗い背景：色を明るくする
      oklab.L = clamp(oklab.L + adjustStep, 0, 1);
    }
    
    // クリップして変換
    const clippedOklab = clipOklabColor(oklab);
    const adjustedRgb = oklabToRgb(clippedOklab);
    currentColor = rgbToHex(adjustedRgb);
    tries++;
  }
  
  return currentColor;
}

// 色相範囲の強制
function enforceHueRange(
  offset: number, 
  range: readonly [number, number], 
  random: () => number
): number {
  const normalizedOffset = normalizeHue(offset);
  const [min, max] = range;
  
  // 範囲チェック
  if (normalizedOffset >= min && normalizedOffset <= max) {
    return normalizedOffset;
  }
  
  // 範囲外の場合、再抽選を試行
  for (let i = 0; i < 8; i++) {
    const newOffset = normalizeHue(random() * 360);
    if (newOffset >= min && newOffset <= max) {
      return newOffset;
    }
  }
  
  // 最終的に範囲内にクランプ
  if (normalizedOffset < min) {
    return min;
  } else if (normalizedOffset > max) {
    return max;
  }
  
  return normalizedOffset;
}

// 適応的な調整値を計算
function getAdaptiveAdjustment(
  base: OklabColor,
  isVivid: boolean,
  params = VIVID_MUTED_PARAMS
): { deltaC: number; deltaL: number } {
  const { lowChroma, highChroma } = params.adaptiveThreshold;
  const baseChroma = getChroma(base);
  const baseL = base.L;
  
  if (isVivid) {
    // Vividモード：極端なコントラストを生成
    if (baseL > 0.8) {
      // 白系（明るい色）：強烈に暗い色を生成
      return {
        deltaC: 0.25,
        deltaL: -0.50  // より強烈に暗く（L ≈ 0.30-0.50）
      };
    } else if (baseL < 0.35) {
      // 黒系（暗い色）：強烈に明るい色を生成
      return {
        deltaC: 0.25,
        deltaL: 0.50   // より強烈に明るく（L ≈ 0.85-1.0）
      };
    } else if (baseL > 0.6) {
      // 中程度の明るい色：強烈に暗くする
      return {
        deltaC: 0.22,
        deltaL: -0.35  // 強烈に暗く
      };
    } else if (baseL < 0.4) {
      // 中程度の暗い色：強烈に明るくする
      return {
        deltaC: 0.22,
        deltaL: 0.35   // 強烈に明るく
      };
    } else if (baseChroma < lowChroma) {
      // 低彩度の色全部：面白い色を生成
      return {
        deltaC: 0.22,
        deltaL: baseL > 0.5 ? -0.25 : 0.25  // より極端な明度コントラスト
      };
    } else if (baseChroma > highChroma) {
      // 派手な色：彩度を下げてバランスを取る
      return {
        deltaC: -0.05 - (baseChroma - highChroma) * 0.3,
        deltaL: 0
      };
    }
    // 中間的な色：標準的な増加 + 極端な明度コントラスト
    const lightnessFactor = baseL > 0.5 ? -0.25 : 0.25;
    return { deltaC: 0.15, deltaL: lightnessFactor };
    
  } else {
    // Mutedモード：落ち着いた色でも面白さを追求
    if (baseL > 0.8) {
      // 白系：中程度の明度で落ち着いた彩度を狙う
      return {
        deltaC: 0.12,  // 控えめだが色味のある彩度
        deltaL: -0.25  // L ≈ 0.65-0.75 程度に
      };
    } else if (baseL < 0.35) {
      // 黒系：中程度の明度で落ち着いた彩度を狙う
      return {
        deltaC: 0.12,  // 控えめだが色味のある彩度
        deltaL: 0.25   // L ≈ 0.60-0.70 程度に
      };
    } else if (baseChroma < lowChroma) {
      // 低彩度の色全部：落ち着いた色味を追加
      return {
        deltaC: 0.10,  // 控えめだが色味のある彩度
        deltaL: baseL > 0.6 ? -0.15 : 0.15  // 適度な明度コントラスト
      };
    } else if (baseChroma > highChroma) {
      // 高彩度：大幅に彩度を下げる
      return {
        deltaC: -0.15 - (baseChroma - highChroma) * 0.4,
        deltaL: 0.03  // 少し明るくしてスモーキーに
      };
    }
    // 中間的な色：バランスよく調整
    return {
      deltaC: -0.08,
      deltaL: baseL > 0.6 ? 0.04 : -0.04
    };
  }
}

// Adventure色を生成
function makeAdventure(
  base: OklabColor,
  isVivid: boolean,
  hueOffset: number,
  params = VIVID_MUTED_PARAMS
): OklabColor {
  // 適応的調整を取得
  const { deltaC, deltaL } = getAdaptiveAdjustment(base, isVivid, params);
  
  // 黒系・白系の色（極端な明度・低彩度）の特別処理（Vivid/Muted共通）
  const baseChroma = getChroma(base);
  if (baseChroma < 0.05 && (base.L < 0.2 || base.L > 0.8)) {
    // 黒系・白系の場合：まず目標の明度と彩度を設定してから色相を適用
    const targetL = clamp(base.L + deltaL, 0, 1);
    const targetChroma = clamp(baseChroma + deltaC, 0, 0.37);
    
    // 色相角度をa,b座標に直接変換
    const hueRad = (hueOffset * Math.PI) / 180;
    const newA = targetChroma * Math.cos(hueRad);
    const newB = targetChroma * Math.sin(hueRad);
    
    return {
      L: targetL,
      a: newA,
      b: newB,
    };
  }
  
  // 通常の処理：色相を回転してから調整
  const rotated = rotateHue(base, hueOffset);
  
  // 彩度調整
  const currentChroma = getChroma(rotated);
  const targetChroma = clamp(currentChroma + deltaC, 0, 0.37);
  const chromaFactor = currentChroma > 0 ? targetChroma / currentChroma : 1;
  const chromaAdjusted = adjustChroma(rotated, chromaFactor);
  
  // 明度調整
  return {
    L: clamp(chromaAdjusted.L + deltaL, 0, 1),
    a: chromaAdjusted.a,
    b: chromaAdjusted.b,
  };
}

// Bridge色を生成（線形補間）
function makeBridge(
  base: OklabColor,
  adventure: OklabColor,
  random: () => number,
  params = VIVID_MUTED_PARAMS
): OklabColor {
  const t = clamp(
    params.bridgeT + (random() - 0.5) * params.bridgeJitter * 2,
    0.25,
    0.75
  );
  
  const interpolated = {
    L: base.L + (adventure.L - base.L) * t,
    a: base.a + (adventure.a - base.a) * t,
    b: base.b + (adventure.b - base.b) * t,
  };
  
  // Bridge色は少し彩度を落として"つなぎ"に寄せる
  const bridgeChromaFactor = 0.9;
  return adjustChroma(interpolated, bridgeChromaFactor);
}

// Vivid配色生成
export function generateVividHarmony(
  baseHex: string,
  seed?: number,
  options?: VividMutedOptions
): string[] {
  const random = seed ? seededRandom(seed) : () => Math.random();
  const bgHex = options?.backgroundHex || '#ffffff';
  const hueRange = options?.hueOffsetRange || VIVID_MUTED_PARAMS.hueOffsetRange;
  
  // Base色をOklabに変換
  const baseRgb = hexToRgb(baseHex);
  const baseOklab = rgbToOklab(baseRgb);
  
  // 補色を優遇した色相オフセットを生成
  let hueOffset = generateComplementaryBiasedHue(random);
  
  // hueOffsetRangeを適用
  if (hueRange[0] !== 0 || hueRange[1] !== 360) {
    hueOffset = enforceHueRange(hueOffset, hueRange, random);
  }
  
  // Adventure色を生成（Vivid）
  let adventureOklab = makeAdventure(baseOklab, true, hueOffset);
  
  // Bridge色を生成
  let bridgeOklab = makeBridge(baseOklab, adventureOklab, random);
  
  // sRGBクリップ
  adventureOklab = clipOklabColor(adventureOklab);
  bridgeOklab = clipOklabColor(bridgeOklab);
  
  // RGB変換してHEX化
  const adventureRgb = oklabToRgb(adventureOklab);
  const bridgeRgb = oklabToRgb(bridgeOklab);
  
  let bridgeHex = rgbToHex(bridgeRgb);
  let adventureHex = rgbToHex(adventureRgb);
  
  // コントラスト調整
  bridgeHex = nudgeForContrast(bridgeHex, bgHex, VIVID_MUTED_PARAMS.minContrastOnBg);
  adventureHex = nudgeForContrast(adventureHex, bgHex, VIVID_MUTED_PARAMS.minContrastOnBg);
  
  return [baseHex, bridgeHex, adventureHex];
}

// Muted配色生成
export function generateMutedHarmony(
  baseHex: string,
  seed?: number,
  options?: VividMutedOptions
): string[] {
  const random = seed ? seededRandom(seed) : () => Math.random();
  const bgHex = options?.backgroundHex || '#ffffff';
  const hueRange = options?.hueOffsetRange || VIVID_MUTED_PARAMS.hueOffsetRange;
  
  // Base色をOklabに変換
  const baseRgb = hexToRgb(baseHex);
  const baseOklab = rgbToOklab(baseRgb);
  
  // 近似色を優遇した色相オフセットを生成
  let hueOffset = generateAnalogousBiasedHue(random);
  
  // hueOffsetRangeを適用
  if (hueRange[0] !== 0 || hueRange[1] !== 360) {
    hueOffset = enforceHueRange(hueOffset, hueRange, random);
  }
  
  // Adventure色を生成（Muted）
  let adventureOklab = makeAdventure(baseOklab, false, hueOffset);
  
  // Bridge色を生成
  let bridgeOklab = makeBridge(baseOklab, adventureOklab, random);
  
  // sRGBクリップ
  adventureOklab = clipOklabColor(adventureOklab);
  bridgeOklab = clipOklabColor(bridgeOklab);
  
  // RGB変換してHEX化
  const adventureRgb = oklabToRgb(adventureOklab);
  const bridgeRgb = oklabToRgb(bridgeOklab);
  
  let bridgeHex = rgbToHex(bridgeRgb);
  let adventureHex = rgbToHex(adventureRgb);
  
  // コントラスト調整
  bridgeHex = nudgeForContrast(bridgeHex, bgHex, VIVID_MUTED_PARAMS.minContrastOnBg);
  adventureHex = nudgeForContrast(adventureHex, bgHex, VIVID_MUTED_PARAMS.minContrastOnBg);
  
  return [baseHex, bridgeHex, adventureHex];
}