import type { Dye, HarmonyPattern } from '$lib/types';

// トライアド（三色配色）- 色相環で120度ずつ離れた色
export function calculateTriadic(baseHue: number): [number, number] {
  return [(baseHue + 120) % 360, (baseHue + 240) % 360];
}

// スプリット・コンプリメンタリー - 補色の両隣の色
export function calculateSplitComplementary(baseHue: number): [number, number] {
  const complement = (baseHue + 180) % 360;
  return [(complement - 30 + 360) % 360, (complement + 30) % 360];
}

// アナログ（類似色）- 色相環で隣接する色
export function calculateAnalogous(baseHue: number): [number, number] {
  return [(baseHue - 30 + 360) % 360, (baseHue + 30) % 360];
}

// モノクロマティック - 同一色相で明度・彩度を変える
export function calculateMonochromatic(baseDye: Dye): [number, number] {
  // 同じ色相で異なる明度・彩度の色を探す
  return [baseDye.hsv.h, baseDye.hsv.h];
}

// 類似色 - 近い色相での組み合わせ
export function calculateSimilar(baseHue: number): [number, number] {
  return [(baseHue - 15 + 360) % 360, (baseHue + 15) % 360];
}

// コントラスト - 補色関係を含む組み合わせ
export function calculateContrast(baseHue: number): [number, number] {
  return [(baseHue + 180) % 360, (baseHue + 90) % 360];
}

// 最も近い色相の染料を見つける
export function findNearestDyes(targetHues: number[], dyes: Dye[], excludeDye?: Dye): Dye[] {
  const availableDyes = dyes.filter((dye) => !excludeDye || dye.id !== excludeDye.id);
  const result: Dye[] = [];
  const usedDyeIds = new Set<string>();

  for (const targetHue of targetHues) {
    let closestDye: Dye | null = null;
    let minDifference = Infinity;

    for (const dye of availableDyes) {
      // すでに結果として選ばれている染料はスキップする
      if (usedDyeIds.has(dye.id)) continue;

      const hueDifference = Math.min(
        Math.abs(dye.hsv.h - targetHue),
        360 - Math.abs(dye.hsv.h - targetHue)
      );

      if (hueDifference < minDifference) {
        minDifference = hueDifference;
        closestDye = dye;
      }
    }

    if (closestDye) {
      result.push(closestDye);
      // 見つかった染料のIDを記録し、次の検索で重複しないようにする
      usedDyeIds.add(closestDye.id);
    }
  }

  return result;
}

// 配色パターンに基づいて提案染料を生成
export function generateSuggestedDyes(
  primaryDye: Dye,
  pattern: HarmonyPattern,
  allDyes: Dye[]
): [Dye, Dye] {
  let targetHues: [number, number];

  switch (pattern) {
    case 'triadic':
      targetHues = calculateTriadic(primaryDye.hsv.h);
      break;
    case 'split-complementary':
      targetHues = calculateSplitComplementary(primaryDye.hsv.h);
      break;
    case 'analogous':
      targetHues = calculateAnalogous(primaryDye.hsv.h);
      break;
    case 'monochromatic':
      targetHues = calculateMonochromatic(primaryDye);
      break;
    case 'similar':
      targetHues = calculateSimilar(primaryDye.hsv.h);
      break;
    case 'contrast':
      targetHues = calculateContrast(primaryDye.hsv.h);
      break;
    default:
      targetHues = calculateTriadic(primaryDye.hsv.h);
  }

  const nearestDyes = findNearestDyes(targetHues, allDyes, primaryDye);

  // 2色に満たない場合はランダムで補完
  while (nearestDyes.length < 2) {
    const randomDye = allDyes[Math.floor(Math.random() * allDyes.length)];
    if (!nearestDyes.includes(randomDye) && randomDye.id !== primaryDye.id) {
      nearestDyes.push(randomDye);
    }
  }

  return [nearestDyes[0], nearestDyes[1]];
}

// 調和度スコアを計算
export function calculateHarmonyScore(dyes: [Dye, Dye, Dye]): number {
  const [dye1, dye2, dye3] = dyes;

  // 色相の調和度（0-1）
  const hueHarmony = calculateHueHarmony([dye1.hsv.h, dye2.hsv.h, dye3.hsv.h]);

  // 彩度のバランス（0-1）
  const saturationBalance = calculateSaturationBalance([dye1.hsv.s, dye2.hsv.s, dye3.hsv.s]);

  // 明度のコントラスト（0-1）
  const valueContrast = calculateValueContrast([dye1.hsv.v, dye2.hsv.v, dye3.hsv.v]);

  // 重み付け平均
  return hueHarmony * 0.4 + saturationBalance * 0.3 + valueContrast * 0.3;
}

// 色相の調和度を計算
function calculateHueHarmony(hues: number[]): number {
  // 理想的な角度差（120度、180度など）に近いほど高いスコア
  const differences = [];
  for (let i = 0; i < hues.length; i++) {
    for (let j = i + 1; j < hues.length; j++) {
      const diff = Math.min(Math.abs(hues[i] - hues[j]), 360 - Math.abs(hues[i] - hues[j]));
      differences.push(diff);
    }
  }

  // 理想的な差異との近さを評価
  const idealDifferences = [120, 120, 120]; // トライアドが理想
  let score = 0;
  for (let i = 0; i < differences.length; i++) {
    const ideal = idealDifferences[i] || 90;
    score += 1 - Math.abs(differences[i] - ideal) / 180;
  }

  return Math.max(0, score / differences.length);
}

// 彩度のバランスを計算
function calculateSaturationBalance(saturations: number[]): number {
  const avg = saturations.reduce((a, b) => a + b, 0) / saturations.length;
  const variance = saturations.reduce((sum, s) => sum + (s - avg) ** 2, 0) / saturations.length;

  // 分散が小さいほどバランスが良い（0-1）
  return Math.max(0, 1 - variance / 2500); // 2500は経験的な最大値
}

// 明度のコントラストを計算
function calculateValueContrast(values: number[]): number {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const contrast = max - min;

  // 適度なコントラスト（30-70）が理想
  if (contrast >= 30 && contrast <= 70) {
    return 1;
  } else if (contrast < 30) {
    return contrast / 30;
  } else {
    return Math.max(0, 1 - (contrast - 70) / 30);
  }
}
