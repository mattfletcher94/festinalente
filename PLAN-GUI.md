# GUI App Plan

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

## Project Vision

Build a lightweight desktop application using Electron that provides a graphical interface for the Claude Kanban workflow. The app wraps the locally installed Claude CLI (not bundled), automating context management and providing a visual Kanban board with integrated command execution.

---

## Current Pain Points (Why Build This)

- Manual `/clear` required between commands (context pollution)
- No visual representation of the board
- Must manually remember which command comes next
- No session history or audit trail in the UI

---

## Design Decisions

### Process Model

**Fresh process per command**

Spawn a new `claude` process for each command, let it exit when done.
- Clean state is automatic (no `/clear` needed)
- Simpler error recovery (process crash = just spawn a new one)
- No memory accumulation from previous commands

---

### State Synchronization

**Files are truth, auto-refresh via chokidar**

- `.kanban/` files are the source of truth (same as CLI)
- Use `chokidar` to watch for file changes (more reliable than `fs.watch`)
- On change: debounce (300ms), then re-read affected files and update UI
- Handles: Claude modifying files, git pull, manual edits

**Existing helper scripts can be reused**:
- `list-tasks.cjs` — Get all tasks for board
- `find-task.cjs` — Get single task details
- Run these via Node.js in main process, send results to renderer via IPC

**Important**: The helper scripts are located in the **user's project** at `.kanban/scripts/`, NOT in the GUI app. When the user opens a project folder, the GUI runs these scripts from `{projectPath}/.kanban/scripts/`.

---

### Command Execution

**Fully interactive embedded terminal (xterm.js + node-pty)**

Use xterm.js paired with node-pty to create a fully interactive terminal.
- **node-pty**: Spawns Claude in a pseudo-terminal (PTY), so Claude thinks it's in a real terminal
- **xterm.js**: Renders output AND captures keyboard input
- Bidirectional: stdout → xterm.js display, keyboard → stdin
- Handles Claude's interactive questions natively (user types responses in the terminal)
- No custom input handling needed — it's a real terminal experience
- Same pattern VS Code uses for its integrated terminal

---

### UI Layout

**Horizontal split — Board above, Terminal below**

```
┌─────────────────────────────────────────────────────────────────┐
│  Kanban Board (columns with task cards)                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ Backlog │ │ Refined │ │ Scoped  │ │ Planned │  ...          │
│  │ ┌─────┐ │ │         │ │ ┌─────┐ │ │         │               │
│  │ │Task1│ │ │         │ │ │Task2│ │ │         │               │
│  │ └─────┘ │ │         │ │ └─────┘ │ │         │               │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
├─────────────────────────────────────────────────────────────────┤
│  Terminal (xterm.js + node-pty) - Interactive Claude session    │
│  $ claude /kanban-refine 001                                    │
│  What problem are you trying to solve?                          │
│  > user types here...                                           │
└─────────────────────────────────────────────────────────────────┘
```

**Task details**: Opens as sidebar/drawer when clicking a task card (board still visible).
The drawer shows task info + action buttons. Clicking an action starts the command in terminal.

---

### Workflow Columns

The board displays **10 columns** matching the kanban workflow:

| Column (Display) | Status (in task.md) | Description |
|------------------|---------------------|-------------|
| Backlog | `backlog` | New tasks awaiting refinement |
| Refined | `refined` | Problem/value/acceptance defined |
| Scoped | `scoped` | Functional spec ready |
| Planned | `planned` | Implementation plan ready |
| In Progress | `in-progress` | Being implemented |
| Code Check | `codecheck` | Automated checks running |
| QA | `qa` | Awaiting human validation |
| Update Docs | `update-docs` | Code committed, docs need update |
| PR | `pr` | Awaiting PR review/merge |
| Done | `done` | Complete |

---

### Contextual Actions

**Show all valid actions, primary action prominent**

Display all valid actions for the task's current status, with the "move forward" action most prominent (larger button, primary color). Secondary actions are smaller/muted.

| Status | Primary Action | Command | Secondary Actions |
|--------|---------------|---------|-------------------|
| backlog | **Refine** | `/kanban-refine {id}` | View, Delete |
| refined | **Scope** | `/kanban-scope {id}` | View, Edit |
| scoped | **Plan** | `/kanban-plan {id}` | View |
| planned | **Implement** | `/kanban-implement {id}` | View |
| in-progress | **Code Check** | `/kanban-codecheck {id}` | Save, View |
| codecheck | **Approve** | `/kanban-approve {id}` | Rework, View |
| qa | **Approve** | `/kanban-approve {id}` | Rework, View |
| update-docs | **Docs** | `/kanban-docs {id}` | View |
| pr | **Merge** | `/kanban-merge {id}` | View PR |
| done | — | — | View, Archive |

---

### Project Management

**Single project per window, path-based**

- App opens with a specific project path (repo folder)
- Could be passed as CLI arg: `kanban-gui /path/to/repo`
- Or selected via "Open Project" dialog on launch
- App validates that `.kanban/` folder exists in the path
- Working directory for Claude commands = the project path

---

### Technology Stack

**electron-vite + Vue**

**Scaffold**: [electron-vite-vue](https://github.com/electron-vite/electron-vite-vue)
```bash
git clone https://github.com/electron-vite/electron-vite-vue.git apps/gui
rm -rf apps/gui/.git
```

**After cloning, update root tsconfig.json** to include the GUI app:
```json
{
  "files": [],
  "references": [
    { "path": "./apps/kanban" },
    { "path": "./apps/gui" }
  ]
}
```

**Update apps/gui/package.json**:
- Set `"name": "claude-kanban-gui"`
- Set `"private": true`

**Update apps/gui/tsconfig.json** to extend base:
```json
{
  "extends": "../../tsconfig.base.json",
  // ... keep electron-vite specific options
}
```

Then install and run:
```bash
cd apps/gui
pnpm install
pnpm dev
```

**Key dependencies**:
- `node-pty` — Spawn Claude in pseudo-terminal
- `xterm` + `xterm-addon-fit` — Terminal UI component
- `chokidar` — File watching for `.kanban/` changes
- `gray-matter` — Parse YAML frontmatter from task files

**Architecture**:
```
┌─────────────────────────────────────────────────────────┐
│  Main Process (Electron)                                │
│  ├── PTY management (node-pty)                          │
│  ├── File system access (read .kanban/, watch changes)  │
│  └── IPC handlers for renderer requests                 │
└─────────────────────────────────────────────────────────┘
           ▲ IPC (invoke/handle) ▼
┌─────────────────────────────────────────────────────────┐
│  Renderer Process (Vue)                                 │
│  ├── Kanban board UI                                    │
│  ├── Task drawer component                              │
│  ├── xterm.js terminal component                        │
│  └── State management (Pinia or Vue reactivity)         │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Project Scaffold & Basic UI

**Goal**: Electron app that opens a project and displays the Kanban board.

**Steps**:
1. Clone electron-vite-vue template into `apps/gui/`
2. Install dependencies: `node-pty`, `xterm`, `xterm-addon-fit`, `chokidar`, `gray-matter`
3. Create project structure:
   ```
   apps/gui/
   ├── electron/
   │   ├── main/
   │   │   ├── index.ts          # Main process entry
   │   │   ├── ipc-handlers.ts   # IPC handler registration
   │   │   ├── kanban-service.ts # Read .kanban/ files, run helper scripts
   │   │   ├── pty-service.ts    # PTY spawn/manage for Claude
   │   │   └── file-watcher.ts   # Chokidar setup
   │   └── preload/
   │       └── index.ts          # Expose IPC to renderer
   └── src/
       ├── App.vue               # Root component
       ├── components/
       │   ├── KanbanBoard.vue   # Column layout with task cards
       │   ├── TaskCard.vue      # Individual task card
       │   ├── TaskDrawer.vue    # Slide-out task details + actions
       │   ├── TerminalPanel.vue # xterm.js wrapper
       │   └── ProjectPicker.vue # Initial project selection
       ├── composables/
       │   ├── useKanban.ts      # Reactive kanban state
       │   └── useTerminal.ts    # Terminal connection logic
       └── types/
           └── kanban.ts         # TypeScript types for tasks, etc.
   ```

4. Implement IPC contract:
   ```typescript
   // Main → Renderer
   'kanban:tasks-updated' (tasks: Task[])
   'pty:data' (data: string)
   'pty:exit' (code: number)

   // Renderer → Main
   'kanban:load-project' (path: string) → { success, tasks, error? }
   'kanban:get-tasks' () → Task[]
   'kanban:get-task' (id: string) → Task
   'pty:spawn' (command: string, args: string[]) → void
   'pty:write' (data: string) → void
   'pty:kill' () → void
   ```

5. Define Task type (`src/types/kanban.ts`):
   ```typescript
   export type TaskStatus =
     | 'backlog'
     | 'refined'
     | 'scoped'
     | 'planned'
     | 'in-progress'
     | 'codecheck'
     | 'qa'
     | 'update-docs'
     | 'pr'
     | 'done';

   export type TaskPriority = 'high' | 'medium' | 'low';

   export type TaskLabel = 'bug' | 'feature' | 'docs' | 'refactor';

   export interface Task {
     id: string;
     title: string;
     status: TaskStatus;
     priority: TaskPriority;
     labels: TaskLabel[];
     created: string;      // ISO date
     updated: string;      // ISO date
     completed?: string;   // ISO date (only if done)
     spec?: string;        // Path to spec.md
     plan?: string;        // Path to plan.md
     affects: string[];    // Product doc IDs
     engineering: string[];// Engineering doc IDs
   }
   ```

6. Build minimal UI:
   - Project picker on launch (or accept path from CLI arg)
   - Kanban board with 10 columns
   - Task cards showing: title, ID, priority badge
   - Clicking card opens drawer with full details

7. Implement `kanban-service.ts` (reads tasks from user's project):
   ```typescript
   import { spawn } from 'child_process';
   import path from 'path';

   let projectPath: string | null = null;

   export function setProjectPath(p: string) {
     projectPath = p;
   }

   export async function listTasks(): Promise<Task[]> {
     if (!projectPath) throw new Error('No project loaded');

     const scriptPath = path.join(projectPath, '.kanban', 'scripts', 'list-tasks.cjs');

     return new Promise((resolve, reject) => {
       const child = spawn('node', [scriptPath], { cwd: projectPath });
       let stdout = '';

       child.stdout.on('data', (data) => { stdout += data; });
       child.on('close', (code) => {
         if (code === 0) {
           const result = JSON.parse(stdout);
           resolve(result.tasks);
         } else {
           reject(new Error(`Script exited with code ${code}`));
         }
       });
     });
   }

   export async function getTask(id: string): Promise<Task> {
     if (!projectPath) throw new Error('No project loaded');

     const scriptPath = path.join(projectPath, '.kanban', 'scripts', 'find-task.cjs');

     return new Promise((resolve, reject) => {
       const child = spawn('node', [scriptPath, id], { cwd: projectPath });
       let stdout = '';

       child.stdout.on('data', (data) => { stdout += data; });
       child.on('close', (code) => {
         if (code === 0) {
           resolve(JSON.parse(stdout));
         } else {
           reject(new Error(`Task ${id} not found`));
         }
       });
     });
   }
   ```

**Deliverable**: App that displays the board from `.kanban/tasks/` files.

---

### Phase 2: Terminal Integration

**Goal**: Embedded terminal that can run Claude commands interactively.

**Steps**:
1. Implement `pty-service.ts`:
   ```typescript
   import * as pty from 'node-pty';

   let currentPty: pty.IPty | null = null;

   export function spawnClaude(cwd: string, args: string[]) {
     currentPty = pty.spawn('claude', args, {
       name: 'xterm-256color',
       cwd,
       env: process.env,
     });

     currentPty.onData((data) => {
       mainWindow.webContents.send('pty:data', data);
     });

     currentPty.onExit(({ exitCode }) => {
       mainWindow.webContents.send('pty:exit', exitCode);
       currentPty = null;
     });
   }

   export function writeToPty(data: string) {
     currentPty?.write(data);
   }

   export function killPty() {
     currentPty?.kill();
   }
   ```

2. Implement `TerminalPanel.vue`:
   ```vue
   <script setup lang="ts">
   import { Terminal } from 'xterm';
   import { FitAddon } from 'xterm-addon-fit';
   import { onMounted, onUnmounted, ref } from 'vue';
   import 'xterm/css/xterm.css';  // Required for proper terminal rendering

   const terminalRef = ref<HTMLDivElement>();
   let terminal: Terminal;
   let fitAddon: FitAddon;
   let resizeObserver: ResizeObserver;

   onMounted(() => {
     terminal = new Terminal({ cursorBlink: true });
     fitAddon = new FitAddon();
     terminal.loadAddon(fitAddon);
     terminal.open(terminalRef.value!);
     fitAddon.fit();

     // Handle window/container resize
     resizeObserver = new ResizeObserver(() => {
       fitAddon.fit();
     });
     resizeObserver.observe(terminalRef.value!);

     // Receive data from PTY
     window.electron.onPtyData((data: string) => terminal.write(data));

     // Send keystrokes to PTY
     terminal.onData((data: string) => window.electron.ptyWrite(data));
   });

   onUnmounted(() => {
     resizeObserver?.disconnect();
     terminal?.dispose();
   });
   </script>

   <template>
     <div ref="terminalRef" class="terminal-container"></div>
   </template>

   <style scoped>
   .terminal-container {
     height: 100%;
     width: 100%;
   }
   </style>
   ```

3. Wire up action buttons to spawn commands:
   - "Refine" button → `spawnClaude(projectPath, ['/kanban-refine', taskId])`
   - "Scope" button → `spawnClaude(projectPath, ['/kanban-scope', taskId])`
   - etc.

**Deliverable**: Click action button → Claude runs in terminal → user can interact.

---

### Phase 3: File Watching & Auto-Refresh

**Goal**: Board updates automatically when `.kanban/` files change.

**Steps**:
1. Implement `file-watcher.ts`:
   ```typescript
   import chokidar from 'chokidar';
   import { debounce } from './utils';

   let watcher: chokidar.FSWatcher | null = null;

   export function watchProject(kanbanPath: string, onChange: () => void) {
     const debouncedChange = debounce(onChange, 300);

     watcher = chokidar.watch(kanbanPath, {
       ignored: /(^|[\/\\])\../,  // ignore dotfiles
       persistent: true,
       ignoreInitial: true,
     });

     watcher.on('change', debouncedChange);
     watcher.on('add', debouncedChange);
     watcher.on('unlink', debouncedChange);
   }

   export function stopWatching() {
     watcher?.close();
   }
   ```

2. On file change → re-run `list-tasks.cjs` → emit `kanban:tasks-updated` to renderer

3. Renderer updates reactive state → Vue re-renders board

**Deliverable**: Edit a task file externally → board updates within ~500ms.

---

### Phase 4: Workflow Polish

**Goal**: Smooth UX for the full workflow.

**Steps**:
1. **Command completion handling**:
   - On `pty:exit` with code 0 → show success indicator
   - Auto-scroll terminal to bottom during output
   - Optional: collapse terminal when idle, expand when running

2. **Task drawer improvements**:
   - Show task.md content rendered as HTML
   - Show spec.md and plan.md if they exist (tabs or accordion)
   - Loading states while command runs

3. **Board header**:
   - Project name (from `.kanban/config.yaml`)
   - "Create Task" button → prompts for title → runs `/kanban-create "title"`
   - Refresh button (manual fallback)

4. **Error handling**:
   - Claude not installed → show helpful error
   - Invalid project path → show error, allow re-select
   - PTY crash → show error, allow retry

5. **Keyboard shortcuts**:
   - `Ctrl+N` — New task
   - `Escape` — Close drawer
   - `Ctrl+R` — Refresh board

---

### Phase 5: Packaging & Distribution

**Goal**: Installable app for Windows/Mac/Linux.

**Steps**:
1. Configure electron-builder in `package.json`
2. Set app icon and metadata
3. Build for target platforms:
   ```bash
   pnpm run build:win
   pnpm run build:mac
   pnpm run build:linux
   ```
4. Test on each platform (especially node-pty native module compilation)
5. Document installation requirements (Claude CLI must be installed separately)

---

## File Structure

```
apps/gui/
├── electron/
│   ├── main/
│   │   ├── index.ts
│   │   ├── ipc-handlers.ts
│   │   ├── kanban-service.ts
│   │   ├── pty-service.ts
│   │   └── file-watcher.ts
│   └── preload/
│       └── index.ts
├── src/
│   ├── App.vue
│   ├── components/
│   │   ├── KanbanBoard.vue
│   │   ├── KanbanColumn.vue
│   │   ├── TaskCard.vue
│   │   ├── TaskDrawer.vue
│   │   ├── TerminalPanel.vue
│   │   └── ProjectPicker.vue
│   ├── composables/
│   │   ├── useKanban.ts
│   │   └── useTerminal.ts
│   ├── types/
│   │   └── kanban.ts
│   └── styles/
│       └── main.css
├── package.json            # name: "claude-kanban-gui"
├── tsconfig.json           # extends ../../tsconfig.base.json
├── electron-builder.json
└── vite.config.ts
```

---

## Dependencies

```json
{
  "dependencies": {
    "node-pty": "^1.0.0",
    "xterm": "^5.3.0",
    "xterm-addon-fit": "^0.8.0",
    "chokidar": "^3.5.3",
    "gray-matter": "^4.0.3"
  },
  "devDependencies": {
    "electron-rebuild": "^3.0.0"
  }
}
```

**Important**: `node-pty` is a native module that must be compiled for Electron's Node version. After installing, run:
```bash
npx electron-rebuild
```

Or add to package.json scripts:
```json
{
  "scripts": {
    "postinstall": "electron-rebuild"
  }
}
```

---

## Risk Considerations

| Risk | Mitigation |
|------|------------|
| node-pty native compilation fails on some systems | Provide prebuilt binaries via electron-rebuild, document Node version requirements |
| Claude CLI not found | Check on startup, show clear error with install instructions |
| Large task lists slow down UI | Virtualize the board columns if >100 tasks (unlikely in practice) |
| File watcher misses changes | Debounce + manual refresh button as fallback |
| Windows path handling issues | Use path.join consistently, test on Windows |

---

## Success Criteria

- [ ] User can open a project folder containing `.kanban/`
- [ ] Board displays all tasks in correct columns
- [ ] Clicking a task shows its details and available actions
- [ ] Clicking an action runs the Claude command in embedded terminal
- [ ] User can type responses to Claude's questions
- [ ] Board auto-refreshes when task files change
- [ ] App can be packaged and distributed as installable
