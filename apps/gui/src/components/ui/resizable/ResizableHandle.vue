<script setup lang="ts">
import { SplitterResizeHandle, type SplitterResizeHandleProps } from 'reka-ui';
import { cn } from '@/lib/utils';

interface Props extends SplitterResizeHandleProps {
  class?: string;
  withHandle?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  withHandle: false,
});
</script>

<template>
  <SplitterResizeHandle
    v-bind="props"
    :class="cn(
      'relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full data-[orientation=vertical]:after:left-0 data-[orientation=vertical]:after:h-1 data-[orientation=vertical]:after:w-full data-[orientation=vertical]:after:-translate-y-1/2 data-[orientation=vertical]:after:translate-x-0 [&[data-orientation=vertical]>div]:rotate-90',
      props.class
    )"
  >
    <template v-if="withHandle">
      <div class="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </div>
    </template>
    <slot v-else />
  </SplitterResizeHandle>
</template>
