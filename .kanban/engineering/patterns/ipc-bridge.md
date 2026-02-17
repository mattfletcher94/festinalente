---
id: "patterns/ipc-bridge"
title: "IPC Bridge Pattern"
type: pattern
summary: "Electron IPC pattern with contextBridge for secure renderer-main communication"
keywords: [electron, ipc, contextbridge, security, preload]
related: ["systems/gui"]
paths: ["apps/gui/electron/preload/index.ts", "apps/gui/electron/main/index.ts"]
updated: 2026-02-17
---

# IPC Bridge Pattern

This pattern establishes secure communication between Electron's renderer process (Vue app) and main process (Node.js) using contextBridge and IPC channels.

## Quick Reference

| Layer | File | Responsibility |
|-------|------|----------------|
| Main Process | `electron/main/index.ts` | IPC handlers, system access |
| Preload | `electron/preload/index.ts` | Expose safe API via contextBridge |
| Renderer | Vue components | Call `window.electronAPI.*` |

## Validation Checklist

- [ ] All renderer-to-main calls use `ipcRenderer.invoke()` for async operations
- [ ] Fire-and-forget calls use `ipcRenderer.send()`
- [ ] Main-to-renderer events use `webContents.send()`
- [ ] API exposed via `contextBridge.exposeInMainWorld()`
- [ ] No direct Node.js access in renderer (`nodeIntegration: false`)

## Examples

### Correct

```typescript
// preload/index.ts - Expose safe API
contextBridge.exposeInMainWorld('electronAPI', {
  openProject: () => ipcRenderer.invoke('dialog:openProject'),
  ptyWrite: (data: string) => ipcRenderer.send('pty:write', data),
  onPtyData: (callback: (data: string) => void) => {
    ipcRenderer.on('pty:data', (_, data) => callback(data));
  },
});

// main/index.ts - Handle IPC
ipcMain.handle('dialog:openProject', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return { projectPath: result.filePaths[0] };
});

// Vue component - Use exposed API
const result = await window.electronAPI.openProject();
```

### Incorrect

```typescript
// BAD: Direct require in renderer (security risk)
const { ipcRenderer } = require('electron');

// BAD: Exposing raw ipcRenderer (allows arbitrary channel access)
contextBridge.exposeInMainWorld('ipc', ipcRenderer);
```

## Common Violations

- Using `nodeIntegration: true` (exposes full Node.js to renderer)
- Passing unvalidated data from renderer to main process
- Not cleaning up event listeners when components unmount
