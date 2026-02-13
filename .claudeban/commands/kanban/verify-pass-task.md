---
name: verify-pass-task
description: Move verified task to human review
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status)
argument-hint: "[task id]"
---

# Pass Verification

Move a task that passed automated checks to human review.

## Usage

`/kanban:verify-pass-task [task-id]`

## Workflow

1. Invoke the **kanban-verify-pass-task** skill
2. Pass `$ARGUMENTS` as the task ID (if provided)
3. Skill moves task to review status

## Column Transition

```
verify → review
```

See `.claudeban/kanban-workflow.yaml` for valid transitions.

## Example

`/kanban:verify-pass-task 001`

Moves task to Review for human approval.
