<script setup lang="ts">
import { Plus } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';

const emit = defineEmits<{
  create: [];
}>();

const props = defineProps<{
  disabled?: boolean;
}>();
</script>

<template>
  <div class="flex flex-col h-full bg-background p-4">
    <h2 class="text-lg font-semibold mb-4">Actions</h2>

    <div class="space-y-2">
      <Button
        @click="emit('create')"
        :disabled="disabled"
        class="w-full justify-start"
        variant="outline"
      >
        <Plus class="w-4 h-4 mr-2" />
        Create Task
      </Button>
    </div>

    <div class="mt-auto pt-4 border-t text-xs text-muted-foreground">
      <p>Claude Kanban v1.0</p>
    </div>
  </div>
</template>
