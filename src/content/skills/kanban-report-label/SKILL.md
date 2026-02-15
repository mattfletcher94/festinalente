---
name: kanban-report-label
description: Query tasks filtered by label (bug, feature, docs, refactor)
allowed-tools: Read, Glob, Grep, Bash(git log *)
argument-hint: "{label} [question]"
disable-model-invocation: true
---

# Report Label

Query tasks filtered by label using natural language.

## Reference

{{> helper-scripts show_list_tasks=true show_find_task=true}}

## Usage

`/kanban-report-label {label} [question]`

## Steps

- [ ] 1. **Parse $ARGUMENTS**
   Extract label (first argument) and optional question (remaining text)

- [ ] 2. **Find all task files with the matching label**
   - Search `.kanban/tasks/*.md` for files containing the label in frontmatter
   - Use: `grep -l "labels:.*{label}" .kanban/tasks/*.md`

- [ ] 3. **For each matching task**
   Read the task file to get full details

- [ ] 4. **Optionally read specs/plans**
   For additional context

- [ ] 5. **If no question provided**
   Ask the user what they want to know

- [ ] 6. **If question provided**
   Answer conversationally using the gathered data

- [ ] 7. **Output next steps to user**

## Valid Labels

From `.claude/kanban-workflow.yaml`:
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

## Validation

- [ ] Tasks with label found successfully
- [ ] Question answered conversationally
- [ ] Next steps shown to user

## Example

`/kanban-report-label bug`

Finds all tasks labeled as bugs and asks what you want to know.

`/kanban-report-label feature What's in progress?`

Lists all feature tasks currently in the in-progress column.

## Next Steps

```
/clear
/kanban-status
```
