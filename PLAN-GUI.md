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

Build a minimal Electron app that provides a fully functional terminal for running Claude commands. This proves out the core technical pieces (node-pty, xterm.js, native module packaging).

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

**Set Claude CWD to project path**

- On launch, user picks a folder (or passes via CLI arg)
- App validates `.kanban/` exists in that folder
- Claude spawns with `cwd` set to the project path
- All commands run in project context

---

## Technology Stack

**Scaffold**: [electron-vite-vue](https://github.com/electron-vite/electron-vite-vue) (see Phase 1 for setup)

**Key dependencies**:
- `node-pty` — Spawn Claude in pseudo-terminal
- `@xterm/xterm` + `@xterm/addon-fit` — Terminal UI component
- `@vueuse/core` — Reactive utilities (useResizeObserver, useEventListener, etc.)
- `shadcn-vue` (reka-ui) — Headless UI components
- `tailwindcss` + `@tailwindcss/vite` — Styling
- `class-variance-authority` + `clsx` + `tailwind-merge` — Class management
- `lucide-vue-next` — Icons

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
1. Clone electron-vite-vue template into `apps/gui/`:
   ```bash
   git clone https://github.com/electron-vite/electron-vite-vue.git apps/gui
   rm -rf apps/gui/.git
   ```

   The template provides this structure (we'll modify files in place):
   ```
   apps/gui/
   ├── electron/
   │   ├── main/index.ts      # Main process (we'll edit this)
   │   └── preload/index.ts   # Preload script (we'll edit this)
   ├── src/
   │   ├── App.vue            # Root component (we'll edit this)
   │   ├── main.ts            # Vue entry point (keep as-is)
   │   └── components/        # We'll add our components here
   ├── package.json
   ├── vite.config.ts
   └── tsconfig.json
   ```

2. Update `apps/gui/package.json`:
   - Set `"name": "claude-kanban-gui"`
   - Set `"private": true`

3. Install UI dependencies:
   ```bash
   cd apps/gui
   pnpm add @vueuse/core
   pnpm add tailwindcss @tailwindcss/vite class-variance-authority clsx tailwind-merge
   pnpm add lucide-vue-next
   ```

4. Update `vite.config.ts` to add Tailwind and path alias (preserve existing electron config):
   ```typescript
   import { defineConfig } from 'vite';
   import vue from '@vitejs/plugin-vue';
   import tailwindcss from '@tailwindcss/vite';
   import path from 'node:path';
   import electron from 'vite-plugin-electron/simple';

   export default defineConfig({
     plugins: [
       vue(),
       tailwindcss(),
       electron({
         main: { entry: 'electron/main/index.ts' },
         preload: { input: 'electron/preload/index.ts' },
       }),
     ],
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
       },
     },
   });
   ```

5. Initialize shadcn-vue (uses reka-ui under the hood):
   ```bash
   npx shadcn-vue@latest init
   ```
   When prompted, select:
   - Style: New York
   - Base color: Neutral
   - CSS variables: yes

   This creates:
   - `components.json` - shadcn config
   - `src/lib/utils.ts` - cn() helper (we can skip step 8 if it creates this)
   - Updates to your CSS with base styles

6. Add shadcn button component:
   ```bash
   npx shadcn-vue@latest add button
   ```
   This creates `src/components/ui/button/` with Button.vue and index.ts

7. Update root `tsconfig.json` to include GUI app:
   ```json
   {
     "files": [],
     "references": [
       { "path": "./apps/kanban" },
       { "path": "./apps/gui" }
     ]
   }
   ```

8. Verify `src/lib/utils.ts` exists (shadcn-vue init should create it):
   ```typescript
   import { type ClassValue, clsx } from 'clsx';
   import { twMerge } from 'tailwind-merge';

   export function cn(...inputs: ClassValue[]) {
     return twMerge(clsx(inputs));
   }
   ```
   If not created, add it manually.

9. Verify pnpm workspace recognizes the new app (already configured via `apps/*` glob in `pnpm-workspace.yaml`)

10. Install and verify basic app runs:
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
1. Create `src/components/ProjectPicker.vue`:
   ```vue
   <script setup lang="ts">
   import { ref } from 'vue';
   import { FolderOpen } from 'lucide-vue-next';
   import { Button } from '@/components/ui/button';

   const emit = defineEmits<{ selected: [path: string] }>();
   const error = ref<string | null>(null);
   const loading = ref(false);

   async function openProject() {
     loading.value = true;
     error.value = null;

     const result = await window.electronAPI.openProject();

     loading.value = false;

     if (result.canceled) return;
     if (result.error) {
       error.value = result.error;
       return;
     }

     emit('selected', result.projectPath!);
   }
   </script>

   <template>
     <div class="flex flex-col items-center justify-center h-full gap-4 bg-background text-foreground">
       <h1 class="text-2xl font-semibold">Claude Kanban</h1>
       <p class="text-muted-foreground">Select a project folder containing a .kanban directory</p>
       <Button @click="openProject" :disabled="loading" size="lg">
         <FolderOpen class="w-4 h-4 mr-2" />
         {{ loading ? 'Opening...' : 'Open Project' }}
       </Button>
       <p v-if="error" class="text-destructive text-sm">{{ error }}</p>
     </div>
   </template>
   ```

2. Add IPC handler in main process (see Phase 3 for full `index.ts`)

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

   **Note (Windows developers)**: `node-pty` requires build tools to compile during `pnpm install`. If you get compilation errors, install "Desktop development with C++" via Visual Studio Installer. End users don't need this - the packaged app includes pre-compiled binaries.

3. Create `electron/main/pty-service.ts`:
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

4. Update `electron/main/index.ts` to wire up all IPC handlers:
   ```typescript
   import { app, BrowserWindow, ipcMain, dialog } from 'electron';
   import path from 'node:path';
   import fs from 'node:fs';
   import { spawnClaude, writeToPty, resizePty, killPty } from './pty-service';

   let mainWindow: BrowserWindow | null = null;

   function createWindow() {
     mainWindow = new BrowserWindow({
       width: 1000,
       height: 700,
       webPreferences: {
         preload: path.join(__dirname, '../preload/index.js'),
         nodeIntegration: false,
         contextIsolation: true,
       },
     });

     // Load the app
     if (process.env.VITE_DEV_SERVER_URL) {
       mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
     } else {
       mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
     }
   }

   // IPC: Open project dialog
   ipcMain.handle('dialog:openProject', async () => {
     const result = await dialog.showOpenDialog({
       properties: ['openDirectory'],
     });
     if (result.canceled) return { canceled: true };

     const projectPath = result.filePaths[0];
     const kanbanPath = path.join(projectPath, '.kanban');

     if (!fs.existsSync(kanbanPath)) {
       return { error: 'No .kanban folder found in selected directory' };
     }

     return { projectPath };
   });

   // IPC: PTY handlers
   ipcMain.handle('pty:spawn', (_, cwd: string) => {
     spawnClaude(
       cwd,
       (data) => mainWindow?.webContents.send('pty:data', data),
       (code) => mainWindow?.webContents.send('pty:exit', code)
     );
   });

   ipcMain.on('pty:write', (_, data: string) => writeToPty(data));
   ipcMain.on('pty:resize', (_, cols: number, rows: number) => resizePty(cols, rows));
   ipcMain.on('pty:kill', () => killPty());

   app.whenReady().then(createWindow);

   app.on('window-all-closed', () => {
     killPty();
     if (process.platform !== 'darwin') app.quit();
   });
   ```

5. Implement `src/components/TerminalPanel.vue`:
   ```vue
   <script setup lang="ts">
   import { Terminal } from '@xterm/xterm';
   import { FitAddon } from '@xterm/addon-fit';
   import { onMounted, onUnmounted, ref } from 'vue';
   import { useResizeObserver } from '@vueuse/core';
   import '@xterm/xterm/css/xterm.css';

   const props = defineProps<{ projectPath: string }>();
   const terminalRef = ref<HTMLDivElement>();

   let terminal: Terminal;
   let fitAddon: FitAddon;
   let isExited = false;

   async function spawnClaude() {
     isExited = false;
     await window.electronAPI.ptySpawn(props.projectPath);
     window.electronAPI.ptyResize(terminal.cols, terminal.rows);
   }

   // Handle container resize (auto-cleanup via vueuse)
   useResizeObserver(terminalRef, () => {
     if (terminal && fitAddon) {
       fitAddon.fit();
       if (!isExited) {
         window.electronAPI.ptyResize(terminal.cols, terminal.rows);
       }
     }
   });

   onMounted(async () => {
     terminal = new Terminal({
       cursorBlink: true,
       fontSize: 14,
       fontFamily: 'Consolas, "Courier New", monospace',
       theme: {
         background: '#09090b',  // zinc-950
         foreground: '#fafafa',  // zinc-50
         cursor: '#fafafa',
         selectionBackground: '#3f3f46',  // zinc-700
       },
     });

     fitAddon = new FitAddon();
     terminal.loadAddon(fitAddon);
     terminal.open(terminalRef.value!);
     fitAddon.fit();

     // Receive data from PTY
     window.electronAPI.onPtyData((data: string) => {
       terminal.write(data);
     });

     // Handle Claude exit
     window.electronAPI.onPtyExit((code: number) => {
       isExited = true;
       terminal.write(`\r\n\x1b[90m[Claude exited with code ${code}. Press Enter to restart.]\x1b[0m\r\n`);
     });

     // Send keystrokes to PTY (or restart if exited)
     terminal.onData((data: string) => {
       if (isExited && data === '\r') {
         terminal.write('\r\n');
         spawnClaude();
       } else if (!isExited) {
         window.electronAPI.ptyWrite(data);
       }
     });

     // Initial spawn
     await spawnClaude();
   });

   onUnmounted(() => {
     terminal?.dispose();
     window.electronAPI.ptyKill();
   });
   </script>

   <template>
     <div ref="terminalRef" class="h-full w-full p-2 bg-[#09090b]"></div>
   </template>
   ```

6. Update `electron/preload/index.ts` to expose IPC:
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

7. Create `src/env.d.ts` for TypeScript types:
   ```typescript
   /// <reference types="vite/client" />

   interface ElectronAPI {
     openProject: () => Promise<{ canceled?: boolean; error?: string; projectPath?: string }>;
     ptySpawn: (cwd: string) => Promise<void>;
     ptyWrite: (data: string) => void;
     ptyResize: (cols: number, rows: number) => void;
     ptyKill: () => void;
     onPtyData: (callback: (data: string) => void) => void;
     onPtyExit: (callback: (code: number) => void) => void;
   }

   interface Window {
     electronAPI: ElectronAPI;
   }
   ```

8. Ensure `src/main.ts` imports the CSS (should already exist from template):
   ```typescript
   import { createApp } from 'vue';
   import App from './App.vue';
   import './style.css';  // Add this line if not present

   createApp(App).mount('#app');
   ```

9. Wire up `src/App.vue` to switch between picker and terminal:
   ```vue
   <script setup lang="ts">
   import { ref } from 'vue';
   import ProjectPicker from './components/ProjectPicker.vue';
   import TerminalPanel from './components/TerminalPanel.vue';

   const projectPath = ref<string | null>(null);
   </script>

   <template>
     <div class="h-screen w-screen dark">
       <TerminalPanel v-if="projectPath" :project-path="projectPath" />
       <ProjectPicker v-else @selected="projectPath = $event" />
     </div>
   </template>
   ```

10. Update `src/style.css` for Tailwind + shadcn:
   ```css
   @import "tailwindcss";

   @layer base {
     :root {
       --background: 0 0% 100%;
       --foreground: 240 10% 3.9%;
       --primary: 240 5.9% 10%;
       --primary-foreground: 0 0% 98%;
       --muted: 240 4.8% 95.9%;
       --muted-foreground: 240 3.8% 46.1%;
       --destructive: 0 84.2% 60.2%;
       --border: 240 5.9% 90%;
       --radius: 0.5rem;
     }

     .dark {
       --background: 240 10% 3.9%;
       --foreground: 0 0% 98%;
       --primary: 0 0% 98%;
       --primary-foreground: 240 5.9% 10%;
       --muted: 240 3.7% 15.9%;
       --muted-foreground: 240 5% 64.9%;
       --destructive: 0 62.8% 30.6%;
       --border: 240 3.7% 15.9%;
     }
   }

   @layer base {
     * { @apply border-border; }
     body { @apply bg-background text-foreground; }
   }
   ```

**Deliverable**: User opens project → lands in Claude session → types `/kanban-status` etc.

---

### Phase 4: Polish & Packaging

**Goal**: Installable app.

**Steps**:
1. Add app icon (`build/icon.png`, 512x512) and update `package.json`:
   ```json
   {
     "name": "claude-kanban-gui",
     "productName": "Claude Kanban",
     "version": "1.0.0",
     "main": "dist-electron/main/index.js"
   }
   ```

2. Handle edge cases in `pty-service.ts`:
   - Claude CLI not installed: catch spawn error, send 'pty:error' to renderer
   - Add error event handler to ptyProcess

3. Add electron-builder config to `package.json`:
   ```json
   {
     "build": {
       "appId": "com.claudekanban.gui",
       "productName": "Claude Kanban",
       "directories": { "output": "release" },
       "files": ["dist-electron", "dist"],
       "win": { "target": ["nsis"] },
       "mac": { "target": ["dmg"] },
       "linux": { "target": ["AppImage"] }
     }
   }
   ```

4. Add build scripts to `package.json`:
   ```json
   {
     "scripts": {
       "build": "vite build && electron-builder",
       "build:win": "vite build && electron-builder --win",
       "build:mac": "vite build && electron-builder --mac",
       "build:linux": "vite build && electron-builder --linux"
     }
   }
   ```

5. Install electron-builder and build:
   ```bash
   pnpm add -D electron-builder
   pnpm run build
   ```

6. Test packaged app works (native modules should be included automatically)

**Deliverable**: Distributable `.exe` / `.dmg` / `.AppImage` in `release/` folder.

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
│   │   ├── ui/                # shadcn-vue components (auto-generated)
│   │   │   └── button/        # Button component
│   │   ├── ProjectPicker.vue  # Folder selection UI
│   │   └── TerminalPanel.vue  # xterm.js wrapper
│   ├── lib/
│   │   └── utils.ts           # cn() helper for class merging
│   ├── style.css              # Tailwind + CSS variables
│   └── env.d.ts               # Type declarations for electronAPI
├── components.json            # shadcn-vue config (auto-generated)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Dependencies

```json
{
  "dependencies": {
    "node-pty": "^1.0.0",
    "@xterm/xterm": "^5.5.0",
    "@xterm/addon-fit": "^0.10.0",
    "@vueuse/core": "^12.0.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "lucide-vue-next": "^0.460.0",
    "reka-ui": "^2.1.0"
  },
  "devDependencies": {
    "electron-rebuild": "^3.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0"
  }
}
```

**Note**: reka-ui is installed automatically by shadcn-vue init.

---

## Success Criteria (v1)

- [ ] User can open a project folder containing `.kanban/`
- [ ] Claude spawns with CWD set to project folder
- [ ] User can type commands and see output
- [ ] Claude interactive prompts work (user can answer questions)
- [ ] Terminal handles resize properly
- [ ] App can be packaged and runs standalone

---

Future versions may add a visual Kanban board UI above the terminal.
