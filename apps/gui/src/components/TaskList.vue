<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Plus, ChevronDown, ChevronRight } from 'lucide-vue-next';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './ui/collapsible';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  status: string;
  priority?: string;
  labels?: string[];
  path: string;
}

interface Column {
  id: string;
  name: string;
  open: boolean;
}

const props = defineProps<{
  projectPath: string;
}>();

const emit = defineEmits<{
  selectTask: [task: Task];
  createTask: [];
}>();

const tasks = ref<Task[]>([]);
const selectedTaskId = ref<string | null>(null);
const loading = ref(true);

// Column order matching kanban workflow
const columns = ref<Column[]>([
  { id: 'in-progress', name: 'In Progress', open: true },
  { id: 'codecheck', name: 'Code Check', open: true },
  { id: 'qa', name: 'QA', open: true },
  { id: 'update-docs', name: 'Update Docs', open: true },
  { id: 'pr', name: 'PR', open: true },
  { id: 'planned', name: 'Planned', open: true },
  { id: 'scoped', name: 'Scoped', open: true },
  { id: 'refined', name: 'Refined', open: true },
  { id: 'backlog', name: 'Backlog', open: true },
  { id: 'done', name: 'Done', open: false },
]);

// Group tasks by status
const tasksByColumn = computed(() => {
  const grouped: Record<string, Task[]> = {};
  for (const col of columns.value) {
    grouped[col.id] = tasks.value.filter(t => t.status === col.id);
  }
  return grouped;
});

// Only show columns that have tasks
const visibleColumns = computed(() => {
  return columns.value.filter(col => tasksByColumn.value[col.id]?.length > 0);
});

function selectTask(task: Task) {
  selectedTaskId.value = task.id;
  emit('selectTask', task);
}

function getLabelVariant(label: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (label) {
    case 'bug': return 'destructive';
    case 'feature': return 'default';
    default: return 'secondary';
  }
}

async function loadTasks() {
  loading.value = true;
  try {
    const result = await window.electronAPI.listTasks(props.projectPath);
    tasks.value = result;
  } catch (err) {
    console.error('Failed to load tasks:', err);
  }
  loading.value = false;
}

// Expose refresh method
defineExpose({
  refresh: loadTasks,
});

onMounted(() => {
  loadTasks();
});
</script>

<template>
  <div class="h-full flex flex-col bg-background text-foreground">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-border">
      <h2 class="text-sm font-semibold">Tasks</h2>
      <Button variant="ghost" size="icon" class="h-7 w-7" @click="emit('createTask')">
        <Plus class="h-4 w-4" />
      </Button>
    </div>

    <!-- Task List -->
    <ScrollArea class="flex-1">
      <div v-if="loading" class="p-4 text-sm text-muted-foreground">
        Loading tasks...
      </div>

      <div v-else-if="visibleColumns.length === 0" class="p-4 text-sm text-muted-foreground">
        No tasks yet. Click + to create one.
      </div>

      <template v-else>
        <Collapsible
          v-for="column in visibleColumns"
          :key="column.id"
          v-model:open="column.open"
          class="border-b border-border last:border-b-0"
        >
          <!-- Column Header -->
          <CollapsibleTrigger as-child>
            <button
              class="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <component
                :is="column.open ? ChevronDown : ChevronRight"
                class="h-3 w-3"
              />
              <span>{{ column.name }}</span>
              <span class="ml-auto opacity-60">{{ tasksByColumn[column.id].length }}</span>
            </button>
          </CollapsibleTrigger>

          <!-- Tasks in Column -->
          <CollapsibleContent>
            <div class="pb-1">
              <button
                v-for="task in tasksByColumn[column.id]"
                :key="task.id"
                :class="cn(
                  'w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors',
                  selectedTaskId === task.id && 'bg-accent text-accent-foreground'
                )"
                @click="selectTask(task)"
              >
                <div class="flex items-start gap-2">
                  <!-- Task ID -->
                  <span class="text-xs font-mono shrink-0 opacity-60">{{ task.id }}</span>

                  <div class="flex-1 min-w-0">
                    <!-- Title -->
                    <div class="text-sm truncate">{{ task.title }}</div>

                    <!-- Labels -->
                    <div v-if="task.labels?.length" class="flex items-center gap-1 mt-1">
                      <Badge
                        v-for="label in task.labels.slice(0, 2)"
                        :key="label"
                        :variant="getLabelVariant(label)"
                        class="text-[10px] px-1.5 py-0"
                      >
                        {{ label }}
                      </Badge>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </template>
    </ScrollArea>
  </div>
</template>
