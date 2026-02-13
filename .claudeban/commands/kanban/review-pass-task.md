---
name: review-pass-task
description: Approve implementation and commit code
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git diff *)
argument-hint: "[task id]"
---

# Review Pass Kanban Task

Approve implementation, commit code, and move to Update Docs.

## Usage

`/kanban:review-pass-task [task-id]`

## Workflow

1. Invoke the **kanban-review-pass-task** skill
2. Pass `$ARGUMENTS` as the task ID (if provided)
3. Skill handles review validation, code commit, and column transition

## Commit

Uses `commits.review-pass` format from `.claude/kanban-workflow.yaml`. Commit type determined by task label.

## Example

`/kanban:review-pass-task 001`

Commits implementation and moves task to Update Docs.
