<script lang="ts">
import type { Dye } from '$lib/types';
import { Shuffle } from '@lucide/svelte';

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
  <Shuffle class="h-5 w-5" />
  ランダムピック
</button>

{#if dyes.length < 3}
  <div class="text-xs text-error text-center mt-1">
    3色以上のカララントが必要です
  </div>
{/if}