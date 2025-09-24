<script lang="ts">
  import { customColorsStore } from '$lib/stores/customColors';
  import { createCustomDye } from '$lib/utils/customColorUtils';
  import { selectPrimaryDye } from '$lib/stores/selection';
  import CustomColorForm from './CustomColorForm.svelte';
  import CustomColorItem from './CustomColorItem.svelte';
  import { Plus, Palette } from '@lucide/svelte';

  let showForm = $state(false);
  let editingColor = $state<string | null>(null);

  const customColors = $derived($customColorsStore);

  function handleAddNew() {
    editingColor = null;
    showForm = true;
  }

  function handleEdit(colorId: string) {
    editingColor = colorId;
    showForm = true;
  }

  function handleFormClose() {
    showForm = false;
    editingColor = null;
  }

  function handleColorSelect(color: any) {
    const customDye = createCustomDye(color);
    selectPrimaryDye(customDye);
  }
</script>

<div class="space-y-4">
  {#if showForm}
    <CustomColorForm 
      editColorId={editingColor} 
      onClose={handleFormClose}
    />
  {:else}
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-medium flex items-center gap-2">
        <Palette size={20} />
        あなたの色
      </h3>
      <button
        type="button"
        onclick={handleAddNew}
        class="btn btn-sm btn-primary gap-2"
      >
        <Plus size={16} />
        新しい色を追加
      </button>
    </div>

    {#if customColors.length === 0}
      <div class="text-center py-8 text-gray-500">
        <p class="mb-2">まだカスタムカラーが登録されていません</p>
        <p class="text-sm">「新しい色を追加」ボタンからあなたの髪色や肌色、目の色を登録してみましょう</p>
      </div>
    {:else}
      <div class="grid gap-3">
        {#each customColors as color (color.id)}
          <CustomColorItem 
            {color}
            onSelect={() => handleColorSelect(color)}
            onEdit={() => handleEdit(color.id)}
          />
        {/each}
      </div>
    {/if}
  {/if}
</div>