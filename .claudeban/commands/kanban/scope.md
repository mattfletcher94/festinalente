---
name: scope
description: Research codebase and create functional specification
skill: .claudeban/skills/kanban-scope/SKILL.md
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *, git checkout *), Glob, Grep
argument-hint: "[task id]"
---

# Scope Kanban Task

> **Skill Reference:** This command invokes `.claudeban/skills/kanban-scope/SKILL.md`
> You MUST read and follow the instructions in that skill file.

Research the codebase and create a functional specification. Creates the task branch.

**Branch requirement:** Must be run on `main` branch. Creates `task/{id}` branch.

## Usage

`/kanban:scope [task-id]`

## Workflow

1. Verify on `main` branch (error if not)
2. Invoke the **kanban-scope** skill
3. Pass `$ARGUMENTS` as the task ID (if provided)
4. Skill researches codebase, creates spec file, creates task branch, commits

## Commit

Uses `commits.scope` format from `.claude/kanban-workflow.yaml`.

## Example

`/kanban:scope 001`

Creates functional specification and task branch.
