import { writable } from 'svelte/store';
import type { Dye, DyeData } from '$lib/types';

// カララントデータストア
export const dyeStore = writable<Dye[]>([]);

// カララントデータを読み込む
export async function loadDyes(): Promise<void> {
  try {
    const response = await fetch('/data/dyes.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch dyes: ${response.status}`);
    }
    const data: DyeData = await response.json();
    dyeStore.set(data.dyes);
  } catch (error) {
    console.error('Error loading dyes:', error);
    dyeStore.set([]);
  }
}
