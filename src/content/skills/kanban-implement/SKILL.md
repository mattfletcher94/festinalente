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
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as taskId</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <action>List tasks in `planned` or `in-progress` status from `.kanban/tasks/`</action>
      <output>Show task IDs and titles</output>
      <prompt>Which task to implement?</prompt>
    </branch>
  </step>

  <step name="read_task_file" outputs="taskPath, title, status">
    <command>node .claude/kanban-scripts/find-task.cjs {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse YAML frontmatter</action>
    <branch condition="status is planned">
      <action>Move to `in-progress` first (step move_to_in_progress)</action>
    </branch>
    <branch condition="status is in-progress">
      <action>Resume implementation (skip step move_to_in_progress)</action>
    </branch>
    <branch condition="status is backlog or refined">
      <output>Task needs refinement/scoping first.</output>
      <output>Run `/kanban-refine {taskId}` or `/kanban-scope {taskId}` first.</output>
      <action>Exit</action>
    </branch>
    <branch condition="status is checks or later">
      <output>Warning: Task is past implementation phase.</output>
    </branch>
    <branch condition="task not found">
      <output>Error: Task not found</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="verify_branch">
    {{> branch-verify-task}}
  </step>

  <step name="move_to_in_progress" when="status was `planned`">
    <action>Change `status: planned` to `status: in-progress`</action>
    <action>Add `updated: {YYYY-MM-DD}`</action>
    <action>Write updated task file</action>
    <output>Task {taskId} moved to In Progress</output>
  </step>

  <step name="read_plan_file" outputs="planPath, planContent">
    <command>node .claude/kanban-scripts/find-plan.cjs {taskId}</command>
    <branch condition="plan found">
      <action>Read the plan at the `path` from JSON output</action>
    </branch>
    <branch condition="plan NOT found">
      <output>Warning: No plan found for task {taskId}</output>
      <output>Suggest: Create plan with /kanban-plan first</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="read_spec">
    <action>Get `spec` path from plan frontmatter</action>
    <action>Read spec file for full context on requirements and patterns</action>
  </step>

  <step name="load_product_context" when="task has `affects` field">
    <action>For each ID in affects: Read `.kanban/product/{id}.md`</action>
    <action>Understand current product behavior</action>
    <note>Implementation should maintain or extend documented behavior</note>
  </step>

  <step name="load_user_skills">
    {{> user-skills command="implement"}}
  </step>

  <step name="parse_plan_checkboxes" outputs="totalItems, completedItems, remainingItems">
    <action>Find all unchecked items: `- [ ]` pattern</action>
    <action>Find all checked items: `- [x]` pattern</action>
    <action>Calculate: total items, completed items, remaining items</action>
    <output>Display progress overview</output>
  </step>

  <step name="execute_plan_checkboxes">
    <note>For each unchecked item (`- [ ]`) in order:</note>
    <action>Display: "[{n}/{total}] {checkbox description}"</action>
    <action>Execute the implementation step described</action>
    <action>Mark checkbox as complete: change `- [ ]` to `- [x]`</action>
    <action>Write updated plan file immediately (enables resume)</action>
    <output>Done</output>

    <branch condition="any step fails">
      <action>Stop execution</action>
      <output>Report which step failed and why</output>
      <note>Progress is saved (can resume later with same command)</note>
      <output>Suggest: Use /kanban-save to save progress</output>
    </branch>
  </step>

  <step name="on_completion">
    <important>This step MUST update the task status when all items are complete</important>
    <branch condition="ALL checkboxes complete">
      <command description="Get current date">node .claude/kanban-scripts/get-date-time.cjs</command>
      <action>Read the task file at {taskPath}</action>
      <action>In the YAML frontmatter, change `status: in-progress` to `status: codecheck`</action>
      <action>Update `updated: {YYYY-MM-DD}` with date from command output</action>
      <action>Write the updated task file back to {taskPath}</action>
      <validate>Verify the task file now contains `status: codecheck`</validate>
      <output>Task moved to codecheck status.</output>
    </branch>
    <branch condition="some checkboxes remain">
      <action>Keep status as `in-progress`</action>
      <output>Partial progress: {completed}/{total} items</output>
    </branch>
  </step>

  <step name="output_result">
    <output>Display implementation summary</output>
    <output>Show files modified (uncommitted)</output>
    <output>Show status</output>
    <branch condition="ALL checkboxes complete">
      <output>**Next: Run code checks**</output>
      <output>Code check runs your configured checks (tests, typecheck, lint). If they pass, the task moves to QA for you to manually test the application.</output>
      <output>
```
/clear
/kanban-codecheck {taskId}
```
      </output>
    </branch>
    <branch condition="some checkboxes remain">
      <output>**Next: Save progress or continue later**</output>
      <output>
```
/clear
/kanban-save {taskId}
```
      </output>
    </branch>
  </step>
</process>

<success_criteria>
- Task file exists at `.kanban/tasks/{taskId}/task.md`
- If all items complete: `status: codecheck`
- If partial progress: `status: in-progress`
- Plan file exists at `.kanban/tasks/{taskId}/plan.md`
- All plan checkboxes are marked complete (`- [x]`) for full implementation
- Next steps shown to user
</success_criteria>

<example>
**Full Implementation:**

User: `/kanban-implement 001`

```
Implementing task 001 "Add user auth"...

Task 001 moved to In Progress

Reading spec: .kanban/tasks/001/spec.md
Reading plan: .kanban/tasks/001/plan.md
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

Task 001 ready for code checks.
- Status: codecheck
- Files modified: 3 (uncommitted)

**Next: Run code checks**
Code check runs your configured checks (tests, lint, typecheck).
If checks pass, you'll manually QA the application before code is committed.

/clear
/kanban-codecheck 001
```

**Resume Partial Implementation:**

User: `/kanban-implement 002`

```
Implementing task 002 "Setup database"...

Column: in-progress (resuming)

Reading spec: .kanban/tasks/002/spec.md
Reading plan: .kanban/tasks/002/plan.md
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

Task 002 ready for code checks.
- Status: codecheck
- Files modified: 5 (uncommitted)

**Next: Run code checks**
Code check runs your configured checks (tests, lint, typecheck).
If checks pass, you'll manually QA the application before code is committed.

/clear
/kanban-codecheck 002
```
</example>

<next_steps>
If interrupted mid-implementation:
```
/clear
/kanban-save {id}
```
This commits your work-in-progress so you don't lose it.

When implementation complete:
```
/clear
/kanban-codecheck {id}
```
Code check runs your automated checks (tests, typecheck, lint). If they pass, the task moves to QA for you to manually test the application.

Code stays uncommitted until you approve after QA.
</next_steps>
