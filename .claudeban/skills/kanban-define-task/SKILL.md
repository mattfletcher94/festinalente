---
name: kanban-define-task
description: Create a new task in the kanban board and commit. Use when the user wants to add a task, ticket, bug, or feature to track.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status)
---

# Create Kanban Task

Create a new task file in `.kanban/tasks/` in the **Backlog** column and commit.

## Column Transition

```
[New Task] → Backlog
```

## Commit

```
docs(add-task): <id> <title>
```

## Steps

1. **Verify .kanban/ exists**: Check that `.kanban/tasks/` directory exists. If not, inform user to run `npx claude-kanban init` first.

2. **Check for command skills**:
   - Load `.kanban/board.yaml`
   - Find `commands."kanban:define-task".skills` array
   - If skills array is non-empty:
     - Read each skill file at the listed paths
     - Follow their instructions as mandatory guidance for this command

3. **Determine next ID**:
   - List files in `.kanban/tasks/`
   - Find highest numbered ID (e.g., 001, 002)
   - Increment by 1, pad to 3 digits

4. **Get task details**:
   - Title: Use $ARGUMENTS if provided, otherwise ask user
   - Ensure title follows best practices (suggest improvements if needed)
   - Generate initial acceptance criteria based on title
   - Column: `backlog`
   - Priority: Ask user (high/medium/low), default to medium if not specified

5. **Detect vague tasks**:
   - Check if task was created with ONLY a title (no $ARGUMENTS body/description provided)
   - Check if title is very short (<5 words) without clear action verb
   - Check if no acceptance criteria could be generated (title too ambiguous)
   - If ANY vagueness indicator detected:
     - Add `needs-refinement` to labels array
     - Note to user: "Task marked as needs-refinement. Run `/kanban:backlog-refine-task {id}` to clarify before planning."

6. **Determine label**:
   - Auto-detect from title/context:
     - "fix", "bug", "error", "crash", "broken" -> `bug`
     - "add", "implement", "feature", "new", "create" -> `feature`
     - "doc", "readme", "guide", "update docs" -> `docs`
   - If unclear, ask user to confirm or skip

7. **Create task file** at `.kanban/tasks/{id}-{slug}.md`:

```yaml
---
id: "{id}"
title: "{title}"
column: backlog
priority: {priority}
labels: [{label}]
created: {YYYY-MM-DD}
---

# {title}

## Description

[Description based on title and context]

## Acceptance Criteria

- [ ] [Generated criterion 1]
- [ ] [Generated criterion 2]
- [ ] [Generated criterion 3]

## Notes

[Technical notes, constraints]
```

8. **Commit the task file**:
   ```bash
   git add .kanban/tasks/{id}-{slug}.md
   git commit -m "docs(add-task): {id} {title}"
   ```

9. **Confirm creation**:
   - Print the created file path and task ID
   - Print commit hash
   - If `needs-refinement` label was added, note this

## Arguments

- `$ARGUMENTS` - Task title and optional description

## Example

User: `/kanban:define-task Fix login redirect bug`

Creates: `.kanban/tasks/002-fix-login-redirect-bug.md`

```
Task 002 created in Backlog
Title: Fix login redirect bug
Labels: [bug]
File: .kanban/tasks/002-fix-login-redirect-bug.md
Commit: a1b2c3d docs(add-task): 002 Fix login redirect bug
```

## Next Steps

If task has `needs-refinement` label:
```
/kanban:backlog-refine-task {id}
```

If task is clear and ready for planning:
```
/kanban:backlog-plan-task {id}
```
