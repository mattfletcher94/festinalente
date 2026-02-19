---
name: kanban-implement
description: Implement a planned task. Moves task to In Progress, executes the plan, then moves to Checks. No commit - code stays uncommitted.
allowed-tools: Read, Write, Edit, Bash(*), AskUserQuestion
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
      <action>Use AskUserQuestion tool with:
        - header: "Task"
        - question: "Which task would you like to implement?"
        - options: Build from task list (up to 4 tasks in planned or in-progress status), each with:
          - label: "{taskId}: {short title}" (truncate title if needed)
          - description: "Status: {status} | Ready to implement"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a task ID directly</note>
    </branch>
  </step>

  <step name="read_task_file" outputs="taskPath, title, status">
    <command>node .kanban/scripts/find-task.cjs {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse XML</action>
    <branch condition="status is planned">
      <action>Move to `in-progress` first (step move_to_in_progress)</action>
    </branch>
    <branch condition="status is in-progress">
      <action>Resume implementation (skip step move_to_in_progress)</action>
    </branch>
    <branch condition="status is backlog">
      <output>Task needs scoping first.</output>
      <output>Run `/kanban-scope {taskId}` first.</output>
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
    <command>node .kanban/scripts/find-plan.cjs {taskId}</command>
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
    <action>Get `spec` path from plan XML</action>
    <action>Read spec file for full context on requirements and patterns</action>
  </step>

  <step name="load_product_context" when="task has `affects` field">
    <action>For each ID in affects: Read `.kanban/product/{id}.md`</action>
    <action>Understand current product behavior</action>
    <note>Implementation should maintain or extend documented behavior</note>
  </step>

  <step name="load_hook_config">
    {{> hook-config command="implement"}}
  </step>

  <step name="parse_plan_tasks" outputs="tasks, executionOrder">
    <action>Parse the `<tasks>` section from plan.md</action>
    <action>Extract all `<task>` elements with their attributes and children</action>
    <action>Build dependency graph from `depends` attributes</action>
    <action>Calculate execution order using topological sort</action>
    <action>Identify any already-completed tasks (have `completed="true"` attribute)</action>

    <output>Found {n} tasks total, {m} remaining, execution order: {ids}</output>

    <branch condition="circular dependency detected">
      <output>Error: Circular dependency in tasks: {cycle}</output>
      <action>Exit - plan needs manual fix</action>
    </branch>
  </step>

  <step name="execute_tasks">
    <note>Execute each task in dependency order, verifying after each.</note>

    <action>For each task in executionOrder where completed != "true":</action>

    <substep name="show_task_context">
      <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[{currentIndex}/{totalTasks}] {task.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Files:** {task.files}
**Requirements:** {task.requirements}
**Pattern:** {task.pattern}
      </output>
    </substep>

    <substep name="execute_action">
      <action>Read and understand the action items in {task.action}</action>
      <action>Make the code changes described</action>
      <note>Follow the pattern reference if provided</note>
    </substep>

    <substep name="run_verification">
      <branch condition="task.type is 'auto' AND task.verify does NOT start with 'Manual:'">
        <output>Running verification: {task.verify}</output>
        <command>{task.verify}</command>
        <branch condition="command succeeds (exit code 0)">
          <output>✓ Verification passed</output>
        </branch>
        <branch condition="command fails">
          <output>✗ Verification failed: {error}</output>
          <action>Analyze the error</action>
          <action>Attempt to fix the issue</action>
          <action>Re-run verification command</action>
          <branch condition="still fails after fix attempt">
            <output>Verification still failing. Manual intervention may be needed.</output>
            <action>Use AskUserQuestion to ask: "Verification failed. Options: 1) I'll fix manually and continue, 2) Skip this task, 3) Stop implementation"</action>
          </branch>
        </branch>
      </branch>
      <branch condition="task.type is 'manual' OR task.verify starts with 'Manual:'">
        <output>Manual verification required: {task.verify}</output>
        <action>Use AskUserQuestion to ask: "Please verify: {task.verify}. Is it working correctly?"</action>
        <branch condition="user confirms">
          <output>✓ Manual verification confirmed</output>
        </branch>
        <branch condition="user says no">
          <action>Ask what's wrong and attempt to fix</action>
        </branch>
      </branch>
    </substep>

    <substep name="confirm_done_criteria">
      <action>Verify the done criteria: {task.done}</action>
      <output>Done criteria met: {task.done}</output>
    </substep>

    <substep name="mark_task_complete">
      <action>Update plan.md: Add `completed="true" completed_at="{ISO timestamp}"` to the task element</action>
      <action>Write updated plan file</action>
      <note>This enables resumability if implementation is interrupted</note>
    </substep>
  </step>

  <step name="check_completion">
    <branch condition="all tasks have completed='true'">
      <action>Update task status to `codecheck`</action>
      <output>All implementation tasks complete. Moving to code check.</output>
      <output>
Next:
/clear
/kanban-codecheck {taskId}
      </output>
    </branch>
    <branch condition="some tasks remain incomplete">
      <action>Keep status as `in-progress`</action>
      <output>
{completed}/{total} tasks complete. To continue later:
/clear
/kanban-implement {taskId}

To save progress now:
/clear
/kanban-save {taskId}
      </output>
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
    {{> skill-complete}}
  </step>
</process>

<success_criteria>
- Task file exists at `.kanban/tasks/{taskId}/task.xml`
- If all tasks complete: `status: codecheck`
- If partial progress: `status: in-progress`
- Plan file exists at `.kanban/tasks/{taskId}/plan.xml`
- Completed tasks have `completed="true"` attribute
- Verification was run for each auto task
- Next steps shown to user
</success_criteria>

<example>
**Full Implementation:**

User: `/kanban-implement 001`

```
Implementing task 001 "Add user auth"...

Task 001 moved to In Progress

Reading spec: .kanban/tasks/001/spec.xml
Reading plan: .kanban/tasks/001/plan.xml
Found 3 tasks, 0 completed, execution order: 1, 2, 3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1/3] Create auth routes file
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Files:** src/routes/auth.ts (create)
**Requirements:** FR1
**Pattern:** Route pattern at src/routes/users.ts:15

Creating src/routes/auth.ts...
Running verification: npx tsc --noEmit
✓ Verification passed
Done criteria met: File exists and compiles

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[2/3] Add login endpoint
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Files:** src/routes/auth.ts (modify)
**Requirements:** FR1
**Pattern:** POST handler at src/routes/users.ts:42

Adding POST /login handler...
Running verification: npm run build
✓ Verification passed
Done criteria met: Login endpoint responds to POST

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[3/3] Test login flow manually
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Files:** N/A
**Requirements:** FR1
**Pattern:** N/A

Manual verification required: Test login with valid and invalid credentials
[User confirms: Yes]
✓ Manual verification confirmed
Done criteria met: Login works with valid creds, rejects invalid

All implementation tasks complete. Moving to code check.
- Status: codecheck
- Files modified: 2 (uncommitted)

Next:
/clear
/kanban-codecheck 001
```

**Resume Partial Implementation:**

User: `/kanban-implement 002`

```
Implementing task 002 "Setup database"...

Column: in-progress (resuming)

Reading spec: .kanban/tasks/002/spec.xml
Reading plan: .kanban/tasks/002/plan.xml
Found 5 tasks, 2 completed, execution order: 3, 4, 5

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[3/5] Create migration script
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Files:** db/migrations/001_initial.sql (create)
**Requirements:** FR2
**Pattern:** Migration format at db/migrations/000_setup.sql:1

Creating db/migrations/001_initial.sql...
Running verification: npm run db:migrate:dry
✓ Verification passed
Done criteria met: Migration applies cleanly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[4/5] Add seed data
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Files:** db/seeds/dev.sql (create)
**Requirements:** FR3
**Pattern:** Seed format at db/seeds/test.sql:1

Creating db/seeds/dev.sql...
Running verification: npm run db:seed:dry
✓ Verification passed
Done criteria met: Seed data inserts without errors

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[5/5] Update README with DB setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Files:** README.md (modify)
**Requirements:** FR4
**Pattern:** N/A

Adding database section to README.md...
Running verification: npx markdownlint README.md
✓ Verification passed
Done criteria met: README has complete DB setup instructions

All implementation tasks complete. Moving to code check.
- Status: codecheck
- Files modified: 5 (uncommitted)

Next:
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
