<script setup lang="ts">
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { onMounted, onUnmounted, ref } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import '@xterm/xterm/css/xterm.css';

const props = defineProps<{ projectPath: string }>();
const emit = defineEmits<{
  exit: [code: number];
  ready: [];
}>();

const terminalRef = ref<HTMLDivElement>();
const isRunning = ref(false);
const currentTaskId = ref<string | null>(null);

let terminal: Terminal;
let fitAddon: FitAddon;

// Extract task ID from command (e.g., "/kanban-plan 001" -> "001")
function extractTaskId(command: string): string | null {
  const match = command.match(/\/kanban-\w+\s+(\S+)/);
  return match ? match[1] : null;
}

// Run a command - spawns Claude, runs command, exits when complete
async function runCommand(command: string) {
  terminal.clear();
  terminal.write(`\x1b[90m> Running: ${command}\x1b[0m\r\n`);

  currentTaskId.value = extractTaskId(command);
  isRunning.value = true;
  await window.electronAPI.ptyRunCommand(props.projectPath, command.trim());
  window.electronAPI.ptyResize(terminal.cols, terminal.rows);
}

// Expose methods to parent
defineExpose({
  runCommand,
  isRunning,
});

// Handle container resize
useResizeObserver(terminalRef, () => {
  if (terminal && fitAddon) {
    fitAddon.fit();
    if (isRunning.value) {
      window.electronAPI.ptyResize(terminal.cols, terminal.rows);
    }
  }
});

onMounted(() => {
  terminal = new Terminal({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    theme: {
      background: '#09090b',
      foreground: '#fafafa',
      cursor: '#fafafa',
      selectionBackground: '#3f3f46',
      // Scrollbar colors to match shadcn ScrollArea
      scrollbarSliderBackground: 'rgba(255, 255, 255, 0.1)',
      scrollbarSliderHoverBackground: 'rgba(255, 255, 255, 0.2)',
      scrollbarSliderActiveBackground: 'rgba(255, 255, 255, 0.3)',
    },
  });

  fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);
  terminal.open(terminalRef.value!);
  fitAddon.fit();

  // Show initial message
  terminal.write('\x1b[90mReady. Click a button to run a command.\x1b[0m\r\n');

  // Receive data from PTY
  window.electronAPI.onPtyData((data: string) => {
    terminal.write(data);
  });

  // Handle Claude exit
  window.electronAPI.onPtyExit((code: number) => {
    isRunning.value = false;
    emit('exit', code);

    // Clear terminal and show placeholder after task completes
    setTimeout(() => {
      terminal.clear();
      terminal.write('\x1b[90mTask complete. Click a button to run another command.\x1b[0m\r\n');
    }, 1500); // Give user time to see the final output

    emit('ready');
  });

  // Forward keystrokes to PTY when running
  terminal.onData((data: string) => {
    if (isRunning.value) {
      window.electronAPI.ptyWrite(data);
    }
  });

  // Emit ready immediately since we don't need to wait for Claude
  emit('ready');
});

onUnmounted(() => {
  terminal?.dispose();
  window.electronAPI.ptyKill();
});
</script>

<template>
  <div class="h-full flex flex-col bg-background text-foreground">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 h-14 border-b border-border">
      <h2 class="text-sm font-semibold">
        Terminal
        <span v-if="currentTaskId" class="font-mono text-muted-foreground font-normal ml-1.5">{{ currentTaskId }}</span>
      </h2>
      <span v-if="isRunning" class="text-xs text-muted-foreground animate-pulse">Running...</span>
    </div>
    <!-- Terminal -->
    <div ref="terminalRef" class="flex-1 p-2 bg-[#09090b]"></div>
  </div>
</template>
