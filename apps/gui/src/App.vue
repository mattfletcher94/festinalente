<script setup lang="ts">
import { onMounted } from 'vue';

import { createAppOrchestrator, provideApp } from '@/app';
import { createHookConfigCapability, provideHookConfig } from '@/hook-config';
import {
  createSettingsCapability,
  createSettingsOrchestrator,
  provideSettings,
} from '@/settings';
import {
  createTaskActionsComputer,
  createTaskGroupingComputer,
  createTasksApiCapability,
  createTasksOrchestrator,
  provideTasks,
} from '@/tasks';
import {
  createPtyCapability,
  createTerminalCommandComputer,
  createTerminalOrchestrator,
  provideTerminal,
} from '@/terminal';
import ProjectPicker from './components/ProjectPicker.vue';
import TerminalPanel from './components/TerminalPanel.vue';
import TaskList from './components/TaskList.vue';
import TaskDetail from './components/TaskDetail.vue';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

const taskActionsComputer = createTaskActionsComputer();
const taskGroupingComputer = createTaskGroupingComputer();
const terminalCommandComputer = createTerminalCommandComputer();

const settingsCapability = createSettingsCapability();
const tasksApiCapability = createTasksApiCapability();
const ptyCapability = createPtyCapability();
const hookConfigCapability = createHookConfigCapability();

const settings = createSettingsOrchestrator({
  settings: settingsCapability,
});

const tasks = createTasksOrchestrator({
  tasksApi: tasksApiCapability,
  actionsComputer: taskActionsComputer,
  groupingComputer: taskGroupingComputer,
});

const terminal = createTerminalOrchestrator({
  pty: ptyCapability,
  commandComputer: terminalCommandComputer,
});

const app = createAppOrchestrator({
  settings,
  tasks,
  terminal,
});

provideApp(app);
provideSettings(settings);
provideTasks(tasks);
provideTerminal(terminal);
provideHookConfig(hookConfigCapability);

onMounted(async () => {
  await app.initialize();
});

async function handleProjectSelected(path: string) {
  await settings.setProjectPath(path);
  await tasks.loadTasks(path);
}

async function handlePanelResize(sizes: number[]) {
  await settings.setPanelSizes({
    taskList: sizes[0],
    taskDetail: sizes[1],
    terminal: sizes[2],
  });
}
</script>

<template>
  <div class="h-screen w-screen bg-background">
    <template v-if="app.isReady.value">
      <template v-if="app.hasProject.value">
        <ResizablePanelGroup
          direction="horizontal"
          class="h-full"
          @layout="handlePanelResize"
        >
          <ResizablePanel
            :default-size="settings.panelSizes.value.taskList"
            :min-size="15"
            :max-size="30"
          >
            <TaskList />
          </ResizablePanel>

          <ResizableHandle with-handle />

          <ResizablePanel
            :default-size="settings.panelSizes.value.taskDetail"
            :min-size="25"
          >
            <TaskDetail />
          </ResizablePanel>

          <ResizableHandle with-handle />

          <ResizablePanel
            :default-size="settings.panelSizes.value.terminal"
            :min-size="25"
          >
            <TerminalPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </template>

      <ProjectPicker v-else @selected="handleProjectSelected" />
    </template>
  </div>
</template>
