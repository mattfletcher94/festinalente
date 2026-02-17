<script setup lang="ts">
import { SplitterGroup, type SplitterGroupProps } from 'reka-ui';
import { cn } from '@/lib/utils';

interface Props extends SplitterGroupProps {
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <SplitterGroup
    v-bind="props"
    :class="cn('flex h-full w-full data-[orientation=vertical]:flex-col', props.class)"
  >
    <slot />
  </SplitterGroup>
</template>
