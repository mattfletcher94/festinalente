/**
 * PTY capability - manages pseudo-terminal operations via Electron IPC.
 */

import type { PtyDataHandler, PtyExitHandler } from './terminal-types';

/**
 * Return type for the PTY capability.
 */
export interface CreatePtyCapabilityReturn {
  /**
   * Run a command in the PTY.
   *
   * @param projectPath - Path to the project directory.
   * @param command - The command to run.
   */
  runCommand(projectPath: string, command: string): Promise<void>;

  /**
   * Write data to the PTY.
   *
   * @param data - The data to write.
   */
  write(data: string): void;

  /**
   * Resize the PTY.
   *
   * @param cols - Number of columns.
   * @param rows - Number of rows.
   */
  resize(cols: number, rows: number): void;

  /**
   * Kill the PTY process.
   */
  kill(): Promise<void>;

  /**
   * Register a handler for PTY data.
   *
   * @param handler - The data handler.
   * @returns Cleanup function.
   */
  onData(handler: PtyDataHandler): () => void;

  /**
   * Register a handler for PTY exit.
   *
   * @param handler - The exit handler.
   * @returns Cleanup function.
   */
  onExit(handler: PtyExitHandler): () => void;
}

/**
 * Create a PTY capability.
 *
 * @returns The PTY capability instance.
 */
export function createPtyCapability(): CreatePtyCapabilityReturn {
  async function runCommand(projectPath: string, command: string): Promise<void> {
    await window.electronAPI.ptyRunCommand(projectPath, command.trim());
  }

  function write(data: string): void {
    window.electronAPI.ptyWrite(data);
  }

  function resize(cols: number, rows: number): void {
    window.electronAPI.ptyResize(cols, rows);
  }

  async function kill(): Promise<void> {
    await window.electronAPI.ptyKill();
  }

  function onData(handler: PtyDataHandler): () => void {
    window.electronAPI.onPtyData(handler);
    // Note: Electron IPC doesn't provide cleanup, but we track for consistency
    return () => {
      // Cleanup would go here if supported
    };
  }

  function onExit(handler: PtyExitHandler): () => void {
    window.electronAPI.onPtyExit(handler);
    return () => {
      // Cleanup would go here if supported
    };
  }

  return {
    runCommand,
    write,
    resize,
    kill,
    onData,
    onExit,
  };
}
