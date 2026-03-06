---
name: festina-implement
description: Implement a planned task. Moves task to In Progress, executes the plan, then moves to Finalize.
allowed-tools: Read, Write, Edit, Bash(*), Task
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Implement Festina Lente Task

<purpose>
Move task from Planned to In Progress and execute the plan.
</purpose>

<context>
<note>
- **`.claude/skills/festina-*/`** — Installed festina skills — READ ONLY
- **`.festinalente/`** — Project data and config — READ/WRITE
- **`.festinalente/tasks/{id}/`** — Task folder containing `task.xml`, `spec.xml`, `plan.xml`
- **`.festinalente/quick/{id}/`** — Quick task folder containing `quick.xml` (for /festina-quick)
- **`.festinalente/scripts/`** — Helper scripts for festina operations
- **`.festinalente/templates/`** — Document templates
- **`.festinalente/workflow.yaml`** — Workflow config (columns, labels, transitions)
- **`.festinalente/directives/`** — User-defined directives (custom instructions for skills)
</note>

<note>Use these scripts to reliably find files:</note>

<command description="Find task by ID (returns JSON with path and metadata)">node .festinalente/scripts/festinalente.cjs find-task {id}</command>


<command description="Find plan by ID (returns JSON with path)">node .festinalente/scripts/festinalente.cjs find-plan {id}</command>



<command description="Get current date/time (returns JSON with iso and date formats)">node .festinalente/scripts/festinalente.cjs get-date-time</command>

<command description="Get skill configuration (returns JSON with directives)">node .festinalente/scripts/festinalente.cjs get-skill-config {skill}</command>
<example_code lang="json">
{
  "skill": "festina-check",
  "directives": [
    { "name": "code-review", "path": ".festinalente/directives/code-review.xml", "exists": true }
  ]
}
</example_code>



<note>Column transition: planned → in-progress</note>
<note>See `.festinalente/workflow.yaml` for column definitions and valid transitions</note>
</context>

<prohibited>
- Do not skip plan steps or mark them complete without executing them
- Do not implement tasks that haven't been planned
- Do not ask the user to manually verify or test during implementation
</prohibited>

<process>
  <step name="load_workflow">
    <action>Read `.festinalente/workflow.yaml` for column definitions, labels, priorities, and transitions</action>
    <note>Use these values throughout this skill</note>
  </step>

  <step name="get_task_id" outputs="taskId">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as taskId</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <action>List tasks in `planned` or `in-progress` status from `.festinalente/tasks/`</action>
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
    <command>node .festinalente/scripts/festinalente.cjs find-task {taskId}</command>
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
      <output>Run `/festina-scope {taskId}` first.</output>
      <action>Exit</action>
    </branch>
    <branch condition="status is finalize or later">
      <output>Warning: Task is past implementation phase.</output>
    </branch>
    <branch condition="task not found">
      <output>Error: Task not found</output>
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
    <command>node .festinalente/scripts/festinalente.cjs find-plan {taskId}</command>
    <branch condition="plan found">
      <action>Read the plan at the `path` from JSON output</action>
    </branch>
    <branch condition="plan NOT found">
      <output>Warning: No plan found for task {taskId}</output>
      <output>Suggest: Create plan with /festina-plan first</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="read_spec">
    <action>Get `spec` path from plan XML</action>
    <action>Read spec file for full context on requirements and patterns</action>
  </step>

  <step name="load_smart_context">
    <note>**Smart Context Selection:** Load relevant docs at appropriate tier</note>
    <command>node .festinalente/scripts/festinalente.cjs select-context {taskId} --tier=standard --max=5</command>
    <action>Parse JSON output</action>
    <action>For each doc in output, present the content field</action>
    <note>Standard tier: tldr + summary + boundary for each relevant doc</note>

    <branch condition="task appears complex (multiple systems involved)">
      <action>Re-run with --tier=full for most relevant 2 docs</action>
      <command>node .festinalente/scripts/festinalente.cjs select-context {taskId} --tier=full --max=2</command>
    </branch>

    <note>Context tiers:</note>
    <note>- minimal: Only tldr (~50 tokens per doc)</note>
    <note>- standard: tldr + summary + boundary (~200 tokens per doc)</note>
    <note>- full: Entire doc content (~500-1000 tokens per doc)</note>

    <note>Implementation should maintain or extend documented behavior</note>
  </step>

  <step name="load_directives">
    <note>**Orchestrator-only step:** Directive loading and compliance checking runs in orchestrator only.
    Subagents do not receive directive context - they focus purely on task execution.</note>
    <command>node .festinalente/scripts/festinalente.cjs get-skill-config festina-implement</command>
    <action>Parse the JSON output</action>
    
    <branch condition="directives.length > 0">
      <warning>Directives are MANDATORY. You MUST follow them.</warning>
      <action>For EACH directive where `exists` is `true`:</action>
      <action>Read the directive XML file at `path`</action>
      <action>Parse and apply:</action>
      <action>- `<context>` principles: Maintain as ongoing mindset</action>
      <action>- `<process>` rules where phase contains "implement" (phase may be comma-separated, e.g. phase="plan,implement" applies to both): Follow as requirements</action>
      <action>- `<override>` sections where phase="implement": Apply step replacements</action>
      <action>- `<verification>` commands: Note for use in task `<verify>` elements</action>
    
      <branch condition="directive has <override> section for phase=implement">
        <output>
    **DIRECTIVE OVERRIDE ACTIVE: {directive.name}**
    
    The following skill steps are REPLACED by this directive:
    
    {For each &lt;skip&gt; element:}
    **SKIP STEP: `{step}`** - Do NOT execute this step when you reach it in the skill process.
    
    **REPLACEMENT:** Execute directive rules {override.instead.rules} instead.
    
    **Reason:** {override.reason}
    
    **CRITICAL:** When you encounter any skipped step in the skill's &lt;process&gt;,
    you MUST skip it entirely and follow the directive's replacement rules instead.
        </output>
      </branch>
      <note>`<validation>` checks will run in directive_compliance step</note>
      <note>`<examples>` will be shown if violations are found</note>
    </branch>
    
    <example_code lang="json">
    {
      "skill": "festina-implement",
      "directives": [
        { "name": "architecture", "path": ".festinalente/directives/architecture.xml", "exists": true }
      ]
    }
    </example_code>
  </step>

  <step name="parse_plan_tasks" outputs="tasks, executionOrder">
    <action>Parse the `<tasks>` section from plan.xml</action>
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
    <note>**Subagent Orchestration:** Spawn a subagent for each task to keep orchestrator lean.</note>
    <note>Each subagent gets fresh context with explicit file references - no embedded snippets.</note>
    <note>Orchestrator persists completion immediately after each subagent finishes.</note>

    <action>For each task in executionOrder where completed != "true":</action>

    <substep name="show_task_header">
      <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[{currentIndex}/{totalTasks}] {task.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Spawning subagent...
      </output>
    </substep>

    <substep name="build_subagent_prompt" outputs="subagentPrompt">
      <note>Build prompt from task elements - file refs only, no embedded content.</note>
      <action>Extract task elements: id, name, context, pattern, action, verify, done</action>
      <action>Build prompt using template:</action>

      <prompt_template>
Execute task {task.id}: "{task.name}"

**Read these files first:**
{For each file in task.context:}
- {file path}

**Pattern to follow:**
{task.pattern file path, if present; otherwise "None specified"}

**Action:**
{content of task.action element}

**Verify:** {content of task.verify element}

**Done criteria:** {content of task.done element}

**Spec reference:** .festinalente/tasks/{taskId}/spec.xml
(Read if you need functional requirements or additional context)

When complete, report:
- SUCCESS: {summary of what was done}
- FAILURE: {what failed and why}
      </prompt_template>

    </substep>

    <substep name="spawn_subagent">
      <note>**CRITICAL:** Use Task tool with subagent_type for execution.</note>
      <note>Subagent gets Edit/Write/Bash access to make changes and run verification.</note>

      <action>Use Task tool with:
        - description: "Execute task {task.id}: {task.name}"
        - prompt: {subagentPrompt built above}
        - subagent_type: "general-purpose"
      </action>

      <action>Wait for subagent to complete</action>
      <action>Parse subagent response for SUCCESS or FAILURE prefix</action>
    </substep>

    <substep name="handle_subagent_result">
      <branch condition="subagent reports SUCCESS">
        <output>✓ Task {task.id} completed: {subagent summary}</output>
        <action>Update plan.xml: Add `completed="true" completed_at="{ISO timestamp}"` to the task element</action>
        <action>Write updated plan file</action>
        <note>Persist immediately - ensures progress saved before potential context issues</note>
      </branch>

      <branch condition="subagent reports FAILURE">
        <output>✗ Task {task.id} failed: {subagent failure reason}</output>

        <action>Use AskUserQuestion tool with:
          - header: "Task Failed"
          - question: "Task '{task.name}' failed: {failure reason}. How should I proceed?"
          - options:
            - label: "Fix manually and continue", description: "I'll fix this myself, then continue with remaining tasks"
            - label: "Skip this task", description: "Mark as incomplete and move to next task"
            - label: "Stop implementation", description: "Halt implementation to investigate"
          - multiSelect: false
        </action>

        <branch condition="user selects 'Fix manually and continue'">
          <output>Pausing for manual fix. Run /festina-implement {taskId} when ready to continue.</output>
          <action>Exit - do not mark task complete</action>
        </branch>

        <branch condition="user selects 'Skip this task'">
          <output>Skipping task {task.id}. Continuing with remaining tasks.</output>
          <note>Do NOT mark as completed - remains incomplete for later attention</note>
          <action>Continue to next task in executionOrder</action>
        </branch>

        <branch condition="user selects 'Stop implementation'">
          <output>
Implementation stopped at task {task.id}.
{completed}/{total} tasks complete.

To resume later:
/clear
/festina-implement {taskId}
          </output>
          <action>Exit</action>
        </branch>
      </branch>

      <branch condition="subagent response unclear (no SUCCESS/FAILURE prefix)">
        <output>Warning: Subagent response unclear. Checking verification manually.</output>
        <branch condition="task.verify is automated command">
          <command>{task.verify}</command>
          <branch condition="command succeeds">
            <output>✓ Verification passed (manual check)</output>
            <action>Update plan.xml: Add `completed="true" completed_at="{ISO timestamp}"` to the task element</action>
            <action>Write updated plan file</action>
          </branch>
          <branch condition="command fails">
            <action>Treat as FAILURE - trigger user question above</action>
          </branch>
        </branch>
      </branch>
    </substep>
  </step>

  <step name="verify_implementation_quality">
    <note>**Quality verification runs in orchestrator after all tasks complete.**</note>
    <note>These checks (TODO scan, requirement trace, wiring check) examine the full codebase and must run in orchestrator context, not subagents.</note>
    <note>Verify implementation achieved spec goals, not just task completion (GSD verifier pattern)</note>
    <note>Work backward from requirements to confirm implementation exists</note>

    <action name="get_modified_files">
      <note>Use the plan's files list to identify what was modified</note>
      <action>Read plan.xml's tasks elements</action>
      <action>Extract all file paths from each task's files element</action>
      <action>These are the files that should have been modified during implementation</action>
    </action>

    <action name="anti_pattern_scan">
      <note>Search modified files for incomplete work markers</note>
      <action>Grep modified files for patterns indicating incomplete work:</action>
      <patterns>
        - TODO
        - FIXME
        - HACK
        - XXX
        - "not implemented"
        - "placeholder"
        - throw new Error("Not implemented")
        - console.log without actual logic
      </patterns>

      <branch condition="anti-patterns found">
        <output>
WARNING: Found incomplete work markers:
        </output>
        <action>List each finding with file:line reference</action>
        <action>Use AskUserQuestion with:
          - header: "Incomplete code"
          - question: "Found {n} incomplete markers (TODO, FIXME, etc). How to proceed?"
          - options:
            - label: "Fix now", description: "Address these before moving to finalize"
            - label: "Proceed anyway", description: "These are intentional or will be addressed later"
          - multiSelect: false
        </action>
        <branch condition="user says fix now">
          <action>Create remediation tasks for each anti-pattern</action>
          <action>Return to execute_tasks step</action>
        </branch>
      </branch>
    </action>

    <action name="requirement_trace">
      <note>Verify each functional requirement has implementation evidence</note>
      <action>Read spec's functional requirements (FR1, FR2, etc.)</action>
      <action>For each FR:</action>
      <action>- Identify which files/code implements it</action>
      <action>- Verify the code is substantive (not a stub)</action>
      <action>- Verify the code is wired (imported/called somewhere)</action>

      <branch condition="any FR lacks clear implementation">
        <output>
WARNING: These requirements may not be fully implemented:
        </output>
        <action>List each FR with concern</action>
        <action>Use AskUserQuestion with:
          - header: "Requirements"
          - question: "Some requirements may not be fully implemented. How to proceed?"
          - options:
            - label: "Review and fix", description: "Examine each and address gaps"
            - label: "Proceed to finalize", description: "Implementation is complete, will verify in finalize"
          - multiSelect: false
        </action>
      </branch>
    </action>

    <action name="wiring_verification">
      <note>Verify new code is actually connected (80% of stubs hide in unwired code)</note>
      <action>For each new file created during implementation:</action>
      <action>- Check if it's imported somewhere</action>
      <action>- Check if its exports are used</action>

      <branch condition="orphan files detected">
        <output>
WARNING: New files created but not imported anywhere:
        </output>
        <action>List orphan files</action>
        <action>Use AskUserQuestion with:
          - header: "Unwired files"
          - question: "Some new files aren't imported anywhere. How to proceed?"
          - options:
            - label: "Fix wiring", description: "Add imports/usage for these files"
            - label: "Proceed anyway", description: "Files are intentionally standalone (e.g., config)"
          - multiSelect: false
        </action>
        <branch condition="user says fix wiring">
          <action>Add necessary imports/wiring</action>
          <action>Return to execute_tasks if code changes needed</action>
        </branch>
      </branch>
    </action>

    <output>
**Implementation Quality Check Complete**
- Files modified: {count}
- Anti-patterns found: {count}
- Requirements traced: {count}/{total}
- Wiring verified: {status}
    </output>
  </step>

  <step name="check_completion">
    <branch condition="all tasks have completed='true' AND verification passed">
      <action>Update task status to `finalize`</action>
      <output>All implementation tasks complete. Moving to finalize.</output>
      <output>
Next:
/clear
/festina-finalize {taskId}
      </output>
    </branch>
    <branch condition="some tasks remain incomplete">
      <action>Keep status as `in-progress`</action>
      <output>
{completed}/{total} tasks complete. To continue later:
/clear
/festina-implement {taskId}

To save progress now:
/clear
/festina-save {taskId}
      </output>
    </branch>
  </step>

  <step name="directive_compliance">
    <note>Verify compliance with all loaded directives</note>
  
    <action>For each directive loaded in load_directives step:</action>
    <action>Re-read the directive XML file</action>
  
    <action>Run each `<validation>` check:</action>
  
    <branch condition="check type=command">
      <command>{content of <run> element}</command>
      <validate>{content of <expect> element}</validate>
    </branch>
  
    <branch condition="check type=pattern">
      <action>For each file matching `files` glob that was modified:</action>
      <action>Check content against `<forbidden>` or `<required>` regex</action>
    </branch>
  
    <branch condition="check type=checklist">
      <action>Self-assess each `<item>` as Y/N</action>
    </branch>
  
    <branch condition="any check fails">
      <output>Directive violation: {check id} - {reason}</output>
      <action>Find `<example>` elements where ref matches failed check</action>
      <action>Show violation examples to illustrate the problem</action>
      <action>Show correct examples to illustrate the fix</action>
      <action>Use AskUserQuestion tool with:
        - header: "Violation"
        - question: "Directive check failed. How would you like to proceed?"
        - options:
          - label: "Fix now", description: "Address the violation before continuing"
          - label: "Continue anyway", description: "Acknowledge and proceed despite violation"
        - multiSelect: false
      </action>
    </branch>
  </step>

  <step name="output_result">
    <output>Display implementation summary</output>
    <output>Show files modified</output>
    <output>Show status</output>
    <branch condition="ALL checkboxes complete">
      <output>**Next: Finalize the task**</output>
      <output>Finalize runs your configured checks from directives, updates documentation, and completes the task.</output>
      <output>
```
/clear
/festina-finalize {taskId}
```
      </output>
    </branch>
    <branch condition="some checkboxes remain">
      <output>**Next: Save progress or continue later**</output>
      <output>
```
/clear
/festina-save {taskId}
```
      </output>
    </branch>
    ## Final Validation
    
    Before completing, validate all task XML:
    
    <command description="Validate XML in task files">node .festinalente/scripts/festinalente.cjs validate-xml {taskId}</command>
    
    If validation fails, fix the reported errors before completing.
    
    <output>[FESTINA_COMPLETE]</output>
  </step>
</process>

<success_criteria>
- Task file exists at `.festinalente/tasks/{taskId}/task.xml`
- If all tasks complete: `status: finalize`
- If partial progress: `status: in-progress`
- Plan file exists at `.festinalente/tasks/{taskId}/plan.xml`
- Completed tasks have `completed="true"` attribute
- Verification was run for each task
- Next steps shown to user
</success_criteria>

<example>
**Full Implementation:**

User: `/festina-implement 001`

```
Implementing task 001 "Add user auth"...

Task 001 moved to In Progress

Reading spec: .festinalente/tasks/001/spec.xml
Reading plan: .festinalente/tasks/001/plan.xml
Found 2 tasks, 0 completed, execution order: 1, 2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1/2] Create auth routes file
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Files:** src/routes/auth.ts (create)
**Requirements:** FR1
**Pattern:** Route pattern at src/routes/users.ts:15

Creating src/routes/auth.ts...
Running verification: npx tsc --noEmit
✓ Verification passed
Done criteria met: File exists and compiles

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[2/2] Add login endpoint
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Files:** src/routes/auth.ts (modify)
**Requirements:** FR1
**Pattern:** POST handler at src/routes/users.ts:42

Adding POST /login handler...
Running verification: npm run build
✓ Verification passed
Done criteria met: Login endpoint responds to POST

All implementation tasks complete. Moving to finalize.
- Status: finalize
- Files modified: 2
Next:
/clear
/festina-finalize 001
```

**Resume Partial Implementation:**

User: `/festina-implement 002`

```
Implementing task 002 "Setup database"...

Column: in-progress (resuming)

Reading spec: .festinalente/tasks/002/spec.xml
Reading plan: .festinalente/tasks/002/plan.xml
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

All implementation tasks complete. Moving to finalize.
- Status: finalize
- Files modified: 5 
Next:
/clear
/festina-finalize 002
```
</example>

<next_steps>
If interrupted mid-implementation:
```
/clear
/festina-save {id}
```
This saves your work-in-progress so you don't lose it.

When implementation complete:
```
/clear
/festina-finalize {id}
```
Finalize runs directive checks, updates documentation, and completes the task.

Code changes remain as work-in-progress until you run /festina-finalize.
</next_steps>
