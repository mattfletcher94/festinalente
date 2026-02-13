---
name: verify-fail-task
description: Return failed verification back to implementation
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status)
argument-hint: "[task id]"
---

# Fail Verification

Return a task that failed automated checks back to implementation.

## Usage

`/kanban:verify-fail-task [task-id]`

## Workflow

1. Invoke the **kanban-verify-fail-task** skill
2. Pass `$ARGUMENTS` as the task ID (if provided)
3. Skill records failure and returns task to in-progress

## Column Transition

```
verify → in-progress
```

See `.claude/kanban-workflow.yaml` for valid transitions.

## Commit

Uses `commits.verify-fail` format from `.claude/kanban-workflow.yaml`.

## Example

`/kanban:verify-fail-task 001`

Records failure details and returns task to In Progress for fixes.
