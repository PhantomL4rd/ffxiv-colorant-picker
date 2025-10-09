/**
 * パレット操作のイベント管理
 * ストア間の疎結合を実現するためのイベントシステム
 */

import type { Dye, ExtendedDye, HarmonyPattern } from '$lib/types';

export type PaletteEventType = 'restore-palette';

export interface RestorePaletteEvent {
  primaryDye: Dye | ExtendedDye;
  suggestedDyes: [Dye, Dye];
  pattern: HarmonyPattern;
}

export interface PaletteEvent {
  type: PaletteEventType;
  data: RestorePaletteEvent;
}

class PaletteEventBus {
  private listeners: Map<PaletteEventType, Set<(event: PaletteEvent) => void>> = new Map();

  /**
   * イベントリスナーを登録
   */
  on(type: PaletteEventType, listener: (event: PaletteEvent) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);

    // アンサブスクライブ関数を返す
    return () => {
      this.listeners.get(type)?.delete(listener);
    };
  }

  /**
   * イベントを発火
   */
  emit(event: PaletteEvent): void {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
  }

  /**
   * すべてのリスナーを削除
   */
  clear(): void {
    this.listeners.clear();
  }
}

// シングルトンインスタンス
export const paletteEventBus = new PaletteEventBus();

/**
 * パレット復元イベントを発火
 */
export function emitRestorePalette(data: RestorePaletteEvent): void {
  paletteEventBus.emit({
    type: 'restore-palette',
    data,
  });
}