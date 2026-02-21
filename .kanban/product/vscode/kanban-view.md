---
id: "vscode/kanban-view"
title: "Kanban View"
type: feature
tldr: "Sidebar tree view displaying tasks grouped by workflow column plus config access"
summary: "VSCode TreeDataProvider showing tasks organized by status (backlog, scoped, planned, in-progress, etc.) with priority indicators, labels, and file status. Includes a Kanban Config section for quick access to config.yaml."
keywords: [kanban, view, treeview, sidebar, columns, status, config]
aliases: [task-view, kanban-board, tasks-view]
boundary: "Does NOT provide drag-and-drop; tasks move via commands"
related: [vscode/codelens, vscode/terminal, tasks/workflow]
updated: 2026-02-21
verified: 2026-02-21
code_refs:
  - apps/vscode/src/extension.ts
  - apps/vscode/src/capabilities/tasks-view.capability.ts
  - apps/vscode/src/capabilities/config-view.capability.ts
---

# Kanban View

> **TL;DR:** Sidebar tree view displaying tasks grouped by workflow column plus config access

## Overview

Kanban View provides a sidebar TreeView showing all tasks organized by their workflow status. Each column (backlog, scoped, planned, in-progress, codecheck, qa, update-docs, pr, done) expands to show tasks with priority indicators and labels. Clicking a task opens its task.xml file.

The sidebar also includes a "Kanban Config" section that provides quick access to config.yaml without navigating the file system.

**Summary:** Visual task organization matching the workflow columns, plus config access.

## How It Works

1. Extension activates when .kanban/ folder detected
2. Scans .kanban/tasks/ for task folders
3. Parses task.xml files for status, priority, label
4. Groups tasks by status column
5. Displays in sidebar with expand/collapse
6. File watcher triggers refresh on changes

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

**Refresh triggers:**
- Manual: Command palette "Kanban: Refresh Tasks"
- Automatic: File watcher detects .kanban/tasks changes

**Kanban Config section:**
- Displays config.yaml as a clickable tree item with a gear icon
- Clicking opens config.yaml in the editor
- Shows welcome message when config.yaml doesn't exist
- Automatically refreshes when config.yaml is created, modified, or deleted

**Summary:** Hierarchical display with automatic refresh.

## Examples

### Typical Display (Collapsed)

```
KANBAN TASKS
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

**Summary:** Columns with nested task items, ActionItems show next action, plus config section.

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
- **CodeLens**: Actions for clicked task
- **File watcher**: Refreshes on changes

## Limitations

- No drag-and-drop (use commands to move)
- Large task counts may slow refresh
- Requires .kanban/ folder in workspace
