---
name: awaiting-merge-merge-task
description: Merge the PR, delete task branch, and complete the task
allowed-tools: Read, Write, Bash(ls *, git *, gh pr *)
argument-hint: "[task id]"
---

# Merge Task PR

Merge the pull request, delete the task branch, switch to main, and move task to Done.

## Usage

`/kanban:awaiting-merge-merge-task [task-id]`

## Workflow

1. Invoke the **kanban-awaiting-merge-merge-task** skill
2. Pass `$ARGUMENTS` as the task ID (if provided)
3. Skill handles PR merge, branch cleanup, and status update

## Example

`/kanban:awaiting-merge-merge-task 001`

Merges PR, deletes task/001 branch, switches to main, marks task as Done.
