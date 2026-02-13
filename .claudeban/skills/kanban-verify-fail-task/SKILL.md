---
name: kanban-verify-fail-task
description: Return a failed verification back to implementation. Records failure details in plan iterations.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status)
---

# Fail Verification

Return a task from **Verify** back to **In Progress** after failed automated checks.

## Column Transition

```
Verify → In Progress
```

## Commit

```
docs(verify): fail {id} {title}
```

## Steps

1. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `verify` status from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task failed verification

2. **Read task file**:
   - Find file matching `.kanban/tasks/{id}-*.md`
   - Parse YAML frontmatter
   - Verify status is `verify`:
     - If not, warn: "Task is in {status} status. Expected: verify. Continue anyway? (y/n)"
   - Error if task not found

3. **Gather failure details**:
   - Ask user: "What verification check(s) failed?"
   - Ask user: "What was the error output?" (or they can paste it)

4. **Read plan file**:
   - Find plan at `.kanban/plans/{id}.plan.md`
   - Parse frontmatter to get current iteration
   - Error if plan not found

5. **Update plan file**:
   - Increment `iteration` in frontmatter
   - Add failure entry to `## Iterations` section (create section if doesn't exist):

   ```markdown
   ## Iterations

   ### Attempt {n} — Verify Failed ({YYYY-MM-DD})
   **Phase:** verify
   **Result:** failed

   **Errors:**
   ```
   {error output from user}
   ```

   **Action:** Fix the failing check(s) and re-verify

   ---
   ```

6. **Update task frontmatter**:
   - Change `status: verify` to `status: in-progress`
   - Update `updated: {YYYY-MM-DD}`

7. **Write updated files**:
   - Write plan file
   - Write task file

8. **Commit the failure record**:
   ```bash
   git add .kanban/plans/{id}.plan.md .kanban/tasks/{id}-*.md
   git commit -m "docs(verify): fail {id} {title}"
   ```

9. **Confirm**:
   - Print: "Task {id} returned to In Progress"
   - Print iteration number
   - Print: "Fix issues and re-verify with /kanban:in-progress-verify-task {id}"
   - Print commit hash

## Validation

All must pass. If any fail, fix and retry.

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Plan file exists at `.kanban/plans/{id}.plan.md`
- [ ] Task frontmatter contains `status: in-progress`
- [ ] Plan contains `## Iterations` section with failure entry
- [ ] Git log shows `docs(verify): fail {id}`

## Arguments

- `$ARGUMENTS` - Task ID (e.g., "001")

## Example

User: `/kanban:verify-fail-task 001`

```
Recording verification failure for task 001...

What check(s) failed?
> Tests

What was the error output?
> FAIL src/auth/oauth.test.ts
> Expected: token defined
> Received: undefined

Updating plan iterations...
Task 001 returned to In Progress
- Iteration: 2
- Status: in-progress
Commit: f6g7h8i docs(verify): fail 001 Add OAuth Login

Fix the test failure and re-verify:
/kanban:in-progress-verify-task 001
```

## Next Steps

```
/kanban:in-progress-verify-task {id}
```
