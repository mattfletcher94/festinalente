<script setup lang="ts">
import { onMounted } from 'vue';
import { Plus, ChevronDown, ChevronRight, FolderOpen } from 'lucide-vue-next';

import { injectApp } from '@/app';
import { injectSettings } from '@/settings';
import { injectTasks, type Task } from '@/tasks';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './ui/collapsible';
import { cn } from '@/lib/utils';

// Inject orchestrators
const app = injectApp();
const settings = injectSettings();
const tasks = injectTasks();

// Actions
function handleSelectTask(task: Task) {
  tasks.selectTask(task);
}

function handleCreateTask() {
  app.createTask();
}

function handleChangeProject() {
  app.changeProject();
}

// Load tasks on mount
onMounted(async () => {
  const projectPath = settings.projectPath.value;
  if (projectPath) {
    await tasks.loadTasks(projectPath);
  }
});
</script>

<template>
  <div class="h-full flex flex-col bg-background text-foreground">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 h-14 border-b border-border">
      <h2 class="text-sm font-semibold">Tasks</h2>
      <div class="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7"
          title="Change project"
          @click="handleChangeProject"
        >
          <FolderOpen class="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7"
          title="Create task"
          @click="handleCreateTask"
        >
          <Plus class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- Task List -->
    <ScrollArea class="flex-1">
      <div v-if="tasks.loading.value" class="p-4 text-sm text-muted-foreground">
        Loading tasks...
      </div>

      <div
        v-else-if="tasks.visibleColumns.value.length === 0"
        class="p-4 text-sm text-muted-foreground"
      >
        No tasks yet. Click + to create one.
      </div>

      <template v-else>
        <Collapsible
          v-for="column in tasks.visibleColumns.value"
          :key="column.id"
          v-model:open="column.open"
          class="border-b border-border last:border-b-0"
        >
          <!-- Column Header -->
          <CollapsibleTrigger as-child>
            <button
              class="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/50 hover:bg-muted transition-colors"
            >
              <component
                :is="column.open ? ChevronDown : ChevronRight"
                class="h-3 w-3"
              />
              <span>{{ column.name }}</span>
              <span class="ml-auto opacity-60">
                {{ tasks.tasksByColumn.value[column.id].length }}
              </span>
            </button>
          </CollapsibleTrigger>

          <!-- Tasks in Column -->
          <CollapsibleContent>
            <div>
              <button
                v-for="task in tasks.tasksByColumn.value[column.id]"
                :key="task.id"
                :class="cn(
                  'w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors',
                  tasks.selectedTaskId.value === task.id && 'bg-accent text-accent-foreground'
                )"
                @click="handleSelectTask(task)"
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
                        :variant="tasks.actionsComputer.getLabelVariant(label)"
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
