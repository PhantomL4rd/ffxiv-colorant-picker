import type { Dye, DyeCandidate, HarmonyPattern, RGBColor } from '$lib/types';
import { deltaEOklab, hsvToRgb, rgbToOklab } from './colorConversion';

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

/**
 * Find the nearest dyes for each targets in a palette based on color difference in Oklab space.
 *
 * @param targets
 * @param palette
 * @returns
 */
export function findNearestDyesInOklab(targets: RGBColor[], palette: Dye[]): DyeCandidate[] {
  const candidatesByTarget = targets.map((target) => {
    const targetOklab = rgbToOklab(target);
    const candidates: DyeCandidate[] = palette.map((dye) => (
      { dye, delta: deltaEOklab(targetOklab, rgbToOklab(dye.rgb)) }
    ));
    return candidates.sort((a, b) => a.delta - b.delta);
  });

  const results: DyeCandidate[] = [];
  const used = new Set<string>();
  for (const candidates of candidatesByTarget) {
    const candidate = candidates.find((c) => !used.has(c.dye.id));
    if (candidate) {
      results.push(candidate);
      used.add(candidate.dye.id);
    }
  }

  return results;
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

  const targets = targetHues.map((h) => (hsvToRgb({ ...primaryDye.hsv, h })));
  const nearestDyes = findNearestDyesInOklab(
    targets, allDyes.filter((dye) => dye.id !== primaryDye.id)
  ).map((c) => c.dye);

  // 2色に満たない場合はランダムで補完
  while (nearestDyes.length < 2) {
    const randomDye = allDyes[Math.floor(Math.random() * allDyes.length)];
    if (!nearestDyes.includes(randomDye) && randomDye.id !== primaryDye.id) {
      nearestDyes.push(randomDye);
    }
  }

  return [nearestDyes[0], nearestDyes[1]];
}

