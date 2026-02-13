---
name: backlog-refine-task
description: Refine vague task through Socratic Q&A and commit
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status)
argument-hint: "[task id]"
---

# Refine Kanban Task

Refine vague tasks through interactive Q&A dialogue to add clarity and acceptance criteria.

## Usage

`/kanban:backlog-refine-task [task-id]`

## Workflow

1. Invoke the **kanban-backlog-refine-task** skill
2. Pass `$ARGUMENTS` as the task ID (if provided)
3. Skill handles Socratic Q&A, task refinement, and commit

## Commit

On success: `docs(task): refine {id} {title}`

## Example

`/kanban:backlog-refine-task 003`

Guides you through clarifying questions to refine a vague task.

## When to Use

- After creating a task that was marked with `needs-refinement` label
- Before planning a task that lacks clear acceptance criteria
- When a task title or description is ambiguous
