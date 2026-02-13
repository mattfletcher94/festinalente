---
name: update-docs-complete-task
description: Update product documentation and commit
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status)
argument-hint: "[task id]"
---

# Update Task Documentation

Update product documentation, commit, and move to Done.

## Usage

`/kanban:update-docs-complete-task [task-id]`

## Workflow

1. Invoke the **kanban-update-docs-complete-task** skill
2. Pass `$ARGUMENTS` as the task ID (if provided)
3. Skill handles documentation updates, commit, and completion

## Commit

On success: `docs(product): {description}`

## Example

`/kanban:update-docs-complete-task 001`

Updates documentation and completes the task.
