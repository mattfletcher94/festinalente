---
id: gui/task-detail
title: "Task Detail Panel"
type: feature
summary: "Middle panel showing task content with tabs for task, spec, and plan files"
keywords: [task-detail, panel, tabs, spec, plan, markdown, content]
related: [gui/desktop-app, gui/task-list, gui/terminal]
updated: 2026-02-17
---

# Task Detail Panel

## Overview

The Task Detail Panel is the middle panel that displays the selected task's content. It shows the task's markdown files (task.md, spec.md, plan.md) with tabs to switch between them.

## How It Works

1. User selects a task from the task list
2. Panel loads and displays task.md content
3. Tabs appear for spec.md and plan.md if they exist
4. Action buttons show available workflow commands based on task status
5. Clicking an action runs the command in the terminal

### Available Actions

Actions are context-aware based on task status:
- Backlog: Refine
- Refined: Scope
- Scoped: Plan
- Planned: Implement
- In Progress: Codecheck
- Code Check: (automated)
- QA: Approve, Rework
- Update Docs: Docs
- PR: Merge, Rework

## Key Concepts

- **Tabs**: Switch between task.md, spec.md, plan.md
- **Action buttons**: Run workflow commands for current status
- **Disabled state**: Buttons disabled while terminal is busy

## Interactions

- **Task List**: Receives selected task
- **Terminal**: Action buttons trigger commands in terminal
- **Auto-refresh**: Content refreshes when terminal completes

## Limitations

- Read-only view (editing done via CLI commands)
- Markdown rendered as plain text (no rich preview)
