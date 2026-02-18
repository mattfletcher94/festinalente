---
id: "cli/kanban-delete"
title: "kanban-delete"
type: feature
summary: "Delete tasks from the kanban board that are in Backlog or Refined status"
keywords: [delete, remove, task, cleanup, backlog, refined]
related: [cli/kanban-create]
updated: 2026-02-18
---

# kanban-delete

## Overview

kanban-delete allows users to permanently delete tasks from the kanban board. This is important because it keeps the board clean and focused on relevant work by removing tasks created by mistake or that are no longer needed.

## How It Works

1. User runs `/kanban-delete {taskId}` on the main branch
2. System validates task exists and is in Backlog or Refined status
3. System displays task details and prompts for confirmation
4. Upon confirmation, task folder is deleted and a git commit is created

### Key Workflows

**Delete a task:**
- Run `/kanban-delete 001` (with task ID)
- Or run `/kanban-delete` to select from eligible tasks
- Review task details shown
- Confirm deletion when prompted
- Success message displays commit hash

## Key Concepts

- **Eligible tasks**: Only tasks in `backlog` or `refined` status can be deleted
- **Permanent deletion**: Removes entire task folder including task.md, spec.md, and plan.md

## Interactions

- **kanban-create**: Tasks created with kanban-create can be deleted if still in early stages

## Limitations

- Can only delete tasks in Backlog or Refined status
- Must be run on the main branch
- No undo capability - deletion is permanent
- Cannot batch delete multiple tasks at once
