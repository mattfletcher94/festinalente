<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { FileText, Play, RotateCcw } from 'lucide-vue-next';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

interface Task {
  id: string;
  title: string;
  status: string;
  priority?: string;
  labels?: string[];
  path: string;
}

interface Action {
  label: string;
  command: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  description: string;
}

const props = defineProps<{
  task: Task | null;
  projectPath: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  runCommand: [command: string];
}>();

const activeTab = ref<'task' | 'spec' | 'plan'>('task');
const taskContent = ref<string>('');
const specContent = ref<string>('');
const planContent = ref<string>('');
const loading = ref(false);
const availableFiles = ref({ task: false, spec: false, plan: false });

// Get the next action(s) based on task status
const actions = computed<Action[]>(() => {
  if (!props.task) return [];

  const id = props.task.id;

  switch (props.task.status) {
    case 'backlog':
      return [
        { label: 'Refine', command: `/kanban-refine ${id}`, variant: 'default', description: 'Clarify requirements through Q&A' },
      ];
    case 'refined':
      return [
        { label: 'Scope', command: `/kanban-scope ${id}`, variant: 'default', description: 'Research codebase and create spec' },
      ];
    case 'scoped':
      return [
        { label: 'Plan', command: `/kanban-plan ${id}`, variant: 'default', description: 'Create implementation plan' },
      ];
    case 'planned':
      return [
        { label: 'Implement', command: `/kanban-implement ${id}`, variant: 'default', description: 'Execute the plan' },
      ];
    case 'in-progress':
      return [
        { label: 'Continue', command: `/kanban-implement ${id}`, variant: 'default', description: 'Resume implementation' },
        { label: 'Save WIP', command: `/kanban-save ${id}`, variant: 'outline', description: 'Commit progress and pause' },
      ];
    case 'codecheck':
      return [
        { label: 'Run Checks', command: `/kanban-codecheck ${id}`, variant: 'default', description: 'Run tests and linting' },
      ];
    case 'qa':
      return [
        { label: 'Approve', command: `/kanban-approve ${id}`, variant: 'default', description: 'QA passed, commit code' },
        { label: 'Rework', command: `/kanban-rework ${id}`, variant: 'outline', description: 'Send back for fixes' },
      ];
    case 'update-docs':
      return [
        { label: 'Update Docs', command: `/kanban-docs ${id}`, variant: 'default', description: 'Update documentation' },
      ];
    case 'pr':
      return [
        { label: 'Merge', command: `/kanban-merge ${id}`, variant: 'default', description: 'Merge to main' },
        { label: 'Rework', command: `/kanban-rework ${id}`, variant: 'outline', description: 'Send back for fixes' },
      ];
    case 'done':
      return [];
    default:
      return [];
  }
});

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'in-progress':
    case 'codecheck':
    case 'qa':
      return 'default';
    case 'done':
      return 'secondary';
    default:
      return 'outline';
  }
}

function getLabelVariant(label: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (label) {
    case 'bug': return 'destructive';
    case 'feature': return 'default';
    default: return 'secondary';
  }
}

function getPriorityClasses(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'critical':
    case 'high':
      return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

async function loadAllContent() {
  if (!props.task) {
    taskContent.value = '';
    specContent.value = '';
    planContent.value = '';
    availableFiles.value = { task: false, spec: false, plan: false };
    return;
  }

  loading.value = true;
  try {
    // Check which files exist
    availableFiles.value = await window.electronAPI.getAvailableTaskFiles(props.projectPath, props.task.id);

    // Load task content
    if (availableFiles.value.task) {
      taskContent.value = await window.electronAPI.readTaskFile(props.projectPath, props.task.id);
    }

    // Load spec content if exists
    if (availableFiles.value.spec) {
      const spec = await window.electronAPI.readSpecFile(props.projectPath, props.task.id);
      specContent.value = spec || '';
    } else {
      specContent.value = '';
    }

    // Load plan content if exists
    if (availableFiles.value.plan) {
      const plan = await window.electronAPI.readPlanFile(props.projectPath, props.task.id);
      planContent.value = plan || '';
    } else {
      planContent.value = '';
    }

    // Reset to task tab if current tab isn't available
    if (activeTab.value === 'spec' && !availableFiles.value.spec) {
      activeTab.value = 'task';
    } else if (activeTab.value === 'plan' && !availableFiles.value.plan) {
      activeTab.value = 'task';
    }
  } catch (err) {
    console.error('Failed to load task content:', err);
    taskContent.value = 'Failed to load task content.';
  }
  loading.value = false;
}

watch(() => props.task, () => {
  activeTab.value = 'task';
  loadAllContent();
}, { immediate: true });

// Expose refresh method
defineExpose({
  refresh: loadAllContent,
});
</script>

<template>
  <div class="h-full flex flex-col bg-card text-card-foreground">
    <!-- Empty State -->
    <div v-if="!task" class="flex-1 flex items-center justify-center">
      <div class="text-center text-muted-foreground">
        <FileText class="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p class="text-sm">Select a task to view details</p>
      </div>
    </div>

    <!-- Task Content -->
    <template v-else>
      <!-- Header -->
      <div class="border-b border-border p-4">
        <div class="flex items-start gap-3">
          <span class="text-sm font-mono text-muted-foreground mt-0.5">{{ task.id }}</span>
          <div class="flex-1">
            <h1 class="text-lg font-medium">{{ task.title }}</h1>

            <!-- Meta row -->
            <div class="flex flex-wrap items-center gap-2 mt-2">
              <!-- Status -->
              <Badge :variant="getStatusVariant(task.status)">
                {{ task.status }}
              </Badge>

              <!-- Priority -->
              <Badge
                v-if="task.priority"
                variant="outline"
                :class="getPriorityClasses(task.priority)"
              >
                {{ task.priority }}
              </Badge>

              <!-- Labels -->
              <Badge
                v-for="label in task.labels"
                :key="label"
                :variant="getLabelVariant(label)"
              >
                {{ label }}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Bar -->
      <div v-if="actions.length > 0" class="border-b border-border px-4 py-3 bg-muted/50">
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted-foreground mr-2">Next:</span>
          <Button
            v-for="action in actions"
            :key="action.command"
            :variant="action.variant"
            size="sm"
            :disabled="disabled"
            :title="action.description"
            @click="emit('runCommand', action.command)"
          >
            <Play v-if="action.variant === 'default'" class="h-3 w-3 mr-1.5" />
            <RotateCcw v-else class="h-3 w-3 mr-1.5" />
            {{ action.label }}
          </Button>
        </div>
      </div>

      <!-- Done state -->
      <div v-else-if="task.status === 'done'" class="border-b border-border px-4 py-3 bg-muted/50">
        <span class="text-xs text-muted-foreground">Task complete</span>
      </div>

      <!-- Tabs -->
      <Tabs v-model="activeTab" class="flex-1 flex flex-col min-h-0">
        <div class="border-b border-border px-4 pt-2">
          <TabsList class="h-8">
            <TabsTrigger value="task" class="text-xs px-3 py-1">
              Task
            </TabsTrigger>
            <TabsTrigger value="spec" :disabled="!availableFiles.spec" class="text-xs px-3 py-1">
              Spec
            </TabsTrigger>
            <TabsTrigger value="plan" :disabled="!availableFiles.plan" class="text-xs px-3 py-1">
              Plan
            </TabsTrigger>
          </TabsList>
        </div>

        <!-- Content -->
        <div class="flex-1 min-h-0">
          <TabsContent value="task" class="h-full m-0">
            <ScrollArea class="h-full">
              <div class="p-4">
                <div v-if="loading" class="text-sm text-muted-foreground">Loading...</div>
                <pre v-else class="text-sm whitespace-pre-wrap font-mono leading-relaxed text-foreground/90">{{ taskContent }}</pre>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="spec" class="h-full m-0">
            <ScrollArea class="h-full">
              <div class="p-4">
                <div v-if="loading" class="text-sm text-muted-foreground">Loading...</div>
                <pre v-else class="text-sm whitespace-pre-wrap font-mono leading-relaxed text-foreground/90">{{ specContent }}</pre>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="plan" class="h-full m-0">
            <ScrollArea class="h-full">
              <div class="p-4">
                <div v-if="loading" class="text-sm text-muted-foreground">Loading...</div>
                <pre v-else class="text-sm whitespace-pre-wrap font-mono leading-relaxed text-foreground/90">{{ planContent }}</pre>
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </template>
  </div>
</template>
