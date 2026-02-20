# Claude Kanban: Electron to VSCode Extension Migration Plan

## Status: Ready for Implementation

---

## 1. Current System Overview

### What is Claude Kanban?
An AI-powered task management system designed for Claude Code (Anthropic's CLI). It provides:
- Kanban-style project management with 9-stage workflow (backlog → scoped → planned → in-progress → codecheck → qa → update-docs → pr → done)
- Real-time terminal integration for executing Claude "skills"
- Task metadata stored as XML files in `.kanban/` folders

### Current Architecture

```
claude-kanban/
├── apps/
│   ├── kanban/          # Backend: Skill definitions & CLI tools (PORTABLE)
│   └── gui/             # Frontend: Electron desktop application (TO BE REPLACED)
├── package.json         # Monorepo root (Turbo build system)
└── pnpm-workspace.yaml
```

### Electron GUI Architecture Pattern

```
Component (Vue)
    ↓
Orchestrator (State + Logic)
    ├─ Capability (External Integration - IPC to Electron)
    └─ Computer (Business Logic - Pure functions)
```

**Key Orchestrators:**
- `AppOrchestrator` - Top-level coordination, autoplay logic
- `TasksOrchestrator` - Task loading, selection, content
- `TerminalOrchestrator` - PTY state and command execution
- `SettingsOrchestrator` - Persistence and preferences

### Key Dependencies

**Electron-specific (need replacement):**
- `electron` - Native desktop shell
- `electron-store` - Persistent settings
- `node-pty` - Pseudo-terminal interface
- IPC handlers for file system access

**Portable (can be reused):**
- `fast-xml-parser` - XML parsing for task files
- `gray-matter` - Markdown frontmatter parsing
- `js-yaml` - YAML configuration parsing
- Orchestrator business logic (computers)

### Main Features

1. **Task Management** - Parse `.kanban/tasks/{id}/` directories
2. **Kanban Board** - Visual columns for each status
3. **Terminal Integration** - xterm.js with PTY emulation
4. **Task Actions** - Status-driven action buttons that run Claude skills
5. **Resizable Three-Panel Layout** - Task List | Task Detail | Terminal
6. **Settings Persistence** - Panel sizes, last project path

---

## 2. Discovery Questions

### Q1: What is the primary use case for the kanban system?
**Answer:** The kanban board visualization is NOT essential. The value is in how the GUI renders task content and the lightweight interaction model. User wants something that feels "better and more lightweight" than a separate Electron app.

### Q2: What functionality is essential vs nice-to-have?
**Answer:**
- Essential: Task dashboard similar to GUI, ability to run actions, view task/spec/plan content
- Leverage VSCode's power: Files open in native VSCode editor (not read-only viewer)
- XML editing uses VSCode's built-in XML support - no custom editor needed

### Q3: Should the VSCode extension replicate the exact UI or adapt to VSCode conventions?
**Answer:** Fully native VSCode approach:
- Activity Bar icon + TreeView in sidebar for task navigation
- Native XML editor with CodeLens for actions and Editor Title bar for status badges
- Files open in native VSCode editor (not read-only viewer)
- Terminal integration uses VSCode's Pseudoterminal API
- No WebView needed

### Q4: How should terminal/autoplay work in VSCode?
**Answer:** Use VSCode's **Pseudoterminal API** with child_process.spawn:
- Spawn `claude` CLI with command arguments
- Pipe stdout through Pseudoterminal to VSCode terminal panel
- Buffer output and detect `[KANBAN_COMPLETE]` marker (same as current Electron app)
- Trigger autoplay on detection
- This pattern directly mirrors the existing `pty-service.ts` implementation

---

## 3. VSCode Extension Architecture (Confirmed)

### UI Layout

```
┌──────┬─────────────────┬──────────────────────────────────┐
│ Act- │   Side Bar      │         Editor Area              │
│ ivity│   (TreeView)    │   (task.xml in native editor)    │
│ Bar  │                 │                                  │
│      │ ▼ In Progress   │ task.xml    [planned][med][feature] │
│ [Ex] │   └ Task 005    │ ─────────────────────────────────── │
│ [Se] │ ▶ Code Check    │ ▶ Implement  |  📄 Spec  |  📄 Plan │
│ [Git]│ ▶ QA            │ ─────────────────────────────────── │
│ [Kb] │ ▼ Planned       │ <task id="001" status="planned">    │
│  ↑   │   └ Task 001 ◀──│   <title>Add settings panel...    │
│ Our  │ ▼ Backlog       │   ...                             │
│ icon │   └ Task 003    │                                  │
├──────┴─────────────────┴──────────────────────────────────┤
│ Terminal (VSCode native with Pseudoterminal)              │
│ $ claude /kanban-implement 001                            │
└───────────────────────────────────────────────────────────┘
```

### Component Mapping

| Electron Component | VSCode Equivalent |
|-------------------|-------------------|
| Task List Panel | **Activity Bar icon** + **TreeView** in Side Bar |
| Task Detail Panel | **Native XML editor** with **CodeLens** + **Editor Title Actions** |
| Terminal Panel | **Pseudoterminal API** in VSCode terminal |
| Autoplay Toggle | **VSCode Setting** (`kanban.autoplay`) + optional status bar indicator |
| Status/Priority/Labels | **Editor Title Bar** badges |
| Settings | **VSCode Settings** (`settings.json`) |

### TreeView Structure

Status groups ordered by workflow priority (active work first):

```
▼ In Progress (1)
    ▼ 005: Implement auth [high]
        📄 task.xml
        📄 spec.xml
        📄 plan.xml
▶ Code Check (0)
▶ QA (0)
▶ Update Docs (0)
▶ PR (0)
▼ Planned (1)
    ▼ 001: Add settings panel [medium]
        📄 task.xml
        📄 spec.xml
        📄 plan.xml
▼ Scoped (1)
    ▼ 002: Refactor API [medium]
        📄 task.xml
        📄 spec.xml
▼ Backlog (2)
    ▼ 003: Fix login bug [high]
        📄 task.xml
    ▼ 004: Add dark mode [low]
        📄 task.xml
▶ Done (5)                              ← Collapsed by default
```

- **All 9 status groups shown** (empty ones collapsed)
- **Order**: in-progress → codecheck → qa → update-docs → pr → planned → scoped → backlog → done
- Task items show: ID + title + priority
- Child nodes for available files (task.xml, spec.xml, plan.xml)
- Clicking file → runs `kanban.openFile` command → opens in native editor

### Key VSCode APIs

1. **TreeDataProvider** - Task list grouped by status, tasks as parents, files as children
2. **CodeLensProvider** - Inline actions (Implement, Scope, Open Spec, Open Plan)
3. **Pseudoterminal** - Terminal with output capture for `[KANBAN_COMPLETE]` detection
4. **Editor Title Actions** - Status badges and quick action buttons
5. **FileSystemWatcher** - Refresh on `.kanban` file changes

### What's Portable from Current Codebase

- Task data model and XML parsing (`fast-xml-parser`)
- Task actions computer (status → available actions logic)
- Skill definitions (`apps/kanban/` - fully portable)
- `[KANBAN_COMPLETE]` marker detection logic

### Extension Settings

```json
{
  "kanban.autoplay": {
    "type": "boolean",
    "default": false,
    "description": "Automatically advance to next workflow stage when a command completes"
  }
}
```

### Commands

| Command | Description | Triggered By |
|---------|-------------|--------------|
| `kanban.open` | Open/focus the Kanban sidebar view | Command palette |
| `kanban.refresh` | Refresh task list from `.kanban` folder | Command palette, file watcher |
| `kanban.runAction` | Run a kanban skill (scope, plan, implement, etc.) | CodeLens click |
| `kanban.openFile` | Open a task/spec/plan file in editor | TreeView click, CodeLens link |

### Command Arguments

```typescript
// kanban.runAction
interface RunActionArgs {
  command: string;  // e.g., "/kanban-implement 001"
  taskId: string;   // e.g., "001"
}

// kanban.openFile
interface OpenFileArgs {
  filePath: string; // Absolute path to file
}
```

---

## 4. Migration Approach

**Confirmed: Full Native VSCode Extension**

- TreeView for task list (sidebar)
- Native XML editor with CodeLens for actions
- Editor Title Actions for status badges
- Pseudoterminal API for command execution with autoplay
- VSCode settings for configuration

---

## 5. Development Setup

### Project Structure

```
apps/vscode/                          # New VSCode extension
├── .vscode/
│   └── launch.json                   # F5 debug config
├── src/
│   ├── extension.ts                  # Entry point (activate/deactivate)
│   ├── tasks/
│   │   ├── task-tree-provider.ts     # TreeDataProvider for sidebar
│   │   ├── task-parser.ts            # XML parsing (port from gui)
│   │   └── task-types.ts             # Task interfaces
│   ├── terminal/
│   │   ├── kanban-terminal.ts        # Pseudoterminal implementation
│   │   └── autoplay.ts               # [KANBAN_COMPLETE] detection
│   ├── editor/
│   │   ├── codelens-provider.ts      # CodeLens for actions
│   │   └── editor-title-actions.ts   # Status badges
│   └── utils/
│       └── file-watcher.ts           # Watch .kanban for changes
├── package.json                      # Extension manifest
├── tsconfig.json
└── README.md
```

### Dev Workflow

1. **F5** → Launches Extension Development Host (new VSCode window with extension loaded)
2. **Open folder with `.kanban/`** → Test TreeView, CodeLens, etc.
3. **Make changes** → `Ctrl+R` / `Cmd+R` to reload dev window
4. **Breakpoints** → Set in original VSCode, hit in Extension Development Host
5. **Debug Console** → Shows extension output

### tsconfig.json

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "out",
    "lib": ["ES2020"],
    "sourceMap": true,
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "exclude": ["node_modules", ".vscode-test"]
}
```

### Monorepo Integration

The extension lives at `apps/vscode/` within the existing monorepo:

```
claude-kanban/
├── apps/
│   ├── kanban/      # Skills (unchanged)
│   ├── gui/         # Electron app (deprecated eventually)
│   └── vscode/      # NEW: VSCode extension
├── .vscode/
│   └── launch.json  # Debug config at monorepo root
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

### launch.json (Monorepo Root)

Run the extension from monorepo root with F5:

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run VSCode Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}/apps/vscode"],
      "outFiles": ["${workspaceFolder}/apps/vscode/out/**/*.js"],
      "preLaunchTask": "compile:vscode"
    }
  ]
}
```

### tasks.json (Monorepo Root)

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "compile:vscode",
      "type": "npm",
      "script": "compile",
      "path": "apps/vscode",
      "problemMatcher": ["$tsc"]
    }
  ]
}
```

---

## 6. Implementation Plan

### Core Architecture

**Workspace Resolution:**
```typescript
// Find .kanban folder in workspace
function findKanbanFolder(): string | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) return undefined;

  for (const folder of workspaceFolders) {
    const kanbanPath = path.join(folder.uri.fsPath, '.kanban');
    if (fs.existsSync(kanbanPath)) {
      return kanbanPath;
    }
  }
  return undefined;
}
```

**Extension Entry Point (`extension.ts`):**
```typescript
import * as vscode from 'vscode';
import { TaskTreeProvider } from './tasks/task-tree-provider';
import { KanbanCodeLensProvider } from './editor/codelens-provider';
import { KanbanTerminal } from './terminal/kanban-terminal';

export function activate(context: vscode.ExtensionContext) {
  const kanbanPath = findKanbanFolder();
  if (!kanbanPath) {
    return; // No .kanban folder, extension inactive
  }

  // Set context for "when" clauses
  vscode.commands.executeCommand('setContext', 'kanban.hasKanbanFolder', true);

  // Register TreeView
  const treeProvider = new TaskTreeProvider(kanbanPath);
  vscode.window.registerTreeDataProvider('kanbanTasks', treeProvider);

  // Register CodeLens
  const codeLensProvider = new KanbanCodeLensProvider(kanbanPath);
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { pattern: '**/.kanban/tasks/*/task.xml' },
      codeLensProvider
    )
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('kanban.refresh', () => treeProvider.refresh()),
    vscode.commands.registerCommand('kanban.runAction', (args) => runAction(args)),
    vscode.commands.registerCommand('kanban.openFile', (args) => openFile(args))
  );

  // File watcher
  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(kanbanPath, 'tasks/**/*.xml')
  );
  watcher.onDidChange(() => treeProvider.refresh());
  watcher.onDidCreate(() => treeProvider.refresh());
  watcher.onDidDelete(() => treeProvider.refresh());
  context.subscriptions.push(watcher);
}

export function deactivate() {}
```

---

### Step 1: Extension Scaffold
- [ ] Create `apps/vscode/` project structure
- [ ] Configure `package.json` with extension manifest
- [ ] Add Activity Bar icon and View Container contribution
- [ ] Basic `extension.ts` with activate/deactivate
- [ ] Verify F5 launches and icon appears

### Step 2: TreeView - Task List
- [ ] Port `task-types.ts` from gui
- [ ] Port XML parsing logic (use `fast-xml-parser`)
- [ ] Implement `TaskTreeProvider` (TreeDataProvider)
- [ ] Group tasks by status (backlog, scoped, planned, etc.)
- [ ] Show task ID + title + priority
- [ ] Child nodes for task.xml, spec.xml, plan.xml
- [ ] Click file → opens in editor
- [ ] Empty groups shown collapsed

**TreeView Implementation:**
```typescript
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { parseTaskXml, ParsedTask } from './task-parser';

type TreeItem = StatusGroup | TaskItem | FileItem;

export class TaskTreeProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  onDidChangeTreeData = this._onDidChangeTreeData.event;

  private readonly COLUMN_ORDER = [
    'in-progress', 'codecheck', 'qa', 'update-docs', 'pr',
    'planned', 'scoped', 'backlog', 'done'
  ];

  constructor(private kanbanPath: string) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeItem): TreeItem[] {
    if (!element) {
      return this.getStatusGroups();
    }
    if (element instanceof StatusGroup) {
      return this.getTasksForStatus(element.status);
    }
    if (element instanceof TaskItem) {
      return this.getFilesForTask(element.taskPath);
    }
    return [];
  }

  private getStatusGroups(): StatusGroup[] {
    const tasks = this.loadAllTasks();
    const groups: StatusGroup[] = [];

    for (const status of this.COLUMN_ORDER) {
      const count = tasks.filter(t => t.status === status).length;
      const collapsed = status === 'done' || count === 0;
      groups.push(new StatusGroup(status, count, collapsed));
    }
    return groups;
  }

  private getTasksForStatus(status: string): TaskItem[] {
    return this.loadAllTasks()
      .filter(t => t.status === status)
      .map(t => new TaskItem(t));
  }

  private getFilesForTask(taskPath: string): FileItem[] {
    const files: FileItem[] = [];
    for (const name of ['task.xml', 'spec.xml', 'plan.xml']) {
      const filePath = path.join(taskPath, name);
      if (fs.existsSync(filePath)) {
        files.push(new FileItem(name, filePath));
      }
    }
    return files;
  }

  private loadAllTasks(): (ParsedTask & { taskPath: string })[] {
    const tasksDir = path.join(this.kanbanPath, 'tasks');
    if (!fs.existsSync(tasksDir)) return [];

    const tasks: (ParsedTask & { taskPath: string })[] = [];
    for (const id of fs.readdirSync(tasksDir)) {
      const taskPath = path.join(tasksDir, id);
      const taskXml = path.join(taskPath, 'task.xml');
      if (fs.existsSync(taskXml)) {
        const content = fs.readFileSync(taskXml, 'utf-8');
        const task = parseTaskXml(content);
        tasks.push({ ...task, taskPath });
      }
    }
    return tasks;
  }
}

class StatusGroup extends vscode.TreeItem {
  constructor(public status: string, count: number, collapsed: boolean) {
    super(
      `${formatStatusName(status)} (${count})`,
      collapsed
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.Expanded
    );
  }
}

class TaskItem extends vscode.TreeItem {
  constructor(public task: ParsedTask & { taskPath: string }) {
    super(
      `${task.id}: ${task.title}`,
      vscode.TreeItemCollapsibleState.Collapsed
    );
    this.description = task.priority ? `[${task.priority}]` : undefined;
    this.taskPath = task.taskPath;
  }
  taskPath: string;
}

class FileItem extends vscode.TreeItem {
  constructor(name: string, public filePath: string) {
    super(name, vscode.TreeItemCollapsibleState.None);
    this.command = {
      command: 'kanban.openFile',
      title: 'Open File',
      arguments: [{ filePath }]
    };
    this.iconPath = new vscode.ThemeIcon('file');
  }
}

// Helper: Format status name for display
function formatStatusName(status: string): string {
  const names: Record<string, string> = {
    'in-progress': 'In Progress',
    'codecheck': 'Code Check',
    'qa': 'QA',
    'update-docs': 'Update Docs',
    'pr': 'PR',
    'planned': 'Planned',
    'scoped': 'Scoped',
    'backlog': 'Backlog',
    'done': 'Done'
  };
  return names[status] || status;
}

// Command: Open file in editor
function openFile(args: { filePath: string }) {
  const uri = vscode.Uri.file(args.filePath);
  vscode.window.showTextDocument(uri);
}
```

### Step 3: CodeLens - Actions
- [ ] Implement `KanbanCodeLensProvider`
- [ ] Detect `.kanban/**/task.xml` files
- [ ] Port `task-actions.computer.ts` logic (status → available actions)
- [ ] Show action CodeLens (e.g., "▶ Implement", "▶ Scope")
- [ ] Show "Open Spec" / "Open Plan" links
- [ ] Register CodeLens provider for XML files

**CodeLens Implementation:**
```typescript
import * as vscode from 'vscode';
import { parseTaskXml } from './task-parser';
import { getActions } from './task-actions';

export class KanbanCodeLensProvider implements vscode.CodeLensProvider {
  constructor(private kanbanPath: string) {}

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const content = document.getText();
    const task = parseTaskXml(content);
    const actions = getActions(task);

    const lenses: vscode.CodeLens[] = [];
    const topLine = new vscode.Range(0, 0, 0, 0);

    // Action buttons (Scope, Plan, Implement, etc.)
    for (const action of actions) {
      lenses.push(new vscode.CodeLens(topLine, {
        title: `▶ ${action.label}`,
        command: 'kanban.runAction',
        arguments: [{ command: action.command, taskId: task.id }]
      }));
    }

    // Open Spec link (if exists)
    const taskDir = path.dirname(document.uri.fsPath);
    if (fs.existsSync(path.join(taskDir, 'spec.xml'))) {
      lenses.push(new vscode.CodeLens(topLine, {
        title: '📄 Spec',
        command: 'kanban.openFile',
        arguments: [{ filePath: path.join(taskDir, 'spec.xml') }]
      }));
    }

    // Open Plan link (if exists)
    if (fs.existsSync(path.join(taskDir, 'plan.xml'))) {
      lenses.push(new vscode.CodeLens(topLine, {
        title: '📄 Plan',
        command: 'kanban.openFile',
        arguments: [{ filePath: path.join(taskDir, 'plan.xml') }]
      }));
    }

    return lenses;
  }
}
```

### Step 4: Terminal - Command Execution
- [ ] Implement `KanbanPseudoterminal`
- [ ] Spawn `claude` process with command argument
- [ ] Pipe stdout/stderr to terminal
- [ ] Buffer output and detect `[KANBAN_COMPLETE]`
- [ ] Clean up process on terminal close
- [ ] CodeLens action triggers terminal command

**Pseudoterminal Implementation:**
```typescript
import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';

class KanbanPseudoterminal implements vscode.Pseudoterminal {
  private writeEmitter = new vscode.EventEmitter<string>();
  private closeEmitter = new vscode.EventEmitter<number>();
  onDidWrite = this.writeEmitter.event;
  onDidClose = this.closeEmitter.event;

  private process: ChildProcess | null = null;
  private outputBuffer = '';

  constructor(
    private cwd: string,
    private command: string,
    private onComplete: () => void
  ) {}

  open(): void {
    this.writeEmitter.fire(`Running: claude ${this.command}\r\n\r\n`);

    this.process = spawn('claude', [this.command], {
      cwd: this.cwd,
      shell: true
    });

    this.process.stdout?.on('data', (data) => {
      const text = data.toString();
      this.writeEmitter.fire(text.replace(/\n/g, '\r\n'));
      this.checkForCompletion(text);
    });

    this.process.stderr?.on('data', (data) => {
      this.writeEmitter.fire(data.toString().replace(/\n/g, '\r\n'));
    });

    this.process.on('close', (code) => {
      this.closeEmitter.fire(code ?? 0);
    });
  }

  close(): void {
    this.process?.kill();
  }

  private checkForCompletion(text: string): void {
    this.outputBuffer += text;
    if (this.outputBuffer.length > 2000) {
      this.outputBuffer = this.outputBuffer.slice(-2000);
    }

    if (this.outputBuffer.includes('[KANBAN_COMPLETE]')) {
      this.onComplete();
      setTimeout(() => this.process?.kill(), 500);
    }
  }
}

// Usage: Run action from CodeLens
function runAction(args: { command: string; taskId: string }) {
  const kanbanPath = findKanbanFolder();
  if (!kanbanPath) return;

  const workspaceRoot = path.dirname(kanbanPath);
  const autoplay = vscode.workspace.getConfiguration('kanban').get('autoplay');

  const pty = new KanbanPseudoterminal(
    workspaceRoot,
    args.command,
    () => {
      if (autoplay) {
        // Refresh and run next action
        vscode.commands.executeCommand('kanban.refresh');
        // TODO: Determine and run next action
      }
    }
  );

  const terminal = vscode.window.createTerminal({
    name: `Kanban: ${args.taskId}`,
    pty
  });
  terminal.show();
}
```

### Step 5: Editor Title Actions
- [ ] Add status badge to editor title (planned, in-progress, etc.)
- [ ] Add priority indicator
- [ ] Add labels display
- [ ] Only show for `.kanban/**/task.xml` files

### Step 6: Autoplay
- [ ] Add `kanban.autoplay` setting in package.json
- [ ] On `[KANBAN_COMPLETE]` detection, check setting
- [ ] If enabled, determine next action and run automatically
- [ ] Refresh TreeView after command completes

### Step 7: File Watcher
- [ ] Watch `.kanban/` folder for changes
- [ ] Refresh TreeView when files added/removed/modified
- [ ] Update CodeLens when task status changes

### Step 8: Polish
- [ ] Error handling (missing .kanban folder, parse errors)
- [ ] Status bar indicator (optional)
- [ ] Icon design for Activity Bar
- [ ] Test on Windows/Mac/Linux

---

## 7. Package.json Manifest (Key Parts)

```json
{
  "name": "claude-kanban",
  "displayName": "Claude Kanban",
  "description": "AI-powered task management for Claude Code",
  "version": "0.1.0",
  "publisher": "your-publisher-id",
  "engines": { "vscode": "^1.85.0" },
  "categories": ["Other"],
  "activationEvents": [
    "workspaceContains:**/.kanban"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "kanban",
          "title": "Kanban",
          "icon": "resources/kanban-icon.svg"
        }
      ]
    },
    "views": {
      "kanban": [
        {
          "id": "kanbanTasks",
          "name": "Tasks",
          "when": "kanban.hasKanbanFolder"
        }
      ]
    },
    "commands": [
      {
        "command": "kanban.open",
        "title": "Kanban: Open"
      },
      {
        "command": "kanban.refresh",
        "title": "Kanban: Refresh Tasks",
        "icon": "$(refresh)"
      },
      {
        "command": "kanban.runAction",
        "title": "Kanban: Run Action"
      },
      {
        "command": "kanban.openFile",
        "title": "Kanban: Open File"
      }
    ],
    "menus": {
      "view/title": [
        {
          "command": "kanban.refresh",
          "when": "view == kanbanTasks",
          "group": "navigation"
        }
      ],
      "editor/title": [
        {
          "command": "kanban.runAction",
          "when": "resourcePath =~ /\\.kanban[\\\\\\/]tasks[\\\\\\/].*task\\.xml$/",
          "group": "navigation"
        }
      ]
    },
    "configuration": {
      "title": "Kanban",
      "properties": {
        "kanban.autoplay": {
          "type": "boolean",
          "default": false,
          "description": "Automatically advance to next workflow stage when a command completes"
        }
      }
    }
  },
  "scripts": {
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "lint": "eslint src --ext ts"
  },
  "dependencies": {
    "fast-xml-parser": "^4.x"
  },
  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "@types/node": "^20.x",
    "@vscode/vsce": "^2.x",
    "typescript": "^5.x"
  }
}
```

---

## 8. Portable Code from Existing Codebase

These files can be ported directly with minimal changes:

| Source File | Port To | Changes Needed |
|-------------|---------|----------------|
| `apps/gui/src/tasks/task-types.ts` | `src/tasks/task-types.ts` | Remove branded type if problematic |
| `apps/gui/src/tasks/task-actions.computer.ts` | `src/tasks/task-actions.ts` | Remove CSS class methods (not needed in VSCode) |
| `apps/gui/src/tasks/task-grouping.computer.ts` | `src/tasks/task-grouping.ts` | Use for column ordering logic |
| `apps/kanban/src/scripts/lib/xml-parser.ts` | `src/tasks/task-parser.ts` | Already standalone, copy directly |
| `apps/gui/electron/main/pty-service.ts` | `src/terminal/kanban-terminal.ts` | Replace node-pty with child_process + Pseudoterminal |

### Key Logic to Preserve

**Task Actions (status → available commands):**
```typescript
// From task-actions.computer.ts
switch (task.status) {
  case 'backlog':    return [{ label: 'Scope',     command: '/kanban-scope {id}' }];
  case 'scoped':     return [{ label: 'Plan',      command: '/kanban-plan {id}' }];
  case 'planned':    return [{ label: 'Implement', command: '/kanban-implement {id}' }];
  case 'in-progress': return [
    { label: 'Continue', command: '/kanban-implement {id}' },
    { label: 'Save WIP', command: '/kanban-save {id}' }
  ];
  case 'codecheck':  return [{ label: 'Run Checks', command: '/kanban-codecheck {id}' }];
  case 'qa':         return [
    { label: 'Approve', command: '/kanban-approve {id}' },
    { label: 'Rework',  command: '/kanban-rework {id}' }
  ];
  case 'update-docs': return [{ label: 'Update Docs', command: '/kanban-docs {id}' }];
  case 'pr':         return [
    { label: 'Merge',  command: '/kanban-merge {id}' },
    { label: 'Rework', command: '/kanban-rework {id}' }
  ];
  case 'done':       return [];
}
```

**Column Ordering (priority order):**
```typescript
// From task-grouping.computer.ts
const COLUMN_ORDER = [
  'in-progress',  // Active work first
  'codecheck',
  'qa',
  'update-docs',
  'pr',
  'planned',      // Ready to start
  'scoped',
  'backlog',      // Not yet scoped
  'done'          // Collapsed by default
];
```

**Completion Marker Detection:**
```typescript
// From pty-service.ts - detect skill completion
const stripped = stripAnsi(outputBuffer);
if (stripped.includes('[KANBAN_COMPLETE]')) {
  // Task complete - trigger autoplay if enabled
}
```

---

## 9. Open Questions (Resolved)

| Question | Answer |
|----------|--------|
| Kanban board essential? | No - task list + editor is sufficient |
| WebView needed? | No - native TreeView + CodeLens + Editor Title Actions |
| Terminal approach? | Pseudoterminal API with child_process spawn |
| Autoplay mechanism? | Detect `[KANBAN_COMPLETE]`, check setting, run next action |
| Settings location? | VSCode settings (`kanban.autoplay`) |
| Task selection behavior? | Click opens task.xml in native editor |

---

## 10. References

- [VSCode Extension API](https://code.visualstudio.com/api)
- [TreeView Guide](https://code.visualstudio.com/api/extension-guides/tree-view)
- [CodeLens Provider](https://code.visualstudio.com/api/references/vscode-api#CodeLensProvider)
- [Pseudoterminal API](https://code.visualstudio.com/api/references/vscode-api#Pseudoterminal)
- [Extension Samples](https://github.com/microsoft/vscode-extension-samples)
