/**
 * Terminal capability - mechanism for VSCode terminal operations.
 */

import * as vscode from 'vscode';

export interface CreateTerminalCapabilityReturn {
  getOrCreateTerminal(name: string, cwd: string): vscode.Terminal;
  sendCommand(terminal: vscode.Terminal, command: string): void;
  showTerminal(terminal: vscode.Terminal): void;
}

export function createTerminalCapability(): CreateTerminalCapabilityReturn {
  let kanbanTerminal: vscode.Terminal | undefined;

  function getOrCreateTerminal(name: string, cwd: string): vscode.Terminal {
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
        name,
        cwd,
        iconPath: new vscode.ThemeIcon('tasklist'),
      });
    }

    return kanbanTerminal;
  }

  function sendCommand(terminal: vscode.Terminal, command: string): void {
    terminal.sendText(command);
  }

  function showTerminal(terminal: vscode.Terminal): void {
    terminal.show();
  }

  return {
    getOrCreateTerminal,
    sendCommand,
    showTerminal,
  };
}
