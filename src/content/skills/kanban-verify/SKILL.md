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

**Behavior:**
- Auto-loop on failure — AI fixes issues and retries (max 3 attempts)
- Auto-advance on success — Moves directly to QA when all checks pass
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
    Use $ARGUMENTS if provided (e.g., "001"), otherwise:
    - List tasks in `in-progress` status from `.kanban/tasks/`
    - Show task IDs and titles
    - Ask user which task to verify
  </step>

  <step name="read_task_file" outputs="taskPath, title">
    - Run `node .claude/scripts/find-task.cjs {taskId}` to get exact path
    - Read the file at the `path` from JSON output
    - Parse YAML frontmatter
    - Verify status is `in-progress`:
      - If not, warn: "Task is in {status} status. Expected: in-progress. Continue anyway? (y/n)"
    - Error if task not found
  </step>

  <step name="verify_branch">
    {{> branch-verify-task}}
  </step>

  <step name="read_plan_file" outputs="planPath">
    - Run `node .claude/scripts/find-plan.cjs {taskId}` to get exact path
    - Read the plan at the `path` from JSON output
    - Verify all implementation checkboxes are marked complete
    - If any unchecked, warn: "Plan has incomplete items. Verify anyway? (y/n)"
  </step>

  <step name="load_verification_checks" outputs="checkSkills">
    - Read `.kanban/config.yaml`
    - Find `user-skills."kanban-verify".skills` array
    - If skills array is empty:
      - Inform user: "No verification checks configured. Add check skills to config.yaml"
      - Ask: "Continue without checks? (y/n)"
    - For each skill path in the array:
      - Read the skill file
      - Extract the check command and pass criteria
  </step>

  <step name="run_verification_loop">
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
  </step>

  <step name="handle_success" when="all checks passed">
    - Update task status to `checks`
    - Write task file
    - Print: "All checks passed. Moving to QA..."

    **Auto-advance to QA:**
    - Update task status to `qa`
    - Add `updated: {YYYY-MM-DD}`
    - Write task file

    **IMPORTANT: Task file changes are ONLY:**
    - `status: qa`
    - `updated: {YYYY-MM-DD}`

    **DO NOT add verification results, check names, pass/fail logs, or any other content to the task file.**

    - Print summary of all passed checks
    - Print: "Task {taskId} moved to QA."
  </step>

  <step name="output_result">
    Output next steps to user.
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

## Check Skill Format

**File naming:** `.kanban/skills/{name}.md` (e.g., `check-typescript.md`, `check-tests.md`)

**IMPORTANT:** Before creating or reading skills, always glob `.kanban/skills/*.md` first to see existing files and naming conventions.

Each check skill should follow this format:

```markdown
# Check: {Name}

Run `{command}`

### Pass criteria
{criteria for success}

### Common failures
- "{error pattern}" — {fix suggestion}
```

## Example Check Skills

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

## Example

**All Checks Pass First Try:**

User: `/kanban-verify 001`

```
Verifying task 001 "Add OAuth Login"...

Loading verification checks from config.yaml...
- check-typescript.md
- check-tests.md
- check-lint.md

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

Next:
/clear
/kanban-approve 001
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

Next:
/clear
/kanban-approve 001
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

## Next Steps

After verification passes and moves to QA:
```
/clear
/kanban-approve {id}
```

If human QA finds issues:
```
/clear
/kanban-rework {id}
```
