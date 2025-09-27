import type { Dye, OklchColor } from "$lib/types";
import { hueDiff, oklabToOklch } from "../colorConversion";

type Candidate = {
  dye: Dye;
  oklch: OklchColor;
  score: number;
  dh: number;
  dC: number;
  dL: number;
};

type Options = {
  hueWindowDeg?: number; // e.g.: 35
  thetaDeg?: number; // e.g.: 30
  weights?: { wh: number; wc: number; wl: number };
  numResults?: number;
  diversifyByLightness?: boolean;
};

function huePenalty(dh: number, theta: number): number {
  // 色相 (h) の差が theta を超えるとペナルティが急増するようスコア付け
  const x = dh / theta;
  return x * x;
}

export function selectAnalogousDyes(
  baseDye: Dye,
  palette: Dye[],
  opts: Options = {}
): Candidate[] {
  const {
    hueWindowDeg = 35,
    thetaDeg = 30,
    weights = { wh: 1.0, wc: 0.3, wl: 0.2 },
    numResults = 2,
    diversifyByLightness = false,
  } = opts;

  const base = oklabToOklch(baseDye.oklab);

  // 1) 基準色との色相・彩度・明度の差を重み付けしてスコアリング
  const scored: Candidate[] = palette
    .filter((d) => d.id !== baseDye.id)
    .map((dye) => {
      const c = oklabToOklch(dye.oklab);
      const dh = hueDiff(base.h, c.h);
      const dC = Math.abs(c.C - base.C);
      const dL = Math.abs(c.L - base.L);

      const s =
        weights.wh * huePenalty(dh, thetaDeg) +
        weights.wc * (dC / (base.C + 1e-6)) +
        weights.wl * dL;

      return { dye, oklch: c, score: s, dh, dC, dL };
    });

  // 2) 色相をフィルタして同系色に絞る（厳しめにしたいときは 30° 程度）
  const filtered = scored.filter((c) => c.dh <= hueWindowDeg);

  // Fallback 処理: 足りない時は「最も近い色相」から追加
  if (filtered.length < numResults) {
    const needed = numResults - filtered.length;
    const fallback = [...scored]
      .sort((a, b) => a.dh - b.dh)
      .slice(0, Math.min(needed, scored.length));
    filtered.push(...fallback);
  }

  // 3) 明度で分散（任意）：近しいスコア上位を取りつつ L を簡易的にクラスタリング
  let picked: Candidate[];

  if (!diversifyByLightness) {
    picked = filtered.sort((a, b) => a.score - b.score).slice(0, numResults);
  } else {
    const sorted = filtered.sort((a, b) => a.score - b.score);

    // 候補色をその L の値域で3分割し、各クラスタから均等に選定する
    const bins: Candidate[][] = [[], [], []]; // low/mid/high
    const Ls = sorted.map((x) => x.oklch.L);
    Ls.push(base.L); // 基準色の L も考慮する
    const Lmin = Math.min(...Ls);
    const Lmax = Math.max(...Ls);
    const step = (Lmax - Lmin) / 3 || 1;

    for (const c of sorted) {
      const bin = Math.min(2, Math.floor((c.oklch.L - Lmin) / step));
      if (bins[bin].length < Math.ceil(numResults / 3)) bins[bin].push(c);
    }

    // 基準色の属するクラスタを除外（numResults >= 3 の場合は要調整）
    const banned = Math.floor((base.L - Lmin) / step);
    const selectedBins = bins.filter((_, i) => i !== banned);

    picked = ([] as Candidate[]).concat(...selectedBins).slice(0, numResults);
  }

  // 4) 最終的にスコア→色相差→彩度差で安定ソート
  picked.sort((a, b) => a.score - b.score || a.dh - b.dh || a.dC - b.dC);

  return picked;
}
