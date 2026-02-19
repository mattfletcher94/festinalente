---
id: "gui/task-list"
title: "Task List"
type: feature
tldr: "Left panel displaying all tasks grouped by workflow column"
summary: "Visual task overview showing tasks organized by status (Backlog, Scoped, Planned, etc.) with collapsible sections and task counts"
keywords: [task-list, panel, workflow-columns, collapsible, task-count]
aliases: [left-panel, task-overview, kanban-board]
boundary: "Does not show task details or execute commands"
related: [gui/task-detail, gui/terminal]
updated: 2026-02-19
---

# Task List

> **TL;DR:** Left panel displaying all tasks grouped by workflow column

## Overview

Task List allows users to see all tasks at a glance, grouped by workflow column. This is important because it provides immediate visibility into work status across the entire workflow.

**Summary:** Visual task overview panel for navigating and understanding task status.

## How It Works

1. User opens a project folder containing `.kanban` directory
2. System scans `.kanban/tasks/` for task.xml files
3. Result: Tasks displayed in collapsible sections by workflow column

### Key Workflows

**Viewing Tasks:**
- Open project via Project Picker
- Tasks automatically load and group by column
- Click section header to expand/collapse
- Click task to view details in center panel

**Summary:** Tasks are automatically loaded and grouped when a project opens.

## Examples

### Typical Usage

```
Backlog (3)
  ├─ Add user authentication
  ├─ Implement search feature
  └─ Fix login bug

Scoped (1)
  └─ Add notification system

In Progress (1)
  └─ Refactor API layer
```

### Edge Case: Empty Project

```
No tasks found. Use /kanban-create to create your first task.
```

**Summary:** Tasks are displayed in a tree-like hierarchy by workflow column.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Show full task details → See [Task Detail](./task-detail.md)
- **Does NOT:** Execute workflow commands → See [Terminal](./terminal.md)
- **Does NOT:** Create or edit tasks (display only)

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Panel size | Width of task list panel | Persisted per session |

## Interactions

- **Task Detail**: Selecting a task updates the detail panel
- **Terminal**: No direct interaction (read-only display)

## Limitations

- Single project at a time (cannot view multiple projects)
- No task filtering or search within the list (relies on column organization)
