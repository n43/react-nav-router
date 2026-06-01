<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { createRoot, type Root } from 'react-dom/client';
import { createElement } from 'react';

const props = defineProps<{ src: string }>();

const containerRef = ref<HTMLDivElement | null>(null);
let root: Root | null = null;

const demoModules = import.meta.glob('/demos/*/index.tsx');

async function mount() {
  if (!containerRef.value) return;
  const key = `/demos/${props.src}/index.tsx`;
  const loader = demoModules[key];
  if (!loader) {
    containerRef.value.textContent = `Demo not found: ${props.src}`;
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await loader();
  const Component = mod.default;
  root?.unmount();
  root = createRoot(containerRef.value);
  root.render(createElement(Component));
}

onMounted(mount);
watch(() => props.src, mount);
onBeforeUnmount(() => {
  root?.unmount();
  root = null;
});
</script>

<template>
  <div class="react-demo" ref="containerRef" />
</template>

<style scoped>
.react-demo {
  position: relative;
  width: 100%;
  height: 480px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}
</style>
