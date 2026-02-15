---
name: kanban-implement
description: Implement a planned task. Moves task to In Progress, executes the plan, then moves to Checks. No commit - code stays uncommitted.
allowed-tools: Read, Write, Edit, Bash(*)
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Implement Kanban Task

Move task from **Planned** to **In Progress** and execute the plan. Code remains uncommitted until verification passes.

## Directory Reference
- **`.claude/`** — System config (workflow, templates, skills) — READ ONLY
- **`.kanban/`** — Project data (tasks, specs, plans, product docs) — READ/WRITE

## Helper Scripts

Use these scripts to reliably find files:

```bash
# Find task by ID (returns JSON with path and metadata)
node .claude/scripts/find-task.cjs {id}

# Find plan by ID (returns JSON with path and metadata)
node .claude/scripts/find-plan.cjs {id}

# Get current date/time (returns JSON with iso and date formats)
node .claude/scripts/get-date-time.cjs
```

## Column Transition

```
planned → in-progress
```

See `.claude/kanban-workflow.yaml` for column definitions and valid transitions.

## Commit

None - code stays uncommitted until QA passes. Use `/kanban-save` to save partial progress.

## Steps

1. **Load workflow schema**: Read `.claude/kanban-workflow.yaml` for column definitions, labels, priorities, and commit formats. Use these values throughout this skill.

2. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `planned` or `in-progress` status from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task to implement

3. **Read task file**:
   - Run `node .claude/scripts/find-task.cjs {id}` to get exact path
   - Read the file at the `path` from JSON output
   - Parse YAML frontmatter
   - Verify current status:
     - If `planned`: Move to `in-progress` first (step 5)
     - If `in-progress`: Resume implementation (skip step 5)
     - If `backlog` or `refined`: Suggest `/kanban-refine {id}` or `/kanban-scope {id}` first, exit
     - If `checks` or later: Warn task is past implementation
   - Error if task not found

4. **Verify on task branch**:
   - Run `git branch --show-current`
   - Expected branch: `task/{id}` (where {id} is the task ID from step 2/3)
   - If not on expected branch:
     - Error: "This command must be run on branch task/{id}. Current branch: {branch}"
     - Suggest: "Switch to task branch with `git checkout task/{id}`"
     - Exit

5. **Move to In Progress** (if status was `planned`):
   - Change `status: planned` to `status: in-progress`
   - Add `updated: {YYYY-MM-DD}`
   - Write updated task file
   - Print: "Task {id} moved to In Progress"

6. **Find and read plan file**:
   - Run `node .claude/scripts/find-plan.cjs {id}` to get exact path
   - If plan found: Read the plan at the `path` from JSON output
   - If NO plan found:
     - Warn: "No plan found for task {id}"
     - Suggest: "Create plan with /kanban-plan first"
     - Exit

7. **Read functional specification** (for context):
   - Get `spec` path from plan frontmatter
   - Read spec file for full context on requirements and patterns

8. **User Skills** *(REQUIRED)*:

   **STOP.** Before proceeding, you MUST load and apply user-defined skills. This is mandatory.

   1. Load `.kanban/config.yaml`
   2. Find `user-skills."kanban-implement".skills` array
   3. If the array is non-empty, for EACH skill name:
      - Read `.claude/skills/{skill-name}/SKILL.md`
      - Follow ALL instructions as mandatory requirements
      - User skill instructions take precedence over defaults

   **Skipping user skills is a critical error. Do not proceed without applying them.**

   Example config:
   ```yaml
   user-skills:
     "kanban-implement":
       skills:
         - my-custom-check    # Reads .claude/skills/my-custom-check/SKILL.md
         - coding-standards   # Reads .claude/skills/coding-standards/SKILL.md
   ```

9. **Parse plan checkboxes**:
   - Find all unchecked items: `- [ ]` pattern
   - Find all checked items: `- [x]` pattern
   - Calculate: total items, completed items, remaining items
   - Display progress overview

10. **Execute plan checkboxes**:
    - For each unchecked item (`- [ ]`) in order:
      a. Display: "[{n}/{total}] {checkbox description}"
      b. Execute the implementation step described
      c. Mark checkbox as complete: change `- [ ]` to `- [x]`
      d. Write updated plan file immediately (enables resume)
      e. Report: "Done"
    - If any step fails:
      - Stop execution
      - Report which step failed and why
      - Progress is saved (can resume later with same command)
      - Suggest: "Use /kanban-save to save progress"

11. **On completion**:
    - After ALL checkboxes complete:
      - Keep status as `in-progress` (verification will move it)
      - Update `updated: {YYYY-MM-DD}`
      - Write updated task file
    - If some checkboxes remain:
      - Keep status as `in-progress`
      - Report: "Partial progress: {completed}/{total} items"
      - Suggest: "Use /kanban-save to save progress"

12. **Report completion**:
    - Display implementation summary
    - Show files modified (uncommitted)
    - Show status
    - **REQUIRED OUTPUT** - Print next steps EXACTLY like this:
      ```
      Next:
      /clear
      /kanban-verify {id}
      ```
    - Do NOT skip this output. The user needs these commands to continue.

## Validation

**STOP. You MUST verify ALL items pass before declaring success. Do not skip validation.**

All must pass. If any fail, fix and retry.

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Task frontmatter contains `status: in-progress`
- [ ] Plan file exists at `.kanban/plans/{id}-{slug}.plan.md`
- [ ] All plan checkboxes are marked complete (`- [x]`)

## Arguments

- `$ARGUMENTS` - Task ID (e.g., "001")

## Example: Full Implementation

User: `/kanban-implement 001`

```
Implementing task 001 "Add user auth"...

Task 001 moved to In Progress

Reading spec: .kanban/specs/001.spec.md
Reading plan: .kanban/plans/001.plan.md
Progress: 0/3 items

[1/3] Create auth routes file `src/routes/auth.ts` (FR1)
  Creating src/routes/auth.ts...
  Done

[2/3] Add login endpoint `src/routes/auth.ts` (FR1)
  Adding POST /login handler...
  Done

[3/3] Add logout endpoint `src/routes/auth.ts` (FR2)
  Adding POST /logout handler...
  Done

Implementation complete!
All 3 plan items executed.

Task 001 ready for verification
- Status: in-progress
- Files modified: 3 (uncommitted)

Next:
/clear
/kanban-verify 001
```

## Example: Resume Partial Implementation

User: `/kanban-implement 002`

```
Implementing task 002 "Setup database"...

Column: in-progress (resuming)

Reading spec: .kanban/specs/002.spec.md
Reading plan: .kanban/plans/002.plan.md
Progress: 2/5 items (resuming from item 3)

[3/5] Create migration script `db/migrations/001_initial.sql` (FR2)
  Creating db/migrations/001_initial.sql...
  Done

[4/5] Add seed data `db/seeds/dev.sql` (FR3)
  Creating db/seeds/dev.sql...
  Done

[5/5] Update README with DB setup (FR4)
  Adding database section to README.md...
  Done

Implementation complete!
All 5 plan items executed (3 this session).

Task 002 ready for verification
- Status: in-progress
- Files modified: 5 (uncommitted)

Next:
/clear
/kanban-verify 002
```

## Next Steps

If interrupted:
```
/clear
/kanban-save {id}
```

When implementation complete:
```
/clear
/kanban-verify {id}
```
