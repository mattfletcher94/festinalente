---
name: define-task
description: Create a new task in the kanban board and commit
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status)
argument-hint: "[task title]"
---

# Define Kanban Task

Create a new task in `.kanban/tasks/` and commit.

## Usage

`/kanban:define-task [title]`

## Workflow

1. Invoke the **kanban-define-task** skill
2. Pass `$ARGUMENTS` as the task title (if provided)
3. Skill handles ID generation, file creation, commit, and confirmation

## Commit

On success: `docs(task): add {id} {title}`

## Example

`/kanban:define-task Fix login redirect bug`

Creates task file, commits, and confirms creation.
