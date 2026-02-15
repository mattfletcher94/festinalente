---
name: implement
description: Execute implementation plan, write code
skill: .claude/skills/kanban-implement/SKILL.md
allowed-tools: Read, Write, Edit, Bash(*)
argument-hint: "[task id]"
---

# Implement Kanban Task

> **Skill Reference:** This command invokes `.claude/skills/kanban-implement/SKILL.md`
> You MUST read and follow the instructions in that skill file.

Execute the implementation plan and write code. Code stays uncommitted until QA passes.

**Branch requirement:** Must be run on `task/{id}` branch.

## Usage

`/kanban:implement [task-id]`

## Workflow

1. Verify on `task/{id}` branch (error if not)
2. Invoke the **kanban-implement** skill
3. Pass `$ARGUMENTS` as the task ID (if provided)
4. Skill executes plan checkboxes, writes code, updates plan progress

## Commit

None - code stays uncommitted until QA passes. Use `/kanban:save` to save partial progress.

## Example

`/kanban:implement 001`

Executes plan checkboxes and writes implementation code.
