/**
 * Terminal command computer - parses commands and extracts metadata.
 */

import type { TaskId } from '@/tasks';

/**
 * Return type for the terminal command computer.
 */
export interface CreateTerminalCommandComputerReturn {
  /**
   * Extract task ID from a kanban command.
   *
   * @param command - The command string (e.g., "/kanban-plan 001").
   * @returns The task ID if found, null otherwise.
   */
  extractTaskId(command: string): TaskId | null;

  /**
   * Format a command for display in the terminal.
   *
   * @param command - The command string.
   * @returns Formatted string for terminal output.
   */
  formatCommandDisplay(command: string): string;
}

/**
 * Create a terminal command computer.
 *
 * @returns The terminal command computer instance.
 */
export function createTerminalCommandComputer(): CreateTerminalCommandComputerReturn {
  function extractTaskId(command: string): TaskId | null {
    const match = command.match(/\/kanban-\w+\s+(\S+)/);
    return match ? (match[1] as TaskId) : null;
  }

  function formatCommandDisplay(command: string): string {
    return `\x1b[90m> Running: ${command}\x1b[0m\r\n`;
  }

  return {
    extractTaskId,
    formatCommandDisplay,
  };
}
