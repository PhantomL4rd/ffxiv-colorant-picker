import type { OklabColor } from '$lib/types';
import {
  hexToRgb,
  rgbToOklab,
  oklabToRgb,
  rgbToHex,
  clipOklabColor,
  deltaEOklab,
} from './colorConversion';

// Vivid/Mutedパラメータ
export const VIVID_MUTED_PARAMS = {
  hueOffsetRange: [0, 360] as const, // 全色相をカバー（赤系も含む）
  vividDeltaC: 0.12,
  mutedDeltaC: 0.12,
  bridgeT: 0.5,
  bridgeJitter: 0.08,
  minContrastOnBg: 1.8,
  clamp: true,
  adaptiveThreshold: {
    lowChroma: 0.08,
    highChroma: 0.25,
  },
  
  // 彩度制限（OKLCH Chroma: 0=無彩色、値が高いほど鮮やか）
  chroma: {
    vivid: {
      max: 0.37, // Vividモードの彩度上限：鮮やかな色まで許可
    },
    muted: {
      max: 0.125, // Mutedモードの彩度上限：ブラッドレッド・コーラルピンク・ターコイズブルーを含める落ち着いた色まで
    },
    low: 0.05, // 低彩度判定：この値以下は黒・白・グレー系とみなす
    mutedTarget: 0.15, // Mutedモード生成時の目標彩度：穏やかだが色味のある程度
  },
  
  // 明度制限（OKLCH Lightness: 0=真っ黒、1=真っ白）
  lightness: {
    low: 0.2,     // 暗色判定：この値以下は黒系
    high: 0.8,    // 明色判定：この値以上は白系
    veryLow: 0.35,  // かなり暗い色：Vividで極端なコントラストを作る境界
    veryHigh: 0.8,  // 明るめの色：調整処理の分岐点
    middle: 0.5,    // 中間明度：明暗判定の基準
    mutedMin: 0.3,  // Mutedモード明度下限：暗すぎず
    mutedMax: 0.7,  // Mutedモード明度上限：明るすぎず
  },
  
  // 色相角度（0-360度、色相環上の位置関係）
  hue: {
    // 補色関係（色相環で正反対、最もコントラストが強い）
    complementary: {
      center: 180,   // 基準色から180度回転
      range: 60,     // ±30度の幅を持たせる
      min: 150,      // 150度〜210度の範囲
      max: 210,
    },
    // トライアド関係（三等分配色、バランスが良い）
    triadic: {
      first: { center: 120, range: 40, min: 100, max: 140 },   // 120度±20度
      second: { center: 240, range: 40, min: 220, max: 260 },  // 240度±20度
    },
    // 類似色関係（近い色相、調和しやすい）
    analogous: {
      range: 60,     // ±30度以内は類似色
      medium: { min: 60, max: 120 },    // 中程度の距離
      opposite: { min: -120, max: -60 }, // 反対側の中程度
    },
  },
  
  // 調整係数（色生成・微調整時の数値）
  adjustment: {
    contrastStep: 0.06,        // コントラスト調整時の明度ステップ
    chromaReduction: 0.85,     // Bridge色の彩度を弱める係数（つなぎ感演出）
    bridgePosition: 0.382,     // Bridge色の位置（黄金比の逆数、美的バランス）
    maxTries: 6,               // コントラスト調整の最大試行回数
    maxRetries: 8,             // 色相範囲調整の最大再試行回数
    finalChromaFactor: 0.85,   // 最終彩度調整係数（Mutedで控えめに）
  },
  
  // 確率値（色相選択時の重み付け）
  probability: {
    complementary: 0.3,    // 30%の確率で補色を選択
    triadic: 0.2,          // 20%の確率でトライアドを選択 (0.5 - 0.3)
    analogous: 0.25,       // 25%の確率で類似色を選択
    mediumDistance: 0.25,  // 25%の確率で中距離色を選択 (0.5 - 0.25)
  },
  
  // Vivid/Muted調整値（彩度・明度の変化量）
  deltaValues: {
    vivid: {
      // 極端なコントラスト（白系・黒系処理用）
      extreme: { chroma: 0.25, lightness: 0.5 },
      // 高コントラスト（中明度処理用）
      high: { chroma: 0.22, lightness: 0.35 },
      // 標準調整（通常色処理用）
      standard: { chroma: 0.15, lightness: 0.25 },
    },
    muted: {
      // 標準調整（白系・黒系処理用）
      standard: { chroma: 0.12, lightness: 0.25 },
      // 控えめ調整（低彩度色処理用）
      low: { chroma: 0.1, lightness: 0.15 },
      // バランス調整（中間色処理用）
      balance: { chroma: -0.08, lightness: 0.04 },
      // 高彩度削減（派手な色を落ち着かせる）
      highChromaReduction: { base: -0.15, factor: 0.4 },
    },
  },
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
function generateComplementaryBiasedHue(random: () => number, params = VIVID_MUTED_PARAMS): number {
  const r = random();
  const { probability, hue } = params;

  // 30%の確率で補色（180°付近）を生成
  if (r < probability.complementary) {
    // 150°-210°の範囲（補色±30°）
    return hue.complementary.min + random() * hue.complementary.range;
  }

  // 20%の確率でトライアド（120°, 240°付近）を生成
  if (r < probability.complementary + probability.triadic) {
    return random() < 0.5
      ? hue.triadic.first.min + random() * hue.triadic.first.range
      : hue.triadic.second.min + random() * hue.triadic.second.range;
  }

  // 残り50%で全色相からランダム
  return random() * 360;
}

// Muted用：近似色を優遇した色相オフセット生成
function generateAnalogousBiasedHue(random: () => number, params = VIVID_MUTED_PARAMS): number {
  const r = random();
  const { probability, hue } = params;

  // 25%の確率で近似色（±30°以内）を生成
  if (r < probability.analogous) {
    // -30°〜+30°の範囲（類似色）
    return -hue.analogous.range / 2 + random() * hue.analogous.range;
  }

  // 25%の確率で中程度の距離（60°-120°付近）
  if (r < probability.analogous + probability.mediumDistance) {
    return random() < 0.5
      ? hue.analogous.medium.min + random() * (hue.analogous.medium.max - hue.analogous.medium.min)
      : hue.analogous.opposite.min + random() * (hue.analogous.opposite.max - hue.analogous.opposite.min);
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
function nudgeForContrast(
  hex: string, 
  bgHex: string, 
  minContrast: number, 
  params = VIVID_MUTED_PARAMS
): string {
  let currentColor = hex;
  let tries = 0;
  const { maxTries, contrastStep } = params.adjustment;

  while (getContrastRatio(currentColor, bgHex) < minContrast && tries < maxTries) {
    const rgb = hexToRgb(currentColor);
    let oklab = rgbToOklab(rgb);

    // 背景との関係で明度を調整
    const bgLum = getLuminance(hexToRgb(bgHex));
    if (bgLum > params.lightness.middle) {
      // 明るい背景：色を暗くする
      oklab.L = clamp(oklab.L - contrastStep, 0, 1);
    } else {
      // 暗い背景：色を明るくする
      oklab.L = clamp(oklab.L + contrastStep, 0, 1);
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
  random: () => number,
  params = VIVID_MUTED_PARAMS
): number {
  const normalizedOffset = normalizeHue(offset);
  const [min, max] = range;

  // 範囲チェック
  if (normalizedOffset >= min && normalizedOffset <= max) {
    return normalizedOffset;
  }

  // 範囲外の場合、再抽選を試行
  for (let i = 0; i < params.adjustment.maxRetries; i++) {
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
  const { lightness, deltaValues } = params;
  const baseChroma = getChroma(base);
  const baseL = base.L;

  if (isVivid) {
    // Vividモード：極端なコントラストを生成
    if (baseL > lightness.high) {
      // 白系（明るい色）：強烈に暗い色を生成
      return {
        deltaC: deltaValues.vivid.extreme.chroma,
        deltaL: -deltaValues.vivid.extreme.lightness, // より強烈に暗く
      };
    } else if (baseL < lightness.veryLow) {
      // 黒系（暗い色）：強烈に明るい色を生成
      return {
        deltaC: deltaValues.vivid.extreme.chroma,
        deltaL: deltaValues.vivid.extreme.lightness, // より強烈に明るく
      };
    } else if (baseL > 0.6) {
      // 中程度の明るい色：強烈に暗くする
      return {
        deltaC: deltaValues.vivid.high.chroma,
        deltaL: -deltaValues.vivid.high.lightness, // 強烈に暗く
      };
    } else if (baseL < 0.4) {
      // 中程度の暗い色：強烈に明るくする
      return {
        deltaC: deltaValues.vivid.high.chroma,
        deltaL: deltaValues.vivid.high.lightness, // 強烈に明るく
      };
    } else if (baseChroma < lowChroma) {
      // 低彩度の色全部：面白い色を生成
      return {
        deltaC: deltaValues.vivid.high.chroma,
        deltaL: baseL > lightness.middle 
          ? -deltaValues.vivid.standard.lightness 
          : deltaValues.vivid.standard.lightness, // より極端な明度コントラスト
      };
    } else if (baseChroma > highChroma) {
      // 派手な色：彩度を下げてバランスを取る
      return {
        deltaC: -0.05 - (baseChroma - highChroma) * 0.3,
        deltaL: 0,
      };
    }
    // 中間的な色：標準的な増加 + 極端な明度コントラスト
    const lightnessFactor = baseL > lightness.middle 
      ? -deltaValues.vivid.standard.lightness 
      : deltaValues.vivid.standard.lightness;
    return { deltaC: deltaValues.vivid.standard.chroma, deltaL: lightnessFactor };
  } else {
    // Mutedモード：落ち着いた色でも面白さを追求
    if (baseL > lightness.high) {
      // 白系：中程度の明度で落ち着いた彩度を狙う
      return {
        deltaC: deltaValues.muted.standard.chroma, // 控えめだが色味のある彩度
        deltaL: -deltaValues.muted.standard.lightness, // 適度に暗く
      };
    } else if (baseL < lightness.veryLow) {
      // 黒系：中程度の明度で落ち着いた彩度を狙う
      return {
        deltaC: deltaValues.muted.standard.chroma, // 控えめだが色味のある彩度
        deltaL: deltaValues.muted.standard.lightness, // 適度に明るく
      };
    } else if (baseChroma < lowChroma) {
      // 低彩度の色全部：落ち着いた色味を追加
      return {
        deltaC: deltaValues.muted.low.chroma, // 控えめだが色味のある彩度
        deltaL: baseL > 0.6 
          ? -deltaValues.muted.low.lightness 
          : deltaValues.muted.low.lightness, // 適度な明度コントラスト
      };
    } else if (baseChroma > highChroma) {
      // 高彩度：大幅に彩度を下げる
      return {
        deltaC: deltaValues.muted.highChromaReduction.base - 
                (baseChroma - highChroma) * deltaValues.muted.highChromaReduction.factor,
        deltaL: 0.03, // 少し明るくしてスモーキーに
      };
    }
    // 中間的な色：バランスよく調整
    return {
      deltaC: deltaValues.muted.balance.chroma,
      deltaL: baseL > 0.6 
        ? deltaValues.muted.balance.lightness 
        : -deltaValues.muted.balance.lightness,
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
  const { chroma, lightness } = params;
  
  // 適応的調整を取得
  const { deltaC, deltaL } = getAdaptiveAdjustment(base, isVivid, params);

  // 黒系・白系の色（極端な明度・低彩度）の特別処理（Vivid/Muted共通）
  const baseChroma = getChroma(base);
  if (baseChroma < chroma.low && (base.L < lightness.low || base.L > lightness.high)) {
    // 黒系・白系の場合：まず目標の明度と彩度を設定してから色相を適用
    const targetL = clamp(base.L + deltaL, 0, 1);
    // Mutedモードではより厳格な彩度制限
    const maxChroma = isVivid ? chroma.vivid.max : chroma.muted.max;
    const targetChroma = clamp(baseChroma + deltaC, 0, maxChroma);

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
  // Mutedモードではより厳格な彩度制限を適用
  const maxChroma = isVivid ? chroma.vivid.max : chroma.muted.max;
  const targetChroma = clamp(currentChroma + deltaC, 0, maxChroma);
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
  const { adjustment } = params;
  
  // 黄金比（φ - 1 ≈ 0.618の逆数）でベース寄りに配置
  const t = adjustment.bridgePosition;
  
  // Lightness: 線形補間
  const L = base.L + (adventure.L - base.L) * t;
  
  // 極座標での補間（Hueは最短経路、Chromaは減衰付き）
  const Ca = Math.hypot(base.a, base.b);
  const Cb = Math.hypot(adventure.a, adventure.b);
  const Ha = Math.atan2(base.b, base.a);
  const Hb = Math.atan2(adventure.b, adventure.a);
  
  // Hueの最短経路補間
  let dH = Hb - Ha;
  if (dH > Math.PI) dH -= 2 * Math.PI;
  if (dH < -Math.PI) dH += 2 * Math.PI;
  const H = Ha + dH * t;
  
  // Chromaは線形補間後に弱める（つなぎ感を出す）
  const C = (Ca * (1 - t) + Cb * t) * adjustment.chromaReduction;
  
  return {
    L,
    a: C * Math.cos(H),
    b: C * Math.sin(H),
  };
}

/**
 * BaseとAdventureから最も離れた色（min(ΔE(X,A), ΔE(X,B))が最大）を探す
 * Mutedモードらしく低彩度・落ち着いた明度に寄せる
 */
function findMaxMinDistanceColor(
  base: OklabColor,
  adventure: OklabColor,
  random: () => number,
  params = VIVID_MUTED_PARAMS
): OklabColor {
  const { chroma, lightness, adjustment } = params;
  
  // 探索する候補を生成
  const candidates: OklabColor[] = [];

  // 色相を360度探索（30度刻み）
  for (let hueOffset = 0; hueOffset < 360; hueOffset += 30) {
    // 明度を3段階（暗め、中間、明るめ）
    for (const lightnessFactor of [0.4, 0.6, 0.8]) {
      // 彩度を低めに（Mutedらしく）
      for (const chromaFactor of [0.3, 0.5, 0.7]) {
        const hueRad = (hueOffset * Math.PI) / 180;

        // Muted向けの控えめな彩度
        const targetChroma = chroma.mutedTarget * chromaFactor;

        const candidate: OklabColor = {
          L: lightness.mutedMin + lightnessFactor * (lightness.mutedMax - lightness.mutedMin),
          a: targetChroma * Math.cos(hueRad),
          b: targetChroma * Math.sin(hueRad),
        };

        candidates.push(candidate);
      }
    }
  }

  // ランダムな候補も追加（多様性のため）
  for (let i = 0; i < 20; i++) {
    const hueRad = random() * 2 * Math.PI;
    const chromaFactor = 0.2 + random() * 0.5; // 0.2〜0.7
    const targetChroma = chroma.mutedTarget * chromaFactor;

    const candidate: OklabColor = {
      L: 0.35 + random() * 0.35, // Muted向け明度範囲
      a: targetChroma * Math.cos(hueRad),
      b: targetChroma * Math.sin(hueRad),
    };

    candidates.push(candidate);
  }

  // 各候補について min(ΔE(X,base), ΔE(X,adventure)) を計算
  let bestCandidate = candidates[0];
  let bestScore = 0;

  for (const candidate of candidates) {
    const distToBase = deltaEOklab(candidate, base);
    const distToAdventure = deltaEOklab(candidate, adventure);
    const minDist = Math.min(distToBase, distToAdventure);

    if (minDist > bestScore) {
      bestScore = minDist;
      bestCandidate = candidate;
    }
  }

  // 最終的な彩度調整（Mutedらしく控えめに）
  return adjustChroma(bestCandidate, adjustment.finalChromaFactor);
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
  let hueOffset = generateComplementaryBiasedHue(random, VIVID_MUTED_PARAMS);

  // hueOffsetRangeを適用
  if (hueRange[0] !== 0 || hueRange[1] !== 360) {
    hueOffset = enforceHueRange(hueOffset, hueRange, random, VIVID_MUTED_PARAMS);
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
  bridgeHex = nudgeForContrast(bridgeHex, bgHex, VIVID_MUTED_PARAMS.minContrastOnBg, VIVID_MUTED_PARAMS);
  adventureHex = nudgeForContrast(adventureHex, bgHex, VIVID_MUTED_PARAMS.minContrastOnBg, VIVID_MUTED_PARAMS);

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
  let hueOffset = generateAnalogousBiasedHue(random, VIVID_MUTED_PARAMS);

  // hueOffsetRangeを適用
  if (hueRange[0] !== 0 || hueRange[1] !== 360) {
    hueOffset = enforceHueRange(hueOffset, hueRange, random, VIVID_MUTED_PARAMS);
  }

  // Adventure色を生成（Muted）
  let adventureOklab = makeAdventure(baseOklab, false, hueOffset);

  // 新アルゴリズム: BaseとAdventureから最も離れた色を探す
  let bridgeOklab = findMaxMinDistanceColor(baseOklab, adventureOklab, random, VIVID_MUTED_PARAMS);

  // sRGBクリップ
  adventureOklab = clipOklabColor(adventureOklab);
  bridgeOklab = clipOklabColor(bridgeOklab);

  // RGB変換してHEX化
  const adventureRgb = oklabToRgb(adventureOklab);
  const bridgeRgb = oklabToRgb(bridgeOklab);

  let bridgeHex = rgbToHex(bridgeRgb);
  let adventureHex = rgbToHex(adventureRgb);

  // コントラスト調整
  bridgeHex = nudgeForContrast(bridgeHex, bgHex, VIVID_MUTED_PARAMS.minContrastOnBg, VIVID_MUTED_PARAMS);
  adventureHex = nudgeForContrast(adventureHex, bgHex, VIVID_MUTED_PARAMS.minContrastOnBg, VIVID_MUTED_PARAMS);

  return [baseHex, bridgeHex, adventureHex];
}
