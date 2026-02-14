---
name: plan
description: Create implementation plan with checkboxes
skill: .claude/skills/kanban-plan/SKILL.md
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *)
argument-hint: "[task id]"
---

# Plan Kanban Task

> **Skill Reference:** This command invokes `.claude/skills/kanban-plan/SKILL.md`
> You MUST read and follow the instructions in that skill file.

Create an implementation plan with checkboxes from the functional specification.

**Branch requirement:** Must be run on `task/{id}` branch.

## Usage

`/kanban:plan [task-id]`

## Workflow

1. Verify on `task/{id}` branch (error if not)
2. Invoke the **kanban-plan** skill
3. Pass `$ARGUMENTS` as the task ID (if provided)
4. Skill creates plan file, updates task, commits

## Commit

Uses `commits.plan` format from `.claude/kanban-workflow.yaml`.

## Example

`/kanban:plan 001`

Creates implementation plan with actionable checkboxes.
