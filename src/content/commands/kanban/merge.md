---
name: merge
description: Merge PR, delete task branch, complete task
skill: .claude/skills/kanban-merge/SKILL.md
allowed-tools: Read, Write, Bash(ls *, git *, gh pr *)
argument-hint: "[task id]"
---

# Merge Kanban Task PR

> **Skill Reference:** This command invokes `.claude/skills/kanban-merge/SKILL.md`
> You MUST read and follow the instructions in that skill file.

Merge the pull request, clean up the task branch, and complete the task.

**Branch requirement:** Must be run on `task/{id}` branch.

## Usage

`/kanban:merge [task-id]`

## Workflow

1. Verify on `task/{id}` branch (error if not)
2. Invoke the **kanban-merge** skill
3. Pass `$ARGUMENTS` as the task ID (if provided)
4. Skill merges PR, deletes branch, switches to main, marks task done

## Commit

Uses `commits.done` format from `.claude/kanban-workflow.yaml`.

## Example

`/kanban:merge 001`

Merges PR, cleans up branch, and completes the task.
