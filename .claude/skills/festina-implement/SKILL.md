---
name: festina-implement
description: Implement a planned task. Moves task to In Progress, executes the plan, then moves to Finalize.
allowed-tools: Read, Write, Edit, Bash(*)
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









<note>Use these scripts to work with product documentation:</note>


<command description="Search product docs by keywords (returns JSON sorted by relevance)">node .festinalente/scripts/festinalente.cjs search-product keyword1 keyword2 ...</command>
<command description="With minimum score threshold">node .festinalente/scripts/festinalente.cjs search-product password reset --min-score=0.3</command>
<note>Score interpretation: ≥0.5 = strong match | 0.3-0.5 = possible match | &lt;0.3 = weak match | No results = likely new feature</note>


<note>Path rule: ID `auth/login` → Path `.festinalente/product/auth/login.md`</note>

<note>Use these scripts to work with engineering documentation:</note>


<command description="Search engineering docs by keywords (returns JSON sorted by relevance)">node .festinalente/scripts/festinalente.cjs search-engineering keyword1 keyword2 ...</command>
<command description="With minimum score threshold">node .festinalente/scripts/festinalente.cjs search-engineering middleware pattern --min-score=0.3</command>
<note>Score interpretation: ≥0.5 = strong match | 0.3-0.5 = possible match | &lt;0.3 = weak match | No results = likely new pattern/system</note>


<note>Path rules:
- `overview` → `.festinalente/engineering/overview.md`
- `systems/auth` → `.festinalente/engineering/systems/auth/_index.md`
- `systems/auth/validator` → `.festinalente/engineering/systems/auth/validator.md`
- `patterns/acyclic-arch` → `.festinalente/engineering/patterns/acyclic-arch.md`
- `conventions/file-naming` → `.festinalente/engineering/conventions/file-naming.md`
</note>

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
      <branch condition="exactly 1 matching task found">
        <action>Auto-select the single task</action>
        <output>Auto-selected task: {taskId} "{title}" (only matching task).</output>
      </branch>
      <branch condition="multiple matching tasks found">
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
    <action>Extract boundaries from spec if present (always, ask-first, never sections)</action>
    <action>Extract contracts from spec if present (contracts element with contract sub-elements)</action>
  </step>

  <step name="load_directives">
    <note>**Directive loading:** Directives are loaded once and remain in context for direct use during task execution.
    Per-task validation runs after each task completes.</note>
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
    <note>**Direct Execution:** Execute each task directly in the orchestrator context.</note>
    <note>Read context files, execute actions, run verify commands — all inline.</note>
    <note>Persist completion immediately after each task finishes.</note>

    <action>For each task in executionOrder where completed != "true":</action>

    <substep name="show_task_header">
      <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[{currentIndex}/{totalTasks}] {task.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      </output>
    </substep>

    <substep name="read_context">
      <action>Read the files listed in the task's &lt;context&gt; element</action>
      <branch condition="task has pattern element with file reference">
        <action>Read the pattern reference file for implementation guidance</action>
      </branch>
      <note>Context files, spec boundaries, and contracts are now directly available in the orchestrator's context</note>
    </substep>

    <substep name="execute_action">
      <action>Execute the task's &lt;action&gt; element directly using available tools (Read, Edit, Write, Bash)</action>
      <action>Follow the pattern reference if specified</action>
      <action>Respect spec boundaries (always/ask-first/never) and contracts from context</action>
      <note>The orchestrator has full visibility of changes from prior tasks — use this for cross-task coherence</note>
    </substep>

    <substep name="run_verify">
      <command>{task.verify}</command>
      <branch condition="verify command succeeds">
        <output>✓ Task {task.id} completed: {summary of changes}</output>
      </branch>
      <branch condition="verify command fails">
        <output>✗ Task {task.id} failed: {failure details}</output>
      </branch>
    </substep>

    <substep name="contract_verification" when="verify succeeded">
      <branch condition="spec contracts were extracted in read_spec step AND contracts element is non-empty">
        <note>**Contract-to-task mapping (FR1, FR2):** For each contract in the spec's contracts element,
        parse the contract's `requirement` attribute (e.g., "FR1, FR2") as a comma-separated list.
        Parse the current task's `requirements` field the same way. If any FR in the contract's
        requirement attribute appears in the task's requirements field, the contract is selected
        for verification. Contracts with no matching FRs are skipped.</note>

        <branch condition="no contracts map to this task">
          <note>Skip the rest of the substep silently — no contracts relevant to this task</note>
        </branch>

        <branch condition="one or more contracts map to this task">
          <note>**Gather contract-test context (FR8):** Check if plan.xml's testing section has
          contract-test elements. For each contract being verified, find any contract-test element
          with a matching contract attribute. Include the positive/negative/property test cases as
          additional context in the verification evaluation.</note>

          <action>**Evaluation (FR3, FR4):** For each selected contract, evaluate all four elements
          against the current state of the code after this task's changes:
          - Precondition: Is the precondition satisfied in the current code state?
          - Postcondition: Does the postcondition hold after this task's changes?
          - Invariant: Is the invariant maintained?
          - Property: Does the property hold?

          If a contract element is absent (e.g., no invariant), skip it — only evaluate elements that
          are present.

          Each contract evaluation produces a structured result:
          - contract: the contract ID (e.g., "C1")
          - status: "pass" or "fail"
          - evidence: file:line reference or reasoning text
          - details: which specific element(s) passed/failed and why

          Output each result as it completes:
          `✓ Contract C1 "Name": pass — {evidence summary}`
          or
          `✗ Contract C2 "Name": FAIL — {evidence summary}`
          </action>

          <branch condition="any contract evaluation produces a fail status">
            <output>Present all failures together including:
            - Which contract(s) failed (ID and name)
            - Why each failed (which element — precondition/postcondition/invariant/property)
            - The evidence (file:line or reasoning)</output>
            <action>Use AskUserQuestion tool with:
              - header: "Contract Violation"
              - question: "Contract verification failed for task {task.id} '{task.name}': {failure summary}. How would you like to proceed?"
              - options:
                - label: "Fix now", description: "Address the contract violation before continuing"
                - label: "Continue anyway", description: "Acknowledge and proceed despite contract failure"
              - multiSelect: false
            </action>
            <branch condition="user selects Fix now">
              <action>Attempt remediation for the contract violation</action>
              <action>Re-evaluate the failed contracts</action>
              <branch condition="still failing after remediation">
                <action>Report to user and continue</action>
              </branch>
            </branch>
          </branch>

          <note>Collect all results (both pass and fail) for persistence in the persist_completion substep</note>
        </branch>
      </branch>

      <branch condition="spec has no contracts element OR contracts element is empty (FR7)">
        <note>Skip entirely — no contract verification runs, no contract-related elements appear in plan.xml.
        Existing verification behavior is unchanged.</note>
      </branch>
    </substep>

    <substep name="per_task_directive_validation" when="verify succeeded">
      <branch condition="directives were loaded in load_directives step">
        <note>Run directive validation checks scoped to files modified by this task</note>
        <action>Extract file paths from this task's files element</action>
        <action>For each loaded directive, re-read the directive XML file</action>
        <action>Run each validation check:</action>

        <branch condition="check type=command">
          <command>{content of run element}</command>
          <validate>{content of expect element}</validate>
        </branch>

        <branch condition="check type=pattern">
          <action>For each file in THIS TASK's files list that matches the check's files glob:</action>
          <action>Check content against forbidden or required regex</action>
        </branch>

        <branch condition="check type=checklist">
          <action>Self-assess each item as Y/N against this task's changes</action>
        </branch>

        <branch condition="any check fails">
          <output>Directive violation in task {task.id}: {check id} - {reason}</output>
          <action>Find example elements where ref matches failed check</action>
          <action>Show violation examples to illustrate the problem</action>
          <action>Show correct examples to illustrate the fix</action>
          <action>Use AskUserQuestion tool with:
            - header: "Directive Violation"
            - question: "Directive check failed for task {task.id} '{task.name}': {violation details}. How would you like to proceed?"
            - options:
              - label: "Fix now", description: "Attempt to remediate the violation before continuing"
              - label: "Continue anyway", description: "Acknowledge and proceed despite violation"
            - multiSelect: false
          </action>
          <branch condition="user selects Fix now">
            <action>Attempt remediation for the violation</action>
            <action>Re-run the failed validation checks</action>
            <branch condition="still failing after remediation">
              <action>Report to user and continue</action>
            </branch>
          </branch>
        </branch>
      </branch>
    </substep>

    <substep name="persist_completion" when="verify succeeded">
      <action>Update plan.xml: Add `completed="true" completed_at="{ISO timestamp}"` to the task element</action>
      <branch condition="contract verification ran for this task (contracts were mapped and evaluated)">
        <action>Add a `contract-verification` child element within the task element in plan.xml containing:
        ```xml
        <contract-verification verified-at="{ISO timestamp}">
          <result contract="{contractId}" status="pass|fail">
            <evidence>{file:line reference or reasoning}</evidence>
            <details>
              <precondition status="pass|fail">{explanation}</precondition>
              <postcondition status="pass|fail">{explanation}</postcondition>
              <invariant status="pass|fail">{explanation}</invariant>
              <property status="pass|fail">{explanation}</property>
            </details>
          </result>
          <!-- one result element per contract evaluated -->
        </contract-verification>
        ```
        </action>
        <note>Only include elements that were present in the contract (skip absent elements)</note>
        <note>Results must exactly match the verification output — no results dropped or modified</note>
      </branch>
      <branch condition="contract verification did NOT run for this task">
        <note>Do not add any contract-related elements to plan.xml</note>
      </branch>
      <action>Write updated plan file</action>
      <note>Persist immediately - ensures progress saved before potential context issues</note>
    </substep>

    <substep name="handle_failure" when="verify failed">
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
    </substep>
  </step>

  <step name="verify_implementation_quality">
    <note>**Quality verification runs in orchestrator after all tasks complete.**</note>
    <note>These checks (TODO scan, requirement trace, wiring check) examine the full codebase after all tasks complete.</note>
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

  <step name="validate_xml">
    <command description="Validate XML in task files">node .festinalente/scripts/festinalente.cjs validate-xml {taskId}</command>
    <branch condition="validation fails">
      <output>Warning: XML validation failed. Fix errors before completing.</output>
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

**Directive Violation During Implementation:**

User: `/festina-implement 003`

```
Implementing task 003 "Add user auth"...

Task 003 moved to In Progress

Reading spec: .festinalente/tasks/003/spec.xml
Reading plan: .festinalente/tasks/003/plan.xml
Found 3 tasks, 0 completed, execution order: 1, 2, 3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1/3] Create auth module
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Files:** src/routes/auth.ts (create)
**Requirements:** FR1

Creating src/routes/auth.ts...
Running verification: npx tsc --noEmit
✓ Verification passed

Running per-task directive validation...
✓ All directive checks passed
✓ Task 1 completed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[2/3] Add login endpoint
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Files:** src/routes/auth.ts (modify)
**Requirements:** FR2

Adding POST /login handler...
Running verification: npx tsc --noEmit
✓ Verification passed

Running per-task directive validation...
Directive violation in task 2 'Add login endpoint': V-T1 - Found `: any` in src/routes/auth.ts:23

  // VIOLATION: line 23
  function parseBody(req: any): LoginRequest {

  // CORRECT: use unknown and narrow
  function parseBody(req: unknown): LoginRequest {
    if (!isLoginRequest(req)) throw new Error('Invalid request');
    return req;
  }

> How would you like to proceed?
> [Fix now] [Continue anyway]

User selects: Fix now

Fixing violation: narrowing `any` to `unknown` with type guard...
Re-running directive validation for task 2 files...
✓ V-T1 passed — no forbidden `: any` patterns

✓ Task 2 completed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[3/3] Register auth routes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Files:** src/index.ts (modify)
**Requirements:** FR3

Registering auth routes in app...
Running verification: npx tsc --noEmit
✓ Verification passed
✓ Task 3 completed

All implementation tasks complete. Moving to finalize.
- Status: finalize
- Files modified: 2
Next:
/clear
/festina-finalize 003
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
