---
name: refine
description: Refine task through Q&A to add clarity and acceptance criteria
skill: .claude/skills/kanban-refine/SKILL.md
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *), Grep, AskUserQuestion
argument-hint: "[task id]"
---

# Refine Kanban Task

> **Skill Reference:** This command invokes `.claude/skills/kanban-refine/SKILL.md`
> You MUST read and follow the instructions in that skill file.

Refine a task through Socratic Q&A dialogue to add clarity and acceptance criteria.

**Branch requirement:** Must be run on `main` branch.

## Usage

`/kanban:refine [task-id]`

## Workflow

1. Verify on `main` branch (error if not)
2. Invoke the **kanban-refine** skill
3. Pass `$ARGUMENTS` as the task ID (if provided)
4. Skill conducts Q&A, updates task, commits, and confirms

## Commit

Uses `commits.refine` format from `.claude/kanban-workflow.yaml`.

## Example

`/kanban:refine 001`

Asks clarifying questions and updates task with refined requirements.
