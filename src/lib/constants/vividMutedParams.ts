/**
 * Vivid/Mutedモードの色生成パラメータ定義
 * 
 * このファイルには、Vivid（鮮やか）/Muted（落ち着いた）モードで
 * 色の組み合わせを生成する際に使用する各種パラメータが定義されています。
 */

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
      // 黒系特別調整（より控えめな色変化）
      darkReduction: {
        chromaFactor: 0.5,    // 彩度変化を50%に抑制（さらに控えめに）
        lightnessFactor: 0.7, // 明度変化を70%に抑制
      },
    },
  },
} as const;

export type VividMutedParams = typeof VIVID_MUTED_PARAMS;