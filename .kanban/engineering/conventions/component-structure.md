---
id: "conventions/component-structure"
title: "Vue Component Structure"
type: convention
summary: "Vue 3 Composition API with script setup pattern"
keywords: [vue, composition-api, script-setup, components]
related: ["systems/gui"]
paths: ["apps/gui/src/components/"]
updated: 2026-02-17
---

# Vue Component Structure

## Rules

1. **Use `<script setup lang="ts">`**: All components use Composition API with script setup
2. **Order**: `<script setup>` → `<template>` (no `<style>` block - use Tailwind)
3. **Imports first**: Vue imports, then component imports, then other imports
4. **Refs over reactive**: Prefer `ref()` for primitive values
5. **Props via defineProps**: Use TypeScript interface for prop types
6. **Emits via defineEmits**: Explicitly declare events

## Examples

### Good

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import TaskCard from './TaskCard.vue';
import { Button } from '@/components/ui/button';

interface Props {
  projectPath: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  selectTask: [task: Task];
  createTask: [];
}>();

const tasks = ref<Task[]>([]);

onMounted(async () => {
  tasks.value = await window.electronAPI.listTasks(props.projectPath);
});

function handleSelect(task: Task) {
  emit('selectTask', task);
}
</script>

<template>
  <div class="p-4">
    <TaskCard
      v-for="task in tasks"
      :key="task.id"
      :task="task"
      @click="handleSelect(task)"
    />
  </div>
</template>
```

### Bad

```vue
<!-- BAD: Using Options API -->
<script>
export default {
  data() {
    return { tasks: [] }
  }
}
</script>

<!-- BAD: Inline styles instead of Tailwind -->
<style scoped>
.container { padding: 16px; }
</style>
```

## Exceptions

- UI library components (Reka UI wrappers) may have different patterns
- Third-party component adapters may need different structures
