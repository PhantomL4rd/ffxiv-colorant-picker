<script lang="ts">
import type { Dye } from '$lib/types';
import { selectPrimaryDye } from '$lib/stores/selection';

interface Props {
  selectedDye: Dye | null;
  suggestedDyes: [Dye, Dye] | null;
  pattern: string;
}

const { selectedDye, suggestedDyes, pattern }: Props = $props();

function handleSuggestedDyeClick(dye: Dye): void {
  selectPrimaryDye(dye);
}
</script>

<div class="card bg-base-100 shadow-lg">
  <div class="card-body">
    {#if selectedDye && suggestedDyes}
      <div class="space-y-6">
        <!-- 3色のプレビュー -->
        <div class="grid grid-cols-3 gap-4">
          <!-- 基本カララント -->
          <div class="text-center">
            <div 
              class="w-full h-20 rounded-lg border-2 border-base-300 mb-2"
              style="background-color: {selectedDye.hex};"
            ></div>
            <h4 class="font-medium text-sm">{selectedDye.name}</h4>
          </div>
          
          <!-- 提案カララント1 -->
          <div class="text-center">
            <button
              type="button"
              class="w-full h-20 rounded-lg border-2 border-base-300 mb-2 hover:border-primary transition-colors cursor-pointer"
              style="background-color: {suggestedDyes[0].hex};"
              onclick={() => handleSuggestedDyeClick(suggestedDyes[0])}
              title="この色を選択して新しい組み合わせを提案"
            ></button>
            <h4 class="font-medium text-sm">{suggestedDyes[0].name}</h4>
          </div>
          
          <!-- 提案カララント2 -->
          <div class="text-center">
            <button
              type="button"
              class="w-full h-20 rounded-lg border-2 border-base-300 mb-2 hover:border-primary transition-colors cursor-pointer"
              style="background-color: {suggestedDyes[1].hex};"
              onclick={() => handleSuggestedDyeClick(suggestedDyes[1])}
              title="この色を選択して新しい組み合わせを提案"
            ></button>
            <h4 class="font-medium text-sm">{suggestedDyes[1].name}</h4>
          </div>
        </div>
        
      </div>
    {:else}
      <div class="text-center py-8 text-base-content/50">
        カララントを選択すると<br>組み合わせプレビューが表示されます
      </div>
    {/if}
  </div>
</div>