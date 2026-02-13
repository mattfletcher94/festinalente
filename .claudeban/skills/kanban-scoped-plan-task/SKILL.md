---
name: kanban-scoped-plan-task
description: Create a plan document for a scoped task. Transforms functional specification into executable implementation checkboxes.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status)
---

# Plan Kanban Task

Create a plan file in `.kanban/plans/` and move task from **Scoped** to **Planned**. Commits the plan.

## Column Transition

```
Scoped → Planned
```

## Commit

```
docs(plan): {id} {title}
```

## Steps

1. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `scoped` status from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task to plan

2. **Read task file**:
   - Find file matching `.kanban/tasks/{id}-*.md`
   - Parse YAML frontmatter
   - Verify current status is `scoped`:
     - If not scoped, warn user and confirm they want to proceed
   - Extract Functional Specification section for reference
   - Error if task not found

3. **Verify functional spec exists**:
   - Check task has `## Functional Specification` section
   - If missing, BLOCK planning with message:
     ```
     Task {id} needs scoping before planning.
     Run: /kanban:refined-scope-task {id}
     ```
   - Exit without creating plan

4. **Check for existing plan**:
   - Check if `.kanban/plans/{id}.plan.md` exists
   - If exists, ask if user wants to overwrite or view existing

5. **Check for command skills**:
   - Load `.kanban/board.yaml`
   - Find `commands."kanban:scoped-plan-task".skills` array
   - If skills array is non-empty:
     - Read each skill file at the listed paths
     - Follow their instructions as mandatory guidance

6. **Create plan file** at `.kanban/plans/{id}.plan.md`:

   ```yaml
   ---
   task: "{id}"
   status: approved
   created: {YYYY-MM-DD}
   iteration: 1
   ---

   # Plan: {task title}

   ## Overview

   {Brief summary referencing functional spec}

   ## Tasks

   - [ ] {Step 1: atomic action based on technical approach}
   - [ ] {Step 2: atomic action}
   - [ ] {Step 3: atomic action}
   - [ ] {Final step: verify acceptance criteria}
   ```

   **Guidelines for creating tasks:**
   - Each task should be atomic and independently verifiable
   - Reference specific files from Functional Specification
   - Include testing/verification as explicit tasks
   - Order tasks logically (dependencies first)

7. **Update task file**:
   - Change `status: scoped` to `status: planned`
   - Add `plan: "plans/{id}.plan.md"` to frontmatter
   - Add `updated: {YYYY-MM-DD}`

8. **Write updated task file**

9. **Commit the plan and task update**:
   ```bash
   git add .kanban/plans/{id}.plan.md .kanban/tasks/{id}-*.md
   git commit -m "docs(plan): {id} {title}"
   ```

10. **Confirm**:
    - Print: "Task {id} moved to Planned"
    - Print plan file path
    - Print number of implementation tasks created
    - Print commit hash

## Validation

All must pass. If any fail, fix and retry.

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Task frontmatter contains `status: planned`
- [ ] Plan file exists at `.kanban/plans/{id}.plan.md`
- [ ] Plan frontmatter contains `task: "{id}"`
- [ ] Plan frontmatter contains `status: approved`
- [ ] Plan frontmatter contains `iteration: 1`
- [ ] Plan contains `## Tasks` section with checkboxes
- [ ] Git log shows `docs(plan): {id}`

## Arguments

- `$ARGUMENTS` - Task ID (e.g., "001")

## Example

User: `/kanban:scoped-plan-task 001`

```
Planning task 001 "Add OAuth Login"...

Reading functional specification...
- 3 files to modify
- 1 new file to create
- Using Passport.js pattern

Creating implementation plan...

Plan created: .kanban/plans/001.plan.md
- 8 implementation tasks

Task 001 moved to Planned
- Status: planned
- Plan: .kanban/plans/001.plan.md
Commit: g7h8i9j docs(plan): 001 Add OAuth Login
```

## Next Steps

```
/kanban:planned-implement-task {id}
```
