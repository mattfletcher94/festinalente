<script setup lang="ts">
import { SplitterPanel, type SplitterPanelProps } from 'reka-ui';

interface Props extends SplitterPanelProps {
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <SplitterPanel v-bind="props" :class="props.class">
    <slot />
  </SplitterPanel>
</template>
