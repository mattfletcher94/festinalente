<script setup lang="ts">
import { ref, onMounted } from 'vue';
import ProjectPicker from './components/ProjectPicker.vue';
import TerminalPanel from './components/TerminalPanel.vue';
import TaskList from './components/TaskList.vue';
import TaskDetail from './components/TaskDetail.vue';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

const projectPath = ref<string | null>(null);
const terminalRef = ref<InstanceType<typeof TerminalPanel> | null>(null);
const taskListRef = ref<InstanceType<typeof TaskList> | null>(null);
const taskDetailRef = ref<InstanceType<typeof TaskDetail> | null>(null);
const isTerminalReady = ref(true); // Start as ready since we don't spawn on mount
const selectedTask = ref<Task | null>(null);
const panelSizes = ref({ taskList: 20, taskDetail: 40, terminal: 40 });
const settingsLoaded = ref(false);

// Load settings on mount
onMounted(async () => {
  const settings = await window.electronAPI.getAllSettings();
  if (settings.projectPath) {
    projectPath.value = settings.projectPath;
  }
  if (settings.panelSizes) {
    panelSizes.value = settings.panelSizes;
  }
  settingsLoaded.value = true;
});

function handleSelectTask(task: Task) {
  selectedTask.value = task;
}

function handleCreateTask() {
  runCommand('/kanban-create');
}

async function handleProjectSelected(path: string) {
  projectPath.value = path;
  await window.electronAPI.setSetting('projectPath', path);
}

async function handlePanelResize(sizes: number[]) {
  const newSizes = {
    taskList: sizes[0],
    taskDetail: sizes[1],
    terminal: sizes[2],
  };
  panelSizes.value = newSizes;
  await window.electronAPI.setSetting('panelSizes', newSizes);
}

function runCommand(command: string) {
  if (!terminalRef.value || !isTerminalReady.value) return;
  isTerminalReady.value = false; // Mark as busy
  terminalRef.value.runCommand(command);
}

async function handleTerminalReady() {
  isTerminalReady.value = true;
  // Refresh task list when a command completes
  await taskListRef.value?.refresh();

  // Update selected task with fresh data (status may have changed)
  if (selectedTask.value && projectPath.value) {
    const tasks = await window.electronAPI.listTasks(projectPath.value);
    const updated = tasks.find(t => t.id === selectedTask.value?.id);
    if (updated) {
      selectedTask.value = updated;
    }
  }

  // Refresh task detail content
  taskDetailRef.value?.refresh();
}

function handleTerminalExit() {
  // Terminal is now ready for a new command
  isTerminalReady.value = true;
}
</script>

<template>
  <div class="h-screen w-screen bg-background">
    <!-- Wait for settings to load -->
    <template v-if="settingsLoaded">
      <template v-if="projectPath">
        <ResizablePanelGroup
          direction="horizontal"
          class="h-full"
          @layout="handlePanelResize"
        >
          <!-- Left: Task List -->
          <ResizablePanel :default-size="panelSizes.taskList" :min-size="15" :max-size="30">
            <TaskList
              ref="taskListRef"
              :project-path="projectPath"
              @select-task="handleSelectTask"
              @create-task="handleCreateTask"
            />
          </ResizablePanel>

          <ResizableHandle with-handle />

          <!-- Middle: Task Detail -->
          <ResizablePanel :default-size="panelSizes.taskDetail" :min-size="25">
            <TaskDetail
              ref="taskDetailRef"
              :task="selectedTask"
              :project-path="projectPath"
              :disabled="!isTerminalReady"
              @run-command="runCommand"
            />
          </ResizablePanel>

          <ResizableHandle with-handle />

          <!-- Right: Terminal -->
          <ResizablePanel :default-size="panelSizes.terminal" :min-size="25">
            <TerminalPanel
              ref="terminalRef"
              :project-path="projectPath"
              @ready="handleTerminalReady"
              @exit="handleTerminalExit"
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </template>

      <ProjectPicker v-else @selected="handleProjectSelected" />
    </template>
  </div>
</template>
