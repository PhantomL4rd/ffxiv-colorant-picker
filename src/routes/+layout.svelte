<script lang="ts">
import '../app.css';

const { children } = $props();

const siteName = 'FF14 カララントピッカー';
const siteDescription = 'FF14のカララント（染料）から3色の組み合わせを提案するツールです。';
const siteUrl = 'https://phantoml4rd.github.io/ffxiv-colorant-picker/'; // 本番URLに変更してください
const ogImage = `${siteUrl}/ogp-img.png`;
</script>

<svelte:head>
  <!-- 基本メタタグ -->
  <meta name="description" content={siteDescription} />
  
  <!-- OGP (Open Graph Protocol) -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content={siteName} />
  <meta property="og:title" content={siteName} />
  <meta property="og:description" content={siteDescription} />
  <meta property="og:url" content={siteUrl} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:locale" content="ja_JP" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={siteName} />
  <meta name="twitter:description" content={siteDescription} />
  <meta name="twitter:image" content={ogImage} />
</svelte:head>

{@render children?.()}
