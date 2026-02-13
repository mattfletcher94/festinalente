---
name: report-task
description: Query a specific task's history and current state
allowed-tools: Read, Glob, Grep, Bash(git log *)
argument-hint: "{id} [question]"
---

# Report Task

Query a specific task's history and current state using natural language.

## Usage

`/kanban:report-task {id} [question]`

## Workflow

1. Parse `$ARGUMENTS` to extract task ID (first argument) and optional question (remaining text)
2. Gather all data for the task:
   - Task file: `.kanban/tasks/{id}-*.md`
   - Spec file (if exists): `.kanban/specs/{id}.spec.md`
   - Plan file (if exists): `.kanban/plans/{id}.plan.md`
   - Git commits: `git log --oneline --all --grep="({id})"`
3. If no question provided, ask the user what they want to know about the task
4. If question provided, answer conversationally using the gathered data

## Data Sources

| Source | Location | Contains |
|--------|----------|----------|
| Task file | `.kanban/tasks/{id}-*.md` | Status, priority, labels, description |
| Spec file | `.kanban/specs/{id}.spec.md` | Requirements, acceptance criteria |
| Plan file | `.kanban/plans/{id}.plan.md` | Implementation steps, checkboxes |
| Git history | `git log --grep="({id})"` | Timeline, commits, state transitions |

## Example Questions

- "What's the current status?"
- "When was this started?"
- "How many times did verification fail?"
- "What files were changed?"
- "Show me the timeline"
- "Is the spec complete?"

## Examples

`/kanban:report-task 003`

Gathers data for task 003 and asks what you want to know.

`/kanban:report-task 003 What files were changed?`

Analyzes git history for task 003 and lists modified files.
