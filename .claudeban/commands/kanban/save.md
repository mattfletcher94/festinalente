---
name: save
description: Save work-in-progress with WIP commit
skill: .claudeban/skills/kanban-save/SKILL.md
allowed-tools: Read, Write, Edit, Bash(ls *, git add *, git commit *, git status, git diff *, git branch *)
argument-hint: "[task id]"
---

# Save Kanban Task Progress

> **Skill Reference:** This command invokes `.claudeban/skills/kanban-save/SKILL.md`
> You MUST read and follow the instructions in that skill file.

Save partial implementation progress with a WIP commit. Use when implementation is interrupted.

**Branch requirement:** Must be run on `task/{id}` branch.

## Usage

`/kanban:save [task-id]`

## Workflow

1. Verify on `task/{id}` branch (error if not)
2. Invoke the **kanban-save** skill
3. Pass `$ARGUMENTS` as the task ID (if provided)
4. Skill verifies checkboxes, stages changes, commits with WIP message

## Commit

Uses `commits.save` format from `.claude/kanban-workflow.yaml`.

## Example

`/kanban:save 001`

Commits current progress with WIP message.
