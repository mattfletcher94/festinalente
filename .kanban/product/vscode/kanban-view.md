---
id: "vscode/kanban-view"
title: "Kanban View"
type: feature
tldr: "Sidebar tree view displaying tasks grouped by workflow column"
summary: "VSCode TreeDataProvider showing tasks organized by status (backlog, scoped, planned, in-progress, etc.) with priority indicators, labels, and file status."
keywords: [kanban, view, treeview, sidebar, columns, status]
aliases: [task-view, kanban-board, tasks-view]
boundary: "Does NOT provide drag-and-drop; tasks move via commands"
related: [vscode/codelens, vscode/terminal, tasks/workflow]
updated: 2026-02-20
---

# Kanban View

> **TL;DR:** Sidebar tree view displaying tasks grouped by workflow column

## Overview

Kanban View provides a sidebar TreeView showing all tasks organized by their workflow status. Each column (backlog, scoped, planned, in-progress, codecheck, qa, update-docs, pr, done) expands to show tasks with priority indicators and labels. Clicking a task opens its task.xml file.

**Summary:** Visual task organization matching the workflow columns.

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
- Tasks → clickable items with icons
- Each task shows: ID, title, priority indicator, label

**Refresh triggers:**
- Manual: Command palette "Kanban: Refresh Tasks"
- Automatic: File watcher detects .kanban/tasks changes

**Summary:** Hierarchical display with automatic refresh.

## Examples

### Typical Display

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

**Summary:** Columns with nested task items.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Drag-and-drop to move tasks
- **Does NOT:** Edit task content directly
- **Does NOT:** Show spec/plan details (click to open file)

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| kanban.autoplay | Auto-run next action (experimental) | false |

## Interactions

- **Task files**: Reads task.xml for display
- **CodeLens**: Actions for clicked task
- **File watcher**: Refreshes on changes

## Limitations

- No drag-and-drop (use commands to move)
- Large task counts may slow refresh
- Requires .kanban/ folder in workspace
