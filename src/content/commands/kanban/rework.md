---
name: rework
description: Return task to In Progress for fixes. Works from QA or PR columns.
skill: .claude/skills/kanban-rework/SKILL.md
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *, gh pr *)
argument-hint: "[task id]"
---

# Rework Kanban Task

> **Skill Reference:** This command invokes `.claude/skills/kanban-rework/SKILL.md`
> You MUST read and follow the instructions in that skill file.

Return a task to In Progress when human review finds issues. Works from QA or PR columns.

## Usage

`/kanban:rework [task-id]`

## Workflow

1. Invoke the **kanban-rework** skill
2. Pass `$ARGUMENTS` as the task ID (if provided)
3. Skill prompts for issues, updates task/plan, commits, and moves to In Progress
4. If task was in PR column, also closes the PR

## Commit

Uses `commits.rework` format from `.claude/kanban-workflow.yaml`.

## Example

`/kanban:rework 001`

Documents issues and returns task for fixes.
