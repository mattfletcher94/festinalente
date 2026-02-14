---
name: docs
description: Update product documentation, commit, move to PR
skill: .claudeban/skills/kanban-docs/SKILL.md
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *, git push *), Grep
argument-hint: "[task id]"
---

# Update Kanban Task Documentation

> **Skill Reference:** This command invokes `.claudeban/skills/kanban-docs/SKILL.md`
> You MUST read and follow the instructions in that skill file.

Update product documentation, commit changes, push branch, and move task to PR column.

**Branch requirement:** Must be run on `task/{id}` branch.

## Usage

`/kanban:docs [task-id]`

## Workflow

1. Verify on `task/{id}` branch (error if not)
2. Invoke the **kanban-docs** skill
3. Pass `$ARGUMENTS` as the task ID (if provided)
4. Skill analyzes docs needs, updates docs, commits, pushes, moves to PR

## Commit

Uses `commits.docs` format from `.claude/kanban-workflow.yaml`.

## Example

`/kanban:docs 001`

Updates documentation, pushes branch, and prepares for PR creation.
