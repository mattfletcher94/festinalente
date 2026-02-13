---
name: kanban-scoped-plan-task
description: Create a plan document for a scoped task. Transforms functional specification into executable implementation checkboxes.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *)
---

# Plan Kanban Task

Create a plan file in `.kanban/plans/` and move task from **Scoped** to **Planned**. Commits the plan.

## Column Transition

```
scoped → planned
```

See `.claudeban/kanban-workflow.yaml` for column definitions and valid transitions.

## Commit

Uses `commits.plan` format from `.claudeban/kanban-workflow.yaml`.

## Steps

1. **Load workflow schema**: Read `.claudeban/kanban-workflow.yaml` for column definitions, labels, priorities, and commit formats. Use these values throughout this skill.

2. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `scoped` status from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task to plan

3. **Read task file**:
   - Find file matching `.kanban/tasks/{id}-*.md`
   - Parse YAML frontmatter
   - Verify current status is `scoped`:
     - If not scoped, warn user and confirm they want to proceed
   - Get `spec` path from frontmatter
   - Error if task not found

4. **Verify on task branch**:
   - Run `git branch --show-current`
   - Expected branch: `task/{id}` (where {id} is the task ID from step 2/3)
   - If not on expected branch:
     - Error: "This command must be run on branch task/{id}. Current branch: {branch}"
     - Suggest: "Switch to task branch with `git checkout task/{id}`"
     - Exit

5. **Read functional specification**:
   - Read spec file at `.kanban/specs/{id}.spec.md`
   - If spec not found, BLOCK planning with message:
     ```
     Task {id} needs scoping before planning.
     Run: /kanban:refined-scope-task {id}
     ```
   - Extract functional requirements, affected files, and existing patterns

6. **Check for existing plan**:
   - Check if `.kanban/plans/{id}.plan.md` exists
   - If exists, ask if user wants to overwrite or view existing

7. **Check for command skills**:
   - Load `.kanban/config.yaml`
   - Find `commands."kanban:scoped-plan-task".skills` array
   - If skills array is non-empty:
     - Read each skill file at the listed paths
     - Follow their instructions as mandatory guidance

8. **Create plan file** at `.kanban/plans/{id}.plan.md`:
   - Follow template at `.claudeban/kanban-templates/plan.md`
   - Link to spec in frontmatter
   - Create implementation steps based on spec

   ```yaml
   ---
   task: "{id}"
   spec: "specs/{id}.spec.md"
   status: approved
   created: {YYYY-MM-DD}
   generated_by: claude
   model: {current model}
   version: 1
   iteration: 1
   ---

   # Plan: {task title}

   ## Overview

   {Brief summary referencing functional spec}
   See full specification: specs/{id}.spec.md

   ## Implementation Steps

   <!-- Step Guidelines:
   1. ATOMIC: Each step = one logical change that leaves codebase working
   2. COMPLETE: Understand desired change, definition of done, all sub-steps, all info needed
   3. TRACEABLE: Reference specific file(s) and/or FR from spec
   4. SEPARABLE: Don't mix concerns - refactoring separate from features
   5. TESTABLE: The change can be verified (test, type-check, manual)
   -->

   - [ ] Step 1: {description} `path/to/file.ts` (FR1)
   - [ ] Step 2: {description} `path/to/file.ts` (FR1)
   - [ ] Step 3: {description} `path/to/new.ts` (FR2)
   - [ ] Step N: Verify acceptance criteria are met
   ```

   **Step creation guidelines:**
   - Each step should be atomic and independently verifiable
   - Reference specific files from spec's Affected Files section
   - Map steps to Functional Requirements (FR1, FR2, etc.)
   - Include testing/verification as explicit steps
   - Order steps logically (dependencies first)
   - Don't mix refactoring with feature work

9. **Update task file**:
   - Change `status: scoped` to `status: planned`
   - Add `plan: "plans/{id}.plan.md"` to frontmatter
   - Add `updated: {YYYY-MM-DD}`

10. **Write updated files**:
    - Write plan file
    - Write task file

11. **Commit the plan and task update**:
    ```bash
    git add .kanban/plans/{id}.plan.md .kanban/tasks/{id}-*.md
    git commit -m "docs({id}): plan - {title}"
    ```

12. **Confirm**:
    - Print: "Task {id} moved to Planned"
    - Print plan file path
    - Print number of implementation steps created
    - Print commit hash

## Validation

All must pass. If any fail, fix and retry.

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Task frontmatter contains `status: planned`
- [ ] Task frontmatter contains `plan: "plans/{id}.plan.md"`
- [ ] Plan file exists at `.kanban/plans/{id}.plan.md`
- [ ] Plan frontmatter contains `task: "{id}"`
- [ ] Plan frontmatter contains `spec: "specs/{id}.spec.md"`
- [ ] Plan frontmatter contains `status: approved`
- [ ] Plan frontmatter contains `iteration: 1`
- [ ] Plan contains `## Implementation Steps` section with checkboxes
- [ ] Git log shows `docs({id}): plan -`

## Arguments

- `$ARGUMENTS` - Task ID (e.g., "001")

## Example

User: `/kanban:scoped-plan-task 001`

```
Planning task 001 "Add OAuth Login"...

Reading functional specification...
- Spec: .kanban/specs/001.spec.md
- 4 functional requirements
- 3 files to modify, 1 new file
- Using Passport.js pattern from existing auth

Creating implementation plan...

Plan created: .kanban/plans/001.plan.md
- 8 implementation steps
- References FR1-FR4
- Includes verification step

Task 001 moved to Planned
- Status: planned
- Spec: specs/001.spec.md
- Plan: plans/001.plan.md
Commit: g7h8i9j docs(001): plan - Add OAuth Login
```

## Next Steps

```
/clear
/kanban:planned-implement-task {id}
```
