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

<note>**Usage:** `/kanban-report-user {name} [question]`</note>
</context>

<prohibited>
- Do not answer questions without first gathering task data
- Do not report on raw commits — focus on tasks
</prohibited>

<process>
  <step name="parse_arguments" outputs="userName, question">
    <action>Extract user name (first argument)</action>
    <action>Extract optional question (remaining text)</action>
  </step>

  <step name="find_task_ids" outputs="taskIds">
    <command description="Find task IDs from user's commits">git log --all --author="{userName}" --format="%s" | grep -oP '\(\K\d+(?=\))' | sort -u</command>
  </step>

  <step name="read_task_files">
    <action>For each task ID found, read the task file: `.kanban/tasks/{id}/task.xml`</action>
  </step>

  <step name="get_board_state">
    <action>Understand task statuses (what's in-progress, done, etc.)</action>
  </step>

  <step name="prompt_for_question" when="no question provided">
    <prompt>What would you like to know about this user's tasks?</prompt>
  </step>

  <step name="answer_question" when="question provided">
    <action>Answer conversationally using the gathered data</action>
  </step>

  <step name="output_result">
    <output>
For more details on the board:
```
/clear
/kanban-status
```
    </output>
    {{> skill-complete}}
  </step>
</process>

<success_criteria>
- User's tasks found via git history
- Question answered conversationally
- Next steps shown to user
</success_criteria>

<note>
**Data Sources:**

| Source | How to Get | Contains |
|--------|------------|----------|
| User's commits | `git log --author="{name}"` | Task IDs touched |
| Task files | `.kanban/tasks/{id}/task.xml` | Current status, priority, labels |
| Board columns | All task statuses | What's in-progress, done, etc. |
</note>

<note>
**Important:**

Focus on **tasks**, not raw commits. Commits are used to identify which tasks the user has worked on, but answers should be about task status, completion, and outcomes.
</note>

<note>
**Example Questions:**

- "How many tasks are they currently working on?"
- "What have they completed?"
- "What bugs have they fixed?"
- "What's in progress?"
- "Show their task history"
</note>

<example>
`/kanban-report-user matt`

Finds all tasks matt has worked on and asks what you want to know.

`/kanban-report-user matt What bugs have they fixed?`

Lists completed bug tasks that matt contributed to.
</example>

<next_steps>
```
/clear
/kanban-status
```
</next_steps>
