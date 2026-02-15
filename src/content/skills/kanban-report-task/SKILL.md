---
name: kanban-report-task
description: Query a specific task's history and current state
allowed-tools: Read, Glob, Grep, Bash(git log *)
argument-hint: "{id} [question]"
disable-model-invocation: true
---

# Report Task

Query a specific task's history and current state using natural language.

## Reference

{{> helper-scripts show_find_task=true show_find_spec=true show_find_plan=true}}

## Usage

`/kanban-report-task {id} [question]`

## Steps

- [ ] 1. **Parse $ARGUMENTS**
   Extract task ID (first argument) and optional question (remaining text)

- [ ] 2. **Gather all data for the task**
   - Task file: `.kanban/tasks/{id}-*.md`
   - Spec file (if exists): `.kanban/specs/{id}-{slug}.spec.md`
   - Plan file (if exists): `.kanban/plans/{id}-{slug}.plan.md`
   - Git commits: `git log --oneline --all --grep="({id})"`

- [ ] 3. **If no question provided**
   Ask the user what they want to know about the task

- [ ] 4. **If question provided**
   Answer conversationally using the gathered data

- [ ] 5. **Output next steps to user**

## Data Sources

| Source | Location | Contains |
|--------|----------|----------|
| Task file | `.kanban/tasks/{id}-*.md` | Status, priority, labels, description |
| Spec file | `.kanban/specs/{id}-{slug}.spec.md` | Requirements, acceptance criteria |
| Plan file | `.kanban/plans/{id}-{slug}.plan.md` | Implementation steps, checkboxes |
| Git history | `git log --grep="({id})"` | Timeline, commits, state transitions |

## Example Questions

- "What's the current status?"
- "When was this started?"
- "How many times did verification fail?"
- "What files were changed?"
- "Show me the timeline"
- "Is the spec complete?"

## Validation

- [ ] Task data gathered successfully
- [ ] Question answered conversationally
- [ ] Next steps shown to user

## Example

`/kanban-report-task 003`

Gathers data for task 003 and asks what you want to know.

`/kanban-report-task 003 What files were changed?`

Analyzes git history for task 003 and lists modified files.

## Next Steps

```
/clear
/kanban-status {id}
```
