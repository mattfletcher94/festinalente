---
name: kanban-define-task
description: Create a new task in the kanban board and commit. Use when the user wants to add a task, ticket, bug, or feature to track.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *), Grep
---

# Create Kanban Task

Create a new task file in `.kanban/tasks/` in the **Backlog** column and commit.

## Column Transition

```
[New Task] → backlog
```

See `.claudeban/kanban-workflow.yaml` for column definitions.

## Commit

Uses `commits.define` format from `.claudeban/kanban-workflow.yaml`.

## Steps

1. **Load workflow schema**: Read `.claudeban/kanban-workflow.yaml` for column definitions, labels, priorities, and commit formats. Use these values throughout this skill.

2. **Verify on main branch**:
   - Run `git branch --show-current`
   - If not on `main` (or `master`):
     - Error: "This command must be run on the main branch. Current branch: {branch}"
     - Suggest: "Switch to main with `git checkout main`"
     - Exit

3. **Verify .kanban/ exists**: Check that `.kanban/tasks/` directory exists. If not, inform user to run `npx claude-kanban init` first.

4. **Check for command skills**:
   - Load `.kanban/config.yaml`
   - Find `commands."kanban:define-task".skills` array
   - If skills array is non-empty:
     - Read each skill file at the listed paths
     - Follow their instructions as mandatory guidance for this command

5. **Determine next ID**:
   - List files in `.kanban/tasks/`
   - Find highest numbered ID (e.g., 001, 002)
   - Increment by 1, pad to 3 digits

6. **Get task details**:
   - Title: Use $ARGUMENTS if provided, otherwise ask user
   - Ensure title follows best practices (suggest improvements if needed)
   - Generate initial description based on title
   - Status: Use first column ID from kanban-workflow.yaml (`backlog`)
   - Priority: Ask user (use priority IDs from kanban-workflow.yaml), default to `medium` if not specified

7. **Detect vague tasks**:
   - Check if task was created with ONLY a title (no $ARGUMENTS body/description provided)
   - Check if title is very short (<5 words) without clear action verb
   - Check if no description could be generated (title too ambiguous)
   - If ANY vagueness indicator detected:
     - Add `needs-refinement` to labels array (from kanban-workflow.yaml)
     - Note to user: "Task marked as needs-refinement. Run `/kanban:backlog-refine-task {id}` to clarify before planning."

8. **Determine label**:
   - Use `labels[].detect-keywords` from kanban-workflow.yaml to auto-detect label from title/context
   - If unclear, ask user to confirm or skip

9. **Create task file** at `.kanban/tasks/{id}-{slug}.md`:
   - Follow template at `.claudeban/kanban-templates/task.md`
   - Fill sections for this phase:
     - Frontmatter: `id`, `title`, `status: backlog`, `priority`, `labels`, `created`
     - Body: `## Description`, `## Notes`
   - Leave empty (filled in later phases):
     - `## What problem are you trying to solve?`
     - `## What value would it provide if solved?`
     - `## Acceptance Criteria`
     - Frontmatter: `spec`, `plan`, `updated`, `completed`

10. **Commit the task file**:
    - Use `commits.define` format from kanban-workflow.yaml
    ```bash
    git add .kanban/tasks/{id}-{slug}.md
    git commit -m "docs({id}): define - {title}"
    ```

11. **Confirm creation**:
   - Print the created file path and task ID
   - Print commit hash
   - If `needs-refinement` label was added, note this

## Arguments

- `$ARGUMENTS` - Task title and optional description

## Validation

All must pass. If any fail, fix and retry.

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Frontmatter contains `id: "{id}"`
- [ ] Frontmatter contains `status: backlog`
- [ ] Frontmatter contains `title: "{title}"`
- [ ] Task file contains `## Description` section
- [ ] Git log shows `docs({id}): define -`

## Example

User: `/kanban:define-task Fix login redirect bug`

Creates: `.kanban/tasks/002-fix-login-redirect-bug.md`

```
Task 002 created in Backlog
Title: Fix login redirect bug
Labels: [bug]
File: .kanban/tasks/002-fix-login-redirect-bug.md
Commit: a1b2c3d docs(002): define - Fix login redirect bug
```

## Next Steps

```
/clear
/kanban:backlog-refine-task {id}
```
