<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { FileText, Play, RotateCcw } from 'lucide-vue-next';

import { injectApp } from '@/app';
import { injectHookConfig, type HookConfig } from '@/hook-config';
import { injectSettings } from '@/settings';
import { injectTasks } from '@/tasks';
import { injectTerminal } from '@/terminal';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

// Inject dependencies
const app = injectApp();
const hookConfig = injectHookConfig();
const settings = injectSettings();
const tasks = injectTasks();
const terminal = injectTerminal();

// Local state for active tab
const activeTab = ref<'task' | 'spec' | 'plan'>('task');

// Hook configs keyed by command string
const hookConfigs = ref<Record<string, HookConfig>>({});

// Get actions for the selected task
const actions = computed(() => {
  const task = tasks.selectedTask.value;
  if (!task) return [];
  return tasks.actionsComputer.getActions(task);
});

// Load hook configs when actions change
watch(
  actions,
  async (newActions) => {
    const projectPath = settings.projectPath.value;
    if (!projectPath || newActions.length === 0) {
      hookConfigs.value = {};
      return;
    }

    const configs: Record<string, HookConfig> = {};
    for (const action of newActions) {
      const hookName = tasks.actionsComputer.getHookName(action.command);
      if (hookName) {
        configs[action.command] = await hookConfig.getConfig(projectPath, hookName);
      }
    }
    hookConfigs.value = configs;
  },
  { immediate: true }
);

// Reset tab when task changes
watch(
  () => tasks.selectedTask.value,
  () => {
    activeTab.value = 'task';
  }
);

// Reset tab if current tab becomes unavailable
watch(
  () => tasks.availableFiles.value,
  (files) => {
    if (activeTab.value === 'spec' && !files.spec) {
      activeTab.value = 'task';
    } else if (activeTab.value === 'plan' && !files.plan) {
      activeTab.value = 'task';
    }
  }
);
</script>

<template>
  <div class="h-full flex flex-col bg-card text-card-foreground">
    <!-- Empty State -->
    <div v-if="!tasks.selectedTask.value" class="flex-1 flex items-center justify-center">
      <div class="text-center text-muted-foreground">
        <FileText class="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p class="text-sm">Select a task to view details</p>
      </div>
    </div>

    <!-- Task Content -->
    <template v-else>
      <!-- Header -->
      <div class="px-4 py-4 border-b border-border">
        <!-- Title Row -->
        <div class="flex items-start justify-between gap-3 mb-3">
          <h2 class="text-base font-semibold leading-tight">
            {{ tasks.selectedTask.value.title }}
            <span class="font-mono text-muted-foreground text-sm font-normal ml-1.5">
              {{ tasks.selectedTask.value.id }}
            </span>
          </h2>
        </div>

        <!-- Meta Row -->
        <div class="flex items-center gap-1.5 flex-wrap">
          <Badge
            :variant="tasks.actionsComputer.getStatusVariant(tasks.selectedTask.value.status)"
            class="text-xs"
          >
            {{ tasks.selectedTask.value.status }}
          </Badge>
          <Badge
            v-if="tasks.selectedTask.value.priority"
            variant="outline"
            :class="tasks.actionsComputer.getPriorityClasses(tasks.selectedTask.value.priority)"
            class="text-xs"
          >
            {{ tasks.selectedTask.value.priority }}
          </Badge>
          <Badge
            v-for="label in tasks.selectedTask.value.labels"
            :key="label"
            :variant="tasks.actionsComputer.getLabelVariant(label)"
            class="text-xs"
          >
            {{ label }}
          </Badge>
          <Badge
            v-if="tasks.selectedTask.value.status === 'done'"
            variant="secondary"
            class="text-xs"
          >
            Complete
          </Badge>
        </div>
      </div>

      <!-- Next Up Section -->
      <div v-if="actions.length > 0" class="px-4 py-3 border-b border-border bg-muted/30">
        <div class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Next Up
        </div>
        <div class="space-y-2">
          <div
            v-for="action in actions"
            :key="action.command"
            class="flex items-center justify-between gap-4"
          >
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium">{{ action.label }}</div>
              <div class="text-xs text-muted-foreground">{{ action.description }}</div>
              <div
                v-if="hookConfigs[action.command]?.directives?.length"
                class="text-xs text-muted-foreground mt-0.5"
              >
                <span class="text-muted-foreground/70">Directives:</span>
                {{ hookConfigs[action.command].directives.join(', ') }}
              </div>
            </div>
            <Button
              :variant="action.variant"
              size="sm"
              :disabled="!terminal.isReady.value"
              class="h-7 text-xs flex-shrink-0"
              @click="app.runCommand(action.command)"
            >
              <Play v-if="action.variant === 'default'" class="h-3 w-3 mr-1" />
              <RotateCcw v-else class="h-3 w-3 mr-1" />
              Run
            </Button>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <Tabs v-model="activeTab" class="flex-1 flex flex-col min-h-0">
        <div class="flex items-center h-10 px-4 border-b border-border">
          <TabsList class="h-8">
            <TabsTrigger value="task" class="text-xs px-3">Task</TabsTrigger>
            <TabsTrigger
              value="spec"
              :disabled="!tasks.availableFiles.value.spec"
              class="text-xs px-3"
            >
              Spec
            </TabsTrigger>
            <TabsTrigger
              value="plan"
              :disabled="!tasks.availableFiles.value.plan"
              class="text-xs px-3"
            >
              Plan
            </TabsTrigger>
          </TabsList>
        </div>

        <!-- Content -->
        <div class="flex-1 min-h-0">
          <TabsContent value="task" class="h-full m-0">
            <ScrollArea class="h-full">
              <div class="p-4">
                <div v-if="tasks.contentLoading.value" class="text-sm text-muted-foreground">
                  Loading...
                </div>
                <pre
                  v-else
                  class="text-sm whitespace-pre-wrap font-mono leading-relaxed text-foreground/80"
                >{{ tasks.taskContent.value }}</pre>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="spec" class="h-full m-0">
            <ScrollArea class="h-full">
              <div class="p-4">
                <div v-if="tasks.contentLoading.value" class="text-sm text-muted-foreground">
                  Loading...
                </div>
                <pre
                  v-else
                  class="text-sm whitespace-pre-wrap font-mono leading-relaxed text-foreground/80"
                >{{ tasks.specContent.value }}</pre>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="plan" class="h-full m-0">
            <ScrollArea class="h-full">
              <div class="p-4">
                <div v-if="tasks.contentLoading.value" class="text-sm text-muted-foreground">
                  Loading...
                </div>
                <pre
                  v-else
                  class="text-sm whitespace-pre-wrap font-mono leading-relaxed text-foreground/80"
                >{{ tasks.planContent.value }}</pre>
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </template>
  </div>
</template>
