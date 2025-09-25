<script lang="ts">
import type { HarmonyPattern } from '$lib/types';
import { PATTERN_OPTIONS } from '$lib/constants/patterns';

interface Props {
  selectedPattern: HarmonyPattern;
  onPatternChange: (pattern: HarmonyPattern) => void;
  excludeMetallic: boolean;
  onExcludeMetallicChange: () => void;
}

const { selectedPattern, onPatternChange, excludeMetallic, onExcludeMetallicChange }: Props =
  $props();

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
    {#each PATTERN_OPTIONS as pattern}
      <option value={pattern.value}>
        {pattern.label}
      </option>
    {/each}
  </select>
  
  <!-- 選択中のパターンの説明 -->
  {#each PATTERN_OPTIONS as pattern}
    {#if pattern.value === selectedPattern}
      <div class="label">
        <span class="label-text-alt text-base-content/70">
          {pattern.description}
        </span>
      </div>
    {/if}
  {/each}
  
  <!-- メタリック除外チェックボックス -->
  <div class="form-control mt-4">
    <label class="cursor-pointer label justify-start gap-3">
      <input 
        type="checkbox" 
        class="checkbox checkbox-sm" 
        checked={excludeMetallic}
        onchange={onExcludeMetallicChange}
      />
      <span class="label-text">メタリック系を除外</span>
    </label>
  </div>
</div>