---
name: kanban-status
description: Show board status and suggest next command to run. Use when user wants to see where things are or resume work.
allowed-tools: Read, Glob, Grep
disable-model-invocation: true
---

# Kanban Board Status

Show the current state of the board and suggest what command to run next. Helps users resume work after losing context.

## Helper Scripts

Use these scripts to reliably find files and list tasks:

```bash
# List all tasks (returns JSON with count and tasks array)
node .claude/scripts/list-tasks.cjs

# List tasks filtered by status
node .claude/scripts/list-tasks.cjs --status=in-progress

# Find task by ID (returns JSON with path and metadata)
node .claude/scripts/find-task.cjs {id}

# Find plan by ID (returns JSON with path and metadata)
node .claude/scripts/find-plan.cjs {id}
```

## Steps

### If task ID provided ($ARGUMENTS is not empty):

1. **Find and read the task file**:
   - Run `node .claude/scripts/find-task.cjs {id}` to get exact path
   - Read the file at the `path` from JSON output
   - Parse YAML frontmatter
   - Error if task not found

2. **Gather task details**:
   - Title, status, labels, priority
   - Created/updated dates

3. **If task has a plan** (status is `planned`, `in-progress`, `checks`, or `qa`):
   - Read `.kanban/plans/{id}-{slug}.plan.md`
   - Count checkboxes: total, completed, remaining
   - Check for WIP Notes section
   - Check for Iterations section (previous failures)

4. **Output task status**:
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

5. **Suggest next command** based on status:
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

6. **Format output**:
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

### If no task ID provided (show full board):

1. **Find all task files**:
   - Run `node .claude/scripts/list-tasks.cjs` to get all tasks
   - If count is 0, inform user and suggest `/kanban-create`

2. **Parse each task**:
   - Read frontmatter to get id, title, status
   - Group tasks by status

3. **For in-progress tasks, get plan progress**:
   - Read plan file if exists
   - Count completed/total checkboxes

4. **Output board status** grouped by column:
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

5. **Suggest next action** based on board state:
   - If tasks in `in-progress`: Suggest resuming that task
   - If tasks in `checks`: Checks run automatically - wait for completion
   - If tasks in `qa`: Suggest approving or sending back for rework
   - If tasks in `update-docs`: Suggest completing documentation
   - If tasks in `pr`: Suggest merging or sending back for rework
   - If tasks in `planned` but none in progress: Suggest starting implementation
   - If only backlog/refined/scoped tasks: Suggest advancing the highest priority one
   - If no tasks: Suggest creating one

6. **Format final output**:
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

## Validation

**STOP. You MUST verify ALL items pass before declaring success. Do not skip validation.**

- [ ] Output shows task(s) with current status
- [ ] Output includes a suggested next command
- [ ] Suggested command is appropriate for the task's current status

## Arguments

- `$ARGUMENTS` - Optional task ID (e.g., "001")

## Example: Full Board Status

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

## Example: Single Task Status

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

## Example: No Tasks

User: `/kanban-status`

```
## Board Status

No tasks found.

**Next:**

/clear
/kanban-create "Your task title"

Create your first task to get started.
```
