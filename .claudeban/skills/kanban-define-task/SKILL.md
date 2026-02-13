---
name: kanban-define-task
description: Create a new task in the kanban board and commit. Use when the user wants to add a task, ticket, bug, or feature to track.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status), Grep
---

# Create Kanban Task

Create a new task file in `.kanban/tasks/` in the **Backlog** column and commit.

## Column Transition

```
[New Task] → backlog
```

See `.claudeban/workflow.yaml` for column definitions.

## Commit

Uses `commits.define` format from `.claudeban/workflow.yaml`.

## Steps

1. **Load workflow schema**: Read `.claudeban/workflow.yaml` for column definitions, labels, priorities, and commit formats. Use these values throughout this skill.

2. **Verify .kanban/ exists**: Check that `.kanban/tasks/` directory exists. If not, inform user to run `npx claude-kanban init` first.

3. **Check for command skills**:
   - Load `.kanban/config.yaml`
   - Find `commands."kanban:define-task".skills` array
   - If skills array is non-empty:
     - Read each skill file at the listed paths
     - Follow their instructions as mandatory guidance for this command

4. **Determine next ID**:
   - List files in `.kanban/tasks/`
   - Find highest numbered ID (e.g., 001, 002)
   - Increment by 1, pad to 3 digits

5. **Get task details**:
   - Title: Use $ARGUMENTS if provided, otherwise ask user
   - Ensure title follows best practices (suggest improvements if needed)
   - Generate initial description based on title
   - Status: Use first column ID from workflow.yaml (`backlog`)
   - Priority: Ask user (use priority IDs from workflow.yaml), default to `medium` if not specified

6. **Detect vague tasks**:
   - Check if task was created with ONLY a title (no $ARGUMENTS body/description provided)
   - Check if title is very short (<5 words) without clear action verb
   - Check if no description could be generated (title too ambiguous)
   - If ANY vagueness indicator detected:
     - Add `needs-refinement` to labels array (from workflow.yaml)
     - Note to user: "Task marked as needs-refinement. Run `/kanban:backlog-refine-task {id}` to clarify before planning."

7. **Determine label**:
   - Use `labels[].detect-keywords` from workflow.yaml to auto-detect label from title/context
   - If unclear, ask user to confirm or skip

8. **Create task file** at `.kanban/tasks/{id}-{slug}.md`:
   - Follow template at `.claudeban/templates/task.md`
   - Fill sections for this phase:
     - Frontmatter: `id`, `title`, `status: backlog`, `priority`, `labels`, `created`
     - Body: `## Description`, `## Notes`
   - Leave empty (filled in later phases):
     - `## What problem are you trying to solve?`
     - `## What value would it provide if solved?`
     - `## Acceptance Criteria`
     - Frontmatter: `spec`, `plan`, `updated`, `completed`

9. **Commit the task file**:
   - Use `commits.define` format from workflow.yaml
   ```bash
   git add .kanban/tasks/{id}-{slug}.md
   git commit -m "docs({id}): define - {title}"
   ```

10. **Confirm creation**:
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
/kanban:backlog-refine-task {id}
```
