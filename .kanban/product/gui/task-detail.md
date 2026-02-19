---
id: "gui/task-detail"
title: "Task Detail"
type: feature
tldr: "Center panel showing task info, content tabs, and workflow actions"
summary: "Displays selected task details including title, status, priority, labels, and provides tabs for Task/Spec/Plan content with available workflow actions"
keywords: [task-detail, center-panel, tabs, actions, workflow]
aliases: [detail-panel, task-view, task-actions]
boundary: "Does not execute commands directly - delegates to terminal"
related: [gui/task-list, gui/terminal, gui/autoplay]
updated: 2026-02-19
---

# Task Detail

> **TL;DR:** Center panel showing task info, content tabs, and workflow actions

## Overview

Task Detail allows users to view full task information and trigger workflow actions. This is important because it provides the context needed to understand a task and the controls to progress it through the workflow.

**Summary:** Central hub for viewing task content and triggering workflow progression.

## How It Works

1. User selects a task from Task List
2. System loads task.xml, spec.xml (if exists), plan.xml (if exists)
3. Result: Full task details with tabs and available actions displayed

### Key Workflows

**Viewing Task Content:**
- Select task from list
- View Task tab (problem statement, acceptance criteria)
- Switch to Spec tab (scoped requirements)
- Switch to Plan tab (implementation steps)

**Running Workflow Actions:**
- View available actions based on current task status
- Click "Run" button for desired action
- Command executes in Terminal panel

**Summary:** View task content across tabs and run workflow actions.

## Examples

### Typical Usage

```
┌─ TASK-003: Add notification system ─┐
│ Status: Scoped    Priority: Medium  │
│ Labels: [Feature]                   │
├─────────────────────────────────────┤
│ [Task] [Spec] [Plan]                │
├─────────────────────────────────────┤
│ ## Problem Statement                │
│ Users need email notifications...   │
├─────────────────────────────────────┤
│ Available Actions:                  │
│ [Run] kanban-plan TASK-003          │
│ [ ] Autoplay                        │
└─────────────────────────────────────┘
```

### Edge Case: Task Without Spec

```
[Spec] tab shows: "No spec file found.
Run kanban-scope to create specifications."
```

**Summary:** Task info at top, content in tabs, actions at bottom.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Execute commands directly → See [Terminal](./terminal.md)
- **Does NOT:** Edit task content (read-only display)
- **Does NOT:** Show multiple tasks simultaneously

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Panel size | Width of detail panel | Persisted per session |
| Autoplay | Toggle for automatic command sequencing | Off (per-task session state) |

## Interactions

- **Task List**: Receives selected task for display
- **Terminal**: Sends commands when action buttons clicked
- **Autoplay**: Toggles autoplay mode for current task

## Limitations

- Read-only view (cannot edit task content directly)
- Actions are computed based on task status (not customizable)
- Hook config directives displayed but not editable
