---
id: gui/task-list
title: "Task List Panel"
type: feature
summary: "Collapsible task list grouped by workflow status columns"
keywords: [task-list, panel, collapsible, status, columns, grouped]
related: [gui/desktop-app, gui/task-detail, cli/task-workflow]
updated: 2026-02-18
---

# Task List Panel

## Overview

The Task List Panel is the left panel of the desktop app that displays all tasks grouped by their workflow status. Tasks are organized in collapsible sections matching the kanban columns.

## How It Works

1. App reads all task files from `.kanban/tasks/`
2. Tasks are grouped by status (column)
3. Each column section is collapsible
4. Only columns with tasks are shown
5. Clicking a task selects it and shows details in middle panel

### Column Order

Columns are displayed in priority order (most active first):
1. In Progress
2. Code Check
3. QA
4. Update Docs
5. PR
6. Planned
7. Scoped
8. Refined
9. Backlog
10. Done (collapsed by default)

## Key Concepts

- **Task card**: Shows ID, title, and labels
- **Collapsible section**: Click column header to expand/collapse
- **Auto-refresh**: List refreshes when terminal command completes or when a new task is created

## Interactions

- **Task Detail**: Selecting a task populates the detail panel
- **Terminal**: Create task button runs `/kanban-create` in terminal

## Limitations

- No drag-and-drop (status changes via commands only)
- No filtering or search within the list
