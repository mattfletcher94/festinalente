/**
 * Terminal Orchestrator
 *
 * Policy decisions for runtime selection and command execution.
 * Determines when/whether to use YOLO mode and which runtime to use.
 */

import * as vscode from 'vscode';

import { createClaudeSettingsCapability } from '../capabilities/claude-settings.capability';
import { createClaudeSettingsComputer } from '../computers/claude-settings.computer';
import type { createFileSystemCapability } from '../capabilities/file-system.capability';
import { createTerminalCapability } from '../capabilities/terminal.capability';

/**
 * Dependencies required by the terminal orchestrator.
 */
export interface TerminalOrchestratorDeps {
  readonly fs: ReturnType<typeof createFileSystemCapability>;
  readonly workspaceRoot: string;
}

/**
 * Return type for the terminal orchestrator factory.
 */
export interface CreateTerminalOrchestratorReturn {
  /**
   * Execute a command/prompt in the terminal with appropriate runtime and flags.
   *
   * @param prompt - The command or prompt to execute.
   */
  readonly executeInTerminal: (prompt: string) => void;
}

/**
 * Create a terminal orchestrator for runtime and execution policy.
 *
 * @param deps - Dependencies for the orchestrator.
 * @returns Terminal orchestrator with execution policy.
 */
export function createTerminalOrchestrator(
  deps: TerminalOrchestratorDeps
): CreateTerminalOrchestratorReturn {
  // Initialize capabilities
  const terminal = createTerminalCapability();
  const settings = createClaudeSettingsCapability({ fs: deps.fs });

  // Initialize computers
  const claudeSettings = createClaudeSettingsComputer();

  /**
   * Policy: Determine which runtime to use based on VSCode settings.
   */
  function getRuntime(): 'claude' | 'opencode' {
    const config = vscode.workspace.getConfiguration('festinalente');
    const runtime = config.get<string>('runtime', 'claude');
    return runtime === 'opencode' ? 'opencode' : 'claude';
  }

  /**
   * Policy: Build CLI command based on runtime and settings.
   */
  function buildRuntimeCommand(prompt: string): string {
    const projectSettings = settings.readProjectSettings(deps.workspaceRoot);
    const globalSettings = settings.readGlobalSettings();
    const runtime = getRuntime();

    if (runtime === 'opencode') {
      // OpenCode uses: opencode --prompt "prompt" to start TUI with prefilled prompt
      return `opencode --prompt "${prompt}"`;
    }

    // Claude Code uses: claude "prompt" (interactive mode with initial prompt)
    const isYolo = claudeSettings.isYoloEnabled(projectSettings, globalSettings);
    if (isYolo) {
      return `claude --dangerously-skip-permissions "${prompt}"`;
    }
    return `claude "${prompt}"`;
  }

  /**
   * Policy: Execute a command in terminal.
   */
  function executeInTerminal(prompt: string): void {
    const kanbanTerminal = terminal.createFreshTerminal('Festina Lente', deps.workspaceRoot);
    terminal.showTerminal(kanbanTerminal);
    terminal.sendCommand(kanbanTerminal, buildRuntimeCommand(prompt));
  }

  return {
    executeInTerminal,
  };
}
