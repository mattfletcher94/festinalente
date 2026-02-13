---
name: define-task
description: Create a new task in the kanban board and commit
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status), Grep
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

## Product Doc Linking

When creating a task, check if the title/description clearly relates to existing product docs:
- Search: `grep -l "keywords:.*{relevant-term}" .kanban/product/*.md`
- If matches found, add IDs to the task's `product-docs` field

This linking is opportunistic - only add obvious connections.

## Commit

Uses `commits.define` format from `.claudeban/kanban-workflow.yaml`.

## Example

`/kanban:define-task Fix login redirect bug`

Creates task file, commits, and confirms creation.
