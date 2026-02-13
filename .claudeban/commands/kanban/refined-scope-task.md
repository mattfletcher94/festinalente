---
name: refined-scope-task
description: Add functional specification with codebase research and technical approach
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *, git checkout *), Glob, Grep
argument-hint: "[task id]"
---

# Scope Kanban Task

Research codebase and create functional specification for a refined task.

**Branch requirement:** Must be run on `main` branch. Creates `task/{id}` branch.

## Usage

`/kanban:refined-scope-task [task-id]`

## Workflow

1. Verify on `main` branch (error if not)
2. Invoke the **kanban-refined-scope-task** skill
3. Pass `$ARGUMENTS` as the task ID (if provided)
4. Skill creates `task/{id}` branch, handles codebase research, functional spec creation, and commit

## Commit

Uses `commits.scope` format from `.claude/kanban-workflow.yaml`.

## Example

`/kanban:refined-scope-task 001`

Creates Functional Specification section with affected files, patterns, and technical approach.

## When to Use

- After a task has been refined with clear acceptance criteria
- Before creating an implementation plan
- When engineering analysis is needed to understand technical approach
