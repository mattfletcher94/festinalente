---
id: cli/tasks
title: "Task Commands"
type: feature
tldr: "CRUD operations for tasks via festinalente.cjs script"
summary: "Task commands provide list-tasks, find-task, next-id, and delete-task operations with JSON output for skills and VSCode consumption."
keywords: [tasks, crud, list, find, id, delete, commands, prefix, resolution]
aliases: [task-commands, task-crud]
boundary: "Does not provide AI workflows - use skills for interactive task management"
references: []
uses: [systems/cli, systems/data-model]
updated: 2026-03-06
---

# Task Commands

> **TL;DR:** CRUD operations for tasks via festinalente.cjs script

## Overview

Task commands provide the foundational operations for managing tasks programmatically. All commands return JSON for easy parsing by skills and VSCode.

**Summary:** Task commands are the persistence layer that skills build upon.

## Commands

| Command | Purpose | Output |
|---------|---------|--------|
| `list-tasks` | List all tasks | JSON with count and tasks array |
| `list-tasks --status={s}` | Filter by status | Filtered tasks |
| `list-tasks --exclude-status={s}` | Exclude status | Filtered tasks |
| `find-task {id}` | Get task path/metadata (supports prefix) | JSON with path |
| `next-id` | Get next task ID | JSON with nextId |
| `delete-task {id}` | Delete a task (supports prefix) | Success/error |

## Examples

```bash
# List all tasks
node .festinalente/scripts/festinalente.cjs list-tasks

# Find task by numeric prefix (resolves to full folder ID)
node .festinalente/scripts/festinalente.cjs find-task 001

# Find task by full ID (still supported)
node .festinalente/scripts/festinalente.cjs find-task 001-my-task-name

# Get next available ID
node .festinalente/scripts/festinalente.cjs next-id

# Delete task by prefix
node .festinalente/scripts/festinalente.cjs delete-task 002
```

## Prefix Resolution

All task-related commands that accept an `{id}` argument support **numeric prefix lookup**. Instead of passing the full task folder name (e.g., `001-my-task-name`), you can pass just the numeric prefix (e.g., `001`). The CLI resolves the prefix to the matching task folder. If no match is found, a clear error is returned.

This applies to commands across multiple handlers:

- `find-task`, `delete-task` (task handler)
- `find-spec`, `find-plan` (spec handler)
- `validate-xml` (validation handler)
- `get-plan-task`, `get-plan-task-context` (task handler)

Full task IDs remain fully supported for backward compatibility.

## Boundaries

- **Does NOT:** Parse task XML content (just paths)
- **Does NOT:** Modify task status → Skills handle this
