---
id: skills/delete
title: "Delete Task"
type: feature
tldr: "Permanently remove a backlog task and all its files"
summary: "The /festina-delete skill permanently deletes a task folder, but only for tasks in backlog status. Requires explicit user confirmation before deletion."
keywords: [delete, remove, backlog, cleanup]
aliases: [festina-delete, remove-task]
boundary: "Only deletes tasks in backlog status - refuses tasks in any later stage"
references: [skills/create, cli/tasks]
uses: []
updated: 2026-03-06
---

# Delete Task

> **TL;DR:** Permanently remove a backlog task and all its files

## Overview

The `/festina-delete` skill permanently removes a task from the board. It only works for tasks in `backlog` status — tasks that have progressed to scoped, planned, or later stages contain work that should not be casually discarded.

**Why it exists:** Clean up tasks that are no longer relevant before they accumulate.

**Summary:** Safe task removal with status guards and confirmation.

## How It Works

```mermaid
flowchart LR
    A[Find Task] --> B{Status = backlog?}
    B -->|Yes| C[Show Details]
    B -->|No| D[Refuse]
    C --> E{Confirm?}
    E -->|Yes| F[Delete Folder]
    E -->|No| G[Cancel]
```

1. **Find task** by ID (or list backlog tasks to choose from)
2. **Validate status** — must be `backlog`
3. **Show details** — ID, title, description
4. **Confirm** — explicit user confirmation required
5. **Delete** — removes entire task folder via CLI

**Summary:** Status check, confirm, delete.

## Examples

### Delete a Backlog Task

```
/festina-delete 005

Task details:
- ID: 005
- Title: Fix typo in README
- Status: backlog

Are you sure? > Yes, delete

Task 005 deleted successfully.
```

### Refused: Task Not in Backlog

```
/festina-delete 003

Error: Cannot delete task in in-progress status.
Only tasks in Backlog status can be deleted.
```

## Boundaries

What this skill does NOT do:

- **Does NOT:** Delete tasks in scoped, planned, in-progress, finalize, or done status
- **Does NOT:** Archive tasks (deletion is permanent)
- **Does NOT:** Delete without user confirmation

## Limitations

- Deletion is permanent — no undo
- Only backlog tasks are eligible
