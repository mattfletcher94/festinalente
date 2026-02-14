---
name: verify
description: Run AI code review. Auto-retries on failure, auto-advances to QA on success.
skill: .claudeban/skills/kanban-verify/SKILL.md
allowed-tools: Read, Write, Bash(*)
argument-hint: "[task id]"
---

# Verify Kanban Task

> **Skill Reference:** This command invokes `.claudeban/skills/kanban-verify/SKILL.md`
> You MUST read and follow the instructions in that skill file.

Run AI code review using configured skills. On failure, AI fixes issues and retries automatically (max 3 attempts). On success, auto-advances to QA.

**Branch requirement:** Must be run on `task/{id}` branch.

## Usage

`/kanban:verify [task-id]`

## Workflow

1. Verify on `task/{id}` branch (error if not)
2. Invoke the **kanban-verify** skill
3. Pass `$ARGUMENTS` as the task ID (if provided)
4. Skill runs checks, auto-fixes failures, auto-advances to QA on success

## Behavior

- **Auto-loop:** If checks fail, AI fixes issues and retries (max 3 attempts)
- **Auto-advance:** Once all checks pass, task moves to QA automatically

## Commit

Uses `commits.verify-retry` format on retry.

## Example

`/kanban:verify 001`

Runs automated checks, fixes issues, and advances to QA when passing.
