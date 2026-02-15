---
name: kanban-implement
description: Implement a planned task. Moves task to In Progress, executes the plan, then moves to Checks. No commit - code stays uncommitted.
allowed-tools: Read, Write, Edit, Bash(*)
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Implement Kanban Task

<purpose>
Move task from Planned to In Progress and execute the plan. Code remains uncommitted until verification passes.
</purpose>

<context>
{{> directory-reference}}

{{> helper-scripts show_find_task=true show_find_plan=true show_get_date_time=true}}

{{> column-transition from="planned" to="in-progress"}}
</context>

<prohibited>
- Do not commit code during implementation (code stays uncommitted until verify passes)
- Do not skip plan steps or mark them complete without executing them
- Do not implement tasks that haven't been planned
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="get_task_id" outputs="taskId">
    Use $ARGUMENTS if provided (e.g., "001"), otherwise:
    - List tasks in `planned` or `in-progress` status from `.kanban/tasks/`
    - Show task IDs and titles
    - Ask user which task to implement
  </step>

  <step name="read_task_file" outputs="taskPath, title, status">
    - Run `node .claude/scripts/find-task.cjs {taskId}` to get exact path
    - Read the file at the `path` from JSON output
    - Parse YAML frontmatter
    - Verify current status:
      - If `planned`: Move to `in-progress` first (step move_to_in_progress)
      - If `in-progress`: Resume implementation (skip step move_to_in_progress)
      - If `backlog` or `refined`: Suggest `/kanban-refine {taskId}` or `/kanban-scope {taskId}` first, exit
      - If `checks` or later: Warn task is past implementation
    - Error if task not found
  </step>

  <step name="verify_branch">
    {{> branch-verify-task}}
  </step>

  <step name="move_to_in_progress" when="status was `planned`">
    - Change `status: planned` to `status: in-progress`
    - Add `updated: {YYYY-MM-DD}`
    - Write updated task file
    - Print: "Task {taskId} moved to In Progress"
  </step>

  <step name="read_plan_file" outputs="planPath, planContent">
    - Run `node .claude/scripts/find-plan.cjs {taskId}` to get exact path
    - If plan found: Read the plan at the `path` from JSON output
    - If NO plan found:
      - Warn: "No plan found for task {taskId}"
      - Suggest: "Create plan with /kanban-plan first"
      - Exit
  </step>

  <step name="read_spec">
    - Get `spec` path from plan frontmatter
    - Read spec file for full context on requirements and patterns
  </step>

  <step name="load_product_context" when="task has `affects` field">
    - For each ID in affects:
      - Read `.kanban/product/{id}.md`
    - Understand current product behavior
    - Implementation should maintain or extend documented behavior
  </step>

  <step name="load_user_skills">
    {{> user-skills command="implement"}}
  </step>

  <step name="parse_plan_checkboxes" outputs="totalItems, completedItems, remainingItems">
    - Find all unchecked items: `- [ ]` pattern
    - Find all checked items: `- [x]` pattern
    - Calculate: total items, completed items, remaining items
    - Display progress overview
  </step>

  <step name="execute_plan_checkboxes">
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
      - Suggest: "Use /kanban-save to save progress"
  </step>

  <step name="on_completion">
    - After ALL checkboxes complete:
      - Keep status as `in-progress` (verification will move it)
      - Update `updated: {YYYY-MM-DD}`
      - Write updated task file
    - If some checkboxes remain:
      - Keep status as `in-progress`
      - Report: "Partial progress: {completed}/{total} items"
      - Suggest: "Use /kanban-save to save progress"
  </step>

  <step name="output_result">
    - Display implementation summary
    - Show files modified (uncommitted)
    - Show status
  </step>
</process>

<success_criteria>
- Task file exists at `.kanban/tasks/{taskId}-*.md`
- Task frontmatter contains `status: in-progress`
- Plan file exists at `.kanban/plans/{taskId}-{slug}.plan.md`
- All plan checkboxes are marked complete (`- [x]`)
- Next steps shown to user
</success_criteria>

## Example

**Full Implementation:**

User: `/kanban-implement 001`

```
Implementing task 001 "Add user auth"...

Task 001 moved to In Progress

Reading spec: .kanban/specs/001.spec.md
Reading plan: .kanban/plans/001.plan.md
Progress: 0/3 items

[1/3] Create auth routes file `src/routes/auth.ts` (FR1)
  Creating src/routes/auth.ts...
  Done

[2/3] Add login endpoint `src/routes/auth.ts` (FR1)
  Adding POST /login handler...
  Done

[3/3] Add logout endpoint `src/routes/auth.ts` (FR2)
  Adding POST /logout handler...
  Done

Implementation complete!
All 3 plan items executed.

Task 001 ready for verification
- Status: in-progress
- Files modified: 3 (uncommitted)

Next:
/clear
/kanban-verify 001
```

**Resume Partial Implementation:**

User: `/kanban-implement 002`

```
Implementing task 002 "Setup database"...

Column: in-progress (resuming)

Reading spec: .kanban/specs/002.spec.md
Reading plan: .kanban/plans/002.plan.md
Progress: 2/5 items (resuming from item 3)

[3/5] Create migration script `db/migrations/001_initial.sql` (FR2)
  Creating db/migrations/001_initial.sql...
  Done

[4/5] Add seed data `db/seeds/dev.sql` (FR3)
  Creating db/seeds/dev.sql...
  Done

[5/5] Update README with DB setup (FR4)
  Adding database section to README.md...
  Done

Implementation complete!
All 5 plan items executed (3 this session).

Task 002 ready for verification
- Status: in-progress
- Files modified: 5 (uncommitted)

Next:
/clear
/kanban-verify 002
```

## Next Steps

If interrupted:
```
/clear
/kanban-save {id}
```

When implementation complete:
```
/clear
/kanban-verify {id}
```
