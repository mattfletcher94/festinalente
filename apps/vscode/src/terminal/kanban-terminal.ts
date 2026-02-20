/**
 * Terminal utilities for running kanban commands.
 * Uses VSCode's built-in terminal to run Claude CLI commands.
 */

import * as vscode from 'vscode';

// Track active kanban terminal
let kanbanTerminal: vscode.Terminal | undefined;

/**
 * Get or create the kanban terminal.
 */
function getKanbanTerminal(cwd: string): vscode.Terminal {
  // Check if terminal still exists
  if (kanbanTerminal) {
    const terminals = vscode.window.terminals;
    if (!terminals.includes(kanbanTerminal)) {
      kanbanTerminal = undefined;
    }
  }

  // Create new terminal if needed
  if (!kanbanTerminal) {
    kanbanTerminal = vscode.window.createTerminal({
      name: 'Kanban',
      cwd,
      iconPath: new vscode.ThemeIcon('tasklist'),
    });
  }

  return kanbanTerminal;
}

/**
 * Run a kanban action in the terminal.
 */
export function runKanbanAction(
  workspaceRoot: string,
  command: string,
  _taskId: string,
  _onComplete?: () => void
): vscode.Terminal {
  const terminal = getKanbanTerminal(workspaceRoot);
  terminal.show();

  // Send the claude command to the terminal
  // The entire slash command must be quoted as a single argument to claude
  terminal.sendText(`claude "${command}"`);

  return terminal;
}
