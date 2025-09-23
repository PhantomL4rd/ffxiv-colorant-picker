<script lang="ts">
import type { Dye } from '$lib/types';

interface Props {
  dyes: Dye[];
  onRandomPick: (dyes: [Dye, Dye, Dye]) => void;
  disabled?: boolean;
}

const { dyes, onRandomPick, disabled = false }: Props = $props();

function handleRandomPick() {
  if (dyes.length < 3) return;

  // ランダムに3色選択
  const shuffled = [...dyes].sort(() => Math.random() - 0.5);
  const randomDyes: [Dye, Dye, Dye] = [shuffled[0], shuffled[1], shuffled[2]];

  onRandomPick(randomDyes);
}
</script>

<button 
  class="btn btn-secondary btn-block"
  onclick={handleRandomPick}
  disabled={disabled || dyes.length < 3}
>
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 3v10a2 2 0 002 2h6a2 2 0 002-2V7M9 7h6M9 11h6m-3 4h3" />
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12l-2-2m0 0l-2 2m2-2v6" />
  </svg>
  ランダムピック
</button>

{#if dyes.length < 3}
  <div class="text-xs text-error text-center mt-1">
    3色以上のカララントが必要です
  </div>
{/if}