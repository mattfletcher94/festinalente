---
id: cli/tasks
title: "Task Commands"
type: feature
tldr: "CRUD operations for tasks via festinalente.cjs script"
summary: "Task commands provide list-tasks, find-task, next-id, delete-task, get-plan-task, and get-plan-task-context operations with JSON output and multi-filter support for skills and VSCode consumption."
keywords: [tasks, crud, list, find, id, delete, commands, prefix, resolution]
aliases: [task-commands, task-crud]
boundary: "Does not provide AI workflows - use skills for interactive task management"
references: []
uses: [systems/cli, systems/data-model]
intent: procedural
prerequisites: []
---

# Task Commands

> **TL;DR:** CRUD operations for tasks via festinalente.cjs script

## Overview

Task commands provide the foundational operations for managing tasks programmatically. All commands return JSON for easy parsing by skills and VSCode.

**Summary:** Task commands are the persistence layer that skills build upon.

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

## Commands

| Command | Purpose | Output |
|---------|---------|--------|
| `list-tasks` | List all tasks | JSON with count and tasks array |
| `list-tasks --status={s}` | Filter by status | Filtered tasks |
| `list-tasks --exclude-status={s}` | Exclude status | Filtered tasks |
| `list-tasks --label={l}` | Filter by label | Filtered tasks |
| `list-tasks --priority={p}` | Filter by priority | Filtered tasks |
| `list-tasks --project={id}` | Filter by project | Filtered tasks |
| `find-task {id}` | Get task path/metadata (supports prefix) | JSON with path |
| `next-id --title="Title"` | Get next task ID | JSON with nextId |
| `delete-task {id}` | Delete a task (supports prefix) | Success/error |
| `get-plan-task {taskId} {planTaskId}` | Get a single task from plan.xml | JSON with task data |
| `get-plan-task-context {taskId} {planTaskId}` | Get context files for a plan task | JSON with file paths |

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

## Plan Task Retrieval

The `get-plan-task` and `get-plan-task-context` commands allow skills to extract individual tasks from a plan.xml file:

```bash
# Get task data (pattern, requirements, verify, done text)
node .festinalente/scripts/festinalente.cjs get-plan-task 005 T1

# Get context files listed for a plan task
node .festinalente/scripts/festinalente.cjs get-plan-task-context 005 T1
```

Both commands support numeric prefix resolution for the festina task ID.

## Boundaries

- **Does NOT:** Parse task XML content (just paths)
- **Does NOT:** Modify task status → Skills handle this
