---
name: kanban-verify-fail-task
description: Return a failed verification back to implementation. Records failure details in plan iterations.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *)
---

# Fail Verification

Return a task from **Verify** back to **In Progress** after failed automated checks.

## Directory Reference
- **`.claude/`** — System config (workflow, templates, skills) — READ ONLY
- **`.kanban/`** — Project data (tasks, specs, plans, product docs) — READ/WRITE

## Column Transition

```
verify → in-progress
```

See `.claudeban/kanban-workflow.yaml` for column definitions and valid transitions.

## Commit

Uses `commits.verify-fail` format from `.claudeban/kanban-workflow.yaml`.

## Steps

1. **Load workflow schema**: Read `.claudeban/kanban-workflow.yaml` for column definitions, labels, priorities, and commit formats. Use these values throughout this skill.

2. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `verify` status from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task failed verification

3. **Read task file**:
   - Find file matching `.kanban/tasks/{id}-*.md`
   - Parse YAML frontmatter
   - Verify status is `verify`:
     - If not, warn: "Task is in {status} status. Expected: verify. Continue anyway? (y/n)"
   - Error if task not found

4. **Verify on task branch**:
   - Run `git branch --show-current`
   - Expected branch: `task/{id}` (where {id} is the task ID from step 2/3)
   - If not on expected branch:
     - Error: "This command must be run on branch task/{id}. Current branch: {branch}"
     - Suggest: "Switch to task branch with `git checkout task/{id}`"
     - Exit

5. **Gather failure details**:
   - Ask user: "What verification check(s) failed?"
   - Ask user: "What was the error output?" (or they can paste it)

6. **Read plan file**:
   - Find plan at `.kanban/plans/{id}-{slug}.plan.md`
   - Parse frontmatter to get current iteration
   - Error if plan not found

7. **Update plan file** (following template at `.claudeban/kanban-templates/plan.md`):
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

8. **Update task frontmatter**:
   - Change `status: verify` to `status: in-progress`
   - Update `updated: {YYYY-MM-DD}`

9. **Write updated files**:
   - Write plan file
   - Write task file

10. **Commit the failure record**:
    ```bash
    git add .kanban/plans/{id}-{slug}.plan.md .kanban/tasks/{id}-*.md
    git commit -m "docs({id}): verify-fail - {title}"
    ```

11. **Confirm**:
   - Print: "Task {id} returned to In Progress"
   - Print iteration number
   - Print commit hash
   - Print recommended next steps in this format:
     ```
     Next:
     /clear
     /kanban:planned-implement-task {id}
     ```
   - Also mention: "Then re-verify with /kanban:in-progress-verify-task {id}"

## Validation

All must pass. If any fail, fix and retry.

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Plan file exists at `.kanban/plans/{id}-{slug}.plan.md`
- [ ] Task frontmatter contains `status: in-progress`
- [ ] Plan contains `## Iterations` section with failure entry
- [ ] Git log shows `docs({id}): verify-fail -`

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
Commit: f6g7h8i docs(001): verify-fail - Add OAuth Login

Next:
/clear
/kanban:planned-implement-task 001

Then re-verify: /kanban:in-progress-verify-task 001
```

## Next Steps

Fix the issues:
```
/clear
/kanban:planned-implement-task {id}
```

Then re-verify:
```
/clear
/kanban:in-progress-verify-task {id}
```
