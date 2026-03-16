---
id: vscode/kanban-view
title: "Kanban TreeView"
type: feature
tldr: "Sidebar TreeView showing tasks grouped by workflow status"
summary: "The kanban TreeView displays tasks in collapsible status groups with labels, provides click-to-open navigation, and auto-refreshes when task files change."
keywords: [kanban, treeview, sidebar, tasks, status, groups, welcome, empty-state, init]
aliases: [sidebar, task-tree]
boundary: "Does not execute skills - click actions open terminals"
references: [skills/overview]
uses: [systems/vscode-extension, systems/cli]
updated: 2026-03-06
---

# Kanban TreeView

> **TL;DR:** Sidebar TreeView showing tasks grouped by workflow status

## Overview

The kanban TreeView is the visual counterpart to `/festina-overview`. It shows all tasks grouped by status in a collapsible tree structure.

**Summary:** See your board without leaving VSCode.

## Welcome / Empty State

When `.festinalente/` does not exist in the workspace, the sidebar shows a welcome state instead of the full kanban view:

```
FESTINA LENTE
└── TASKS
    └── Get started by initializing Festina Lente:
        npx festinalente init
```

- Only the Tasks view is visible; Projects, Quicks, Config, Directives, Product Docs, and Engineering Docs views are hidden
- When the user runs `npx festinalente init` and `.festinalente/` is created, the sidebar automatically refreshes to show the full kanban view (no reload required)
- The directory watcher disposes itself after initialization

## UI Structure

```
FESTINA LENTE
├── PROJECTS
│   ├── ▼ Open (1)
│   │   └── P001: User authentication system (2/3 tasks done)
│   └── ▶ Done (1)
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

### PROJECTS Section

The PROJECTS section appears above TASKS when projects exist. Projects are grouped by status (open, done) and each entry shows a progress summary (e.g., "2/3 tasks done"). Clicking a project opens the `project.xml` file. The section is hidden when no projects exist.

## Features

- **Auto-refresh**: File watcher detects `.festinalente/` changes
- **Click to open**: Opens task.xml in editor
- **Status icons**: Visual indicators per status
- **Label badges**: Shows first label on each task
- **Progress indicator**: Shows plan task completion (e.g., `3/7`) in the task description when a plan.xml exists. Tooltip shows "Progress: X/Y tasks completed". Updates automatically when plan.xml changes.

## Boundaries

- **Does NOT:** Execute skills directly
- **Does NOT:** Modify task files → Use skills
