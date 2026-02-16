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

<note>**Usage:** `/kanban-report-task {id} [question]`</note>
</context>

<prohibited>
- Do not answer questions without first gathering task data
- Do not make up information not found in task files or git history
</prohibited>

<process>
  <step name="parse_arguments" outputs="taskId, question">
    <action>Extract task ID (first argument)</action>
    <action>Extract optional question (remaining text)</action>
  </step>

  <step name="gather_task_data" outputs="taskFile, specFile, planFile, gitHistory">
    <command description="Get task file path">node .claude/scripts/find-task.cjs {taskId}</command>
    <action>Read the task file at the returned path</action>
    <command description="Get spec file path (if exists)">node .claude/scripts/find-spec.cjs {taskId}</command>
    <action>Read the spec file if found</action>
    <command description="Get plan file path (if exists)">node .claude/scripts/find-plan.cjs {taskId}</command>
    <action>Read the plan file if found</action>
    <command description="Get git commits for this task">git log --oneline --all --grep="({taskId})"</command>
  </step>

  <step name="prompt_for_question" when="no question provided">
    <prompt>What would you like to know about the task?</prompt>
  </step>

  <step name="answer_question" when="question provided">
    <action>Answer conversationally using the gathered data</action>
  </step>

  <step name="output_result">
    <output>
For task status details:
```
/clear
/kanban-status {taskId}
```
    </output>
  </step>
</process>

<success_criteria>
- Task data gathered successfully
- Question answered conversationally
- Next steps shown to user
</success_criteria>

<note>
**Data Sources:**

| Source | Location | Contains |
|--------|----------|----------|
| Task file | `.kanban/tasks/{id}/task.md` | Status, priority, labels, description |
| Spec file | `.kanban/tasks/{id}/spec.md` | Requirements, acceptance criteria |
| Plan file | `.kanban/tasks/{id}/plan.md` | Implementation steps, checkboxes |
| Git history | `git log --grep="({id})"` | Timeline, commits, state transitions |
</note>

<note>
**Example Questions:**

- "What's the current status?"
- "When was this started?"
- "How many times did verification fail?"
- "What files were changed?"
- "Show me the timeline"
- "Is the spec complete?"
</note>

<example>
`/kanban-report-task 003`

Gathers data for task 003 and asks what you want to know.

`/kanban-report-task 003 What files were changed?`

Analyzes git history for task 003 and lists modified files.
</example>

<next_steps>
```
/clear
/kanban-status {id}
```
</next_steps>
