<script lang="ts">
import type { HarmonyPattern } from '$lib/types';

interface Props {
  selectedPattern: HarmonyPattern;
  onPatternChange: (pattern: HarmonyPattern) => void;
}

const { selectedPattern, onPatternChange }: Props = $props();

const patterns: { value: HarmonyPattern; label: string; description: string }[] = [
  {
    value: 'triadic',
    label: 'バランス',
    description: 'バランスよく調和した鮮やかな3色',
  },
  {
    value: 'split-complementary',
    label: 'アクセント',
    description: 'メインカラーに映える個性的な3色',
  },
  {
    value: 'analogous',
    label: 'グラデーション',
    description: '自然につながる優しい3色',
  },
  {
    value: 'monochromatic',
    label: '同系色',
    description: '統一感のある落ち着いた3色',
  },
  {
    value: 'similar',
    label: 'ナチュラル',
    description: '馴染みやすい近い色味の3色',
  },
  {
    value: 'contrast',
    label: 'コントラスト',
    description: 'はっきりとした対比のある3色',
  },
];

function handlePatternChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  onPatternChange(target.value as HarmonyPattern);
}
</script>

<div class="form-control w-full">
  <label class="label" for="pattern-selector">
    <span class="label-text font-medium">配色パターン</span>
  </label>
  
  <select 
    id="pattern-selector"
    class="select select-bordered w-full"
    value={selectedPattern}
    onchange={handlePatternChange}
  >
    {#each patterns as pattern}
      <option value={pattern.value}>
        {pattern.label}
      </option>
    {/each}
  </select>
  
  <!-- 選択中のパターンの説明 -->
  {#each patterns as pattern}
    {#if pattern.value === selectedPattern}
      <div class="label">
        <span class="label-text-alt text-base-content/70">
          {pattern.description}
        </span>
      </div>
    {/if}
  {/each}
</div>