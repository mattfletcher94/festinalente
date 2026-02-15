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
    - Run `node .claude/scripts/find-task.cjs {id}` to get exact path
    - Read the file at the `path` from JSON output
    - Parse YAML frontmatter
    - Error if task not found
  </step>

  <step name="gather_task_details" when="$ARGUMENTS is not empty" outputs="title, status, labels, priority">
    - Title, status, labels, priority
    - Created/updated dates
  </step>

  <step name="get_plan_progress" when="$ARGUMENTS is not empty AND status is `planned`, `in-progress`, `checks`, or `qa`">
    - Read `.kanban/plans/{id}-{slug}.plan.md`
    - Count checkboxes: total, completed, remaining
    - Check for WIP Notes section
    - Check for Iterations section (previous failures)
  </step>

  <step name="output_task_status" when="$ARGUMENTS is not empty">
    ```
    ## Task {id}: {title}

    **Status:** {status}
    **Labels:** {labels}
    **Priority:** {priority}

    **Progress:** {completed}/{total} steps complete

    **Last activity:** {updated date}

    {If WIP Notes exist, show continuation hints}
    {If Iterations exist, show last failure summary}
    ```
  </step>

  <step name="suggest_next_command_for_task" when="$ARGUMENTS is not empty">
    Based on status:
    - `backlog` → `/kanban-refine {id}`
    - `refined` → `/kanban-scope {id}`
    - `scoped` → `/kanban-plan {id}`
    - `planned` → `/kanban-implement {id}`
    - `in-progress` → `/kanban-implement {id}` (to resume) or `/kanban-verify {id}` (if all checkboxes done)
    - `checks` → "Checks run automatically. Wait for auto-advance to QA."
    - `qa` → `/kanban-approve {id}` or `/kanban-rework {id}`
    - `update-docs` → `/kanban-docs {id}`
    - `pr` → `/kanban-merge {id}` or `/kanban-rework {id}`
    - `done` → "Task complete. No action needed."
  </step>

  <step name="output_task_next_steps" when="$ARGUMENTS is not empty">
    ```
    ## Task {id}: {title}

    **Status:** {status}
    **Progress:** {completed}/{total} steps complete

    {additional context if relevant}

    **Next:**
    ```
    /clear
    /kanban-{appropriate-command} {id}
    ```
    ```
  </step>

  <!-- If no task ID provided (show full board) -->
  <step name="find_all_tasks" when="$ARGUMENTS is empty" outputs="tasks">
    - Run `node .claude/scripts/list-tasks.cjs` to get all tasks
    - If count is 0, inform user and suggest `/kanban-create`
  </step>

  <step name="parse_each_task" when="$ARGUMENTS is empty">
    - Read frontmatter to get id, title, status
    - Group tasks by status
  </step>

  <step name="get_in_progress_plan_progress" when="$ARGUMENTS is empty">
    For in-progress tasks:
    - Read plan file if exists
    - Count completed/total checkboxes
  </step>

  <step name="output_board_status" when="$ARGUMENTS is empty">
    Grouped by column:
    ```
    ## Board Status

    **In Progress ({count})**
    - {id}: {title} — {completed}/{total} steps

    **Checks ({count})**
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
    ```

    Only show columns that have tasks. Order by workflow priority (in-progress first, done last).
  </step>

  <step name="suggest_next_action_for_board" when="$ARGUMENTS is empty">
    Based on board state:
    - If tasks in `in-progress`: Suggest resuming that task
    - If tasks in `checks`: Checks run automatically - wait for completion
    - If tasks in `qa`: Suggest approving or sending back for rework
    - If tasks in `update-docs`: Suggest completing documentation
    - If tasks in `pr`: Suggest merging or sending back for rework
    - If tasks in `planned` but none in progress: Suggest starting implementation
    - If only backlog/refined/scoped tasks: Suggest advancing the highest priority one
    - If no tasks: Suggest creating one
  </step>

  <step name="output_board_next_steps" when="$ARGUMENTS is empty">
    ```
    ## Board Status

    {grouped task list}

    **Next:**
    ```
    /clear
    /kanban-{command} {id}
    ```

    {Brief explanation of why this is suggested}
    ```
  </step>
</process>

<success_criteria>
- Output shows task(s) with current status
- Output includes a suggested next command
- Suggested command is appropriate for the task's current status
- Next steps shown to user
</success_criteria>

## Example

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

## Next Steps

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
