/**
 * Terminal capability - mechanism for VSCode terminal operations.
 */

import * as vscode from 'vscode';

export interface CreateTerminalCapabilityReturn {
  createFreshTerminal(name: string, cwd: string): vscode.Terminal;
  sendCommand(terminal: vscode.Terminal, command: string): void;
  showTerminal(terminal: vscode.Terminal): void;
}

export function createTerminalCapability(): CreateTerminalCapabilityReturn {
  let kanbanTerminal: vscode.Terminal | undefined;

  function createFreshTerminal(name: string, cwd: string): vscode.Terminal {
    // Dispose existing terminal if it still exists
    if (kanbanTerminal && vscode.window.terminals.includes(kanbanTerminal)) {
      kanbanTerminal.dispose();
    }

    // Create new terminal
    kanbanTerminal = vscode.window.createTerminal({
      name,
      cwd,
      iconPath: new vscode.ThemeIcon('tasklist')
    });

    return kanbanTerminal;
  }

  function sendCommand(terminal: vscode.Terminal, command: string): void {
    terminal.sendText(command);
  }

  function showTerminal(terminal: vscode.Terminal): void {
    terminal.show();
  }

  return {
    createFreshTerminal,
    sendCommand,
    showTerminal
  };
}
