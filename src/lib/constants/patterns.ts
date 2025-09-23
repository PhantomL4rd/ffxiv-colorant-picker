import type { HarmonyPattern } from '$lib/types';

// パターン名のマッピング
export const PATTERN_LABELS: Record<HarmonyPattern, string> = {
  'triadic': 'バランス',
  'split-complementary': 'アクセント',
  'analogous': 'グラデーション',
  'monochromatic': '同系色',
  'similar': 'ナチュラル',
  'contrast': 'コントラスト',
  'random': 'ランダム'
};

// パターンの説明
export const PATTERN_DESCRIPTIONS: Record<HarmonyPattern, string> = {
  'triadic': 'バランスよく調和した鮮やかな3色',
  'split-complementary': 'メインカラーに映える個性的な3色',
  'analogous': '自然につながる優しい3色',
  'monochromatic': '統一感のある落ち着いた3色',
  'similar': '馴染みやすい近い色味の3色',
  'contrast': 'はっきりとした対比のある3色',
  'random': 'ランダムに選ばれた予想外の3色'
};

// パターンの配列（セレクトボックス用）
export const PATTERN_OPTIONS: Array<{
  value: HarmonyPattern;
  label: string;
  description: string;
}> = [
  {
    value: 'triadic',
    label: PATTERN_LABELS.triadic,
    description: PATTERN_DESCRIPTIONS.triadic,
  },
  {
    value: 'split-complementary',
    label: PATTERN_LABELS['split-complementary'],
    description: PATTERN_DESCRIPTIONS['split-complementary'],
  },
  {
    value: 'analogous',
    label: PATTERN_LABELS.analogous,
    description: PATTERN_DESCRIPTIONS.analogous,
  },
  {
    value: 'monochromatic',
    label: PATTERN_LABELS.monochromatic,
    description: PATTERN_DESCRIPTIONS.monochromatic,
  },
  {
    value: 'similar',
    label: PATTERN_LABELS.similar,
    description: PATTERN_DESCRIPTIONS.similar,
  },
  {
    value: 'contrast',
    label: PATTERN_LABELS.contrast,
    description: PATTERN_DESCRIPTIONS.contrast,
  },
];

// パターンラベルを取得する関数
export function getPatternLabel(pattern: HarmonyPattern): string {
  return PATTERN_LABELS[pattern] || pattern;
}

// パターン説明を取得する関数
export function getPatternDescription(pattern: HarmonyPattern): string {
  return PATTERN_DESCRIPTIONS[pattern] || '';
}