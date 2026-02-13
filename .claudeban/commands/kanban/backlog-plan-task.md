---
name: backlog-plan-task
description: Create an implementation plan for an existing task and commit
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status)
argument-hint: "[task id]"
---

# Plan Kanban Task

Create a plan document linked to an existing task and commit.

## Usage

`/kanban:backlog-plan-task [task-id]`

## Workflow

1. Invoke the **kanban-backlog-plan-task** skill
2. Pass `$ARGUMENTS` as the task ID (if provided)
3. Skill handles task lookup, plan creation, commit, and confirmation

## Commit

On success: `docs(plan-task): <id> <title>`

## Example

`/kanban:backlog-plan-task 001`

Creates `.kanban/plans/001.plan.md` with implementation template and commits.
