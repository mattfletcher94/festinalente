---
name: kanban-report-label
description: Query tasks filtered by label (bug, feature, docs, refactor)
allowed-tools: Read, Glob, Grep, Bash(git log *)
argument-hint: "{label} [question]"
disable-model-invocation: true
---

# Report Label

<purpose>
Query tasks filtered by label using natural language.
</purpose>

<context>
{{> helper-scripts show_list_tasks=true show_find_task=true}}

**Usage:** `/kanban-report-label {label} [question]`
</context>

<prohibited>
- Do not answer questions without first gathering task data
- Do not make up information not found in task files
</prohibited>

<process>
  <step name="parse_arguments" outputs="label, question">
    Extract label (first argument) and optional question (remaining text)
  </step>

  <step name="find_matching_tasks" outputs="taskFiles">
    - Search `.kanban/tasks/*.md` for files containing the label in frontmatter
    - Use: `grep -l "labels:.*{label}" .kanban/tasks/*.md`
  </step>

  <step name="read_task_details">
    For each matching task, read the task file to get full details
  </step>

  <step name="read_specs_plans" when="additional context needed">
    Optionally read specs/plans for additional context
  </step>

  <step name="prompt_for_question" when="no question provided">
    Ask the user what they want to know
  </step>

  <step name="answer_question" when="question provided">
    Answer conversationally using the gathered data
  </step>

  <step name="output_result">
    Output next steps to user.
  </step>
</process>

<success_criteria>
- Tasks with label found successfully
- Question answered conversationally
- Next steps shown to user
</success_criteria>

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
