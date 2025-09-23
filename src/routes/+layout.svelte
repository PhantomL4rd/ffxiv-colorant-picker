<script lang="ts">
import '../app.css';

const { children } = $props();

const siteName = 'FF14 カララントピッカー';
const siteDescription = 'FF14のカララント（染料）から3色の組み合わせを提案するツールです。';
const siteUrl = 'https://phantoml4rd.github.io/ffxiv-colorant-picker'; // 本番URLに変更してください
</script>

<svelte:head>
  <meta name="description" content={siteDescription} />
</svelte:head>

{@render children?.()}
