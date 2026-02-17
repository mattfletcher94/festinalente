<script setup lang="ts">
import { ref } from 'vue';
import ProjectPicker from './components/ProjectPicker.vue';
import TerminalPanel from './components/TerminalPanel.vue';
import Sidebar from './components/Sidebar.vue';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

const projectPath = ref<string | null>(null);
const terminalRef = ref<InstanceType<typeof TerminalPanel> | null>(null);
const isTerminalReady = ref(false);

function handleCreate() {
  if (!terminalRef.value || !isTerminalReady.value) return;

  // Run the /kanban-create command (one-shot mode, exits when done)
  terminalRef.value.runCommand('/kanban-create');
}

function handleTerminalReady() {
  isTerminalReady.value = true;
}

function handleTerminalExit() {
  isTerminalReady.value = false;
}
</script>

<template>
  <div class="h-screen w-screen dark">
    <template v-if="projectPath">
      <ResizablePanelGroup direction="horizontal" class="h-full">
        <ResizablePanel :default-size="20" :min-size="15" :max-size="30">
          <Sidebar
            :disabled="!isTerminalReady"
            @create="handleCreate"
          />
        </ResizablePanel>

        <ResizableHandle with-handle />

        <ResizablePanel :default-size="80">
          <TerminalPanel
            ref="terminalRef"
            :project-path="projectPath"
            @ready="handleTerminalReady"
            @exit="handleTerminalExit"
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </template>

    <ProjectPicker v-else @selected="projectPath = $event" />
  </div>
</template>
