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
<note>
- **`.claude/skills/kanban-*/`** — Installed kanban skills — READ ONLY
- **`.kanban/`** — Project data and config — READ/WRITE
- **`.kanban/tasks/{id}/`** — Task folder containing `task.xml`, `spec.xml`, `plan.xml`
- **`.kanban/scripts/`** — Helper scripts for kanban operations
- **`.kanban/templates/`** — Document templates
- **`.kanban/workflow.yaml`** — Workflow config (columns, labels, transitions)
- **`.kanban/directives/`** — User-defined directives (custom instructions for hooks)
</note>

<note>Use these scripts to reliably find files:</note>

<command description="Find task by ID (returns JSON with path and metadata)">node .kanban/scripts/find-task.cjs {id}</command>


<command description="Find plan by ID (returns JSON with path)">node .kanban/scripts/find-plan.cjs {id}</command>



<command description="Get current date/time (returns JSON with iso and date formats)">node .kanban/scripts/get-date-time.cjs</command>


<note>Column transition: planned → in-progress</note>
<note>See `.kanban/workflow.yaml` for column definitions and valid transitions</note>
</context>

<prohibited>
- Do not commit code during implementation (code stays uncommitted until verify passes)
- Do not skip plan steps or mark them complete without executing them
- Do not implement tasks that haven't been planned
</prohibited>

<process>
  <step name="load_workflow">
    <action>Read `.kanban/workflow.yaml` for column definitions, labels, priorities, and commit formats</action>
    <note>Use these values throughout this skill</note>
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
    <command>git branch --show-current</command>
    <validate>Must be on branch `task/{id}` where {id} is the task ID</validate>
    <branch condition="not on expected branch">
      <output>Error: This command must be run on branch task/{id}. Current branch: {branch}</output>
      <output>Suggest: Switch to task branch with `git checkout task/{id}`</output>
      <action>Exit</action>
    </branch>
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

  <step name="load_smart_context">
    <note>**Smart Context Selection:** Load relevant docs at appropriate tier</note>
    <command>node .kanban/scripts/select-context.cjs {taskId} --tier=standard --max=5</command>
    <action>Parse JSON output</action>
    <action>For each doc in output, present the content field</action>
    <note>Standard tier: tldr + summary + boundary for each relevant doc</note>

    <branch condition="task appears complex (multiple systems involved)">
      <action>Re-run with --tier=full for most relevant 2 docs</action>
      <command>node .kanban/scripts/select-context.cjs {taskId} --tier=full --max=2</command>
    </branch>

    <note>Context tiers:</note>
    <note>- minimal: Only tldr (~50 tokens per doc)</note>
    <note>- standard: tldr + summary + boundary (~200 tokens per doc)</note>
    <note>- full: Entire doc content (~500-1000 tokens per doc)</note>

    <note>Implementation should maintain or extend documented behavior</note>
  </step>

  <step name="check_doc_freshness">
    <note>**Freshness Check:** Warn if relevant docs may be outdated</note>
    <command>node .kanban/scripts/check-freshness.cjs --stale-days=30</command>
    <action>Parse JSON output</action>
    <action>Check if any docs from affects or engineering field are in staleDocs list</action>

    <branch condition="any affected docs are stale">
      <output>
Warning: Some relevant docs may be outdated:
      </output>
      <action>For each stale doc related to this task:</action>
      <output>- {doc.id}: verified {doc.verifiedDate} ({doc.daysSinceVerified} days ago)</output>
      <output>  Code changed: {doc.modifiedCodeRefs}</output>

      <action>Use AskUserQuestion with:
        - header: "Stale docs"
        - question: "Some docs may be outdated. How should I proceed?"
        - options:
          - label: "Continue anyway (Recommended)", description: "Proceed with implementation, update docs later"
          - label: "Review docs first", description: "Read the stale docs before implementing"
        - multiSelect: false
      </action>

      <branch condition="user selects review first">
        <action>For each stale doc, read and present content</action>
        <prompt>Is this doc still accurate enough to guide implementation?</prompt>
      </branch>
    </branch>

    <branch condition="no stale docs">
      <note>All relevant docs are fresh</note>
    </branch>
  </step>

  <step name="load_hook_config">
    <step name="load_hook_config">
      <command>node .kanban/scripts/get-hook-config.cjs kanban-implement</command>
      <action>Parse the JSON output</action>
    
      <branch condition="directives.length > 0">
        <warning>Directives are MANDATORY. You MUST follow them.</warning>
        <action>For EACH directive where `exists` is `true`:</action>
        <action>Read the directive file at `path`</action>
        <action>Follow ALL instructions as mandatory requirements</action>
      </branch>
    
      <branch condition="product.length > 0 OR engineering.length > 0">
        <note>Context docs are for guidance, not mandatory.</note>
        <action>Read any product/engineering docs where `exists` is `true`</action>
        <action>Use these for additional context as needed</action>
      </branch>
    </step>
    
    <example_code lang="json">
    {
      "hook": "kanban-implement",
      "directives": [
        { "name": "my-directive", "path": ".kanban/directives/my-directive/DIRECTIVE.md", "exists": true }
      ],
      "product": [],
      "engineering": []
    }
    </example_code>
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
    ## Final Validation
    
    Before completing, validate all task XML:
    
    <command description="Validate XML in all task files">node .kanban/scripts/validate-xml.cjs</command>
    
    If validation fails, fix the reported errors before completing.
    
    <output>[KANBAN_COMPLETE]</output>
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
