---
name: kanban-save
description: Save partial implementation progress with WIP commit. Use when implementation is interrupted and you need to save work.
allowed-tools: Read, Write, Edit, Bash(ls *, git add *, git commit *, git status, git diff *, git branch *)
argument-hint: "[task-id]"
disable-model-invocation: true
---

# WIP Commit Kanban Task

<purpose>
Save partial implementation progress when interrupted. Task stays in In Progress. Commits current code changes and ensures plan checkboxes are up to date.
</purpose>

<context>
{{> column-transition from="in-progress" to="in-progress (no change)"}}
</context>

<prohibited>
- Do not save WIP for tasks not in `in-progress` status
- Do not skip updating plan checkboxes to reflect actual progress
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="get_task_id" outputs="taskId">
    Use $ARGUMENTS if provided (e.g., "001"), otherwise:
    - List tasks in `in-progress` status from `.kanban/tasks/`
    - Show task IDs and titles
    - Ask user which task to commit WIP for
  </step>

  <step name="read_task_file" outputs="taskPath, title">
    - **NEVER guess filenames.** Glob for `.kanban/tasks/{taskId}-*.md` to find the exact filename
    - Parse YAML frontmatter
    - Verify current status is `in-progress`:
      - If not `in-progress`, warn user: "Task is not in progress. WIP commit only works for tasks being implemented."
      - Exit
    - Error if task not found
  </step>

  <step name="verify_branch">
    {{> branch-verify-task}}
  </step>

  <step name="read_plan_file" outputs="planPath, planContent">
    - Check for `.kanban/plans/{taskId}-{slug}.plan.md`
    - If plan found: Read plan content
    - If NO plan found:
      - Warn: "No plan found for task {taskId}"
      - Still proceed with WIP commit (code can still be committed)
  </step>

  <step name="load_user_skills">
    {{> user-skills command="save"}}
  </step>

  <step name="verify_plan_checkboxes">
    If plan exists:
    - Parse all checkboxes in the plan
    - For each implementation step, verify if the work was actually done
    - Update any checkboxes that should be checked but aren't
    - Report any discrepancies found
  </step>

  <step name="generate_progress_summary" outputs="progressSummary">
    - Count completed vs total checkboxes
    - Identify which steps were completed
    - Create a brief summary (e.g., "completed auth routes and middleware")
  </step>

  <step name="add_wip_notes_to_plan" when="plan exists">
    Add or update `## WIP Notes` section:
    - Follow template at `.claude/kanban-templates/plan.md`
    ```markdown
    ## WIP Notes

    **Last WIP:** {YYYY-MM-DD}
    **Progress:** {completed}/{total} steps

    **Continuation hints:**
    - Next step: {description of next unchecked item}
    - Context: {any relevant context for resuming}
    ```
  </step>

  <step name="check_uncommitted_changes" outputs="changedFiles">
    - Run `git status` to find modified/new files
    - Run `git diff --name-only` to list changed files
    - If no changes found:
      - Warn: "No uncommitted changes to commit"
      - Still update plan if checkboxes changed
      - Exit early if nothing to commit
  </step>

  <step name="stage_and_commit">
    Format: `wip({taskId}): {progress summary}`

    - Stage all relevant files (code + plan):
      ```bash
      git add {changed files}
      git add .kanban/plans/{taskId}-{slug}.plan.md  # if exists
      ```
    - Commit with WIP message:
      ```bash
      git commit -m "wip({taskId}): {progress summary}"
      ```
  </step>

  <step name="output_result">
    - Print commit hash
    - Print progress: "{completed}/{total} plan items complete"
    - Print continuation hint
    - Remind: "Resume with /kanban-implement {taskId}"
  </step>
</process>

<success_criteria>
- Task file exists at `.kanban/tasks/{taskId}-*.md`
- Task frontmatter contains `status: in-progress`
- If changes existed: git log shows `wip({taskId}):`
- Next steps shown to user
</success_criteria>

## Example

**WIP Commit Mid-Implementation:**

User: `/kanban-save 001`

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

Resume with: /kanban-implement 001
```

**No Changes to Commit:**

User: `/kanban-save 002`

```
Saving WIP for task 002 "Setup database"...

Reading plan: .kanban/plans/002.plan.md
Progress: 3/5 items complete

Checking for uncommitted changes...
No uncommitted changes found.

Plan checkboxes are up to date.
Nothing to commit.

Resume with: /kanban-implement 002
```

## Next Steps

To resume implementation:
```
/clear
/kanban-implement {id}
```
