<script setup lang="ts">
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { onMounted, onUnmounted, ref } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import '@xterm/xterm/css/xterm.css';

import { injectApp } from '@/app';
import { injectTasks } from '@/tasks';
import { injectSettings } from '@/settings';
import { injectTerminal, type TerminalWriter } from '@/terminal';

// Inject orchestrators
const app = injectApp();
const settings = injectSettings();
const tasks = injectTasks();
const terminal = injectTerminal();

// Local refs
const terminalRef = ref<HTMLDivElement>();
let xtermInstance: Terminal;
let fitAddon: FitAddon;
let clearTimeoutId: ReturnType<typeof setTimeout> | null = null;

// Handle container resize
useResizeObserver(terminalRef, () => {
  if (xtermInstance && fitAddon) {
    fitAddon.fit();
    terminal.resize(xtermInstance.cols, xtermInstance.rows);
  }
});

onMounted(() => {
  xtermInstance = new Terminal({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    theme: {
      background: '#09090b',
      foreground: '#fafafa',
      cursor: '#fafafa',
      selectionBackground: '#3f3f46',
    },
  });

  fitAddon = new FitAddon();
  xtermInstance.loadAddon(fitAddon);
  xtermInstance.open(terminalRef.value!);
  fitAddon.fit();

  // Show initial message
  xtermInstance.write('\x1b[90mReady. Click a button to run a command.\x1b[0m\r\n');

  // Register writer with orchestrator
  const writer: TerminalWriter = {
    clear: () => {
      // Cancel any pending clear timeout when new command starts
      if (clearTimeoutId) {
        clearTimeout(clearTimeoutId);
        clearTimeoutId = null;
      }
      xtermInstance.clear();
    },
    write: (data: string) => xtermInstance.write(data),
    getDimensions: () => ({ cols: xtermInstance.cols, rows: xtermInstance.rows }),
  };
  terminal.registerWriter(writer);

  // Receive data from PTY
  terminal.onData((data: string) => {
    xtermInstance.write(data);
  });

  // Handle PTY exit
  terminal.onExit(async (exitCode: number) => {
    // Clear terminal and show placeholder after task completes (unless autoplay starts new command)
    clearTimeoutId = setTimeout(() => {
      if (!terminal.isRunning.value) {
        xtermInstance.clear();
        xtermInstance.write('\x1b[90mTask complete. Click a button to run another command.\x1b[0m\r\n');
      }
      clearTimeoutId = null;
    }, 1500);

    // Refresh task data including selected task
    const projectPath = settings.projectPath.value;
    if (projectPath) {
      try {
        await tasks.refreshSelectedTask(projectPath);
        // Handle autoplay after refresh completes
        await app.handleCommandComplete(exitCode);
      } catch (err) {
        console.error('Failed to refresh task after process exit:', err);
      }
    }
  });

  // Forward keystrokes to PTY when running
  xtermInstance.onData((data: string) => {
    terminal.write(data);
  });
});

onUnmounted(() => {
  if (clearTimeoutId) {
    clearTimeout(clearTimeoutId);
    clearTimeoutId = null;
  }
  terminal.unregisterWriter();
  xtermInstance?.dispose();
  terminal.kill();
});
</script>

<template>
  <div class="h-full flex flex-col bg-background text-foreground">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 h-14 border-b border-border">
      <h2 class="text-sm font-semibold">
        Terminal
        <span
          v-if="terminal.currentTaskId.value"
          class="font-mono text-muted-foreground font-normal ml-1.5"
        >
          {{ terminal.currentTaskId.value }}
        </span>
      </h2>
      <span
        v-if="terminal.isRunning.value"
        class="text-xs text-muted-foreground animate-pulse"
      >
        Running...
      </span>
    </div>
    <!-- Terminal -->
    <div ref="terminalRef" class="flex-1 p-2 bg-[#09090b]"></div>
  </div>
</template>
