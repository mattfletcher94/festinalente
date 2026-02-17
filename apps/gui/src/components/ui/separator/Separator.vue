<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import { Separator as SeparatorPrimitive } from 'reka-ui';
import { cn } from '@/lib/utils';

const props = withDefaults(defineProps<{
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
  class?: HTMLAttributes['class'];
}>(), {
  orientation: 'horizontal',
  decorative: true,
});

const delegatedProps = computed(() => {
  const { class: _, ...rest } = props;
  return rest;
});
</script>

<template>
  <SeparatorPrimitive
    v-bind="delegatedProps"
    :class="cn(
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
      props.class
    )"
  />
</template>
