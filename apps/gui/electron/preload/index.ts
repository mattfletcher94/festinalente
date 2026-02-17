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

  // Tasks
  listTasks: (projectPath: string) => ipcRenderer.invoke('tasks:list', projectPath),
  readTaskFile: (projectPath: string, taskId: string) => ipcRenderer.invoke('tasks:read', projectPath, taskId),
  getAvailableTaskFiles: (projectPath: string, taskId: string) => ipcRenderer.invoke('tasks:getAvailableFiles', projectPath, taskId),
  readSpecFile: (projectPath: string, taskId: string) => ipcRenderer.invoke('tasks:readSpec', projectPath, taskId),
  readPlanFile: (projectPath: string, taskId: string) => ipcRenderer.invoke('tasks:readPlan', projectPath, taskId),

  // Settings
  getSetting: <T>(key: string) => ipcRenderer.invoke('settings:get', key) as Promise<T>,
  setSetting: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),
  getAllSettings: () => ipcRenderer.invoke('settings:getAll'),
});
