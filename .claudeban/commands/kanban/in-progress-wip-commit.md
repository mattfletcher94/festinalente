---
name: in-progress-wip-commit
description: Save partial implementation progress with WIP commit
allowed-tools: Read, Write, Edit, Bash(ls *, git add *, git commit *, git status, git diff *)
argument-hint: "[task id]"
---

# WIP Commit Kanban Task

Save partial implementation progress when interrupted. Task stays in In Progress.

## Usage

`/kanban:in-progress-wip-commit [task-id]`

## Workflow

1. Invoke the **kanban-in-progress-wip-commit** skill
2. Pass `$ARGUMENTS` as the task ID (if provided)
3. Skill verifies checkboxes, adds continuation notes, and commits

## Commit

Uses `commits.wip` format from `.claudeban/workflow.yaml`.

## Example

`/kanban:in-progress-wip-commit 001`

Commits current progress and updates plan with continuation notes.

## When to Use

- When you need to stop implementation mid-way
- To save progress before switching to another task
- As a checkpoint during long implementations
