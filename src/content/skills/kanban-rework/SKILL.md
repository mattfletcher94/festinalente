---
name: kanban-rework
description: Return task to In Progress for fixes. Works from QA or PR columns.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *, gh pr *)
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Rework Kanban Task

<purpose>
Return a task to In Progress when human review finds issues. Works from both QA and PR columns.
</purpose>

<context>
{{> directory-reference}}

**Column Transitions:**
```
qa → in-progress
pr → in-progress
```

See `.claude/kanban-workflow.yaml` for column definitions and valid transitions.
</context>

<prohibited>
- Do not skip documenting issues in the plan file
- Do not forget to close PR if task was in PR column
- Do not skip the commit step
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="get_task_id" outputs="taskId">
    Use $ARGUMENTS if provided (e.g., "001"), otherwise:
    - List tasks in `qa` or `pr` status from `.kanban/tasks/`
    - Show task IDs and titles
    - Ask user which task needs rework
  </step>

  <step name="read_task_file" outputs="taskPath, title, currentStatus">
    - **NEVER guess filenames.** Glob for `.kanban/tasks/{taskId}-*.md` to find the exact filename
    - Parse YAML frontmatter
    - Verify current status is `qa` or `pr`:
      - If not `qa` or `pr`, warn user and confirm they want to proceed
    - Note current title, status, and acceptance criteria
    - Error if task not found
  </step>

  <step name="verify_branch">
    {{> branch-verify-task}}
  </step>

  <step name="read_plan_file" outputs="planPath">
    - Check for `.kanban/plans/{taskId}-{slug}.plan.md`
    - If plan found: Read plan content
    - Plan will be updated with issues to address
  </step>

  <step name="load_user_skills">
    {{> user-skills command="rework"}}
  </step>

  <step name="close_pr" when="status was `pr`">
    ```bash
    gh pr close
    ```
    Print: "PR closed"
  </step>

  <step name="prompt_for_issues" outputs="issues">
    - Ask user: "What issues need to be fixed?"
    - Collect detailed description of problems
    - Parse into individual issues if multiple provided
  </step>

  <step name="update_plan_with_iteration">
    Following template at `.claude/kanban-templates/plan.md`:
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
  </step>

  <step name="move_to_in_progress">
    - Change `status: {qa|pr}` to `status: in-progress`
    - Add `updated: {YYYY-MM-DD}`
    - Write updated task file
  </step>

  <step name="commit">
    Format: `docs({taskId}): rework - {title}`

    ```bash
    git add .kanban/tasks/{taskId}-*.md
    git add .kanban/plans/{taskId}-{slug}.plan.md  # if exists
    git commit -m "docs({taskId}): rework - {title}"
    ```
  </step>

  <step name="output_result">
    - Print commit hash
    - Print: "Task {taskId} returned to In Progress for rework"
    - Print iteration number
    - Print number of issues to address
    - Also mention: "Then re-verify with /kanban-verify {taskId}"
  </step>
</process>

<success_criteria>
- Task file exists at `.kanban/tasks/{taskId}-*.md`
- Plan file exists at `.kanban/plans/{taskId}-{slug}.plan.md`
- Task frontmatter contains `status: in-progress`
- Plan contains `## Iterations` section with rework entry
- Git log shows `docs({taskId}): rework -`
- If was in PR: PR is closed (verify with `gh pr view --json state`)
- Next steps shown to user
</success_criteria>

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
