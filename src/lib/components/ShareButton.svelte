<script lang="ts">
import { Share } from '@lucide/svelte';
import type { Favorite } from '$lib/types';

interface Props {
  favorite: Favorite;
  onShare: (favorite: Favorite) => void;
}

const { favorite, onShare }: Props = $props();

function handleShare() {
  onShare(favorite);
}
</script>

<button
  type="button"
  class="btn btn-outline btn-sm"
  onclick={handleShare}
  title="パレットをシェア"
>
  <Share class="w-4 h-4" />
</button>