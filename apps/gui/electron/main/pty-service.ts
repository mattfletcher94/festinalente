import * as pty from 'node-pty';
import { homedir } from 'os';
import { join } from 'path';

let ptyProcess: pty.IPty | null = null;
let commandMode = false;
let outputBuffer = '';
let exitCallback: ((code: number) => void) | null = null;
let intentionalKill = false;

// Strip ANSI escape codes from text
function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

// Get environment with augmented PATH for macOS
// Electron apps launched from GUI don't inherit shell PATH
function getSpawnEnv(): Record<string, string> {
  const env = { ...process.env } as Record<string, string>;

  if (process.platform === 'darwin') {
    const home = homedir();
    const extraPaths = [
      '/usr/local/bin',
      '/opt/homebrew/bin',
      join(home, '.npm-global/bin'),
      join(home, '.local/bin'),
      join(home, '.nvm/versions/node'),  // nvm installs
      '/opt/local/bin',  // MacPorts
    ];

    const currentPath = env.PATH || '';
    const pathsToAdd = extraPaths.filter(p => !currentPath.includes(p));

    if (pathsToAdd.length > 0) {
      env.PATH = [...pathsToAdd, currentPath].join(':');
    }
  }

  return env;
}

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
      env: getSpawnEnv(),
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

// Run a slash command - spawns Claude with the command as initial prompt
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

  const trimmedCommand = command.trim();
  console.log('[PTY] Running command:', trimmedCommand, 'in:', cwd);

  try {
    // Pass the command directly to Claude as a positional argument
    ptyProcess = pty.spawn('claude', [trimmedCommand], {
      name: 'xterm-256color',
      cwd,
      env: getSpawnEnv(),
      cols: 80,
      rows: 24,
    });

    let markerDetected = false;

    ptyProcess.onData((data: string) => {
      onData(data);

      // Always accumulate buffer to detect marker (even if commandMode is false due to race condition)
      if (!markerDetected) {
        outputBuffer += data;

        // Keep buffer manageable - just keep last 2000 chars
        if (outputBuffer.length > 2000) {
          outputBuffer = outputBuffer.slice(-2000);
        }

        // Detect completion marker from skill
        const stripped = stripAnsi(outputBuffer);
        if (stripped.includes('[KANBAN_COMPLETE]')) {
          console.log('[PTY] Detected [KANBAN_COMPLETE] - task complete, killing process');
          markerDetected = true;
          commandMode = false;

          // Small delay to let the full message render, then kill
          setTimeout(() => {
            if (ptyProcess) {
              const callback = exitCallback;
              exitCallback = null; // Prevent double-calling
              intentionalKill = true;

              try {
                ptyProcess.kill();
              } catch (err) {
                console.log('[PTY] Kill error (expected on Windows):', err);
              }

              ptyProcess = null;
              if (callback) {
                callback(0);
              }
            }
          }, 500);
        }
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
    try {
      ptyProcess.kill();
    } catch (err) {
      console.log('[PTY] Kill error (expected on Windows):', err);
    }
    ptyProcess = null;
  }
}

// Public kill - triggers exit callback
export function killPty() {
  commandMode = false;
  if (ptyProcess) {
    try {
      ptyProcess.kill();
    } catch (err) {
      console.log('[PTY] Kill error (expected on Windows):', err);
    }
    ptyProcess = null;
  }
}
