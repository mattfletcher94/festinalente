---
name: report-user
description: Query what tasks a git user has worked on
allowed-tools: Read, Glob, Grep, Bash(git log *)
argument-hint: "{name} [question]"
---

# Report User

Query what tasks a specific git user has worked on using natural language.

## Usage

`/kanban:report-user {name} [question]`

## Workflow

1. Parse `$ARGUMENTS` to extract user name (first argument) and optional question (remaining text)
2. Find task IDs the user has touched:
   ```bash
   git log --all --author="{name}" --format="%s" | grep -oP '\(\K\d+(?=\))' | sort -u
   ```
3. For each task ID found, read the task file: `.kanban/tasks/{id}-*.md`
4. Get current board state to understand task statuses
5. If no question provided, ask the user what they want to know
6. If question provided, answer conversationally using the gathered data

## Data Sources

| Source | How to Get | Contains |
|--------|------------|----------|
| User's commits | `git log --author="{name}"` | Task IDs touched |
| Task files | `.kanban/tasks/{id}-*.md` | Current status, priority, labels |
| Board columns | All task statuses | What's in-progress, done, etc. |

## Important

Focus on **tasks**, not raw commits. Commits are used to identify which tasks the user has worked on, but answers should be about task status, completion, and outcomes.

## Example Questions

- "How many tasks are they currently working on?"
- "What have they completed?"
- "What bugs have they fixed?"
- "What's in progress?"
- "Show their task history"

## Examples

`/kanban:report-user matt`

Finds all tasks matt has worked on and asks what you want to know.

`/kanban:report-user matt What bugs have they fixed?`

Lists completed bug tasks that matt contributed to.
