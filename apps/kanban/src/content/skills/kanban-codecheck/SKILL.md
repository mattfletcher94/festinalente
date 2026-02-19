---
name: kanban-codecheck
description: Run code checks using user-defined directives. Supports automated commands and AI-driven reviews.
allowed-tools: Read, Write, Bash(*), AskUserQuestion
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Code Check Kanban Task

<purpose>
Run code checks using user-configured directives. Directives can be automated commands (tests, lint) or AI-driven reviews (coding patterns, architecture). On failure, ask user whether to attempt a fix.
</purpose>

<context>
{{> directory-reference}}

{{> helper-scripts show_find_task=true show_find_plan=true show_get_date_time=true}}

{{> column-transition from="codecheck" to="qa"}}

<note>
**This skill is an orchestrator.** It runs whatever check directives the user has configured in `.kanban/config.yaml`. The user defines what gets checked - this skill just executes them.
</note>
</context>

<prohibited>
- Do not skip configured checks
- Do not mark checks as passed when they fail
- Do not add check results to the task file (only update status and updated date)
- Do not auto-fix without asking the user first
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
      <action>List tasks in `codecheck` status from `.kanban/tasks/`</action>
      <action>Use AskUserQuestion tool with:
        - header: "Task"
        - question: "Which task would you like to run code checks on?"
        - options: Build from task list (up to 4 tasks in codecheck status), each with:
          - label: "{taskId}: {short title}" (truncate title if needed)
          - description: "Ready for code checks"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a task ID directly</note>
    </branch>
  </step>

  <step name="read_task_file" outputs="taskPath, title">
    <command>node .kanban/scripts/find-task.cjs {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse XML</action>
    <validate>Verify status is `codecheck`</validate>
    <branch condition="status is not codecheck">
      <action>Use AskUserQuestion tool with:
        - header: "Continue?"
        - question: "Task is in {status} status. Expected: codecheck. Continue with checks anyway?"
        - options:
          - label: "Yes", description: "Proceed with code checks despite unexpected status"
          - label: "No", description: "Cancel and check task status first"
        - multiSelect: false
      </action>
    </branch>
    <branch condition="task not found">
      <output>Error: Task not found</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="verify_branch">
    {{> branch-verify-task}}
  </step>

  <step name="read_plan_file" outputs="planPath">
    <command>node .kanban/scripts/find-plan.cjs {taskId}</command>
    <action>Read the plan at the `path` from JSON output</action>
    <validate>Verify all implementation checkboxes are marked complete</validate>
    <branch condition="any unchecked items">
      <action>Use AskUserQuestion tool with:
        - header: "Incomplete"
        - question: "Plan has incomplete items. Run checks anyway?"
        - options:
          - label: "Yes", description: "Proceed with code checks despite incomplete plan items"
          - label: "No", description: "Cancel and complete remaining plan items first"
        - multiSelect: false
      </action>
    </branch>
  </step>

  <step name="load_check_directives" outputs="checkDirectives, hasChecks">
    <action>Read `.kanban/config.yaml`</action>
    <action>Find `hooks.kanban-codecheck.directives` array</action>
    <branch condition="directives array is empty or not defined">
      <action>Set hasChecks = false</action>
      <output>No code checks configured.</output>
      <note>Proceeding without checks - will move directly to QA</note>
    </branch>
    <branch condition="directives array has entries">
      <action>Set hasChecks = true</action>
      <action>For each directive name: read `.kanban/directives/{name}/DIRECTIVE.md`</action>
    </branch>
  </step>

  <step name="run_checks">
    <note>
**For each check directive, determine type and execute:**

```
for each directive in checkDirectives:
    Print: "Running check: {directive name}..."

    # Determine check type
    if directive contains "Run `{command}`":
        # COMMAND-BASED CHECK
        Execute the command
        if exit code == 0:
            Print "PASS: {directive name}"
            continue to next directive
        else:
            issues = command error output
    else:
        # AI-DRIVEN REVIEW
        Read the directive's guidelines/rules
        Review the code changes against guidelines
        if no violations:
            Print "PASS: {directive name}"
            continue to next directive
        else:
            issues = list of violations found

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
        Add to ## Iterations section:
            ### Code Check Fix ({YYYY-MM-DD})
            **Check:** {directive name}
            **Issues:**
            {issues}
            **Fix applied:**
            {description of fix}

        # Commit the fix
        git add {changed files}
        git commit -m "docs({taskId}): codecheck-retry - {title}"

        # Restart all checks from beginning
        break and restart loop

    if user selects No:
        Print: "Exiting. Fix issues manually and re-run /kanban-codecheck {taskId}"
        Exit

# If we get here, all checks passed
```
    </note>
  </step>

  <step name="advance_to_qa">
    <note>This step runs after all checks pass (or immediately if no checks configured)</note>

    <branch condition="hasChecks is true">
      <output>All checks passed!</output>
    </branch>
    <branch condition="hasChecks is false">
      <output>No checks configured.</output>
    </branch>

    <output>Moving to QA...</output>

    <action>Update task status to `qa`</action>
    <command description="Get current date">node .kanban/scripts/get-date-time.cjs</command>
    <action>Add `updated: {YYYY-MM-DD}` from output</action>
    <action>Write task file</action>

    <warning>Task file changes are ONLY: `status: qa` and `updated: {YYYY-MM-DD}`</warning>
    <warning>DO NOT add check results to the task file</warning>

    <output>Task {taskId} moved to QA.</output>
  </step>

  <step name="output_result">
    <output>**Your turn to QA:**</output>
    <output>Now's your chance to manually test the implementation. Run the application, verify the feature works as expected, and check that nothing else broke.</output>
    <output>
When you're satisfied:
```
/clear
/kanban-approve {taskId}
```

If you find issues that need fixing:
```
/clear
/kanban-rework {taskId}
```
    </output>
    {{> skill-complete}}
  </step>
</process>

<success_criteria>
- Task exists at `.kanban/tasks/{taskId}/task.xml`
- Plan exists at `.kanban/tasks/{taskId}/plan.xml`
- If checks passed: task status is `qa`
- If user declined fix: task status remains `codecheck`, user notified to fix manually
- Any fix attempts are logged to plan's Iterations section
- Next steps shown to user
</success_criteria>

<note>
**Check Directive Types:**

Users create check directives in `.kanban/directives/`. There are two types:

**1. Command-based (automated)**
```markdown
# Check: TypeScript

Run `pnpm typecheck`

### Pass criteria
Exit code 0, no errors in output.

### Common failures
- "Cannot find module X" — missing dependency
- "Type X is not assignable to Y" — type mismatch
```

**2. AI-driven review (guidelines)**
```markdown
# Check: Coding Patterns

### Guidelines
- Use factory functions instead of classes
- API handlers belong in src/routes/
- Use arrow functions for callbacks
- Prefer composition over inheritance

### Review focus
Look at new/modified files and check against the above patterns.
```

The directive is detected as command-based if `Run \`command\`` is present.
</note>

<example>
**Command Check Passes:**

User: `/kanban-codecheck 001`

```
Running code checks for task 001 "Add OAuth Login"...

Loading check directives from config.yaml...
- check-typescript
- check-tests

Running check: TypeScript...
PASS: TypeScript

Running check: Tests...
PASS: Tests

All checks passed!
Moving to QA...

Task 001 moved to QA.
- Status: qa

**Your turn to QA:**
Now's your chance to manually test the implementation.

When you're satisfied:
/clear
/kanban-approve 001

If you find issues:
/clear
/kanban-rework 001
```
</example>

<example>
**Command Check Fails, User Approves Fix:**

User: `/kanban-codecheck 001`

```
Running code checks for task 001 "Add OAuth Login"...

Loading check directives from config.yaml...
- check-typescript
- check-tests

Running check: TypeScript...
PASS: TypeScript

Running check: Tests...
FAIL: Tests

Error output:
  FAIL src/auth/oauth.test.ts
  - OAuth callback > should set session token
    Expected: token defined
    Received: undefined

[User selects "Yes" to fix issues]

Analyzing failure...
Found issue: Missing `req.session.token = token` in oauth callback handler.
Fixing: Adding session token assignment in src/auth/oauth.ts:45

Committing fix...
Commit: e5f6g7h docs(001): codecheck-retry - Add OAuth Login

Restarting checks...

Running check: TypeScript...
PASS: TypeScript

Running check: Tests...
PASS: Tests

All checks passed!
Moving to QA...

Task 001 moved to QA.
```
</example>

<example>
**AI Review Fails, User Approves Fix:**

User: `/kanban-codecheck 002`

```
Running code checks for task 002 "Add payment service"...

Loading check directives from config.yaml...
- check-typescript
- coding-patterns

Running check: TypeScript...
PASS: TypeScript

Running check: Coding Patterns...
FAIL: Coding Patterns

Issues found:
- src/services/payment.ts uses a class instead of factory function
- src/services/payment.ts imports directly instead of using dependency injection

[User selects "Yes" to fix issues]

Refactoring PaymentService class to factory function...
Adding dependency injection for Stripe client...

Committing fix...
Commit: a1b2c3d docs(002): codecheck-retry - Add payment service

Restarting checks...

Running check: TypeScript...
PASS: TypeScript

Running check: Coding Patterns...
PASS: Coding Patterns

All checks passed!
Moving to QA...

Task 002 moved to QA.
```
</example>

<example>
**Check Fails, User Declines Fix:**

User: `/kanban-codecheck 003`

```
Running code checks for task 003 "Database migration"...

Running check: Tests...
FAIL: Tests

Error output:
  Connection timeout: Database not responding

[User selects "No" to decline fix]

Exiting. Fix issues manually and re-run:
/kanban-codecheck 003
```
</example>

<example>
**No Checks Configured:**

User: `/kanban-codecheck 001`

```
Running code checks for task 001 "Add spacing fix"...

Loading check directives from config.yaml...
No code checks configured.

Moving to QA...

Task 001 moved to QA.
- Status: qa

**Your turn to QA:**
...
```
</example>

<next_steps>
**Your turn to QA:**
Now's your chance to manually test the implementation. Run the application, verify the feature works as expected, and check that nothing else broke.

When you're satisfied:
```
/clear
/kanban-approve {id}
```

If you find issues that need fixing:
```
/clear
/kanban-rework {id}
```
</next_steps>
