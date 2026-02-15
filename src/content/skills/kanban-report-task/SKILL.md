---
name: kanban-report-task
description: Query a specific task's history and current state
allowed-tools: Read, Glob, Grep, Bash(git log *)
argument-hint: "{id} [question]"
disable-model-invocation: true
---

# Report Task

<purpose>
Query a specific task's history and current state using natural language.
</purpose>

<context>
{{> helper-scripts show_find_task=true show_find_spec=true show_find_plan=true}}

**Usage:** `/kanban-report-task {id} [question]`
</context>

<prohibited>
- Do not answer questions without first gathering task data
- Do not make up information not found in task files or git history
</prohibited>

<process>
  <step name="parse_arguments" outputs="taskId, question">
    Extract task ID (first argument) and optional question (remaining text)
  </step>

  <step name="gather_task_data" outputs="taskFile, specFile, planFile, gitHistory">
    - Task file: Run `node .claude/scripts/find-task.cjs {taskId}` to get path
    - Spec file (if exists): Run `node .claude/scripts/find-spec.cjs {taskId}` to get path
    - Plan file (if exists): Run `node .claude/scripts/find-plan.cjs {taskId}` to get path
    - Git commits: `git log --oneline --all --grep="({taskId})"`
  </step>

  <step name="prompt_for_question" when="no question provided">
    Ask the user what they want to know about the task
  </step>

  <step name="answer_question" when="question provided">
    Answer conversationally using the gathered data
  </step>

  <step name="output_result">
    Output next steps to user.
  </step>
</process>

<success_criteria>
- Task data gathered successfully
- Question answered conversationally
- Next steps shown to user
</success_criteria>

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
