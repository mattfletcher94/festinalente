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

<note>**Usage:** `/kanban-report-label {label} [question]`</note>
</context>

<prohibited>
- Do not answer questions without first gathering task data
- Do not make up information not found in task files
</prohibited>

<process>
  <step name="parse_arguments" outputs="label, question">
    <action>Extract label (first argument)</action>
    <action>Extract optional question (remaining text)</action>
  </step>

  <step name="find_matching_tasks" outputs="taskFiles">
    <action>Search `.kanban/tasks/*/task.md` for files containing the label in frontmatter</action>
    <command>grep -l "labels:.*{label}" .kanban/tasks/*/task.md</command>
  </step>

  <step name="read_task_details">
    <action>For each matching task, read the task file to get full details</action>
  </step>

  <step name="read_specs_plans" when="additional context needed">
    <action>Optionally read specs/plans for additional context</action>
  </step>

  <step name="prompt_for_question" when="no question provided">
    <prompt>What would you like to know about these tasks?</prompt>
  </step>

  <step name="answer_question" when="question provided">
    <action>Answer conversationally using the gathered data</action>
  </step>

  <step name="output_result">
    <output>Output next steps to user</output>
  </step>
</process>

<success_criteria>
- Tasks with label found successfully
- Question answered conversationally
- Next steps shown to user
</success_criteria>

<note>
**Valid Labels:**

From `.claude/kanban-workflow.yaml`:
- `bug` - Bug fixes
- `feature` - New features
- `docs` - Documentation
- `refactor` - Code refactoring
</note>

<note>
**Data Sources:**

| Source | Location | Contains |
|--------|----------|----------|
| Task files | `.kanban/tasks/{id}/task.md` | Status, priority, labels, description |
| Spec files | `.kanban/tasks/{id}/spec.md` | Requirements for scoped tasks |
| Plan files | `.kanban/tasks/{id}/plan.md` | Implementation plans |
</note>

<note>
**Example Questions:**

- "How many bugs are open?"
- "What features are in progress?"
- "List all completed refactors"
- "What's the highest priority?"
- "Which tasks are blocked?"
</note>

<example>
`/kanban-report-label bug`

Finds all tasks labeled as bugs and asks what you want to know.

`/kanban-report-label feature What's in progress?`

Lists all feature tasks currently in the in-progress column.
</example>

<next_steps>
```
/clear
/kanban-status
```
</next_steps>
