import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Dialog
  openProject: () => ipcRenderer.invoke('dialog:openProject'),

  // PTY
  ptySpawn: (cwd: string) => ipcRenderer.invoke('pty:spawn', cwd),
  ptyRunCommand: (cwd: string, command: string) => ipcRenderer.invoke('pty:runCommand', cwd, command),
  ptyWrite: (data: string) => ipcRenderer.send('pty:write', data),
  ptyResize: (cols: number, rows: number) => ipcRenderer.send('pty:resize', cols, rows),
  ptyKill: () => ipcRenderer.send('pty:kill'),

  onPtyData: (callback: (data: string) => void) => {
    ipcRenderer.on('pty:data', (_, data) => callback(data));
  },
  onPtyExit: (callback: (code: number) => void) => {
    ipcRenderer.on('pty:exit', (_, code) => callback(code));
  },
});
