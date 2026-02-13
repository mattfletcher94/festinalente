---
name: kanban-in-progress-wip-commit
description: Save partial implementation progress with WIP commit. Use when implementation is interrupted and you need to save work.
allowed-tools: Read, Write, Edit, Bash(ls *, git add *, git commit *, git status, git diff *)
---

# WIP Commit Kanban Task

Save partial implementation progress when interrupted. Task stays in **In Progress**. Commits current code changes and ensures plan checkboxes are up to date.

## Column Transition

```
in-progress → in-progress (no change)
```

See `.claudeban/workflow.yaml` for column definitions.

## Commit

Uses `commits.wip` format from `.claudeban/workflow.yaml`.

## Steps

1. **Load workflow schema**: Read `.claudeban/workflow.yaml` for column definitions, labels, priorities, and commit formats. Use these values throughout this skill.

2. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `in-progress` status from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task to commit WIP for

3. **Read task file**:
   - Find file matching `.kanban/tasks/{id}-*.md`
   - Parse YAML frontmatter
   - Verify current status is `in-progress`:
     - If not `in-progress`, warn user: "Task is not in progress. WIP commit only works for tasks being implemented."
     - Exit
   - Error if task not found

4. **Find and read plan file**:
   - Check for `.kanban/plans/{id}.plan.md`
   - If plan found: Read plan content
   - If NO plan found:
     - Warn: "No plan found for task {id}"
     - Still proceed with WIP commit (code can still be committed)

5. **Check for command skills**:
   - Load `.kanban/config.yaml`
   - Find `commands."kanban:in-progress-wip-commit".skills` array
   - If skills array is non-empty:
     - Read each skill file at the listed paths
     - Follow their instructions as mandatory guidance for this command

6. **Verify plan checkboxes match reality**:
   - If plan exists:
     - Parse all checkboxes in the plan
     - For each implementation step, verify if the work was actually done
     - Update any checkboxes that should be checked but aren't
     - Report any discrepancies found

7. **Generate progress summary**:
   - Count completed vs total checkboxes
   - Identify which steps were completed
   - Create a brief summary (e.g., "completed auth routes and middleware")

8. **Add WIP notes to plan**:
   - If plan exists, add or update `## WIP Notes` section:
     - Follow template at `.claudeban/templates/plan.md`
     ```markdown
     ## WIP Notes

     **Last WIP:** {YYYY-MM-DD}
     **Progress:** {completed}/{total} steps

     **Continuation hints:**
     - Next step: {description of next unchecked item}
     - Context: {any relevant context for resuming}
     ```

9. **Check for uncommitted changes**:
   - Run `git status` to find modified/new files
   - Run `git diff --name-only` to list changed files
   - If no changes found:
     - Warn: "No uncommitted changes to commit"
     - Still update plan if checkboxes changed
     - Exit early if nothing to commit

10. **Stage and commit**:
   - Stage all relevant files (code + plan):
     ```bash
     git add {changed files}
     git add .kanban/plans/{id}.plan.md  # if exists
     ```
   - Commit with WIP message:
     ```bash
     git commit -m "wip({id}): {progress summary}"
     ```

11. **Confirm WIP commit**:
    - Print commit hash
    - Print progress: "{completed}/{total} plan items complete"
    - Print continuation hint
    - Remind: "Resume with /kanban:planned-implement-task {id}"

## Validation

All must pass. If any fail, fix and retry.

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Task frontmatter contains `status: in-progress`
- [ ] If changes existed: git log shows `wip({id}):`

## Arguments

- `$ARGUMENTS` - Task ID (e.g., "001")

## Example: WIP Commit Mid-Implementation

User: `/kanban:in-progress-wip-commit 001`

```
Saving WIP for task 001 "Add user authentication"...

Reading plan: .kanban/plans/001.plan.md
Progress: 2/5 items complete

Verifying checkboxes match actual progress...
- [x] Create auth routes file - verified
- [x] Add login endpoint - verified
- [ ] Add logout endpoint - not started
- [ ] Add password reset - not started
- [ ] Write tests - not started

Adding WIP notes to plan...

Staging files:
- src/routes/auth.ts
- src/middleware/jwt.ts
- .kanban/plans/001.plan.md

Commit: d4e5f6g wip(001): completed auth routes and login endpoint

WIP saved!
- Progress: 2/5 items
- Next step: Add logout endpoint

Resume with: /kanban:planned-implement-task 001
```

## Example: No Changes to Commit

User: `/kanban:in-progress-wip-commit 002`

```
Saving WIP for task 002 "Setup database"...

Reading plan: .kanban/plans/002.plan.md
Progress: 3/5 items complete

Checking for uncommitted changes...
No uncommitted changes found.

Plan checkboxes are up to date.
Nothing to commit.

Resume with: /kanban:planned-implement-task 002
```

## Next Steps

To resume implementation:
```
/kanban:planned-implement-task {id}
```
