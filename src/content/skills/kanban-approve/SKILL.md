---
name: kanban-approve
description: Approve implementation after human QA, commit code, and move to Update Docs. Use when QA testing passes.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git diff *, git branch *)
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Approve Kanban Task

Approve implementation after human QA testing, commit the code with appropriate conventional commit type, and move task from **QA** to **Update Docs**.

## Directory Reference
- **`.claude/`** — System config (workflow, templates, skills) — READ ONLY
- **`.kanban/`** — Project data (tasks, specs, plans, product docs) — READ/WRITE

## Column Transition

```
qa → update-docs
```

See `.claude/kanban-workflow.yaml` for column definitions and valid transitions.

## Commit

**Format:** `{type}({id}): {title}` where `{type}` comes from task label:
- `bug` label → `fix({id}): {title}`
- `feature` label → `feat({id}): {title}`
- `refactor` label → `refactor({id}): {title}`
- `docs` label → `docs({id}): {title}`
- Default → `feat({id}): {title}`

**CRITICAL:** Use EXACTLY these formats. Do NOT invent commit types like `kanban(...)`. Valid types are: `feat`, `fix`, `refactor`, `docs`.

## Steps

1. **Load workflow schema**: Read `.claude/kanban-workflow.yaml` for column definitions, labels, priorities, and commit formats. Use these values throughout this skill.

2. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `qa` status from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task to approve

3. **Read task file**:
   - **NEVER guess filenames.** Glob for `.kanban/tasks/{id}-*.md` to find the exact filename
   - Parse YAML frontmatter
   - Verify current status is `qa`:
     - If `in-progress`: Suggest completing verification first
     - If `backlog` or `planned`: Suggest earlier commands
     - If `update-docs` or later: Warn task already past QA
   - Get title and labels for commit message
   - Error if task not found

4. **Verify on task branch**:
   - Run `git branch --show-current`
   - Expected branch: `task/{id}` (where {id} is the task ID from step 2/3)
   - If not on expected branch:
     - Error: "This command must be run on branch task/{id}. Current branch: {branch}"
     - Suggest: "Switch to task branch with `git checkout task/{id}`"
     - Exit

5. **User Skills** *(REQUIRED)*:

   **STOP.** Before proceeding, you MUST load and apply user-defined skills. This is mandatory.

   1. Load `.kanban/config.yaml`
   2. Find `user-skills."kanban-approve".skills` array
   3. If the array is non-empty, for EACH skill name:
      - Read `.claude/skills/{skill-name}/SKILL.md`
      - Follow ALL instructions as mandatory requirements
      - User skill instructions take precedence over defaults

   **Skipping user skills is a critical error. Do not proceed without applying them.**

   Example config:
   ```yaml
   user-skills:
     "kanban-approve":
       skills:
         - my-custom-check    # Reads .claude/skills/my-custom-check/SKILL.md
         - coding-standards   # Reads .claude/skills/coding-standards/SKILL.md
   ```

6. **Prompt for QA confirmation**:
   - Display task title and acceptance criteria
   - Ask: "Have you tested the application and verified it meets acceptance criteria? [Y/n]"
   - If user declines:
     - Suggest: "Use /kanban-rework {id} to document issues"
     - Exit

7. **Check for uncommitted changes**:
   - Run `git status` to find modified/new files
   - Run `git diff --name-only` to list changed files
   - Display files that will be committed
   - If no changes found:
     - Warn: "No uncommitted changes to commit. Was the implementation already committed?"
     - Ask if user wants to proceed anyway (just move status)

8. **Determine commit type from labels**:
   - Check task labels array:
     - If contains `bug`: type = `fix`
     - If contains `refactor`: type = `refactor`
     - If contains `docs`: type = `docs`
     - If contains `feature` or default: type = `feat`

9. **Move to Update Docs** (before commit so status is included):
    - Change `status: qa` to `status: update-docs`
    - Add `updated: {YYYY-MM-DD}`
    - Write updated task file

10. **CRITICAL: Stage and commit code**:

   **This step is MANDATORY. Do not proceed without committing.**

   - Stage implementation files AND .kanban files together:
     ```bash
     git add {implementation files}
     git add .kanban/
     ```
   - `.kanban` files MUST be included — they accumulate status and plan changes from implement/verify that are not committed earlier
   - Create commit:
     ```bash
     git commit -m "{type}({id}): {title}"
     ```

   **DO NOT skip this step. If the commit fails, stop and report the error.**

11. **Confirm**:
   - Print commit hash and message
   - Print: "Task {id} moved to Update Docs"
   - Print: "QA passed! Code committed."
   - **REQUIRED OUTPUT** - Print next steps EXACTLY like this:
     ```
     Next:
     /clear
     /kanban-docs {id}
     ```
   - Do NOT skip this output. The user needs these commands to continue.

## Validation

**STOP. You MUST verify ALL items pass before declaring success. Do not skip validation.**

All must pass. If any fail, fix and retry.

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Task frontmatter contains `status: update-docs`
- [ ] Git log shows appropriate commit type (`feat`, `fix`, `refactor`, or `docs`) with `({id}):`

## Arguments

- `$ARGUMENTS` - Task ID (e.g., "001")

## Example: Feature QA Passed

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

## Example: Bug Fix QA Passed

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
