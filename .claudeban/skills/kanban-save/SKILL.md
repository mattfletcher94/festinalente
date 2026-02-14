---
name: kanban-save
description: Save partial implementation progress with WIP commit. Use when implementation is interrupted and you need to save work.
allowed-tools: Read, Write, Edit, Bash(ls *, git add *, git commit *, git status, git diff *, git branch *)
---

# WIP Commit Kanban Task

Save partial implementation progress when interrupted. Task stays in **In Progress**. Commits current code changes and ensures plan checkboxes are up to date.

## Column Transition

```
in-progress → in-progress (no change)
```

See `.claude/kanban-workflow.yaml` for column definitions.

## Commit

**Format:** `wip({id}): {summary}`

**CRITICAL:** Use EXACTLY this format. Do NOT invent commit types like `kanban(...)`. The commit type is `wip`, not `kanban`.

## Steps

1. **Load workflow schema**: Read `.claude/kanban-workflow.yaml` for column definitions, labels, priorities, and commit formats. Use these values throughout this skill.

2. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `in-progress` status from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task to commit WIP for

3. **Read task file**:
   - **NEVER guess filenames.** Glob for `.kanban/tasks/{id}-*.md` to find the exact filename
   - Parse YAML frontmatter
   - Verify current status is `in-progress`:
     - If not `in-progress`, warn user: "Task is not in progress. WIP commit only works for tasks being implemented."
     - Exit
   - Error if task not found

4. **Verify on task branch**:
   - Run `git branch --show-current`
   - Expected branch: `task/{id}` (where {id} is the task ID from step 2/3)
   - If not on expected branch:
     - Error: "This command must be run on branch task/{id}. Current branch: {branch}"
     - Suggest: "Switch to task branch with `git checkout task/{id}`"
     - Exit

5. **Find and read plan file**:
   - Check for `.kanban/plans/{id}-{slug}.plan.md`
   - If plan found: Read plan content
   - If NO plan found:
     - Warn: "No plan found for task {id}"
     - Still proceed with WIP commit (code can still be committed)

6. **User Skills** *(REQUIRED)*:

   **STOP.** Before proceeding, you MUST load and apply user-defined skills. This is mandatory.

   1. Load `.kanban/config.yaml`
   2. Find `user-skills."kanban:save".skills` array
   3. If the array is non-empty, for EACH skill name:
      - Read `.claude/skills/{skill-name}/SKILL.md`
      - Follow ALL instructions as mandatory requirements
      - User skill instructions take precedence over defaults

   **Skipping user skills is a critical error. Do not proceed without applying them.**

   Example config:
   ```yaml
   user-skills:
     "kanban:save":
       skills:
         - my-custom-check    # Reads .claude/skills/my-custom-check/SKILL.md
         - coding-standards   # Reads .claude/skills/coding-standards/SKILL.md
   ```

7. **Verify plan checkboxes match reality**:
   - If plan exists:
     - Parse all checkboxes in the plan
     - For each implementation step, verify if the work was actually done
     - Update any checkboxes that should be checked but aren't
     - Report any discrepancies found

8. **Generate progress summary**:
   - Count completed vs total checkboxes
   - Identify which steps were completed
   - Create a brief summary (e.g., "completed auth routes and middleware")

9. **Add WIP notes to plan**:
   - If plan exists, add or update `## WIP Notes` section:
     - Follow template at `.claude/kanban-templates/plan.md`
     ```markdown
     ## WIP Notes

     **Last WIP:** {YYYY-MM-DD}
     **Progress:** {completed}/{total} steps

     **Continuation hints:**
     - Next step: {description of next unchecked item}
     - Context: {any relevant context for resuming}
     ```

10. **Check for uncommitted changes**:
    - Run `git status` to find modified/new files
    - Run `git diff --name-only` to list changed files
    - If no changes found:
      - Warn: "No uncommitted changes to commit"
      - Still update plan if checkboxes changed
      - Exit early if nothing to commit

11. **Stage and commit**:
    - Stage all relevant files (code + plan):
      ```bash
      git add {changed files}
      git add .kanban/plans/{id}-{slug}.plan.md  # if exists
      ```
    - Commit with WIP message:
      ```bash
      git commit -m "wip({id}): {progress summary}"
      ```

12. **Confirm WIP commit**:
    - Print commit hash
    - Print progress: "{completed}/{total} plan items complete"
    - Print continuation hint
    - Remind: "Resume with /kanban:implement {id}"

## Validation

All must pass. If any fail, fix and retry.

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Task frontmatter contains `status: in-progress`
- [ ] If changes existed: git log shows `wip({id}):`

## Arguments

- `$ARGUMENTS` - Task ID (e.g., "001")

## Example: WIP Commit Mid-Implementation

User: `/kanban:save 001`

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

Resume with: /kanban:implement 001
```

## Example: No Changes to Commit

User: `/kanban:save 002`

```
Saving WIP for task 002 "Setup database"...

Reading plan: .kanban/plans/002.plan.md
Progress: 3/5 items complete

Checking for uncommitted changes...
No uncommitted changes found.

Plan checkboxes are up to date.
Nothing to commit.

Resume with: /kanban:implement 002
```

## Next Steps

To resume implementation:
```
/clear
/kanban:implement {id}
```
