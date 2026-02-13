---
name: planned-implement-task
description: Execute plan checkboxes and track implementation progress (no commit)
allowed-tools: Read, Write, Edit, Bash(*)
argument-hint: "[task id]"
---

# Implement Kanban Task

Execute plan checkboxes. Code remains uncommitted until review passes.

## Usage

`/kanban:planned-implement-task [task-id]`

## Workflow

1. Invoke the **kanban-planned-implement-task** skill
2. Pass `$ARGUMENTS` as the task ID (if provided)
3. Skill handles checkbox execution and moves task to Review when complete

## Commit

None - code stays uncommitted. Use `/kanban:in-progress-wip-commit` to save partial progress, or `/kanban:review-pass-task` to commit after review.

## Example

`/kanban:planned-implement-task 001`

Executes plan checkboxes and tracks progress.
