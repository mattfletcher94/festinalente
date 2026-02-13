---
name: kanban-status
description: Show board status and suggest next command to run. Use when user wants to see where things are or resume work.
allowed-tools: Read, Glob, Grep
---

# Kanban Board Status

Show the current state of the board and suggest what command to run next. Helps users resume work after losing context.

## Steps

### If task ID provided ($ARGUMENTS is not empty):

1. **Find and read the task file**:
   - Find file matching `.kanban/tasks/{id}-*.md`
   - Parse YAML frontmatter
   - Error if task not found

2. **Gather task details**:
   - Title, status, labels, priority
   - Created/updated dates

3. **If task has a plan** (status is `planned`, `in-progress`, `verify`, or `review`):
   - Read `.kanban/plans/{id}.plan.md`
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
   - `backlog` → `/kanban:backlog-refine-task {id}`
   - `refined` → `/kanban:refined-scope-task {id}`
   - `scoped` → `/kanban:scoped-plan-task {id}`
   - `planned` → `/kanban:planned-implement-task {id}`
   - `in-progress` → `/kanban:planned-implement-task {id}` (to resume) or `/kanban:in-progress-verify-task {id}` (if all checkboxes done)
   - `verify` → `/kanban:verify-pass-task {id}` or `/kanban:verify-fail-task {id}`
   - `review` → `/kanban:review-pass-task {id}` or `/kanban:review-fail-task {id}`
   - `update-docs` → `/kanban:update-docs-complete-task {id}`
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
   /kanban:{appropriate-command} {id}
   ```
   ```

### If no task ID provided (show full board):

1. **Find all task files**:
   - Glob for `.kanban/tasks/*.md`
   - If no tasks found, inform user and suggest `/kanban:define-task`

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

   **Verify ({count})**
   - {id}: {title}

   **Review ({count})**
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
   - If tasks in `verify`: Suggest passing or failing verification
   - If tasks in `review`: Suggest passing or failing review
   - If tasks in `update-docs`: Suggest completing documentation
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
   /kanban:{command} {id}
   ```

   {Brief explanation of why this is suggested}
   ```

## Validation

- [ ] Output shows task(s) with current status
- [ ] Output includes a suggested next command
- [ ] Suggested command is appropriate for the task's current status

## Arguments

- `$ARGUMENTS` - Optional task ID (e.g., "001")

## Example: Full Board Status

User: `/kanban:status`

```
## Board Status

**In Progress (1)**
- 001: Add dark mode support — 3/7 steps

**Review (1)**
- 002: Fix login redirect bug

**Backlog (2)**
- 003: Add email notifications
- 004: Improve search performance

**Done (1)**
- 000: Initial setup

**Next:**

/clear
/kanban:planned-implement-task 001

Task 001 is in progress with 4 steps remaining. Resume implementation to continue.
```

## Example: Single Task Status

User: `/kanban:status 001`

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
/kanban:planned-implement-task 001

Resume implementation to complete remaining steps.
```

## Example: No Tasks

User: `/kanban:status`

```
## Board Status

No tasks found.

**Next:**

/clear
/kanban:define-task "Your task title"

Create your first task to get started.
```
