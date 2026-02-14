---
name: status
description: Show board status and suggest next command to run
skill: .claude/skills/kanban-status/SKILL.md
allowed-tools: Read, Glob, Grep
argument-hint: "[task id]"
---

# Kanban Board Status

> **Skill Reference:** This command invokes `.claude/skills/kanban-status/SKILL.md`
> You MUST read and follow the instructions in that skill file.

Show the current state of the board or a specific task, and suggest what command to run next.

## Usage

`/kanban:status` - Show full board status
`/kanban:status [id]` - Show status of a specific task

## Workflow

1. Invoke the **kanban-status** skill
2. Pass `$ARGUMENTS` as task ID (if provided)
3. Skill reads task files, analyzes state, and suggests next steps

## Example

`/kanban:status`

Shows all tasks grouped by column with next actions.

`/kanban:status 001`

Shows detailed status for task 001 including plan progress.
