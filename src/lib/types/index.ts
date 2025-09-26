// カララント
export interface Dye {
  id: string;
  name: string;
  category: DyeCategory;
  hsv: HSVColor;
  rgb: RGBColor;
  hex: string;
  tags?: string[];
}

// HSV色空間
export interface HSVColor {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

// RGB色空間
export interface RGBColor {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

// カララントカテゴリ
export type DyeCategory = '白系' | '赤系' | '茶系' | '黄系' | '緑系' | '青系' | '紫系' | 'レア系';

// 配色パターン
export type HarmonyPattern =
  | 'triadic'
  | 'split-complementary'
  | 'analogous'
  | 'monochromatic'
  | 'similar'
  | 'contrast'
  | 'random';

// 組み合わせ
export interface DyeCombination {
  id: string;
  name?: string;
  pattern: HarmonyPattern;
  primaryDye: Dye;
  secondaryDyes: [Dye, Dye];
  harmonyScore: number;
  createdAt: string;
}

// フィルター設定
export interface FilterOptions {
  categories: DyeCategory | null;
  hueRange: [number, number];
  saturationRange: [number, number];
  valueRange: [number, number];
  excludeMetallic: boolean;
}

// カララントデータJSONの型
export interface DyeData {
  dyes: Dye[];
}

// お気に入り
export interface Favorite {
  id: string;
  name: string;
  primaryDye: Dye;
  suggestedDyes: [Dye, Dye];
  pattern: HarmonyPattern;
  createdAt: string;
  updatedAt?: string;
}

// 保存用の軽量型定義（hsv/hex除外）
export interface StoredDye {
  id: string;
  name: string;
  category: DyeCategory;
  rgb: RGBColor;
  tags?: string[];
}

export interface StoredCustomColor {
  id: string;
  name: string;
  rgb: RGBColor;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredFavorite {
  id: string;
  name: string;
  primaryDye: StoredDye;
  suggestedDyes: [StoredDye, StoredDye];
  pattern: HarmonyPattern;
  createdAt: string;
  updatedAt?: string;
}

// LocalStorage用のお気に入りデータ
export interface FavoritesData {
  favorites: Favorite[];
  version: string;
}

// カスタムカラー
export interface CustomColor {
  id: string;
  name: string;
  rgb: RGBColor;
  hsv: HSVColor;
  createdAt: Date;
  updatedAt: Date;
}

// 拡張されたDye（カスタムカラー対応）
export type DyeSource = 'game' | 'custom';

export interface ExtendedDye extends Dye {
  source: DyeSource;
  customColor?: CustomColor;
}

// カスタムカラー対応シェアデータ
export interface CustomColorShare {
  type: 'custom';
  name: string;
  rgb: RGBColor;
  // hsv削除（必要時にrgbから計算）
}

export interface ExtendedSharePaletteData {
  p: string | CustomColorShare;
  s: [string, string];
  pt: HarmonyPattern;
}

// カスタムカラー対応お気に入り
export interface ExtendedFavorite extends Omit<Favorite, 'primaryDye'> {
  primaryDye: Dye | CustomColor;
}

// LocalStorage用のカスタムカラーデータ
export interface CustomColorsData {
  colors: CustomColor[];
  version: string;
  lastUpdated: string;
}
