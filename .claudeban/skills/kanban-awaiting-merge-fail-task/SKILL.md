---
name: kanban-awaiting-merge-fail-task
description: Close PR and return task to in-progress for fixes when merge is rejected.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *, gh pr *)
---

# Reject Task PR

Close the pull request, document issues, and return task to **In Progress** for fixes.

## Column Transition

```
awaiting-merge → in-progress
```

See `.claudeban/kanban-workflow.yaml` for column definitions and valid transitions.

## Commit

Uses `commits.merge-fail` format from `.claudeban/kanban-workflow.yaml`.

## Steps

1. **Load workflow schema**: Read `.claudeban/kanban-workflow.yaml` for column definitions and commit formats.

2. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `awaiting-merge` status from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task's PR was rejected

3. **Read task file**:
   - Find file matching `.kanban/tasks/{id}-*.md`
   - Parse YAML frontmatter
   - Verify current status is `awaiting-merge`
   - Error if task not found

4. **Verify on task branch**:
   - Run `git branch --show-current`
   - Expected: `task/{id}`
   - If not on expected branch:
     - Error: "This command must be run on branch task/{id}. Current branch: {branch}"
     - Exit

5. **Check for command skills**:
   - Load `.kanban/config.yaml`
   - Find `commands."kanban:awaiting-merge-fail-task".skills` array
   - If skills array is non-empty:
     - Read each skill file at the listed paths
     - Follow their instructions as mandatory guidance

6. **Close the PR**:
   ```bash
   gh pr close
   ```

7. **Document rejection reason**:
   - Ask user: "What issues caused the PR rejection?"
   - Read plan file at `.kanban/plans/{id}-{slug}.plan.md`
   - Add to `## Iterations` section:
     ```markdown
     ### Iteration N: Merge Rejected ({YYYY-MM-DD})

     **PR Feedback:**
     - {user's feedback}

     **Required Changes:**
     - [ ] {change needed}
     ```

8. **Update task status**:
   - Change `status: awaiting-merge` to `status: in-progress`
   - Add `updated: {YYYY-MM-DD}`
   - Write updated task file

9. **Commit the changes**:
   ```bash
   git add .kanban/plans/{id}-{slug}.plan.md .kanban/tasks/{id}-*.md
   git commit -m "docs({id}): merge-fail - {title}"
   ```

10. **Confirm**:
    - Print: "PR closed"
    - Print: "Issues documented in plan"
    - Print: "Task {id} returned to In Progress"
    - Print recommended next steps in this format:
      ```
      Next:
      /clear
      /kanban:planned-implement-task {id}
      ```
    - Also mention: "Then re-verify with /kanban:in-progress-verify-task {id}"

## Validation

All must pass:

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Task frontmatter contains `status: in-progress`
- [ ] Plan file contains new Iteration section documenting merge failure
- [ ] Git log shows `docs({id}): merge-fail -`
- [ ] PR is closed (verify with `gh pr view --json state`)

## Arguments

- `$ARGUMENTS` - Task ID (e.g., "001")

## Example

User: `/kanban:awaiting-merge-fail-task 001`

```
Handling PR rejection for task 001 "Add user authentication"...

Task: 001 - Add user authentication
Status: awaiting-merge

Closing PR...
PR closed.

What issues caused the PR rejection?
> Security review found session tokens aren't being rotated on login

Documenting in plan...
Added Iteration 2: Merge Rejected

Updated task status to in-progress.

Commit: j9k0l1m docs(001): merge-fail - Add user authentication

Task 001 returned to In Progress.
- Status: in-progress
- Branch: task/001 (still active)

Next:
/clear
/kanban:planned-implement-task 001

Then re-verify: /kanban:in-progress-verify-task 001
```

## Next Steps

Fix the issues, then:
```
/clear
/kanban:in-progress-verify-task {id}
```
