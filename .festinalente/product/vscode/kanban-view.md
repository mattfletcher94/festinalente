---
id: "vscode/kanban-view"
title: "Kanban View"
type: feature
tldr: "Sidebar tree view displaying tasks grouped by workflow column, quick tasks, config access, global actions, and documentation browsers"
summary: "VSCode TreeDataProvider showing tasks organized by status (backlog, scoped, planned, in-progress, etc.) with priority indicators, labels, and file status. Includes QUICKS section for quick tasks, Kanban Config, Global Actions, Product Docs, and Engineering Docs sections."
keywords: [kanban, view, treeview, sidebar, columns, status, config, global-actions, product-docs, engineering-docs, quicks, quick-tasks]
aliases: [task-view, kanban-board, tasks-view]
boundary: "Does NOT provide drag-and-drop; tasks move via commands"
related: [vscode/codelens, vscode/terminal, tasks/workflow]
updated: 2026-02-25
verified: 2026-02-25
code_refs:
  - apps/vscode/src/extension.ts
  - apps/vscode/src/capabilities/tasks-view.capability.ts
  - apps/vscode/src/capabilities/quicks-view.capability.ts
  - apps/vscode/src/capabilities/config-view.capability.ts
  - apps/vscode/src/capabilities/global-actions-view.capability.ts
  - apps/vscode/src/capabilities/docs-view.capability.ts
  - apps/vscode/package.json
---

# Kanban View

> **TL;DR:** Sidebar tree view displaying tasks grouped by workflow column, quick tasks, config access, global actions, and documentation browsers

## Overview

Kanban View provides a sidebar TreeView showing all tasks organized by their workflow status. Each column (backlog, scoped, planned, in-progress, check, update-docs, pr, done) expands to show tasks with priority indicators and labels. Clicking a task opens its task.xml file.

The sidebar also includes a "QUICKS" section for quick tasks (fast implementation for simple fixes), a "Kanban Config" section for quick access to config.yaml, a "Global Actions" section providing project-wide commands like documentation mapping, and "Product Docs" and "Engineering Docs" sections for browsing documentation directly from the sidebar.

**Summary:** Visual task organization matching the workflow columns, plus quicks, config, global actions, and documentation browsers.

## How It Works

1. Extension activates when .kanban/ folder detected
2. Scans .kanban/tasks/ for task folders
3. Parses task.xml files for status, priority, label
4. Groups tasks by status column
5. Displays in sidebar with expand/collapse
6. File watcher triggers refresh on changes

### Header Actions

The KANBAN TASKS view header includes action buttons (left to right):

| Button | Icon | Action |
|--------|------|--------|
| Create Task | `add` | Prompts for title, then runs `/kanban-create {title}` |
| Refresh | `refresh` | Refreshes task list |
| Find Task | `search` | Opens QuickPick to search and reveal tasks |

**Rich tooltips:**
- Create Task button: "**Create Task**\nCreate a new task through conversational Q&A. Captures problem, value, and acceptance criteria."
- Find Task button: "**Find Task**\nSearch tasks by ID or title. Select to reveal in tree."

### QUICKS Section

The QUICKS section displays quick tasks from `.kanban/quick/{id}/` folders. Quick tasks are lightweight tasks for fast implementation of simple fixes, created via `/kanban-quick`.

#### Header Actions

| Button | Icon | Action |
|--------|------|--------|
| Create Quick | `add` | Prompts for title, then runs `/kanban-quick {title}` |
| Refresh | `refresh` | Refreshes quick task list |
| Find Quick | `search` | Opens QuickPick to search and reveal quick tasks |

#### Quick Item Display

Each quick task displays as a flat list item showing:
- ID and title (e.g., "001: Fix typo in README")
- Status badge (`in-progress` or `complete`)
- Status icon: Blue play circle for in-progress, green checkmark for complete

Clicking a quick item opens its `quick.xml` file in the editor.

#### File Watcher

The QUICKS view automatically refreshes when files change in `.kanban/quick/`.

### Key Workflows

**View hierarchy:**
- Columns (backlog, scoped, ...) → expandable groups
- Tasks → expandable items with icons
- Each task shows: ID, title, priority indicator, label
- ActionItem → first child when task expanded (shows next workflow action)
- FileItems → task files (task.xml, spec.xml, plan.xml)

**ActionItem behavior:**
- Appears as first child(ren) when expanding a task (except for tasks in "done" status)
- Shows all available actions for the task's current status
- Primary action (first): Green play icon (e.g., "Approve", "Merge", "Continue")
- Secondary actions: Orange reply icon (e.g., "Rework", "Save WIP")
- Clicking any action executes its command in terminal

**Multi-action statuses:**
- check: "Check" (primary) + "Rework" (secondary)
- pr: "Merge" (primary) + "Rework" (secondary)
- in-progress: "Continue" (primary) + "Save WIP" (secondary)

**Find Task workflow:**
- Click search icon in header or use command palette "Kanban: Find Task"
- QuickPick opens showing all tasks with fuzzy search
- Each item displays: "ID: Title" with labels and status/priority
- Type to filter by task ID, title, labels, or status
- Select a task to reveal it in the TreeView
- Parent column expands automatically, task is highlighted

**Refresh triggers:**
- Manual: Command palette "Kanban: Refresh Tasks"
- Automatic: File watcher detects .kanban/tasks changes

**Kanban Config section:**
- Displays config.yaml as a clickable tree item with a gear icon
- Clicking opens config.yaml in the editor
- Shows welcome message when config.yaml doesn't exist
- Automatically refreshes when config.yaml is created, modified, or deleted

**Global Actions section:**
- Provides project-wide commands not tied to specific tasks
- "Map Product Docs" - runs `/kanban-map-product` command
- "Map Engineering Docs" - runs `/kanban-map-engineering` command
- Both actions use green play button icons (consistent with action items)
- Clicking an action opens a terminal and executes the command
- Keyboard accessible: focus with arrow keys, activate with Enter

**Product Docs section:**
- Displays `.kanban/product/` folder hierarchy as a TreeView
- Folders appear as collapsible items with folder icons
- Markdown files (.md) appear as clickable items with file icons
- Clicking a file opens it in the editor
- Automatically refreshes when files change in the product folder
- Sorted alphabetically with folders before files

**Engineering Docs section:**
- Displays `.kanban/engineering/` folder hierarchy as a TreeView
- Same behavior as Product Docs section
- Provides quick access to systems, patterns, and conventions documentation
- Automatically refreshes when files change in the engineering folder

**Summary:** Hierarchical display with automatic refresh, plus global actions and documentation browsers.

## Examples

### Header Buttons

```
KANBAN TASKS                          [+] [↻] [🔍]
                                       │    │   └── Find Task
                                       │    └── Refresh
                                       └── Create Task
```

### Typical Display (Collapsed)

```
KANBAN TASKS                          [+] [↻] [🔍]
├── Backlog (2)
│   ├── 003: Add dark mode [feature] [medium]
│   └── 004: Fix login bug [bug] [high]
├── Scoped (0)
├── Planned (1)
│   └── 002: Add user auth [feature] [medium]
├── In Progress (1)
│   └── 001: Add localStorage [feature] [high]
├── Check (0)
├── Update Docs (0)
├── PR (0)
└── Done (0)
```

### Expanded Task (single action)

```
├── Planned (1)
│   └── ▼ 002: Add user auth [feature] [medium]
│       ├── ▶ Implement              ← ActionItem (green play icon)
│       ├── task.xml                  ← FileItem
│       ├── spec.xml
│       └── plan.xml
```

### Expanded Task (multiple actions)

```
├── Check (1)
│   └── ▼ 001: Add localStorage [feature] [high]
│       ├── ▶ Check                  ← Primary action (green play icon)
│       ├── ↩ Rework                 ← Secondary action (orange reply icon)
│       ├── task.xml                  ← FileItem
│       ├── spec.xml
│       └── plan.xml
```

Clicking any ActionItem runs the corresponding workflow command in the terminal.

### QUICKS Section

```
QUICKS                                    [+] [↻] [🔍]
├── 001: Fix typo in README        complete  ✓
├── 002: Update dependency         in-progress ▶
└── 003: Add missing export        in-progress ▶
```

- Green checkmark (✓) indicates complete status
- Blue play circle (▶) indicates in-progress status
- Clicking any item opens its quick.xml file

### Find Quick QuickPick

```
Search quicks by ID or title...
┌─────────────────────────────────────────────────────────┐
│ 001: Fix typo in README                   complete      │
│ No problem description                                  │
├─────────────────────────────────────────────────────────┤
│ 002: Update dependency                    in-progress   │
│ Package version is outdated                             │
└─────────────────────────────────────────────────────────┘
```

Type to filter by ID, title, or status. Select to reveal in tree.

### Kanban Config Section

```
KANBAN CONFIG
└── config.yaml                  ← ConfigItem (gear icon, clickable)
```

Clicking config.yaml opens it in the editor.

### Global Actions Section

```
GLOBAL ACTIONS
├── Global Actions               ← GlobalActionsGroupItem (tools icon, expanded)
│   ├── ▶ Map Product Docs       ← DocsActionItem (green play icon)
│   └── ▶ Map Engineering Docs   ← DocsActionItem (green play icon)
```

Clicking an action opens a terminal and runs the corresponding `/kanban-*` command. The green play icons provide visual consistency with other executable actions.

### Product Docs Section

```
PRODUCT DOCS
├── auth/                        ← DocsFolderItem (collapsible)
│   ├── login.md                 ← DocsFileItem (clickable)
│   └── registration.md
├── docs/
│   ├── _index.md
│   ├── engineering.md
│   └── product.md
└── vscode/
    └── kanban-view.md
```

Clicking a markdown file opens it in the editor.

### Engineering Docs Section

```
ENGINEERING DOCS
├── conventions/
│   └── file-naming.md
├── patterns/
│   ├── capability-computer.md
│   └── factory-di.md
└── systems/
    ├── cli/
    │   └── _index.md
    ├── storage/
    │   └── _index.md
    └── vscode-extension/
        └── _index.md
```

Same behavior as Product Docs - folders are collapsible, files are clickable.

### Find Task QuickPick

```
Search tasks by ID or title...
┌─────────────────────────────────────────────────────────┐
│ 001: Add localStorage                #feature          │
│ Status: in-progress | Priority: high                   │
├─────────────────────────────────────────────────────────┤
│ 002: Add user auth                   #feature          │
│ Status: planned | Priority: medium                     │
├─────────────────────────────────────────────────────────┤
│ 003: Add dark mode                   #feature          │
│ Status: backlog | Priority: medium                     │
├─────────────────────────────────────────────────────────┤
│ 004: Fix login bug                   #bug              │
│ Status: backlog | Priority: high                       │
└─────────────────────────────────────────────────────────┘
```

Type to filter by ID, title, labels, or status. Select to reveal in tree.

**Summary:** Columns with nested task items, ActionItems show next action, plus config, global actions, and documentation browser sections.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Drag-and-drop to move tasks
- **Does NOT:** Edit task content directly
- **Does NOT:** Show spec/plan details (click to open file)
- **Does NOT:** Customize which actions appear (determined by task status)

## Interactions

- **Task files**: Reads task.xml for display
- **ActionItem**: Triggers workflow commands via terminal
- **GlobalActionItem**: Triggers global commands via terminal
- **CodeLens**: Actions for clicked task
- **File watcher**: Refreshes on changes

## Limitations

- No drag-and-drop (use commands to move)
- Large task counts may slow refresh
- Requires .kanban/ folder in workspace
