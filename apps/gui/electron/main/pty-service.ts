import * as pty from 'node-pty';

let ptyProcess: pty.IPty | null = null;
let commandMode = false;
let outputBuffer = '';
let exitCallback: ((code: number) => void) | null = null;
let intentionalKill = false;

export function spawnClaude(cwd: string, onData: (data: string) => void, onExit: (code: number) => void) {
  killPtyInternal();
  commandMode = false;
  outputBuffer = '';
  exitCallback = onExit;

  console.log('[PTY] Spawning Claude in:', cwd);

  try {
    ptyProcess = pty.spawn('claude', [], {
      name: 'xterm-256color',
      cwd,
      env: process.env as Record<string, string>,
      cols: 80,
      rows: 24,
    });

    ptyProcess.onData((data) => {
      onData(data);
    });

    ptyProcess.onExit(({ exitCode }) => {
      console.log('[PTY] Exit code:', exitCode, 'intentional:', intentionalKill);
      if (!intentionalKill && exitCallback) {
        exitCallback(exitCode);
      }
      intentionalKill = false;
    });
  } catch (err) {
    console.error('[PTY] Spawn error:', err);
    onData(`\r\nError spawning Claude: ${err}\r\n`);
    onExit(1);
  }

  return ptyProcess;
}

// Run a slash command - spawns Claude, sends command after delay,
// then auto-exits when Claude outputs "Churned for" (task complete)
export function runClaudeCommand(
  cwd: string,
  command: string,
  onData: (data: string) => void,
  onExit: (code: number) => void
) {
  killPtyInternal();
  commandMode = true;
  outputBuffer = '';
  exitCallback = onExit;

  console.log('[PTY] Running command:', command, 'in:', cwd);

  try {
    ptyProcess = pty.spawn('claude', [], {
      name: 'xterm-256color',
      cwd,
      env: process.env as Record<string, string>,
      cols: 80,
      rows: 24,
    });

    ptyProcess.onData((data: string) => {
      onData(data);

      if (!commandMode) return;

      // Accumulate output to detect completion pattern
      outputBuffer += data;

      // Keep buffer manageable - just keep last 1000 chars
      if (outputBuffer.length > 1000) {
        outputBuffer = outputBuffer.slice(-1000);
      }

      // Detect completion marker from skill
      if (outputBuffer.includes('[KANBAN_COMPLETE]')) {
        console.log('[PTY] Detected [KANBAN_COMPLETE] - task complete, killing process');
        commandMode = false;

        // Small delay to let the full message render, then kill
        setTimeout(() => {
          if (ptyProcess) {
            const callback = exitCallback;
            exitCallback = null; // Prevent double-calling
            ptyProcess.kill();
            ptyProcess = null;
            if (callback) {
              callback(0);
            }
          }
        }, 500);
      }
    });

    ptyProcess.onExit(({ exitCode }) => {
      console.log('[PTY] Exit code:', exitCode, 'intentional:', intentionalKill);
      commandMode = false;
      if (!intentionalKill && exitCallback) {
        exitCallback(exitCode);
      }
      intentionalKill = false;
    });

    // Wait for Claude to initialize, then send the command
    setTimeout(() => {
      if (ptyProcess && commandMode) {
        console.log('[PTY] Sending command:', command);
        ptyProcess.write(command + '\r');
      }
    }, 3000);

  } catch (err) {
    console.error('[PTY] Spawn error:', err);
    onData(`\r\nError spawning Claude: ${err}\r\n`);
    onExit(1);
  }

  return ptyProcess;
}

export function writeToPty(data: string) {
  ptyProcess?.write(data);
}

export function resizePty(cols: number, rows: number) {
  ptyProcess?.resize(cols, rows);
}

// Internal kill - doesn't trigger exit callback
function killPtyInternal() {
  intentionalKill = true;
  commandMode = false;
  if (ptyProcess) {
    ptyProcess.kill();
    ptyProcess = null;
  }
}

// Public kill - triggers exit callback
export function killPty() {
  commandMode = false;
  if (ptyProcess) {
    ptyProcess.kill();
    ptyProcess = null;
  }
}
