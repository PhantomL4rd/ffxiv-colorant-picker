<script lang="ts">
import '../app.css';
import { SwatchBook } from 'lucide-svelte';
import TabNavigation from '$lib/components/TabNavigation.svelte';

const { children } = $props();

const siteName = 'FF14 カララントピッカー';
const siteDescription = 'FF14のカララント（染料）から3色の組み合わせを提案するツールです。';
</script>

<svelte:head>
  <title>{siteName}/title>
  <meta name="description" content={siteDescription} />
</svelte:head>

<div class="min-h-screen bg-base-100">
  <!-- ヘッダー -->
  <div class="navbar bg-primary text-primary-content mb-8">
    <div class="container mx-auto">
      <div class="flex-1">
        <h1 class="text-xl font-bold flex items-center gap-2">
          <SwatchBook class="w-6 h-6" />
          {siteName}
        </h1>
      </div>
    </div>
  </div>

  <div class="container mx-auto px-4 pb-8">
    <main>
      {@render children?.()}
    </main>
  </div>
  
  <!-- フッター固定タブナビゲーション -->
  <TabNavigation />
</div>