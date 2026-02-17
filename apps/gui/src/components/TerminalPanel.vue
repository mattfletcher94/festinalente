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

let terminal: Terminal;
let fitAddon: FitAddon;

// Run a command - spawns Claude, runs command, exits when complete
async function runCommand(command: string) {
  terminal.clear();
  terminal.write(`\x1b[90m> Running: ${command}\x1b[0m\r\n\r\n`);

  isRunning.value = true;
  await window.electronAPI.ptyRunCommand(props.projectPath, command);
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
    terminal.write(`\r\n\x1b[90m[Task complete]\x1b[0m\r\n`);
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
  <div ref="terminalRef" class="h-full w-full p-2 bg-[#09090b]"></div>
</template>
