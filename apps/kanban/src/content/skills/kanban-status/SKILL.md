---
name: kanban-status
description: Show board status and suggest next command to run. Use when user wants to see where things are or resume work.
allowed-tools: Read, Glob, Grep
disable-model-invocation: true
---

# Kanban Board Status

<purpose>
Show the current state of the board and suggest what command to run next. Helps users resume work after losing context.
</purpose>

<context>
{{> helper-scripts show_list_tasks=true show_find_task=true show_find_plan=true}}
</context>

<prohibited>
- Do not suggest commands inappropriate for the task's current status
- Do not show stale or cached data — always read fresh from files
</prohibited>

<process>
  <!-- If task ID provided -->
  <step name="find_task" when="$ARGUMENTS is not empty" outputs="taskPath">
    <command>node .kanban/scripts/find-task.cjs {id}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse YAML frontmatter</action>
    <branch condition="task not found">
      <output>Error: Task not found</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="gather_task_details" when="$ARGUMENTS is not empty" outputs="title, status, labels, priority">
    <action>Extract title, status, labels, priority</action>
    <action>Extract created/updated dates</action>
  </step>

  <step name="get_plan_progress" when="$ARGUMENTS is not empty AND status is `planned`, `in-progress`, `checks`, or `qa`">
    <action>Read `.kanban/tasks/{id}/plan.md`</action>
    <action>Count checkboxes: total, completed, remaining</action>
    <action>Check for WIP Notes section</action>
    <action>Check for Iterations section (previous failures)</action>
  </step>

  <step name="output_task_status" when="$ARGUMENTS is not empty">
    <output>
## Task {id}: {title}

**Status:** {status}
**Labels:** {labels}
**Priority:** {priority}

**Progress:** {completed}/{total} steps complete

**Last activity:** {updated date}

{If WIP Notes exist, show continuation hints}
{If Iterations exist, show last failure summary}
    </output>
  </step>

  <step name="suggest_next_command_for_task" when="$ARGUMENTS is not empty">
    <branch condition="status is backlog">
      <output>Next: `/kanban-refine {id}`</output>
    </branch>
    <branch condition="status is refined">
      <output>Next: `/kanban-scope {id}`</output>
    </branch>
    <branch condition="status is scoped">
      <output>Next: `/kanban-plan {id}`</output>
    </branch>
    <branch condition="status is planned">
      <output>Next: `/kanban-implement {id}`</output>
    </branch>
    <branch condition="status is in-progress">
      <output>Next: `/kanban-implement {id}` (to resume)</output>
    </branch>
    <branch condition="status is codecheck">
      <output>Next: `/kanban-codecheck {id}`</output>
    </branch>
    <branch condition="status is qa">
      <output>Next: `/kanban-approve {id}` or `/kanban-rework {id}`</output>
    </branch>
    <branch condition="status is update-docs">
      <output>Next: `/kanban-docs {id}`</output>
    </branch>
    <branch condition="status is pr">
      <output>Next: `/kanban-merge {id}` or `/kanban-rework {id}`</output>
    </branch>
    <branch condition="status is done">
      <output>Task complete. No action needed.</output>
    </branch>
  </step>

  <step name="output_task_next_steps" when="$ARGUMENTS is not empty">
    <output>
## Task {id}: {title}

**Status:** {status}
**Progress:** {completed}/{total} steps complete

{additional context if relevant}

**Next:**
```
/clear
/kanban-{appropriate-command} {id}
```
    </output>
  </step>

  <!-- If no task ID provided (show full board) -->
  <step name="find_all_tasks" when="$ARGUMENTS is empty" outputs="tasks">
    <command>node .kanban/scripts/list-tasks.cjs</command>
    <branch condition="count is 0">
      <output>No tasks found.</output>
      <output>Next: `/kanban-create "Your task title"`</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="parse_each_task" when="$ARGUMENTS is empty">
    <action>Read frontmatter to get id, title, status</action>
    <action>Group tasks by status</action>
  </step>

  <step name="get_in_progress_plan_progress" when="$ARGUMENTS is empty">
    <note>For in-progress tasks:</note>
    <action>Read plan file if exists</action>
    <action>Count completed/total checkboxes</action>
  </step>

  <step name="output_board_status" when="$ARGUMENTS is empty">
    <note>Group by column, ordered by workflow priority (in-progress first, done last)</note>
    <output>
## Board Status

**In Progress ({count})**
- {id}: {title} — {completed}/{total} steps

**Code Check ({count})**
- {id}: {title}

**QA ({count})**
- {id}: {title}

**Update Docs ({count})**
- {id}: {title}

**PR ({count})**
- {id}: {title}

**Planned ({count})**
- {id}: {title}

**Scoped ({count})**
- {id}: {title}

**Refined ({count})**
- {id}: {title}

**Backlog ({count})**
- {id}: {title}

**Done ({count})**
- {id}: {title}
    </output>
    <note>Only show columns that have tasks</note>
  </step>

  <step name="suggest_next_action_for_board" when="$ARGUMENTS is empty">
    <branch condition="tasks in in-progress">
      <action>Suggest resuming that task</action>
    </branch>
    <branch condition="tasks in codecheck">
      <action>Suggest running code checks</action>
    </branch>
    <branch condition="tasks in qa">
      <action>Suggest approving or sending back for rework</action>
    </branch>
    <branch condition="tasks in update-docs">
      <action>Suggest completing documentation</action>
    </branch>
    <branch condition="tasks in pr">
      <action>Suggest merging or sending back for rework</action>
    </branch>
    <branch condition="tasks in planned but none in progress">
      <action>Suggest starting implementation</action>
    </branch>
    <branch condition="only backlog/refined/scoped tasks">
      <action>Suggest advancing the highest priority one</action>
    </branch>
    <branch condition="no tasks">
      <action>Suggest creating one</action>
    </branch>
  </step>

  <step name="output_board_next_steps" when="$ARGUMENTS is empty">
    <output>
## Board Status

{grouped task list}

**Next:**
```
/clear
/kanban-{command} {id}
```

{Brief explanation of why this is suggested}
    </output>
    {{> skill-complete}}
  </step>
</process>

<success_criteria>
- Output shows task(s) with current status
- Output includes a suggested next command
- Suggested command is appropriate for the task's current status
- Next steps shown to user
</success_criteria>

<example>
**Full Board Status:**

User: `/kanban-status`

```
## Board Status

**In Progress (1)**
- 001: Add dark mode support — 3/7 steps

**QA (1)**
- 002: Fix login redirect bug

**Backlog (2)**
- 003: Add email notifications
- 004: Improve search performance

**Done (1)**
- 000: Initial setup

**Next:**

/clear
/kanban-implement 001

Task 001 is in progress with 4 steps remaining. Resume implementation to continue.
```

**Single Task Status:**

User: `/kanban-status 001`

```
## Task 001: Add dark mode support

**Status:** in-progress
**Labels:** [feature]
**Priority:** high

**Progress:** 3/7 steps complete

**Remaining steps:**
- [ ] Add theme toggle component
- [ ] Persist preference to localStorage
- [ ] Add system preference detection
- [ ] Update documentation

**Last activity:** 2026-02-12

**WIP Notes:**
Next step is the toggle component. Theme context is already set up.

**Next:**

/clear
/kanban-implement 001

Resume implementation to complete remaining steps.
```

**No Tasks:**

User: `/kanban-status`

```
## Board Status

No tasks found.

**Next:**

/clear
/kanban-create "Your task title"

Create your first task to get started.
```
</example>

<next_steps>
Check status of a specific task:
```
/clear
/kanban-status {id}
```

Or view the full board:
```
/clear
/kanban-status
```
</next_steps>
