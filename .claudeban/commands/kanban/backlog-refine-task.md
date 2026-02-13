---
name: backlog-refine-task
description: Refine vague task through Socratic Q&A and commit
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *), Grep, AskUserQuestion
argument-hint: "[task id]"
---

# Refine Kanban Task

Refine vague tasks through interactive Q&A dialogue to add clarity and acceptance criteria.

**Branch requirement:** Must be run on `main` branch.

## Usage

`/kanban:backlog-refine-task [task-id]`

## Workflow

1. Verify on `main` branch (error if not)
2. Invoke the **kanban-backlog-refine-task** skill
3. Pass `$ARGUMENTS` as the task ID (if provided)
4. Skill handles Socratic Q&A, task refinement, and commit

## Product Doc Discovery

As requirements are clarified, identify additional product docs that may be relevant:
- Search: `grep -l "keywords:.*{relevant-term}" .kanban/product/*.md`
- Update the task's `product-docs` field if new connections are discovered

## Commit

Uses `commits.refine` format from `.claudeban/kanban-workflow.yaml`.

## Example

`/kanban:backlog-refine-task 003`

Guides you through clarifying questions to refine a vague task.

## When to Use

- After creating a task that was marked with `needs-refinement` label
- Before planning a task that lacks clear acceptance criteria
- When a task title or description is ambiguous
