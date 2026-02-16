<script setup lang="ts">
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { onMounted, onUnmounted, ref } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import '@xterm/xterm/css/xterm.css';

const props = defineProps<{ projectPath: string }>();
const terminalRef = ref<HTMLDivElement>();

let terminal: Terminal;
let fitAddon: FitAddon;
let isExited = false;

async function spawnClaude() {
  isExited = false;
  await window.electronAPI.ptySpawn(props.projectPath);
  window.electronAPI.ptyResize(terminal.cols, terminal.rows);
}

// Handle container resize (auto-cleanup via vueuse)
useResizeObserver(terminalRef, () => {
  if (terminal && fitAddon) {
    fitAddon.fit();
    if (!isExited) {
      window.electronAPI.ptyResize(terminal.cols, terminal.rows);
    }
  }
});

onMounted(async () => {
  terminal = new Terminal({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    theme: {
      background: '#09090b',  // zinc-950
      foreground: '#fafafa',  // zinc-50
      cursor: '#fafafa',
      selectionBackground: '#3f3f46',  // zinc-700
    },
  });

  fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);
  terminal.open(terminalRef.value!);
  fitAddon.fit();

  // Receive data from PTY
  window.electronAPI.onPtyData((data: string) => {
    terminal.write(data);
  });

  // Handle Claude exit
  window.electronAPI.onPtyExit((code: number) => {
    isExited = true;
    terminal.write(`\r\n\x1b[90m[Claude exited with code ${code}. Press Enter to restart.]\x1b[0m\r\n`);
  });

  // Send keystrokes to PTY (or restart if exited)
  terminal.onData((data: string) => {
    if (isExited && data === '\r') {
      terminal.write('\r\n');
      spawnClaude();
    } else if (!isExited) {
      window.electronAPI.ptyWrite(data);
    }
  });

  // Initial spawn
  await spawnClaude();
});

onUnmounted(() => {
  terminal?.dispose();
  window.electronAPI.ptyKill();
});
</script>

<template>
  <div ref="terminalRef" class="h-full w-full p-2 bg-[#09090b]"></div>
</template>
