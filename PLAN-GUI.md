# GUI App Plan (v1 - Terminal POC)

## Prerequisites

**Complete PLAN.md first.** This plan assumes the monorepo migration is done and the structure is:
```
claudeban/
├── apps/
│   └── kanban/     # Existing package
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.json
└── tsconfig.base.json
```

---

## Project Vision (v1)

Build a minimal Electron app that provides a fully functional terminal for running Claude commands. This proves out the core technical pieces (node-pty, xterm.js, native module packaging) before adding Kanban board UI in v2.

---

## What v1 Does

- Opens with a project folder picker (or accepts path via CLI arg)
- Validates `.kanban/` folder exists
- Spawns Claude directly in the project directory
- User lands straight in an interactive Claude session
- User types commands directly (e.g., `/kanban-status`, `/kanban-refine 001`)
- Handles all Claude interactive prompts natively

---

## What v1 Does NOT Do

- No Kanban board UI
- No task cards or columns
- No action buttons
- No file watching / auto-refresh
- No state management

---

## Design Decisions

### Terminal Implementation

**xterm.js + node-pty (full PTY)**

- `node-pty`: Spawns Claude in a pseudo-terminal (PTY)
- `xterm.js`: Renders terminal output and captures keyboard input
- Bidirectional: stdout → xterm display, keyboard → stdin
- User types `/kanban-refine 001` etc. directly to Claude
- All Claude interactive features work (questions, confirmations, etc.)

### Direct Claude Spawn

**Spawn Claude directly, not a shell**

On project open, immediately spawn `claude` in the project directory:
- User lands straight in an interactive Claude session
- They type `/kanban-status`, `/kanban-refine 001`, etc. directly
- No shell overhead - this is a Claude app, not a general terminal
- When Claude exits, offer to restart or pick a new project

### Project Directory

**Set shell CWD to project path**

- On launch, user picks a folder (or passes via CLI arg)
- App validates `.kanban/` exists in that folder
- Shell spawns with `cwd` set to the project path
- All commands run in project context

---

## Technology Stack

**Scaffold**: [electron-vite-vue](https://github.com/electron-vite/electron-vite-vue)

```bash
git clone https://github.com/electron-vite/electron-vite-vue.git apps/gui
rm -rf apps/gui/.git
```

**Key dependencies**:
- `node-pty` — Spawn shell in pseudo-terminal
- `@xterm/xterm` + `@xterm/addon-fit` — Terminal UI component

**Architecture**:
```
┌─────────────────────────────────────────────────────────┐
│  Main Process (Electron)                                │
│  ├── Window management                                  │
│  ├── PTY management (node-pty)                          │
│  ├── Project path validation                            │
│  └── IPC handlers                                       │
└─────────────────────────────────────────────────────────┘
           ▲ IPC (invoke/handle) ▼
┌─────────────────────────────────────────────────────────┐
│  Renderer Process (Vue)                                 │
│  ├── Project picker (initial screen)                    │
│  └── Full-screen xterm.js terminal                      │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Scaffold & Basic Window

**Goal**: Electron app that opens and shows a window.

**Steps**:
1. Clone electron-vite-vue template into `apps/gui/`
2. Update `package.json`:
   - Set `"name": "claude-kanban-gui"`
   - Set `"private": true`
3. Update root `tsconfig.json` to include GUI app:
   ```json
   {
     "files": [],
     "references": [
       { "path": "./apps/kanban" },
       { "path": "./apps/gui" }
     ]
   }
   ```
4. Install and verify basic app runs:
   ```bash
   cd apps/gui
   pnpm install
   pnpm dev
   ```

**Deliverable**: Empty Electron window opens.

---

### Phase 2: Project Picker

**Goal**: User can select a project folder on launch.

**Steps**:
1. Create `ProjectPicker.vue` component:
   - "Open Project" button
   - Calls Electron's `dialog.showOpenDialog` via IPC
   - Validates `.kanban/` folder exists
   - Shows error if not a valid kanban project

2. Implement IPC handlers in main process:
   ```typescript
   // Main process
   ipcMain.handle('dialog:openProject', async () => {
     const result = await dialog.showOpenDialog({
       properties: ['openDirectory']
     });
     if (result.canceled) return { canceled: true };

     const projectPath = result.filePaths[0];
     const kanbanPath = path.join(projectPath, '.kanban');

     if (!fs.existsSync(kanbanPath)) {
       return { error: 'No .kanban folder found in selected directory' };
     }

     return { projectPath };
   });
   ```

3. Store selected project path in main process state

**Deliverable**: User can pick a folder, app validates it's a kanban project.

---

### Phase 3: Terminal Integration

**Goal**: Fully functional terminal in the app.

**Steps**:
1. Install terminal dependencies:
   ```bash
   pnpm add node-pty @xterm/xterm @xterm/addon-fit
   ```

2. Run electron-rebuild for native modules:
   ```bash
   pnpm add -D electron-rebuild
   npx electron-rebuild
   ```

3. Implement `pty-service.ts` in main process:
   ```typescript
   import * as pty from 'node-pty';

   let ptyProcess: pty.IPty | null = null;

   export function spawnClaude(cwd: string, onData: (data: string) => void, onExit: (code: number) => void) {
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
   ```

4. Set up IPC handlers:
   ```typescript
   // Renderer → Main
   ipcMain.handle('pty:spawn', (_, cwd: string) => { ... });
   ipcMain.on('pty:write', (_, data: string) => writeToPty(data));
   ipcMain.on('pty:resize', (_, cols: number, rows: number) => resizePty(cols, rows));
   ipcMain.on('pty:kill', () => killPty());

   // Main → Renderer (via webContents.send)
   // 'pty:data' (data: string)
   // 'pty:exit' (code: number)
   ```

5. Implement `TerminalPanel.vue`:
   ```vue
   <script setup lang="ts">
   import { Terminal } from '@xterm/xterm';
   import { FitAddon } from '@xterm/addon-fit';
   import { onMounted, onUnmounted, ref } from 'vue';
   import '@xterm/xterm/css/xterm.css';

   const props = defineProps<{ projectPath: string }>();
   const terminalRef = ref<HTMLDivElement>();

   let terminal: Terminal;
   let fitAddon: FitAddon;
   let resizeObserver: ResizeObserver;

   onMounted(async () => {
     terminal = new Terminal({
       cursorBlink: true,
       fontSize: 14,
       fontFamily: 'Consolas, "Courier New", monospace',
       theme: {
         background: '#1e1e1e',
         foreground: '#d4d4d4',
       },
     });

     fitAddon = new FitAddon();
     terminal.loadAddon(fitAddon);
     terminal.open(terminalRef.value!);
     fitAddon.fit();

     // Handle container resize
     resizeObserver = new ResizeObserver(() => {
       fitAddon.fit();
       window.electronAPI.ptyResize(terminal.cols, terminal.rows);
     });
     resizeObserver.observe(terminalRef.value!);

     // Receive data from PTY
     window.electronAPI.onPtyData((data: string) => {
       terminal.write(data);
     });

     // Handle Claude exit
     window.electronAPI.onPtyExit((code: number) => {
       terminal.write(`\r\n\x1b[90m[Claude exited with code ${code}. Press Enter to restart.]\x1b[0m\r\n`);
     });

     // Send keystrokes to PTY
     terminal.onData((data: string) => {
       window.electronAPI.ptyWrite(data);
     });

     // Spawn Claude in project directory
     await window.electronAPI.ptySpawn(props.projectPath);

     // Send initial resize
     window.electronAPI.ptyResize(terminal.cols, terminal.rows);
   });

   onUnmounted(() => {
     resizeObserver?.disconnect();
     terminal?.dispose();
     window.electronAPI.ptyKill();
   });
   </script>

   <template>
     <div ref="terminalRef" class="terminal-container"></div>
   </template>

   <style scoped>
   .terminal-container {
     height: 100%;
     width: 100%;
     padding: 8px;
     box-sizing: border-box;
     background: #1e1e1e;
   }
   </style>
   ```

6. Update preload script to expose IPC:
   ```typescript
   import { contextBridge, ipcRenderer } from 'electron';

   contextBridge.exposeInMainWorld('electronAPI', {
     // Dialog
     openProject: () => ipcRenderer.invoke('dialog:openProject'),

     // PTY
     ptySpawn: (cwd: string) => ipcRenderer.invoke('pty:spawn', cwd),
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
   ```

7. Wire up `App.vue` to show picker then terminal:
   ```vue
   <script setup lang="ts">
   import { ref } from 'vue';
   import ProjectPicker from './components/ProjectPicker.vue';
   import TerminalPanel from './components/TerminalPanel.vue';

   const projectPath = ref<string | null>(null);
   </script>

   <template>
     <ProjectPicker v-if="!projectPath" @selected="projectPath = $event" />
     <TerminalPanel v-else :projectPath="projectPath" />
   </template>

   <style>
   html, body, #app {
     margin: 0;
     padding: 0;
     height: 100%;
     width: 100%;
     overflow: hidden;
   }
   </style>
   ```

**Deliverable**: User opens project → lands in Claude session → types `/kanban-status` etc.

---

### Phase 4: Polish & Packaging

**Goal**: Installable app.

**Steps**:
1. Add app icon and metadata
2. Handle edge cases:
   - Claude CLI not installed (show helpful error)
   - Claude exits (offer to restart or pick new project)
   - Window close (clean up PTY)
3. Configure electron-builder
4. Build for target platform:
   ```bash
   pnpm run build
   ```
5. Test packaged app works with native modules

**Deliverable**: Distributable `.exe` / `.dmg` / `.AppImage`.

---

## File Structure (v1)

```
apps/gui/
├── electron/
│   ├── main/
│   │   ├── index.ts           # Main process entry, window creation
│   │   └── pty-service.ts     # PTY spawn/manage
│   └── preload/
│       └── index.ts           # Expose IPC to renderer
├── src/
│   ├── App.vue                # Root - picker or terminal
│   ├── components/
│   │   ├── ProjectPicker.vue  # Folder selection UI
│   │   └── TerminalPanel.vue  # xterm.js wrapper
│   └── env.d.ts               # Type declarations for electronAPI
├── package.json
├── tsconfig.json
├── electron-builder.json
└── vite.config.ts
```

---

## Dependencies

```json
{
  "dependencies": {
    "node-pty": "^1.0.0",
    "@xterm/xterm": "^5.5.0",
    "@xterm/addon-fit": "^0.10.0"
  },
  "devDependencies": {
    "electron-rebuild": "^3.0.0"
  }
}
```

---

## Success Criteria (v1)

- [ ] User can open a project folder containing `.kanban/`
- [ ] Terminal spawns with CWD set to project folder
- [ ] User can type commands and see output
- [ ] Claude interactive prompts work (user can answer questions)
- [ ] Terminal handles resize properly
- [ ] App can be packaged and runs standalone

---

Future versions may add a visual Kanban board UI above the terminal.
