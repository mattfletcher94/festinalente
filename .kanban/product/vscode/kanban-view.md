---
id: "vscode/kanban-view"
title: "Kanban View"
type: feature
tldr: "Sidebar tree view displaying tasks grouped by workflow column, config access, and global actions"
summary: "VSCode TreeDataProvider showing tasks organized by status (backlog, scoped, planned, in-progress, etc.) with priority indicators, labels, and file status. Includes Kanban Config and Global Actions sections."
keywords: [kanban, view, treeview, sidebar, columns, status, config, global-actions]
aliases: [task-view, kanban-board, tasks-view]
boundary: "Does NOT provide drag-and-drop; tasks move via commands"
related: [vscode/codelens, vscode/terminal, tasks/workflow]
updated: 2026-02-23
verified: 2026-02-23
code_refs:
  - apps/vscode/src/extension.ts
  - apps/vscode/src/capabilities/tasks-view.capability.ts
  - apps/vscode/src/capabilities/config-view.capability.ts
  - apps/vscode/src/capabilities/global-actions-view.capability.ts
  - apps/vscode/package.json
---

# Kanban View

> **TL;DR:** Sidebar tree view displaying tasks grouped by workflow column, config access, and global actions

## Overview

Kanban View provides a sidebar TreeView showing all tasks organized by their workflow status. Each column (backlog, scoped, planned, in-progress, codecheck, qa, update-docs, pr, done) expands to show tasks with priority indicators and labels. Clicking a task opens its task.xml file.

The sidebar also includes a "Kanban Config" section for quick access to config.yaml, and a "Global Actions" section providing project-wide commands like documentation mapping.

**Summary:** Visual task organization matching the workflow columns, plus config and global actions.

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
| Discovery | `comment-discussion` | Opens terminal and runs `/kanban-discover` |
| Create Task | `add` | Prompts for title, then runs `/kanban-create {title}` |
| Find Task | `search` | Opens QuickPick to search and reveal tasks |
| Refresh | `refresh` | Refreshes task list |

**Rich tooltips:**
- Discovery button: "**Discovery Session**\nExplore questions and analyze the codebase through Socratic Q&A before creating tasks."
- Create Task button: "**Create Task**\nCreate a new task through conversational Q&A. Captures problem, value, and acceptance criteria."
- Find Task button: "**Find Task**\nSearch tasks by ID or title. Select to reveal in tree."

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
- qa: "Approve" (primary) + "Rework" (secondary)
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
- Each action uses a distinct ThemeIcon (book, symbol-structure)
- Clicking an action opens a terminal and executes the command
- Keyboard accessible: focus with arrow keys, activate with Enter

**Summary:** Hierarchical display with automatic refresh, plus global actions.

## Examples

### Header Buttons

```
KANBAN TASKS                    [💬] [+] [🔍] [↻]
                                 │    │    │   └── Refresh
                                 │    │    └── Find Task
                                 │    └── Create Task
                                 └── Discovery Session
```

### Typical Display (Collapsed)

```
KANBAN TASKS                    [💬] [+] [🔍] [↻]
├── Backlog (2)
│   ├── 003: Add dark mode [feature] [medium]
│   └── 004: Fix login bug [bug] [high]
├── Scoped (0)
├── Planned (1)
│   └── 002: Add user auth [feature] [medium]
├── In Progress (1)
│   └── 001: Add localStorage [feature] [high]
├── Code Check (0)
├── QA (0)
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
├── QA (1)
│   └── ▼ 001: Add localStorage [feature] [high]
│       ├── ▶ Approve                ← Primary action (green play icon)
│       ├── ↩ Rework                 ← Secondary action (orange reply icon)
│       ├── task.xml                  ← FileItem
│       ├── spec.xml
│       └── plan.xml
```

Clicking any ActionItem runs the corresponding workflow command in the terminal.

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
│   ├── Map Product Docs         ← GlobalActionItem (book icon)
│   └── Map Engineering Docs     ← GlobalActionItem (symbol-structure icon)
```

Clicking an action opens a terminal and runs the corresponding `/kanban-*` command.

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

**Summary:** Columns with nested task items, ActionItems show next action, plus config and global actions sections.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Drag-and-drop to move tasks
- **Does NOT:** Edit task content directly
- **Does NOT:** Show spec/plan details (click to open file)
- **Does NOT:** Customize which actions appear (determined by task status)

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| kanban.autoplay | Auto-run next action (experimental) | false |

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
