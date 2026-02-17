/**
 * Terminal orchestrator - coordinates terminal state and PTY operations.
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue';

import type { TaskId } from '@/tasks';

import type { CreatePtyCapabilityReturn } from './pty.capability';
import type { CreateTerminalCommandComputerReturn } from './terminal-command.computer';
import type { PtyDataHandler, PtyExitHandler } from './terminal-types';

/**
 * Terminal writer interface - registered by the terminal panel component.
 */
export interface TerminalWriter {
  /**
   * Clear the terminal display.
   */
  clear(): void;

  /**
   * Write data to the terminal display.
   */
  write(data: string): void;

  /**
   * Get current terminal dimensions.
   */
  getDimensions(): { cols: number; rows: number };
}

/**
 * Options for creating a terminal orchestrator.
 */
export interface CreateTerminalOrchestratorOptions {
  /**
   * The PTY capability.
   */
  readonly pty: CreatePtyCapabilityReturn;

  /**
   * The terminal command computer.
   */
  readonly commandComputer: CreateTerminalCommandComputerReturn;
}

/**
 * Return type for the terminal orchestrator.
 */
export interface CreateTerminalOrchestratorReturn {
  // State
  readonly isRunning: Ref<boolean>;
  readonly currentTaskId: Ref<TaskId | null>;
  readonly isReady: ComputedRef<boolean>;

  // Registration
  registerWriter(writer: TerminalWriter): void;
  unregisterWriter(): void;

  // Actions
  runCommand(projectPath: string, command: string): Promise<void>;
  write(data: string): void;
  resize(cols: number, rows: number): void;
  kill(): Promise<void>;

  // Event handlers
  onData(handler: PtyDataHandler): () => void;
  onExit(handler: PtyExitHandler): () => void;
}

/**
 * Create a terminal orchestrator.
 *
 * @param options - Configuration options.
 * @returns The terminal orchestrator instance.
 */
export function createTerminalOrchestrator(
  options: CreateTerminalOrchestratorOptions
): CreateTerminalOrchestratorReturn {
  const { pty, commandComputer } = options;

  // State
  const isRunning = ref(false);
  const currentTaskId = ref<TaskId | null>(null);

  // Registered terminal writer (set by component)
  let writer: TerminalWriter | null = null;

  // Computed
  const isReady = computed(() => !isRunning.value && writer !== null);

  // Registration
  function registerWriter(w: TerminalWriter): void {
    writer = w;
  }

  function unregisterWriter(): void {
    writer = null;
  }

  // Actions
  async function runCommand(projectPath: string, command: string): Promise<void> {
    if (!writer) {
      console.error('Terminal writer not registered');
      return;
    }

    // Update state
    currentTaskId.value = commandComputer.extractTaskId(command);
    isRunning.value = true;

    // Clear and show command in terminal
    writer.clear();
    writer.write(commandComputer.formatCommandDisplay(command));

    // Run via PTY
    await pty.runCommand(projectPath, command);

    // Resize to match terminal dimensions
    const dims = writer.getDimensions();
    pty.resize(dims.cols, dims.rows);
  }

  function write(data: string): void {
    if (isRunning.value) {
      pty.write(data);
    }
  }

  function resize(cols: number, rows: number): void {
    if (isRunning.value) {
      pty.resize(cols, rows);
    }
  }

  async function kill(): Promise<void> {
    await pty.kill();
    isRunning.value = false;
    currentTaskId.value = null;
  }

  function onData(handler: PtyDataHandler): () => void {
    return pty.onData(handler);
  }

  function onExit(handler: PtyExitHandler): () => void {
    return pty.onExit((code: number) => {
      isRunning.value = false;
      handler(code);
    });
  }

  return {
    // State
    isRunning,
    currentTaskId,
    isReady,

    // Registration
    registerWriter,
    unregisterWriter,

    // Actions
    runCommand,
    write,
    resize,
    kill,

    // Event handlers
    onData,
    onExit,
  };
}
