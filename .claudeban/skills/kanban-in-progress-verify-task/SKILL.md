---
name: kanban-in-progress-verify-task
description: Run automated verification checks on completed implementation. Stops on first failure - fail fast, fix, retry.
allowed-tools: Read, Write, Bash(*)
---

# Verify Kanban Task

Run automated verification checks on completed implementation. Moves task from **In Progress** to **Verify** if all checks pass.

## Column Transition

```
In Progress → Verify (if all pass)
In Progress → In Progress (if any fail)
```

## Behavior

**Stop on first failure** — fail fast, fix, retry.

## Steps

1. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `in-progress` status from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task to verify

2. **Read task file**:
   - Find file matching `.kanban/tasks/{id}-*.md`
   - Parse YAML frontmatter
   - Verify status is `in-progress`:
     - If not, warn: "Task is in {status} status. Expected: in-progress. Continue anyway? (y/n)"
   - Error if task not found

3. **Read plan file**:
   - Find plan at `.kanban/plans/{id}.plan.md`
   - Verify all implementation checkboxes are marked complete
   - If any unchecked, warn: "Plan has incomplete items. Verify anyway? (y/n)"

4. **Load verification checks**:
   - Read `.kanban/board.yaml`
   - Find `commands."kanban:in-progress-verify-task".skills` array
   - If skills array is empty:
     - Inform user: "No verification checks configured. Add check skills to board.yaml"
     - Ask: "Continue without checks? (y/n)"
   - For each skill path in the array:
     - Read the skill file
     - Extract the check command and pass criteria

5. **Run checks sequentially**:
   For each check skill:
   - Print: "Running check: {check name}..."
   - Execute the check command from the skill
   - Evaluate pass criteria
   - If PASS: Print "✓ {check name} passed" and continue
   - If FAIL:
     - Print "✗ {check name} failed"
     - Print error output
     - Stop immediately (don't run remaining checks)
     - Go to step 6 (Handle failure)

6. **Handle failure** (if any check failed):
   - Read plan file
   - Increment `iteration` in frontmatter
   - Add failure to `## Iterations` section:
     ```markdown
     ## Iterations

     ### Attempt {n} — Verify Failed ({YYYY-MM-DD})
     **Phase:** verify
     **Result:** failed

     **Errors:**
     ```
     {check output}
     ```

     **Action:** {guidance from check skill's "Common failures" section if available}

     ---
     ```
   - Write updated plan file
   - Commit: `git add .kanban/plans/{id}.plan.md && git commit -m "docs(verify): fail {id} {title}"`
   - Print: "Verification failed. Fix issues and re-run /kanban:in-progress-verify-task {id}"
   - Exit

7. **Handle success** (all checks passed):
   - Update task frontmatter: `status: verify`
   - Update `updated: {YYYY-MM-DD}`
   - Write task file
   - Print summary of all passed checks
   - Ask user: "All checks passed. Continue to Review? (y/n)"

8. **If user confirms**:
   - Print: "Task {id} moved to Verify. Run /kanban:verify-pass-task {id} to proceed to Review."

## Validation

All must pass. If any fail, fix and retry.

- [ ] Task exists at `.kanban/tasks/{id}-*.md`
- [ ] Plan exists at `.kanban/plans/{id}.plan.md`
- [ ] If checks passed: task status is `verify`
- [ ] If checks failed: plan has updated Iterations section

## Check Skill Format

Each check skill in `.kanban/skills/` should follow this format:

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

## Example

User: `/kanban:in-progress-verify-task 001`

```
Verifying task 001 "Add OAuth Login"...

Loading verification checks from board.yaml...
- check-typescript.md
- check-tests.md
- check-lint.md

Running check: TypeScript...
✓ TypeScript passed

Running check: Tests...
✗ Tests failed

Error output:
  FAIL src/auth/oauth.test.ts
  ● OAuth callback › should set session token
    Expected: token defined
    Received: undefined

Updating plan with failure...
Commit: e5f6g7h docs(verify): fail 001 Add OAuth Login

Verification failed. Fix the failing test and re-run:
/kanban:in-progress-verify-task 001
```

## Next Steps (on success)

```
/kanban:verify-pass-task {id}
```
