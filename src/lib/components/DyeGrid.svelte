<script lang="ts">
import type { Dye } from '$lib/types';
import DyeCard from './DyeCard.svelte';

interface Props {
  dyes: Dye[];
  selectedDye?: Dye | null;
  onDyeSelect: (dye: Dye) => void;
}

const { dyes, selectedDye = null, onDyeSelect }: Props = $props();
</script>

<div class="w-full">
  {#if dyes.length === 0}
    <div class="text-center py-8">
      <div class="text-base-content/50">カララントが見つかりませんでした</div>
    </div>
  {:else}
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {#each dyes as dye (dye.id)}
        <DyeCard 
          {dye} 
          isSelected={selectedDye?.id === dye.id}
          onSelect={onDyeSelect}
        />
      {/each}
    </div>
  {/if}
</div>