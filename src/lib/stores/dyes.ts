import { writable } from 'svelte/store';
import type { Dye, DyeData } from '$lib/types';

// カララントデータストア
export const dyeStore = writable<Dye[]>([]);

// カララントデータを読み込む
export async function loadDyes(): Promise<void> {
  try {
    // base pathを考慮してフェッチパスを動的に決定
    const basePath = import.meta.env.BASE_URL || '';
    const fetchUrl = `${basePath}data/dyes.json`;
    console.log('Fetching dyes from:', fetchUrl);
    const response = await fetch(fetchUrl);
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
