---
name: kanban-rework
description: Return task to In Progress for fixes. Works from QA or PR columns.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *, gh pr *)
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Rework Kanban Task

Return a task to In Progress when human review finds issues. This consolidated command works from both **QA** and **PR** columns.

{{> directory-reference}}

## Column Transitions

```
qa → in-progress
pr → in-progress
```

See `.claude/kanban-workflow.yaml` for column definitions and valid transitions.

## Commit

{{> commit-format type="docs" action="rework"}}

## Steps

1. **Load workflow schema**
   {{> workflow-load}}

2. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `qa` or `pr` status from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task needs rework

3. **Read task file**:
   - **NEVER guess filenames.** Glob for `.kanban/tasks/{id}-*.md` to find the exact filename
   - Parse YAML frontmatter
   - Verify current status is `qa` or `pr`:
     - If not `qa` or `pr`, warn user and confirm they want to proceed
   - Note current title, status, and acceptance criteria
   - Error if task not found

4. **Verify on task branch**
   {{> branch-verify-task}}

5. **Find and read plan file**:
   - Check for `.kanban/plans/{id}-{slug}.plan.md`
   - If plan found: Read plan content
   - Plan will be updated with issues to address

6. **User Skills** *(REQUIRED)*
   {{> user-skills command="rework"}}

7. **If task was in PR column, close the PR**:
   - If status was `pr`:
     ```bash
     gh pr close
     ```
   - Print: "PR closed"

8. **Prompt for issues**:
   - Ask user: "What issues need to be fixed?"
   - Collect detailed description of problems
   - Parse into individual issues if multiple provided

9. **Update plan file with iteration** (following template at `.claude/kanban-templates/plan.md`):
   - Increment `iteration` in frontmatter
   - Determine phase name based on original status:
     - `qa` → "QA Failed"
     - `pr` → "PR Rejected"
   - Add to `## Iterations` section (create if doesn't exist):
     ```markdown
     ## Iterations

     ### Attempt {n} — {phase name} ({YYYY-MM-DD})
     **Phase:** {qa|pr}
     **Result:** failed

     **Issues:**
     - [ ] {issue 1}
     - [ ] {issue 2}
     - [ ] {issue 3}

     **Action:** Address issues above, then re-verify

     ---
     ```

10. **Move to In Progress**:
    - Change `status: {qa|pr}` to `status: in-progress`
    - Add `updated: {YYYY-MM-DD}`
    - Write updated task file

11. **CRITICAL: Commit the rework notes**
    {{> commit-critical}}

    ```bash
    git add .kanban/tasks/{id}-*.md
    git add .kanban/plans/{id}-{slug}.plan.md  # if exists
    git commit -m "docs({id}): rework - {title}"
    ```

12. **Confirm**:
    - Print commit hash
    - Print: "Task {id} returned to In Progress for rework"
    - Print iteration number
    - Print number of issues to address
    {{> next-steps next_command="implement"}}
    - Also mention: "Then re-verify with /kanban-verify {id}"

## Validation

{{> validation-intro}}

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Plan file exists at `.kanban/plans/{id}-{slug}.plan.md`
- [ ] Task frontmatter contains `status: in-progress`
- [ ] Plan contains `## Iterations` section with rework entry
- [ ] Git log shows `docs({id}): rework -`
- [ ] If was in PR: PR is closed (verify with `gh pr view --json state`)

## Arguments

- `$ARGUMENTS` - Task ID (e.g., "001")

## Example

User: `/kanban-rework 001`

```
Handling rework for task 001 "Add user authentication"...

Task: 001 - Add user authentication
Status: qa

What issues need to be fixed?
> 1. Password validation is missing minimum length check
> 2. JWT token expiry is not being checked
> 3. Error messages expose internal details

Updating plan with iteration...

Commit: g7h8i9j docs(001): rework - Add user authentication

Task 001 returned to In Progress for rework.
- Iteration: 2
- Status: in-progress
- Issues to address: 3

Next:
/clear
/kanban-implement 001

Then re-verify: /kanban-verify 001
```

## Next Steps

Fix the issues (see plan's Iterations for checkboxes):
```
/clear
/kanban-implement {id}
```

Then re-verify:
```
/clear
/kanban-verify {id}
```
