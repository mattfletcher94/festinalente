---
name: kanban-backlog-plan-task
description: Create a plan document for an existing task and commit. Use to document implementation approach, steps, and validation criteria before starting work.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status)
---

# Plan Kanban Task

Create a plan file in `.kanban/plans/` and move task from **Backlog** to **Planned**. Commits the plan.

## Column Transition

```
Backlog → Planned
```

## Commit

```
docs(plan-task): <id> <title>
```

## Steps

1. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `backlog` column from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task to plan

2. **Read task file**:
   - Find file matching `.kanban/tasks/{id}-*.md`
   - Parse YAML frontmatter
   - Verify current column is `backlog`:
     - If not backlog, warn user and confirm they want to proceed
   - Error if task not found

3. **Check for needs-refinement label**:
   - If task has `needs-refinement` in labels array:
     - BLOCK planning with message:
       ```
       Task {id} needs refinement before planning.
       Run: /kanban:backlog-refine-task {id}
       ```
     - Exit without creating plan

4. **Check for existing plan**:
   - Check if `.kanban/plans/{id}.plan.md` exists
   - If exists, ask if user wants to overwrite or view existing

5. **Check for command skills**:
   - Load `.kanban/board.yaml`
   - Find `commands."kanban:backlog-plan-task".skills` array
   - If skills array is non-empty:
     - Read each skill file at the listed paths
     - Follow their instructions as mandatory guidance for this command

6. **Create plan file** at `.kanban/plans/{id}.plan.md`:

```yaml
---
task: "{id}"
created: {YYYY-MM-DD}
---

# Plan: {task title}

## Overview

[Summary of what this task accomplishes]

## Goals

- [ ] {derived from task acceptance criteria}
- [ ] {additional goals}

## Implementation Steps

1. {Step 1 with file references}
2. {Step 2}
3. {Testing/validation step}

## Files to Modify

- {file path 1}
- {file path 2}

## Risks

- {Risk}: {mitigation}

## Validation

- [ ] {From task acceptance criteria}
```

7. **Update task file**:
   - Change `column: backlog` to `column: planned`
   - Add `plan: "plans/{id}.plan.md"` to frontmatter
   - Add `updated: {YYYY-MM-DD}`

8. **Write updated task file**

9. **Commit the plan and task update**:
   ```bash
   git add .kanban/plans/{id}.plan.md .kanban/tasks/{id}-*.md
   git commit -m "docs(plan-task): {id} {title}"
   ```

10. **Confirm**:
    - Print: "Task {id} moved to Planned"
    - Print plan file path
    - Print commit hash

## Arguments

- `$ARGUMENTS` - Task ID (e.g., "001")

## Example

User: `/kanban:backlog-plan-task 001`

```
Planning task 001 "Add user authentication"...

Checking for command skills...
- Reading: .claude/skills/coding-standards.md

Plan created: .kanban/plans/001.plan.md

Task 001 moved to Planned
- Column: planned
- Plan: .kanban/plans/001.plan.md
Commit: c3d4e5f docs(plan-task): 001 Add user authentication
```

## Next Steps

```
/kanban:planned-implement-task {id}
```
