/**
 * Pseudoterminal implementation for running kanban commands.
 *
 * Spawns the Claude CLI and pipes output to VSCode terminal.
 * Detects [KANBAN_COMPLETE] marker for autoplay orchestration.
 */

import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';

/**
 * Dependencies for the kanban pseudoterminal.
 */
export interface KanbanPseudoterminalDeps {
  readonly cwd: string;
  readonly command: string;
  readonly onComplete: (exitCode: number) => void;
}

/**
 * Pseudoterminal that spawns Claude CLI and intercepts output.
 *
 * Implements the VSCode Pseudoterminal interface to provide a custom
 * terminal that can detect completion markers in the output stream.
 */
export class KanbanPseudoterminal implements vscode.Pseudoterminal {
  private readonly writeEmitter = new vscode.EventEmitter<string>();
  private readonly closeEmitter = new vscode.EventEmitter<number | void>();

  readonly onDidWrite = this.writeEmitter.event;
  readonly onDidClose = this.closeEmitter.event;

  private process: ChildProcess | null = null;
  private outputBuffer = '';
  private completionDetected = false;

  constructor(private readonly deps: KanbanPseudoterminalDeps) {}

  /**
   * Called when the terminal is opened by VSCode.
   */
  open(): void {
    this.writeEmitter.fire(`\x1b[36m$ claude ${this.deps.command}\x1b[0m\r\n\r\n`);

    // Spawn claude CLI process
    // Use full command string with shell: true so shell parses arguments correctly
    this.process = spawn(`claude ${this.deps.command}`, [], {
      cwd: this.deps.cwd,
      shell: true,
      env: {
        ...process.env,
        // Ensure colors work
        FORCE_COLOR: '1',
        TERM: 'xterm-256color',
      },
    });

    // Handle stdout
    this.process.stdout?.on('data', (data: Buffer) => {
      const text = data.toString();
      // Convert \n to \r\n for terminal display
      this.writeEmitter.fire(text.replace(/\n/g, '\r\n'));
      this.checkForCompletion(text);
    });

    // Handle stderr
    this.process.stderr?.on('data', (data: Buffer) => {
      const text = data.toString();
      this.writeEmitter.fire(text.replace(/\n/g, '\r\n'));
    });

    // Handle process exit
    this.process.on('close', (code: number | null) => {
      const exitCode = code ?? 0;
      this.writeEmitter.fire(`\r\n\x1b[90m[Process exited with code ${exitCode}]\x1b[0m\r\n`);
      this.closeEmitter.fire(exitCode);

      // Call onComplete if not already called via marker detection
      if (!this.completionDetected) {
        this.deps.onComplete(exitCode);
      }
    });

    // Handle errors
    this.process.on('error', (err: Error) => {
      this.writeEmitter.fire(`\r\n\x1b[31mError: ${err.message}\x1b[0m\r\n`);
      this.closeEmitter.fire(1);

      if (!this.completionDetected) {
        this.deps.onComplete(1);
      }
    });
  }

  /**
   * Called when the terminal is closed by the user.
   */
  close(): void {
    this.killProcess();
  }

  /**
   * Handle terminal input (not used - commands run non-interactively).
   *
   * @param data - Input data from the terminal.
   */
  handleInput(data: string): void {
    // Send input to process if it's interactive
    if (this.process?.stdin?.writable) {
      this.process.stdin.write(data);
    }
  }

  /**
   * Kill the running process.
   */
  private killProcess(): void {
    if (this.process && !this.process.killed) {
      this.process.kill();
    }
  }

  /**
   * Check output for the [KANBAN_COMPLETE] marker.
   *
   * When detected, waits for visibility delay then calls onComplete.
   *
   * @param text - Output text to check.
   */
  private checkForCompletion(text: string): void {
    if (this.completionDetected) {
      return;
    }

    this.outputBuffer += text;

    // Keep buffer at reasonable size
    if (this.outputBuffer.length > 4000) {
      this.outputBuffer = this.outputBuffer.slice(-4000);
    }

    // Check for completion marker
    if (this.outputBuffer.includes('[KANBAN_COMPLETE]')) {
      this.completionDetected = true;

      // FR3: 1500ms delay for visibility before calling onComplete
      setTimeout(() => {
        this.deps.onComplete(0);
        // Give a moment for output to flush, then close
        setTimeout(() => this.killProcess(), 500);
      }, 1500);
    }
  }
}

/**
 * Create a kanban terminal for running a command.
 *
 * Factory function that creates a VSCode terminal with a pseudoterminal
 * that spawns the Claude CLI and detects completion markers.
 *
 * @param workspaceRoot - The workspace root directory.
 * @param command - The command to run (e.g., "/kanban-implement 001").
 * @param taskId - The task ID for the terminal name.
 * @param onComplete - Callback when command completes with exit code.
 * @returns The created terminal.
 */
export function createKanbanTerminal(
  workspaceRoot: string,
  command: string,
  taskId: string,
  onComplete?: (exitCode: number) => void
): vscode.Terminal {
  const pty = new KanbanPseudoterminal({
    cwd: workspaceRoot,
    command,
    onComplete: onComplete ?? ((): void => {}),
  });

  const terminal = vscode.window.createTerminal({
    name: `Kanban: ${taskId}`,
    pty,
    iconPath: new vscode.ThemeIcon('tasklist'),
  });

  terminal.show();

  return terminal;
}
