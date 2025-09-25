<script lang="ts">
import type { DyeCategory } from '$lib/types';

interface Props {
  selectedCategory: DyeCategory | null;
  onToggleCategory: (category: DyeCategory) => void;
  onClearCategories: () => void;
}

const { selectedCategory, onToggleCategory, onClearCategories }: Props = $props();

const categories: DyeCategory[] = [
  '白系',
  '赤系',
  '茶系',
  '黄系',
  '緑系',
  '青系',
  '紫系',
  'レア系',
];

function isSelected(category: DyeCategory): boolean {
  return selectedCategory === category;
}
</script>

<div class="form-control w-full">  
  <div class="flex flex-wrap gap-2">
    {#each categories as category}
      <button
        class="btn btn-sm {isSelected(category) ? 'btn-primary' : 'btn-outline'}"
        onclick={() => onToggleCategory(category)}
      >
        {category}
      </button>
    {/each}
    {#if selectedCategory}
      <button 
        class="btn btn-sm btn-outline"
        onclick={onClearCategories}
      >
        クリア
      </button>
    {/if}
  </div>
</div>