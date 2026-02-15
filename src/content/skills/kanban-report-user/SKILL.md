---
name: kanban-report-user
description: Query what tasks a git user has worked on
allowed-tools: Read, Glob, Grep, Bash(git log *)
argument-hint: "{name} [question]"
disable-model-invocation: true
---

# Report User

<purpose>
Query what tasks a specific git user has worked on using natural language.
</purpose>

<context>
{{> helper-scripts show_list_tasks=true show_find_task=true}}

**Usage:** `/kanban-report-user {name} [question]`
</context>

<prohibited>
- Do not answer questions without first gathering task data
- Do not report on raw commits — focus on tasks
</prohibited>

<process>
  <step name="parse_arguments" outputs="userName, question">
    Extract user name (first argument) and optional question (remaining text)
  </step>

  <step name="find_task_ids" outputs="taskIds">
    ```bash
    git log --all --author="{userName}" --format="%s" | grep -oP '\(\K\d+(?=\))' | sort -u
    ```
  </step>

  <step name="read_task_files">
    For each task ID found, read the task file: `.kanban/tasks/{id}-*.md`
  </step>

  <step name="get_board_state">
    Understand task statuses (what's in-progress, done, etc.)
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
- User's tasks found via git history
- Question answered conversationally
- Next steps shown to user
</success_criteria>

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

## Example

`/kanban-report-user matt`

Finds all tasks matt has worked on and asks what you want to know.

`/kanban-report-user matt What bugs have they fixed?`

Lists completed bug tasks that matt contributed to.

## Next Steps

```
/clear
/kanban-status
```
