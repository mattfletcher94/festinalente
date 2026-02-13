---
name: kanban-review-pass-task
description: Approve implementation, commit code, and move to Update Docs. Use when code review passes.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git diff *)
---

# Review Pass Kanban Task

Approve implementation, commit the code with appropriate conventional commit type, and move task from **Review** to **Update Docs**.

## Column Transition

```
Review → Update Docs
```

## Commit

Based on task labels:
- `bug` label → `fix(<id>): <title>`
- `feature` label → `feat(<id>): <title>`
- `refactor` label → `refactor(<id>): <title>`
- `docs` label → `docs(<id>): <title>`
- Default → `feat(<id>): <title>`

## Steps

1. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `review` column from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task to approve

2. **Read task file**:
   - Find file matching `.kanban/tasks/{id}-*.md`
   - Parse YAML frontmatter
   - Verify current column is `review`:
     - If `in-progress`: Suggest completing implementation first
     - If `backlog` or `planned`: Suggest earlier commands
     - If `update-docs` or later: Warn task already past review
   - Get title and labels for commit message
   - Error if task not found

3. **Check for command skills**:
   - Load `.kanban/board.yaml`
   - Find `commands."kanban:review-pass-task".skills` array
   - If skills array is non-empty:
     - Read each skill file at the listed paths
     - Follow their instructions as mandatory guidance for this command

4. **Prompt for review confirmation**:
   - Display task title and acceptance criteria
   - Ask: "Have you reviewed the implementation and verified it meets acceptance criteria? [Y/n]"
   - If user declines:
     - Suggest: "Use /kanban:review-fail-task {id} to document issues"
     - Exit

5. **Check for uncommitted changes**:
   - Run `git status` to find modified/new files
   - Run `git diff --name-only` to list changed files
   - Display files that will be committed
   - If no changes found:
     - Warn: "No uncommitted changes to commit. Was the implementation already committed?"
     - Ask if user wants to proceed anyway (just move column)

6. **Determine commit type from labels**:
   - Check task labels array:
     - If contains `bug`: type = `fix`
     - If contains `refactor`: type = `refactor`
     - If contains `docs`: type = `docs`
     - If contains `feature` or default: type = `feat`

7. **Stage and commit code**:
   - Stage implementation files:
     ```bash
     git add {implementation files}
     ```
   - Do NOT stage .kanban files in this commit (those were committed during planning)
   - Create commit:
     ```bash
     git commit -m "{type}({id}): {title}"
     ```

8. **Move to Update Docs**:
   - Change `column: review` to `column: update-docs`
   - Add `updated: {YYYY-MM-DD}`
   - Write updated task file

9. **Confirm**:
   - Print commit hash and message
   - Print: "Task {id} moved to Update Docs"
   - Print: "Review passed! Code committed."

## Arguments

- `$ARGUMENTS` - Task ID (e.g., "001")

## Example: Feature Review Passed

User: `/kanban:review-pass-task 001`

```
Reviewing task 001 "Add user authentication"...

Task: 001 - Add user authentication
Labels: [feature]
Acceptance Criteria:
- [x] Users can register with email/password
- [x] Users can log in
- [x] Users can log out

Have you reviewed the implementation and verified it meets acceptance criteria? [Y/n]
> Y

Staging implementation files:
- src/routes/auth.ts
- src/middleware/jwt.ts
- src/types/auth.ts

Commit type: feat (from feature label)

Commit: e5f6g7h feat(001): Add user authentication

Review passed!
Task 001 moved to Update Docs
- Column: update-docs
- Commit: e5f6g7h
```

## Example: Bug Fix Review Passed

User: `/kanban:review-pass-task 002`

```
Reviewing task 002 "Fix login redirect loop"...

Task: 002 - Fix login redirect loop
Labels: [bug]
Acceptance Criteria:
- [x] Login redirects to dashboard correctly
- [x] No infinite redirect loop

Have you reviewed the implementation and verified it meets acceptance criteria? [Y/n]
> Y

Staging implementation files:
- src/routes/auth.ts

Commit type: fix (from bug label)

Commit: f6g7h8i fix(002): Fix login redirect loop

Review passed!
Task 002 moved to Update Docs
- Column: update-docs
- Commit: f6g7h8i
```

## Next Steps

```
/kanban:update-docs-complete-task {id}
```
