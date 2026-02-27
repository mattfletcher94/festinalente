---
name: festina-check
description: Run code checks, verify requirements, prompt for QA, and commit. Combines automated verification with human approval.
tools:
  read: true
  write: true
  bash: "*"
  question: true
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Check Festina Lente Task

<purpose>
Run automated code checks using directives, verify requirements are met, prompt for human QA, and commit the code. This skill combines the verification and approval phases into a single command.
</purpose>

<context>
<note>
- **`.opencode/skills/festina-*/`** — Installed festina skills — READ ONLY
- **`.festinalente/`** — Project data and config — READ/WRITE
- **`.festinalente/tasks/{id}/`** — Task folder containing `task.xml`, `spec.xml`, `plan.xml`
- **`.festinalente/quick/{id}/`** — Quick task folder containing `quick.xml` (for /festina-quick)
- **`.festinalente/scripts/`** — Helper scripts for festina operations
- **`.festinalente/templates/`** — Document templates
- **`.festinalente/workflow.yaml`** — Workflow config (columns, labels, transitions)
- **`.festinalente/directives/`** — User-defined directives (custom instructions for skills)
</note>

<note>Use these scripts to reliably find files:</note>

<command description="Find task by ID (returns JSON with path and metadata)">node .festinalente/scripts/find-task.cjs {id}</command>


<command description="Find plan by ID (returns JSON with path)">node .festinalente/scripts/find-plan.cjs {id}</command>



<command description="Get current date/time (returns JSON with iso and date formats)">node .festinalente/scripts/get-date-time.cjs</command>

<command description="Get skill configuration (returns JSON with directives)">node .festinalente/scripts/get-skill-config.cjs {skill}</command>
<example_code lang="json">
{
  "skill": "festina-check",
  "directives": [
    { "name": "code-review", "path": ".festinalente/directives/code-review.xml", "exists": true }
  ]
}
</example_code>



<note>Column transition: check → update-docs</note>
<note>See `.festinalente/workflow.yaml` for column definitions and valid transitions</note>

<note>
**This skill is an orchestrator.** It runs whatever check directives the user has configured in `.festinalente/config.yaml`, verifies requirements are met, then prompts for human QA before committing.
</note>
</context>

<prohibited>
- Do not skip configured checks
- Do not mark checks as passed when they fail
- Do not commit without QA confirmation from user
- Do not use invented commit types like `festina(...)` — valid types are: `feat`, `fix`, `refactor`, `docs`
- Do not auto-fix without asking the user first
- Do not commit sensitive files (.env, credentials)
</prohibited>

<process>
  <step name="load_workflow">
    <action>Read `.festinalente/workflow.yaml` for column definitions, labels, priorities, and commit formats</action>
    <note>Use these values throughout this skill</note>
  </step>

  <step name="get_task_id" outputs="taskId">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as taskId</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <action>List tasks in `check` status from `.festinalente/tasks/`</action>
      <action>Use AskUserQuestion tool with:
        - header: "Task"
        - question: "Which task would you like to check?"
        - options: Build from task list (up to 4 tasks in check status), each with:
          - label: "{taskId}: {short title}" (truncate title if needed)
          - description: "Ready for verification"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a task ID directly</note>
    </branch>
  </step>

  <step name="read_task_file" outputs="taskPath, title, labels, acceptanceCriteria">
    <command>node .festinalente/scripts/find-task.cjs {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse XML</action>
    <validate>Verify status is `check`</validate>
    <branch condition="status is not check">
      <action>Use AskUserQuestion tool with:
        - header: "Continue?"
        - question: "Task is in {status} status. Expected: check. Continue anyway?"
        - options:
          - label: "Yes", description: "Proceed despite unexpected status"
          - label: "No", description: "Cancel and check task status first"
        - multiSelect: false
      </action>
    </branch>
    <action>Extract title, labels, and acceptance-criteria for later use</action>
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

  <step name="read_plan_file" outputs="planPath">
    <command>node .festinalente/scripts/find-plan.cjs {taskId}</command>
    <action>Read the plan at the `path` from JSON output</action>
    <validate>Verify all implementation tasks have completed="true"</validate>
    <branch condition="any uncompleted tasks">
      <action>Use AskUserQuestion tool with:
        - header: "Incomplete"
        - question: "Plan has incomplete tasks. Run checks anyway?"
        - options:
          - label: "Yes", description: "Proceed despite incomplete plan tasks"
          - label: "No", description: "Cancel and complete remaining tasks first"
        - multiSelect: false
      </action>
    </branch>
  </step>

  <step name="load_check_directives" outputs="checkDirectives, hasChecks">
    <action>Read `.festinalente/config.yaml`</action>
    <action>Find `directives.festina-check` array</action>
    <branch condition="directives array is empty or not defined">
      <action>Set hasChecks = false</action>
      <output>No code checks configured.</output>
      <note>Proceeding without automated checks</note>
    </branch>
    <branch condition="directives array has entries">
      <action>Set hasChecks = true</action>
      <action>For each directive name: read `.festinalente/directives/{name}.xml`</action>
    </branch>
  </step>

  <step name="run_checks">
    <note>
**For each check directive, determine type and execute:**

```
for each directive in checkDirectives:
    Print: "Running check: {directive name}..."

    # Determine check type from directive XML
    if directive contains type="command":
        Execute the command from <run> element
        if exit code == 0:
            Print "PASS: {directive name}"
            continue to next directive
        else:
            issues = command error output

    else if directive contains type="pattern":
        Scan files matching glob for forbidden/required patterns
        if no violations:
            Print "PASS: {directive name}"
            continue to next directive
        else:
            issues = list of pattern violations

    else if directive contains type="checklist":
        Review code against checklist items
        if all items satisfied:
            Print "PASS: {directive name}"
            continue to next directive
        else:
            issues = unsatisfied items

    # Handle failure
    Print "FAIL: {directive name}"
    Print issues

    Use AskUserQuestion tool with:
        - header: "Fix?"
        - question: "Check failed. Should I try to fix these issues?"
        - options:
          - label: "Yes (Recommended)", description: "Attempt to fix the issues automatically"
          - label: "No", description: "Exit and fix manually"
        - multiSelect: false

    if user selects Yes:
        Analyze the issues
        Make code changes to fix

        # Log attempt to plan
        Add to <iterations> section:
            <iteration phase="check" date="{YYYY-MM-DD}">
              <fix directive="{name}">{description of fix}</fix>
            </iteration>

        # Commit the fix
        git add {changed files}
        git commit -m "docs({taskId}): check-retry - {title}"

        # Restart all checks from beginning
        break and restart loop

    if user selects No:
        Print: "Exiting. Fix issues manually and re-run /festina-check {taskId}"
        Exit

# If we get here, all checks passed
Print "All automated checks passed!"
```
    </note>
  </step>

  <step name="read_spec" outputs="functionalRequirements">
    <action>Get spec path from plan.xml's spec attribute</action>
    <action>Read spec file at `.festinalente/tasks/{taskId}/spec.xml`</action>
    <action>Extract functional requirements (FR1, FR2, etc.)</action>
  </step>

  <step name="verify_requirements_met">
    <note>Before prompting for QA, verify spec requirements are addressed</note>

    <action name="trace_requirements">
      <action>For each functional requirement:</action>
      <action>1. Identify the code change that addresses it</action>
      <action>2. Verify the code is not a stub (no TODO/placeholder)</action>
      <action>3. Verify the code is reachable (wired into the application)</action>
    </action>

    <branch condition="gaps found">
      <output>
**Requirement Gaps Detected**

The following requirements may not be fully implemented:
{list gaps with details}
      </output>

      <action>Use AskUserQuestion with:
        - header: "Gaps found"
        - question: "Some requirements may have gaps. How to proceed?"
        - options:
          - label: "Return to implement", description: "Go back and address the gaps"
          - label: "Proceed with QA", description: "Gaps are acceptable, continue to QA"
        - multiSelect: false
      </action>

      <branch condition="user says return to implement">
        <action>Update task status back to in-progress</action>
        <output>Run /festina-implement {taskId} to address gaps</output>
        <action>Exit</action>
      </branch>
    </branch>

    <branch condition="all requirements traced">
      <output>All requirements verified.</output>
    </branch>
  </step>

  <step name="prompt_qa_confirmation">
    <note>Only reached after all automated checks pass</note>

    <output>
**All automated checks passed!**

Now it's time to manually test the implementation.

**Task:** {taskId} - {title}

**Acceptance Criteria:**
{acceptance-criteria from task.xml, formatted as list}
    </output>

    <action>Use AskUserQuestion tool with:
      - header: "QA Passed?"
      - question: "Have you tested the application and verified it meets the acceptance criteria above?"
      - options:
        - label: "Yes", description: "QA passed, ready to commit and move to Update Docs"
        - label: "No", description: "Issues found, need to document and rework"
      - multiSelect: false
    </action>

    <branch condition="user selects No">
      <output>
Use `/festina-rework {taskId}` to document issues and return to implementation.
      </output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="check_uncommitted_changes" outputs="changedFiles">
    <command>git status</command>
    <command>git diff --name-only</command>
    <output>Display files that will be committed</output>
    <branch condition="no changes found">
      <output>Warning: No uncommitted changes to commit.</output>
      <action>Use AskUserQuestion tool with:
        - header: "Proceed?"
        - question: "No uncommitted changes found. Proceed anyway (just move status)?"
        - options:
          - label: "Yes", description: "Continue and move task to Update Docs"
          - label: "No", description: "Cancel and investigate missing changes"
        - multiSelect: false
      </action>
    </branch>
  </step>

  <step name="determine_commit_type" outputs="commitType">
    <action>Check task labels array</action>
    <branch condition="contains `bug`">
      <action>type = `fix`</action>
    </branch>
    <branch condition="contains `refactor`">
      <action>type = `refactor`</action>
    </branch>
    <branch condition="contains `docs`">
      <action>type = `docs`</action>
    </branch>
    <branch condition="contains `feature` or default">
      <action>type = `feat`</action>
    </branch>
  </step>

  <step name="move_to_update_docs">
    <note>Update status before commit so it's included</note>
    <action>Change `status: check` to `status: update-docs`</action>
    <command>node .festinalente/scripts/get-date-time.cjs</command>
    <action>Add `updated: {YYYY-MM-DD}` from output</action>
    <action>Write updated task file</action>
  </step>

  <step name="stage_and_commit">
    <note>Format: `{commitType}({taskId}): {title}`</note>
    <warning>Valid commit types: `feat`, `fix`, `refactor`, `docs`</warning>

    <action>Stage implementation files AND .festinalente files together</action>
    <command>git add {implementation files}</command>
    <command>git add .festinalente/</command>
    <note>`.festinalente` files MUST be included — they accumulate status and plan changes</note>
    <command>git commit -m "{commitType}({taskId}): {title}"</command>
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
    <output>Print commit hash and message</output>
    <output>Print: "Task {taskId} moved to Update Docs"</output>
    <output>
**Checks passed, QA approved, code committed!**

Next: Update documentation
```
/clear
/festina-docs {taskId}
```
    </output>
    ## Final Validation
    
    Before completing, validate all task XML:
    
    <command description="Validate XML in task files">node .festinalente/scripts/validate-xml.cjs {taskId}</command>
    
    If validation fails, fix the reported errors before completing.
    
    <output>[KANBAN_COMPLETE]</output>
  </step>
</process>

<success_criteria>
- Task exists at `.festinalente/tasks/{taskId}/task.xml`
- Plan exists at `.festinalente/tasks/{taskId}/plan.xml`
- All directive checks passed
- User confirmed QA passed
- Task status is `update-docs`
- Git log shows appropriate commit type (`feat`, `fix`, `refactor`, or `docs`) with `({taskId}):`
- Next steps shown to user
</success_criteria>

<example>
**All Checks Pass, QA Approved:**

User: `/festina-check 001`

```
Checking task 001 "Add user authentication"...

Loading check directives from config.yaml...
- check-typescript
- check-tests
- code-review

Running check: TypeScript...
PASS: TypeScript

Running check: Tests...
PASS: Tests

Running check: Code Review...
PASS: Code Review

All automated checks passed!

Verifying requirements...
- FR1: Login endpoint ✓
- FR2: JWT token generation ✓
- FR3: Password hashing ✓
All requirements verified.

**All automated checks passed!**

Now it's time to manually test the implementation.

**Task:** 001 - Add user authentication

**Acceptance Criteria:**
- Given a user enters valid credentials, when they click login, then they are authenticated
- Given a user enters invalid credentials, when they click login, then they see an error

[User selects "Yes" - QA passed]

Staging files:
- src/routes/auth.ts
- src/middleware/jwt.ts
- src/types/auth.ts
- .festinalente/tasks/001/task.xml
- .festinalente/tasks/001/plan.xml

Commit type: feat (from feature label)

Commit: e5f6g7h feat(001): Add user authentication

Task 001 moved to Update Docs

**Checks passed, QA approved, code committed!**

Next:
/clear
/festina-docs 001
```
</example>

<example>
**Check Fails, User Fixes:**

User: `/festina-check 001`

```
Checking task 001 "Add user authentication"...

Running check: TypeScript...
FAIL: TypeScript

Error output:
  src/routes/auth.ts:45:10 - error TS2345: Argument of type 'string' is not assignable

[User selects "Yes" to fix issues]

Analyzing failure...
Found issue: Type mismatch in auth handler
Fixing: Adding type assertion in src/routes/auth.ts:45

Committing fix...
Commit: a1b2c3d docs(001): check-retry - Add user authentication

Restarting checks...

Running check: TypeScript...
PASS: TypeScript

Running check: Tests...
PASS: Tests

All automated checks passed!

[QA prompt and commit flow continues...]
```
</example>

<example>
**QA Failed:**

User: `/festina-check 001`

```
[All checks pass...]

**All automated checks passed!**

**Task:** 001 - Add user authentication

**Acceptance Criteria:**
- Given a user enters valid credentials...

[User selects "No" - issues found]

Use `/festina-rework 001` to document issues and return to implementation.
```
</example>

<next_steps>
After checks pass and code is committed:
```
/clear
/festina-docs {id}
```

If issues are found during QA:
```
/clear
/festina-rework {id}
```
</next_steps>
