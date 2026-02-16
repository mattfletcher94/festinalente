<script setup lang="ts">
import { ref } from 'vue';
import { FolderOpen } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';

const emit = defineEmits<{ selected: [path: string] }>();
const error = ref<string | null>(null);
const loading = ref(false);

async function openProject() {
  loading.value = true;
  error.value = null;

  const result = await window.electronAPI.openProject();

  loading.value = false;

  if (result.canceled) return;
  if (result.error) {
    error.value = result.error;
    return;
  }

  emit('selected', result.projectPath!);
}
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full gap-4 bg-background text-foreground">
    <h1 class="text-2xl font-semibold">Claude Kanban</h1>
    <p class="text-muted-foreground">Select a project folder containing a .kanban directory</p>
    <Button @click="openProject" :disabled="loading" size="lg">
      <FolderOpen class="w-4 h-4 mr-2" />
      {{ loading ? 'Opening...' : 'Open Project' }}
    </Button>
    <p v-if="error" class="text-destructive text-sm">{{ error }}</p>
  </div>
</template>
