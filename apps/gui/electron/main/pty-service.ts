import * as pty from 'node-pty';

let ptyProcess: pty.IPty | null = null;

export function spawnClaude(cwd: string, onData: (data: string) => void, onExit: (code: number) => void) {
  // Kill any existing process
  if (ptyProcess) {
    ptyProcess.kill();
    ptyProcess = null;
  }

  ptyProcess = pty.spawn('claude', [], {
    name: 'xterm-256color',
    cwd,
    env: process.env as Record<string, string>,
    cols: 80,
    rows: 24,
  });

  ptyProcess.onData(onData);
  ptyProcess.onExit(({ exitCode }) => onExit(exitCode));

  return ptyProcess;
}

export function writeToPty(data: string) {
  ptyProcess?.write(data);
}

export function resizePty(cols: number, rows: number) {
  ptyProcess?.resize(cols, rows);
}

export function killPty() {
  ptyProcess?.kill();
  ptyProcess = null;
}
