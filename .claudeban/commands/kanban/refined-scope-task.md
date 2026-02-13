---
name: refined-scope-task
description: Add functional specification with codebase research and technical approach
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status), Glob, Grep
argument-hint: "[task id]"
---

# Scope Kanban Task

Research codebase and create functional specification for a refined task.

## Usage

`/kanban:refined-scope-task [task-id]`

## Workflow

1. Invoke the **kanban-refined-scope-task** skill
2. Pass `$ARGUMENTS` as the task ID (if provided)
3. Skill handles codebase research, functional spec creation, and commit

## Commit

Uses `commits.scope` format from `.claudeban/kanban-workflow.yaml`.

## Example

`/kanban:refined-scope-task 001`

Creates Functional Specification section with affected files, patterns, and technical approach.

## When to Use

- After a task has been refined with clear acceptance criteria
- Before creating an implementation plan
- When engineering analysis is needed to understand technical approach
