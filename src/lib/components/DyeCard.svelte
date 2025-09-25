<script lang="ts">
import type { Dye } from '$lib/types';

interface Props {
  dye: Dye;
  isSelected?: boolean;
  onSelect: (dye: Dye) => void;
}

const { dye, isSelected = false, onSelect }: Props = $props();

function handleClick() {
  onSelect(dye);
}
</script>

<div 
  class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer {isSelected ? 'ring-2 ring-primary' : ''}"
  onclick={handleClick}
  role="button"
  tabindex="0"
  onkeydown={(e) => e.key === 'Enter' && handleClick()}
>
  <div class="card-body p-4">
    <!-- カラーサンプル -->
    <div 
      class="w-full h-16 rounded-lg border-2 border-base-300 mb-3 shadow-sm"
      style="background-color: {dye.hex};"
    ></div>
    
    <!-- カララント名 -->
    <h3 class="card-title text-base font-medium text-center mb-2">{dye.name}</h3>
    
  </div>
</div>