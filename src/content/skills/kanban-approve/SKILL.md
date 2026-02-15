---
name: kanban-approve
description: Approve implementation after human QA, commit code, and move to Update Docs. Use when QA testing passes.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git diff *, git branch *)
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Approve Kanban Task

<purpose>
Approve implementation after human QA testing, commit the code with appropriate conventional commit type, and move task from QA to Update Docs.
</purpose>

<context>
{{> directory-reference}}

{{> column-transition from="qa" to="update-docs"}}
</context>

<prohibited>
- Do not approve without QA confirmation from user
- Do not use invented commit types like `kanban(...)` — valid types are: `feat`, `fix`, `refactor`, `docs`
- Do not skip the commit step
- Do not commit sensitive files (.env, credentials)
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="get_task_id" outputs="taskId">
    Use $ARGUMENTS if provided (e.g., "001"), otherwise:
    - List tasks in `qa` status from `.kanban/tasks/`
    - Show task IDs and titles
    - Ask user which task to approve
  </step>

  <step name="read_task_file" outputs="taskPath, title, labels">
    - **NEVER guess filenames.** Glob for `.kanban/tasks/{taskId}-*.md` to find the exact filename
    - Parse YAML frontmatter
    - Verify current status is `qa`:
      - If `in-progress`: Suggest completing verification first
      - If `backlog` or `planned`: Suggest earlier commands
      - If `update-docs` or later: Warn task already past QA
    - Get title and labels for commit message
    - Error if task not found
  </step>

  <step name="verify_branch">
    {{> branch-verify-task}}
  </step>

  <step name="load_user_skills">
    {{> user-skills command="approve"}}
  </step>

  <step name="prompt_qa_confirmation">
    - Display task title and acceptance criteria
    - Ask: "Have you tested the application and verified it meets acceptance criteria? [Y/n]"
    - If user declines:
      - Suggest: "Use /kanban-rework {taskId} to document issues"
      - Exit
  </step>

  <step name="check_uncommitted_changes" outputs="changedFiles">
    - Run `git status` to find modified/new files
    - Run `git diff --name-only` to list changed files
    - Display files that will be committed
    - If no changes found:
      - Warn: "No uncommitted changes to commit. Was the implementation already committed?"
      - Ask if user wants to proceed anyway (just move status)
  </step>

  <step name="determine_commit_type" outputs="commitType">
    - Check task labels array:
      - If contains `bug`: type = `fix`
      - If contains `refactor`: type = `refactor`
      - If contains `docs`: type = `docs`
      - If contains `feature` or default: type = `feat`
  </step>

  <step name="move_to_update_docs">
    (Before commit so status is included)
    - Change `status: qa` to `status: update-docs`
    - Add `updated: {YYYY-MM-DD}`
    - Write updated task file
  </step>

  <step name="stage_and_commit">
    Format: `{commitType}({taskId}): {title}` where `{commitType}` comes from task label:
    - `bug` label → `fix({taskId}): {title}`
    - `feature` label → `feat({taskId}): {title}`
    - `refactor` label → `refactor({taskId}): {title}`
    - `docs` label → `docs({taskId}): {title}`
    - Default → `feat({taskId}): {title}`

    **CRITICAL:** Use EXACTLY these formats. Do NOT invent commit types like `kanban(...)`. Valid types are: `feat`, `fix`, `refactor`, `docs`.

    - Stage implementation files AND .kanban files together:
      ```bash
      git add {implementation files}
      git add .kanban/
      ```
    - `.kanban` files MUST be included — they accumulate status and plan changes from implement/verify that are not committed earlier
    - Create commit:
      ```bash
      git commit -m "{commitType}({taskId}): {title}"
      ```
  </step>

  <step name="output_result">
    - Print commit hash and message
    - Print: "Task {taskId} moved to Update Docs"
    - Print: "QA passed! Code committed."
  </step>
</process>

<success_criteria>
- Task file exists at `.kanban/tasks/{taskId}-*.md`
- Task frontmatter contains `status: update-docs`
- Git log shows appropriate commit type (`feat`, `fix`, `refactor`, or `docs`) with `({taskId}):`
- Next steps shown to user
</success_criteria>

## Example

**Feature QA Passed:**

User: `/kanban-approve 001`

```
Approving task 001 "Add user authentication"...

Task: 001 - Add user authentication
Labels: [feature]
Acceptance Criteria:
  Given a user enters valid credentials
  When they click login
  Then they are authenticated and redirected to dashboard

Have you tested the application and verified it meets acceptance criteria? [Y/n]
> Y

Task 001 moved to Update Docs

Staging files:
- src/routes/auth.ts
- src/middleware/jwt.ts
- src/types/auth.ts
- .kanban/tasks/001-add-user-authentication.md
- .kanban/plans/001-add-user-authentication.plan.md

Commit type: feat (from feature label)

Commit: e5f6g7h feat(001): Add user authentication

QA passed!
- Column: update-docs
- Commit: e5f6g7h

Next:
/clear
/kanban-docs 001
```

**Bug Fix QA Passed:**

User: `/kanban-approve 002`

```
Approving task 002 "Fix login redirect loop"...

Task: 002 - Fix login redirect loop
Labels: [bug]
Acceptance Criteria:
  Given a user completes login
  When the server redirects
  Then the redirect goes to dashboard without loop

Have you tested the application and verified it meets acceptance criteria? [Y/n]
> Y

Task 002 moved to Update Docs

Staging files:
- src/routes/auth.ts
- .kanban/tasks/002-fix-login-redirect-loop.md
- .kanban/plans/002-fix-login-redirect-loop.plan.md

Commit type: fix (from bug label)

Commit: f6g7h8i fix(002): Fix login redirect loop

QA passed!
- Column: update-docs
- Commit: f6g7h8i

Next:
/clear
/kanban-docs 002
```

## Next Steps

```
/clear
/kanban-docs {id}
```

Or if issues are found during QA:
```
/clear
/kanban-rework {id}
```
