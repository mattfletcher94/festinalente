---
name: kanban-verify
description: Run AI code review using skills. Auto-retries on failure, auto-advances to QA on success.
allowed-tools: Read, Write, Bash(*)
---

# Verify Kanban Task

Run AI code review using configured skills. On failure, AI fixes issues and retries automatically. On success, auto-advances to QA. Moves task from **In Progress** to **Checks** then **QA**.

## Directory Reference
- **`.claude/`** — System config (workflow, templates, skills) — READ ONLY
- **`.kanban/`** — Project data (tasks, specs, plans, product docs) — READ/WRITE

## Helper Scripts

Use these scripts to reliably find files:

```bash
# Find task by ID (returns JSON with path and metadata)
node .claude/scripts/find-task.js {id}

# Find plan by ID (returns JSON with path and metadata)
node .claude/scripts/find-plan.js {id}

# Get current date/time (returns JSON with iso and date formats)
node .claude/scripts/get-date-time.js
```

## Column Transition

```
in-progress → checks → qa (automatic on success)
```

See `.claude/kanban-workflow.yaml` for column definitions and valid transitions.

## Behavior

**Auto-loop on failure** — AI fixes issues and retries (max 3 attempts).
**Auto-advance on success** — Moves directly to QA when all checks pass.

## Commit

**Format (on retry):** `docs({id}): verify-retry - {title}`

**CRITICAL:** Use EXACTLY this format. Do NOT invent commit types like `kanban(...)`. The commit type is `docs`, not `kanban`.

## Steps

1. **Load workflow schema**: Read `.claude/kanban-workflow.yaml` for column definitions, labels, priorities, and commit formats. Use these values throughout this skill.

2. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `in-progress` status from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task to verify

3. **Read task file**:
   - Run `node .claude/scripts/find-task.js {id}` to get exact path
   - Read the file at the `path` from JSON output
   - Parse YAML frontmatter
   - Verify status is `in-progress`:
     - If not, warn: "Task is in {status} status. Expected: in-progress. Continue anyway? (y/n)"
   - Error if task not found

4. **Verify on task branch**:
   - Run `git branch --show-current`
   - Expected branch: `task/{id}` (where {id} is the task ID from step 2/3)
   - If not on expected branch:
     - Error: "This command must be run on branch task/{id}. Current branch: {branch}"
     - Suggest: "Switch to task branch with `git checkout task/{id}`"
     - Exit

5. **Read plan file**:
   - Run `node .claude/scripts/find-plan.js {id}` to get exact path
   - Read the plan at the `path` from JSON output
   - Verify all implementation checkboxes are marked complete
   - If any unchecked, warn: "Plan has incomplete items. Verify anyway? (y/n)"

6. **Load verification checks**:
   - Read `.kanban/config.yaml`
   - Find `user-skills."kanban:verify".skills` array
   - If skills array is empty:
     - Inform user: "No verification checks configured. Add check skills to config.yaml"
     - Ask: "Continue without checks? (y/n)"
   - For each skill path in the array:
     - Read the skill file
     - Extract the check command and pass criteria

7. **Run verification loop** (max 3 attempts):

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

                   # CRITICAL: Commit the retry fix
                   # This step is MANDATORY. Do not skip.
                   Commit: "docs({id}): verify-retry - {title}"
                   # DO NOT skip this commit. If it fails, stop and report the error.

                   attempt += 1
                   break (restart all checks from beginning)
               else:
                   # Max attempts reached
                   Print: "Max retry attempts reached. Manual intervention needed."
                   Print: "Fix issues and re-run /kanban:verify {id}"
                   Exit

       # If we get here, all checks passed
       break
   ```

8. **Handle success** (all checks passed):
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
   - Print: "Task {id} moved to QA."
   - **REQUIRED OUTPUT** - Print next steps EXACTLY like this:
     ```
     Next:
     /clear
     /kanban:approve {id}
     ```
   - Do NOT skip this output. The user needs these commands to continue.

## Validation

**STOP. You MUST verify ALL items pass before declaring success. Do not skip validation.**

All must pass. If any fail, fix and retry.

- [ ] Task exists at `.kanban/tasks/{id}-*.md`
- [ ] Plan exists at `.kanban/plans/{id}-{slug}.plan.md`
- [ ] If checks passed: task status is `qa`
- [ ] If checks failed after 3 attempts: plan has updated Iterations section
- [ ] All retry attempts are logged to plan

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

## Arguments

- `$ARGUMENTS` - Task ID (e.g., "001")

## Example: All Checks Pass First Try

User: `/kanban:verify 001`

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
/kanban:approve 001
```

## Example: Auto-Retry on Failure

User: `/kanban:verify 001`

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
/kanban:approve 001
```

## Example: Max Retries Exceeded

User: `/kanban:verify 002`

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
/kanban:verify 002
```

## Next Steps

After verification passes and moves to QA:
```
/clear
/kanban:approve {id}
```

If human QA finds issues:
```
/clear
/kanban:rework {id}
```
