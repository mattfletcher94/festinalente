---
name: report-label
description: Query tasks filtered by label (bug, feature, docs, refactor)
allowed-tools: Read, Glob, Grep, Bash(git log *)
argument-hint: "{label} [question]"
---

# Report Label

Query tasks filtered by label using natural language.

## Usage

`/kanban:report-label {label} [question]`

## Workflow

1. Parse `$ARGUMENTS` to extract label (first argument) and optional question (remaining text)
2. Find all task files with the matching label:
   - Search `.kanban/tasks/*.md` for files containing the label in frontmatter
   - Use: `grep -l "labels:.*{label}" .kanban/tasks/*.md`
3. For each matching task, read the task file to get full details
4. Optionally read specs/plans for additional context
5. If no question provided, ask the user what they want to know
6. If question provided, answer conversationally using the gathered data

## Valid Labels

From `.claudeban/kanban-workflow.yaml`:
- `bug` - Bug fixes
- `feature` - New features
- `docs` - Documentation
- `refactor` - Code refactoring
- `needs-refinement` - Tasks requiring more detail

## Data Sources

| Source | Location | Contains |
|--------|----------|----------|
| Task files | `.kanban/tasks/*.md` | Status, priority, labels, description |
| Spec files | `.kanban/specs/{id}-{slug}.spec.md` | Requirements for scoped tasks |
| Plan files | `.kanban/plans/{id}-{slug}.plan.md` | Implementation plans |

## Example Questions

- "How many bugs are open?"
- "What features are in progress?"
- "List all completed refactors"
- "What's the highest priority?"
- "Which tasks are blocked?"

## Examples

`/kanban:report-label bug`

Finds all tasks labeled as bugs and asks what you want to know.

`/kanban:report-label feature What's in progress?`

Lists all feature tasks currently in the in-progress column.
