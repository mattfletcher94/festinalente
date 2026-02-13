---
name: awaiting-merge-fail-task
description: Close PR and return task to in-progress for fixes
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *, gh pr *)
argument-hint: "[task id]"
---

# Reject Task PR

Close the pull request and return task to In Progress for fixes.

## Usage

`/kanban:awaiting-merge-fail-task [task-id]`

## Workflow

1. Invoke the **kanban-awaiting-merge-fail-task** skill
2. Pass `$ARGUMENTS` as the task ID (if provided)
3. Skill handles PR closure, documentation of issues, and status update

## Example

`/kanban:awaiting-merge-fail-task 001`

Closes PR, documents issues in plan iterations, returns task to in-progress.
