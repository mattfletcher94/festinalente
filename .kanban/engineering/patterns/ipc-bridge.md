---
id: "patterns/ipc-bridge"
title: "IPC Bridge Pattern"
type: pattern
summary: "Secure Electron main/renderer communication via contextBridge"
keywords: [electron, ipc, contextbridge, preload, security]
related: ["systems/gui"]
paths: ["apps/gui/electron/preload/index.ts", "apps/gui/electron/main/index.ts"]
updated: 2026-02-17
---

# IPC Bridge Pattern

The IPC Bridge pattern establishes secure communication between Electron's main process and renderer process using `contextBridge` and `ipcRenderer`. This is the standard Electron security pattern with `contextIsolation: true`.

## Quick Reference

| Layer | File | Responsibility |
|-------|------|----------------|
| Main Process | `electron/main/index.ts` | Register `ipcMain.handle()` and `ipcMain.on()` handlers |
| Preload | `electron/preload/index.ts` | Expose typed API via `contextBridge.exposeInMainWorld()` |
| Renderer | `*.capability.ts` | Call `window.electronAPI.*` methods |

## Communication Types

| Type | Main Process | Preload | Use Case |
|------|--------------|---------|----------|
| Request/Response | `ipcMain.handle()` | `ipcRenderer.invoke()` | Async operations with return values |
| Fire-and-forget | `ipcMain.on()` | `ipcRenderer.send()` | One-way messages (PTY write, resize) |
| Main-to-Renderer | `webContents.send()` | `ipcRenderer.on()` | Push events (PTY data, exit) |

## Validation Checklist

- [ ] Main process handlers registered with `ipcMain.handle()` or `ipcMain.on()`
- [ ] Preload exposes minimal typed API via `contextBridge.exposeInMainWorld()`
- [ ] Renderer uses `window.electronAPI.*` (not direct ipcRenderer)
- [ ] BrowserWindow has `contextIsolation: true` and `nodeIntegration: false`

## Examples

### Correct

```typescript
// Main process (electron/main/index.ts)
ipcMain.handle('tasks:list', async (_, projectPath: string) => {
  const tasks = await loadTasks(projectPath);
  return tasks;
});

// Preload (electron/preload/index.ts)
contextBridge.exposeInMainWorld('electronAPI', {
  listTasks: (projectPath: string) =>
    ipcRenderer.invoke('tasks:list', projectPath),
});

// Renderer (capability file)
export function createTasksApiCapability() {
  async function listTasks(projectPath: string) {
    return window.electronAPI.listTasks(projectPath);
  }
  return { listTasks };
}
```

### Push Events (Main to Renderer)

```typescript
// Main process - send event
win?.webContents.send('pty:data', data);

// Preload - expose listener
onPtyData: (callback: (data: string) => void) => {
  ipcRenderer.on('pty:data', (_, data) => callback(data));
},

// Renderer - subscribe
window.electronAPI.onPtyData((data) => {
  terminal.write(data);
});
```

### Incorrect

```typescript
// BAD: Direct ipcRenderer in renderer
import { ipcRenderer } from 'electron';  // Won't work with contextIsolation
const tasks = await ipcRenderer.invoke('tasks:list', path);

// BAD: Exposing entire ipcRenderer
contextBridge.exposeInMainWorld('ipc', ipcRenderer);  // Security risk

// BAD: Using nodeIntegration
new BrowserWindow({
  webPreferences: { nodeIntegration: true }  // Security risk
});
```

## Common Violations

1. **Importing `electron` in renderer code** - Use preload bridge instead
2. **Exposing raw ipcRenderer** - Only expose specific typed methods
3. **Missing error handling** - Wrap IPC calls in try/catch in capabilities
4. **Synchronous IPC** - Avoid `ipcRenderer.sendSync()`, use async `invoke()`
