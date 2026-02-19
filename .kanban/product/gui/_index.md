---
id: "gui/_index"
title: "GUI Application"
type: domain
tldr: "Electron desktop app for visual task management and integrated terminal"
summary: "The GUI provides a visual overview of all tasks grouped by workflow column, with an integrated terminal for running workflow commands with autoplay support."
keywords: [gui, desktop, electron, visual, terminal, autoplay]
aliases: [desktop-app, electron-app, visual-kanban]
boundary: "Does not cover CLI-only workflows or Claude Code skills directly"
contains: [gui/task-list, gui/task-detail, gui/terminal, gui/autoplay]
related: [cli/_index]
updated: 2026-02-19
---

# GUI Application

> **TL;DR:** Electron desktop app for visual task management and integrated terminal

## Overview

The GUI Application domain handles the desktop interface for Claudeban. It provides visual task overview and integrated terminal capabilities in a three-panel layout.

**Why it exists:** Users need both a visual overview of all tasks (grouped by workflow column) and an integrated terminal to run workflow commands with visible output. The GUI combines these into a single interface.

**Summary:** This domain provides visual task management with integrated command execution.

## Boundaries

This domain does NOT cover CLI skills or command-line-only workflows. For that, see [CLI](../cli/_index.md).

- **Does NOT:** Execute workflow logic (delegates to CLI skills)
- **Does NOT:** Support multiple projects simultaneously
- **Does NOT:** Provide multi-terminal capability
- **See instead:** [CLI Skills](../cli/_index.md) for workflow automation

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| [Task List](./task-list.md) | Left panel showing tasks grouped by workflow column | stable |
| [Task Detail](./task-detail.md) | Center panel with task info, tabs, and action buttons | stable |
| [Terminal](./terminal.md) | Right panel with integrated xterm.js terminal | stable |
| [Autoplay](./autoplay.md) | Sequential command execution until review phases | stable |

**Summary:** This domain contains 4 features covering visual task management and command execution.

## Key Concepts

- **Workflow Column**: Task grouping by status (Backlog, Scoped, Planned, In Progress, etc.)
- **Autoplay**: Automatic progression through workflow steps until a review phase
- **Review Phase**: Workflow steps requiring human approval (codecheck, qa, pr)

## Example

```
┌─────────────────┬───────────────────────┬─────────────────────┐
│  Task List      │  Task Detail          │  Terminal           │
├─────────────────┼───────────────────────┼─────────────────────┤
│ Backlog (2)     │ TASK-003: Add auth    │ $ /kanban-scope ... │
│   └─ Add auth   │ Status: Backlog       │                     │
│   └─ Fix bug    │ Priority: High        │ Scoping task...     │
│                 │ [Task] [Spec] [Plan]  │                     │
│ In Progress (1) │                       │ Done. Moved to      │
│   └─ Refactor   │ [Run] kanban-scope    │ Scoped column.      │
│                 │ [ ] Autoplay          │                     │
└─────────────────┴───────────────────────┴─────────────────────┘
```

## Relationships

| Related Domain | Relationship |
|----------------|--------------|
| [CLI](../cli/_index.md) | GUI executes CLI skills via integrated terminal |

**Summary:** This domain primarily interacts with CLI skills for workflow execution.
