---
name: kanban-verify
description: Run AI code review using skills. Auto-retries on failure, auto-advances to QA on success.
allowed-tools: Read, Write, Bash(*)
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Verify Kanban Task

<purpose>
Run AI code review using configured skills. On failure, AI fixes issues and retries automatically. On success, auto-advances to QA.
</purpose>

<context>
{{> directory-reference}}

{{> helper-scripts show_find_task=true show_find_plan=true show_get_date_time=true}}

{{> column-transition from="in-progress" to="checks → qa (automatic on success)"}}

<note>
**Behavior:**
- Auto-loop on failure — AI fixes issues and retries (max 3 attempts)
- Auto-advance on success — Moves directly to QA when all checks pass
</note>
</context>

<prohibited>
- Do not skip verification checks
- Do not mark checks as passed when they fail
- Do not add verification results to the task file (only update status and updated date)
- Do not exceed 3 retry attempts
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
      <action>List tasks in `in-progress` status from `.kanban/tasks/`</action>
      <output>Show task IDs and titles</output>
      <prompt>Which task to verify?</prompt>
    </branch>
  </step>

  <step name="read_task_file" outputs="taskPath, title">
    <command>node .claude/scripts/find-task.cjs {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse YAML frontmatter</action>
    <validate>Verify status is `in-progress`</validate>
    <branch condition="status is not in-progress">
      <prompt>Task is in {status} status. Expected: in-progress. Continue anyway? (y/n)</prompt>
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
    <command>node .claude/scripts/find-plan.cjs {taskId}</command>
    <action>Read the plan at the `path` from JSON output</action>
    <validate>Verify all implementation checkboxes are marked complete</validate>
    <branch condition="any unchecked items">
      <prompt>Plan has incomplete items. Verify anyway? (y/n)</prompt>
    </branch>
  </step>

  <step name="load_verification_checks" outputs="checkSkills, hasChecks">
    <action>Read `.kanban/config.yaml`</action>
    <action>Find `user-skills."kanban-verify".skills` array</action>
    <branch condition="skills array is empty or not defined">
      <action>Set hasChecks = false</action>
      <output>No verification checks configured.</output>
      <note>Proceeding without automated checks - will move directly to QA</note>
    </branch>
    <branch condition="skills array has entries">
      <action>Set hasChecks = true</action>
      <action>For each skill path in the array: read the skill file</action>
      <action>Extract the check command and pass criteria</action>
    </branch>
  </step>

  <step name="update_status_to_checks">
    <action>Update task status to `checks`</action>
    <command description="Get current date">node .claude/scripts/get-date-time.cjs</command>
    <action>Add `updated: {YYYY-MM-DD}` from output</action>
    <action>Write task file</action>
    <note>Task is now in `checks` status while verification runs</note>
  </step>

  <step name="run_verification_loop">
    <note>
```
attempt = 1
while attempt <= 3:
    for each check skill:
        Print: "Running check: {check name}..."
        Execute the check command from the skill
        Evaluate pass criteria

        if PASS:
            Print "PASS: {check name}"
            continue to next check

        if FAIL:
            Print "FAIL: {check name}"
            Print error output

            # Log attempt to plan
            Add to ## Iterations section:
                ### Attempt {n} — Verify (attempt {attempt}) ({YYYY-MM-DD})
                **Phase:** checks
                **Result:** failed
                **Check:** {check name}
                **Errors:**
                ```
                {check output}
                ```

            if attempt < 3:
                # AI auto-fix
                Print: "Attempting to fix issues..."
                Analyze the error output
                Make code changes to fix the issue
                Write updated plan file

                # Commit the retry fix
                Format: `docs({taskId}): verify-retry - {title}`

                attempt += 1
                break (restart all checks from beginning)
            else:
                # Max attempts reached
                Print: "Max retry attempts reached. Manual intervention needed."
                Print: "Fix issues and re-run /kanban-verify {taskId}"
                Exit

    # If we get here, all checks passed
    break
```
    </note>
  </step>

  <step name="advance_to_qa">
    <note>This step ALWAYS runs after verification loop completes (or immediately if no checks configured)</note>

    <branch condition="hasChecks is true">
      <output>All checks passed!</output>
    </branch>
    <branch condition="hasChecks is false">
      <output>No automated checks configured.</output>
    </branch>

    <output>Moving to QA...</output>

    <action>Update task status to `qa`</action>
    <command description="Get current date">node .claude/scripts/get-date-time.cjs</command>
    <action>Add `updated: {YYYY-MM-DD}` from output</action>
    <action>Write task file</action>

    <warning>Task file changes are ONLY: `status: qa` and `updated: {YYYY-MM-DD}`</warning>
    <warning>DO NOT add verification results, check names, pass/fail logs, or any other content to the task file</warning>

    <output>Task {taskId} moved to QA.</output>
  </step>

  <step name="output_result">
    <output>Output next steps to user</output>
  </step>
</process>

<success_criteria>
- Task exists at `.kanban/tasks/{taskId}-*.md`
- Plan exists at `.kanban/plans/{taskId}-{slug}.plan.md`
- If checks passed: task status is `qa`
- If checks failed after 3 attempts: plan has updated Iterations section
- All retry attempts are logged to plan
- Next steps shown to user
</success_criteria>

<note>
**Check Skill Format:**

File naming: `.kanban/skills/{name}.md` (e.g., `check-typescript.md`, `check-tests.md`)

Before creating or reading skills, always glob `.kanban/skills/*.md` first to see existing files and naming conventions.

Each check skill should follow this format:

```markdown
# Check: {Name}

Run `{command}`

### Pass criteria
{criteria for success}

### Common failures
- "{error pattern}" — {fix suggestion}
```
</note>

<note>
**Example Check Skills:**

### check-typescript.md
```markdown
# Check: TypeScript

Run `pnpm typecheck`

### Pass criteria
Exit code 0, no errors in output.

### Common failures
- "Cannot find module X" — missing dependency, run `pnpm install`
- "Type X is not assignable to Y" — type mismatch, fix the code
```

### check-tests.md
```markdown
# Check: Tests

Run `pnpm test`

### Pass criteria
Exit code 0, all tests pass.

### Common failures
- "Test suite failed" — review failing test output
- "Cannot find module" — missing test dependency
```
</note>

<example>
**No Checks Configured:**

User: `/kanban-verify 001`

```
Verifying task 001 "Add spacing fix"...

Loading verification checks from config.yaml...
No verification checks configured.

Moving to checks status...

No automated checks configured.
Moving to QA...

Task 001 moved to QA.
- Status: qa

**Your turn to QA:**
Now's your chance to manually test the implementation. Run the application,
verify the feature works as expected, and check that nothing else broke.

When you're satisfied:
/clear
/kanban-approve 001

If you find issues:
/clear
/kanban-rework 001
```
</example>

<example>
**All Checks Pass First Try:**

User: `/kanban-verify 001`

```
Verifying task 001 "Add OAuth Login"...

Loading verification checks from config.yaml...
- check-typescript.md
- check-tests.md
- check-lint.md

Moving to checks status...

Running check: TypeScript...
PASS: TypeScript

Running check: Tests...
PASS: Tests

Running check: Lint...
PASS: Lint

All checks passed!
Moving to QA...

Task 001 moved to QA.
- Status: qa
- All 3 checks passed on first attempt

**Your turn to QA:**
Now's your chance to manually test the implementation. Run the application,
verify the feature works as expected, and check that nothing else broke.

When you're satisfied:
/clear
/kanban-approve 001

If you find issues:
/clear
/kanban-rework 001
```

**Auto-Retry on Failure:**

User: `/kanban-verify 001`

```
Verifying task 001 "Add OAuth Login"...

Loading verification checks from config.yaml...
- check-typescript.md
- check-tests.md

Attempt 1:
Running check: TypeScript...
PASS: TypeScript

Running check: Tests...
FAIL: Tests

Error output:
  FAIL src/auth/oauth.test.ts
  - OAuth callback > should set session token
    Expected: token defined
    Received: undefined

Logging attempt to plan...
Attempting to fix issues...

Analyzing failure: Test expects session token to be set in callback.
Found issue: Missing `req.session.token = token` in oauth callback handler.
Fixing: Adding session token assignment in src/auth/oauth.ts:45

Committing fix...
Commit: e5f6g7h docs(001): verify-retry - Add OAuth Login

Attempt 2:
Running check: TypeScript...
PASS: TypeScript

Running check: Tests...
PASS: Tests

All checks passed!
Moving to QA...

Task 001 moved to QA.
- Status: qa
- Passed on attempt 2

**Your turn to QA:**
Now's your chance to manually test the implementation. Run the application,
verify the feature works as expected, and check that nothing else broke.

When you're satisfied:
/clear
/kanban-approve 001

If you find issues:
/clear
/kanban-rework 001
```

**Max Retries Exceeded:**

User: `/kanban-verify 002`

```
Verifying task 002 "Database migration"...

Attempt 1:
Running check: Tests...
FAIL: Tests
Attempting to fix...

Attempt 2:
Running check: Tests...
FAIL: Tests
Attempting to fix...

Attempt 3:
Running check: Tests...
FAIL: Tests

Max retry attempts reached (3).
Manual intervention needed.

The following issues could not be auto-fixed:
- Database connection timeout in tests

See plan file for all logged attempts.

Fix issues manually and re-run:
/kanban-verify 002
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
