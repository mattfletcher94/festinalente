---
id: vscode/kanban-view
title: "Kanban TreeView"
type: feature
tldr: "Sidebar TreeView showing tasks grouped by workflow status"
summary: "The kanban TreeView displays tasks in collapsible status groups with labels, provides click-to-open navigation, and auto-refreshes when task files change."
keywords: [kanban, treeview, sidebar, tasks, status, groups]
aliases: [sidebar, task-tree]
boundary: "Does not execute skills - click actions open terminals"
references: [skills/overview]
uses: [systems/vscode-extension, systems/cli]
updated: 2026-03-05
---

# Kanban TreeView

> **TL;DR:** Sidebar TreeView showing tasks grouped by workflow status

## Overview

The kanban TreeView is the visual counterpart to `/festina-overview`. It shows all tasks grouped by status in a collapsible tree structure.

**Summary:** See your board without leaving VSCode.

## UI Structure

```
FESTINA LENTE
├── TASKS
│   ├── ▼ In Progress (1)
│   │   └── 007: Add auth ! #feature [SP] 3/5 → Implement
│   ├── ▼ Planned (2)
│   │   ├── 008: Password reset ! #feature [SP] 0/4 → Implement
│   │   └── 009: Email notifications ! #feature [S] → Plan
│   └── ▶ Backlog (3)
├── QUICKS
├── PRODUCT DOCS
├── ENGINEERING DOCS
└── DIRECTIVES
```

## Features

- **Auto-refresh**: File watcher detects `.festinalente/` changes
- **Click to open**: Opens task.xml in editor
- **Status icons**: Visual indicators per status
- **Label badges**: Shows first label on each task
- **Progress indicator**: Shows plan task completion (e.g., `3/7`) in the task description when a plan.xml exists. Tooltip shows "Progress: X/Y tasks completed". Updates automatically when plan.xml changes.

## Boundaries

- **Does NOT:** Execute skills directly
- **Does NOT:** Modify task files → Use skills
