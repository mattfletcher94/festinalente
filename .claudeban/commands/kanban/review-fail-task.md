---
name: review-fail-task
description: Document review issues and return task to implementation
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status)
argument-hint: "[task id]"
---

# Review Fail Kanban Task

Document issues found during review, commit notes, and return to In Progress.

## Usage

`/kanban:review-fail-task [task-id]`

## Workflow

1. Invoke the **kanban-review-fail-task** skill
2. Pass `$ARGUMENTS` as the task ID (if provided)
3. Skill prompts for issues, updates task/plan, commits, and moves to In Progress

## Commit

Uses `commits.review-fail` format from `.claudeban/workflow.yaml`.

## Example

`/kanban:review-fail-task 001`

Documents issues and returns task for fixes.
