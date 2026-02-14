---
name: approve
description: Approve after human QA, commit code, move to Update Docs
skill: .claudeban/skills/kanban-approve/SKILL.md
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git diff *, git branch *)
argument-hint: "[task id]"
---

# Approve Kanban Task

> **Skill Reference:** This command invokes `.claudeban/skills/kanban-approve/SKILL.md`
> You MUST read and follow the instructions in that skill file.

Approve implementation after human QA testing, commit the code, and move to Update Docs.

**Branch requirement:** Must be run on `task/{id}` branch.

## Usage

`/kanban:approve [task-id]`

## Workflow

1. Verify on `task/{id}` branch (error if not)
2. Invoke the **kanban-approve** skill
3. Pass `$ARGUMENTS` as the task ID (if provided)
4. Skill prompts for confirmation, stages and commits code, moves to Update Docs

## Commit

Uses `commits.approve` format from `.claude/kanban-workflow.yaml`.
Commit type determined by task labels (feat, fix, refactor, docs).

## Example

`/kanban:approve 001`

Commits approved code and moves task to documentation phase.
