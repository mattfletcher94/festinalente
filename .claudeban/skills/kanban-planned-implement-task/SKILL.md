---
name: kanban-planned-implement-task
description: Implement a planned task. Moves task to In Progress, executes the plan, then moves to Review. No commit - code stays uncommitted.
allowed-tools: Read, Write, Edit, Bash(*)
---

# Implement Kanban Task

Move task from **Planned** to **In Progress** and execute the plan. Code remains uncommitted until verification passes.

## Column Transition

```
Planned → In Progress
```

## Commit

None - code stays uncommitted until review passes. Use `/kanban:in-progress-wip-commit` to save partial progress.

## Steps

1. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `planned` or `in-progress` status from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task to implement

2. **Read task file**:
   - Find file matching `.kanban/tasks/{id}-*.md`
   - Parse YAML frontmatter
   - Verify current status:
     - If `planned`: Move to `in-progress` first (step 3)
     - If `in-progress`: Resume implementation (skip step 3)
     - If `backlog`: Suggest `/kanban:backlog-refine-task {id}` first, exit
     - If `review` or later: Warn task is past implementation
   - Error if task not found

3. **Move to In Progress** (if status was `planned`):
   - Change `status: planned` to `status: in-progress`
   - Add `updated: {YYYY-MM-DD}`
   - Write updated task file
   - Print: "Task {id} moved to In Progress"

4. **Find and read plan file**:
   - Check for `.kanban/plans/{id}.plan.md`
   - If plan found: Read plan content
   - If NO plan found:
     - Warn: "No plan found for task {id}"
     - Suggest: "Create plan with /kanban:backlog-plan-task first"
     - Exit

5. **Check for command skills**:
   - Load `.kanban/board.yaml`
   - Find `commands."kanban:planned-implement-task".skills` array
   - If skills array is non-empty:
     - Read each skill file at the listed paths
     - Follow their instructions as mandatory guidance for this command

6. **Parse plan checkboxes**:
   - Find all unchecked items: `- [ ]` pattern
   - Find all checked items: `- [x]` pattern
   - Calculate: total items, completed items, remaining items
   - Display progress overview

7. **Execute plan checkboxes**:
   - For each unchecked item (`- [ ]`) in order:
     a. Display: "[{n}/{total}] {checkbox description}"
     b. Execute the implementation step described
     c. Mark checkbox as complete: change `- [ ]` to `- [x]`
     d. Write updated plan file immediately (enables resume)
     e. Report: "Done"
   - If any step fails:
     - Stop execution
     - Report which step failed and why
     - Progress is saved (can resume later with same command)
     - Suggest: "Use /kanban:in-progress-wip-commit to save progress"

8. **On completion**:
   - After ALL checkboxes complete:
     - Keep status as `in-progress` (verification will move it)
     - Update `updated: {YYYY-MM-DD}`
     - Write updated task file
   - If some checkboxes remain:
     - Keep status as `in-progress`
     - Report: "Partial progress: {completed}/{total} items"
     - Suggest: "Use /kanban:in-progress-wip-commit to save progress"

9. **Report completion**:
   - Display implementation summary
   - Show files modified (uncommitted)
   - Show status
   - Remind: "Code is uncommitted. Run /kanban:in-progress-verify-task {id} to run automated checks."

## Validation

All must pass. If any fail, fix and retry.

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Task frontmatter contains `status: in-progress`
- [ ] Plan file exists at `.kanban/plans/{id}.plan.md`
- [ ] All plan checkboxes are marked complete (`- [x]`)

## Arguments

- `$ARGUMENTS` - Task ID (e.g., "001")

## Example: Full Implementation

User: `/kanban:planned-implement-task 001`

```
Implementing task 001 "Add user auth"...

Task 001 moved to In Progress

Plan: .kanban/plans/001.plan.md
Progress: 0/3 items

[1/3] Create auth routes file
  Creating src/routes/auth.ts...
  Done

[2/3] Add login endpoint
  Adding POST /login handler...
  Done

[3/3] Add logout endpoint
  Adding POST /logout handler...
  Done

Implementation complete!
All 3 plan items executed.

Task 001 ready for verification
- Status: in-progress
- Files modified: 3 (uncommitted)

Next: Run /kanban:in-progress-verify-task 001 to run automated checks.
```

## Example: Resume Partial Implementation

User: `/kanban:planned-implement-task 002`

```
Implementing task 002 "Setup database"...

Column: in-progress (resuming)

Plan: .kanban/plans/002.plan.md
Progress: 2/5 items (resuming from item 3)

[3/5] Create migration script
  Creating db/migrations/001_initial.sql...
  Done

[4/5] Add seed data
  Creating db/seeds/dev.sql...
  Done

[5/5] Update README with DB setup
  Adding database section to README.md...
  Done

Implementation complete!
All 5 plan items executed (3 this session).

Task 002 ready for verification
- Status: in-progress
- Files modified: 5 (uncommitted)

Next: Run /kanban:in-progress-verify-task 002 to run automated checks.
```

## Next Steps

If interrupted:
```
/kanban:in-progress-wip-commit {id}
```

When complete:
```
/kanban:in-progress-verify-task {id}
```
