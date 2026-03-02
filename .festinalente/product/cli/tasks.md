---
id: cli/tasks
title: "Task Commands"
type: feature
tldr: "CRUD operations for tasks via festinalente.cjs script"
summary: "Task commands provide list-tasks, find-task, next-id, and delete-task operations with JSON output for skills and VSCode consumption."
keywords: [tasks, crud, list, find, id, delete, commands]
aliases: [task-commands, task-crud]
boundary: "Does not provide AI workflows - use skills for interactive task management"
references: []
uses: [systems/cli, systems/data-model]
updated: 2026-03-01
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
| `find-task {id}` | Get task path/metadata | JSON with path |
| `next-id` | Get next task ID | JSON with nextId |
| `delete-task {id}` | Delete a task | Success/error |

## Examples

```bash
# List all tasks
node .festinalente/scripts/festinalente.cjs list-tasks

# Find specific task
node .festinalente/scripts/festinalente.cjs find-task 001

# Get next available ID
node .festinalente/scripts/festinalente.cjs next-id
```

## Boundaries

- **Does NOT:** Parse task XML content (just paths)
- **Does NOT:** Modify task status → Skills handle this
