import type { Dye, DyeCandidate, HarmonyPattern, RGBColor } from '$lib/types';
import { deltaEOklab, hsvToRgb, rgbToOklab, rgbToOklch, oklchToRgb } from './colorConversion';
import { selectMonochromaticDyes } from './selector/monochromatic';

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
// TODO: replaced with analogousSelector
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

// クラッシュ - 補色±30°（挑戦的な配色）
export function calculateClash(baseHue: number): [number, number] {
  const complement = (baseHue + 180) % 360;
  return [(complement - 30 + 360) % 360, (complement + 30) % 360];
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
    const candidates: DyeCandidate[] = palette.map((dye) => ({
      dye,
      delta: deltaEOklab(targetOklab, rgbToOklab(dye.rgb)),
    }));
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

/**
 * dyeAとdyeBのOklab空間での中間点に最も近い染料を見つける
 * 2色の「橋渡し」となる色を選ぶ
 *
 * @param dyeA 第1の基本色
 * @param dyeB 第2の色
 * @param palette 選択可能な染料リスト
 * @returns Oklab中間点に最も近い染料
 */
export function findBridgeDye(dyeA: Dye, dyeB: Dye, palette: Dye[]): Dye {
  // Oklab空間での中間点を計算
  const midpointOklab = {
    L: (dyeA.oklab.L + dyeB.oklab.L) / 2,
    a: (dyeA.oklab.a + dyeB.oklab.a) / 2,
    b: (dyeA.oklab.b + dyeB.oklab.b) / 2,
  };

  let minDistance = Infinity;
  let selectedDye: Dye | null = null;

  for (const dye of palette) {
    // dyeAまたはdyeBと同じ場合はスキップ
    if (dye.id === dyeA.id || dye.id === dyeB.id) continue;

    const distance = deltaEOklab(dye.oklab, midpointOklab);

    if (distance < minDistance) {
      minDistance = distance;
      selectedDye = dye;
    }
  }

  // 適切な染料が見つからない場合はランダムに選択
  if (!selectedDye) {
    const availableDyes = palette.filter(
      (dye) => dye.id !== dyeA.id && dye.id !== dyeB.id
    );
    selectedDye = availableDyes[Math.floor(Math.random() * availableDyes.length)];
  }

  return selectedDye;
}

// 配色パターンに基づいて提案染料を生成

export function generateSuggestedDyes(
  primaryDye: Dye,
  pattern: HarmonyPattern,
  allDyes: Dye[],
  _seed?: number
): [Dye, Dye] {
  if (pattern === 'monochromatic') {
    return selectMonochromaticDyes(
      primaryDye, allDyes, {diversifyByLightness: true}
    ).map(c => c.dye) as [Dye, Dye];
  }

  // クラッシュパターンの場合は新しいロジックを使用
  if (pattern === 'clash') {
    const availableDyes = allDyes.filter((dye) => dye.id !== primaryDye.id);

    // 1. Base色をOklchに変換
    const baseOklch = rgbToOklch(primaryDye.rgb);

    // 2. 補色の色相を計算（色相 + 180度）
    const complementHue = (baseOklch.h + 180) % 360;

    // 3. 明度を逆方向に調整
    // Base色が明るい（L > 0.5）なら暗く、暗いなら明るく
    const adjustedL = baseOklch.L > 0.5 ? 0.3 : 0.75;

    // 4. 彩度を逆方向に調整
    // Base色の彩度が高い（C > 0.1）なら低く、低いなら高く
    const adjustedC = baseOklch.C > 0.1 ? 0.05 : 0.15;

    // 5. 調整されたOklchから3色目のターゲット色を作成
    const thirdColorTarget = oklchToRgb({
      L: adjustedL,
      C: adjustedC,
      h: complementHue,
    });

    // 6. ターゲット色に最も近い染料を3色目として選択
    const thirdColorCandidate = findNearestDyesInOklab([thirdColorTarget], availableDyes)[0];

    if (!thirdColorCandidate) {
      // フォールバック: 適切な染料が見つからない場合
      const randomDyes = availableDyes.slice(0, 2);
      return [randomDyes[0], randomDyes[1]] as [Dye, Dye];
    }

    const thirdColor = thirdColorCandidate.dye;

    // 7. 2色目（橋渡し）: Base色と3色目Xの中間色
    const bridgeColor = findBridgeDye(primaryDye, thirdColor, availableDyes);

    return [bridgeColor, thirdColor];
  }

  // その他のパターンは既存のロジックを使用
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
    case 'similar':
      targetHues = calculateSimilar(primaryDye.hsv.h);
      break;
    case 'contrast':
      targetHues = calculateContrast(primaryDye.hsv.h);
      break;
    default:
      targetHues = calculateTriadic(primaryDye.hsv.h);
  }

  const targets = targetHues.map((h) => hsvToRgb({ ...primaryDye.hsv, h }));
  const nearestDyes = findNearestDyesInOklab(
    targets,
    allDyes.filter((dye) => dye.id !== primaryDye.id)
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
