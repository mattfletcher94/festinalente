---
task: "006"
spec: "tasks/006/spec.md"
status: approved
created: 2026-02-18
generated_by: claude
model: claude-opus-4-5-20251101
version: 1
iteration: 1
complexity: medium
---

# Plan: Ask for task description first before other questions in kanban-create

## Overview

Reorder steps in the kanban-create skill so the task title is obtained BEFORE doc searches execute. Split the existing `get_task_details` step into two separate steps: `get_task_title` (asks for title only) and `get_priority` (asks for priority after doc searches). This ensures users always describe their task first before being asked configuration questions.

See full specification: tasks/006/spec.md

## Technical Approach

Following the task-first pattern established in `kanban-refine/SKILL.md`: the refine skill reads the task (which contains the title) in `read_task_file` before searching docs in `analyze_initial_context`. We apply the same principle here—know the task before searching for related context.

The fix involves:
1. Creating a new `get_task_title` step that runs early (after `get_next_id`)
2. Moving `search_product_docs` and `search_engineering_docs` after `get_task_title`
3. Creating a new `get_priority` step after doc searches
4. Updating step naming to follow the `get_X` convention

## Implementation Steps

### Step 1: Create `get_task_title` step
**Files:** `apps/kanban/src/content/skills/kanban-create/SKILL.md`
**Requirements:** FR1, FR2, FR5
**Pattern:** Step naming convention `get_X` for input collection

- [x] Create new `get_task_title` step after `get_next_id` (around line 61)
- [x] Add `outputs="title, slug"` to the step
- [x] Copy the title-handling logic from existing `get_task_details` (lines 113-120)
- [x] Branch on `$ARGUMENTS provided` vs not provided
- [x] Include title best practices check and slug generation

**Verify:** New step compiles without syntax errors, outputs `title` variable

### Step 2: Reposition doc search steps
**Files:** `apps/kanban/src/content/skills/kanban-create/SKILL.md`
**Requirements:** FR3, FR4

- [x] Move `search_product_docs` step (lines 62-89) to after `get_task_title`
- [x] Move `search_engineering_docs` step (lines 91-110) to after `search_product_docs`
- [x] Update the keyword extraction comment to reference "the established title" not "the task title"
- [x] Verify step references `title` variable from previous step

**Verify:** Doc search steps now appear after `get_task_title` in the file

### Step 3: Create `get_priority` step
**Files:** `apps/kanban/src/content/skills/kanban-create/SKILL.md`
**Requirements:** FR4, FR6

- [x] Create new `get_priority` step after `search_engineering_docs`
- [x] Add `outputs="priority"` to the step
- [x] Move the priority AskUserQuestion logic from old `get_task_details` (lines 122-130)
- [x] Keep the same question format (High/Medium/Low options)

**Verify:** Priority question now appears after doc searches

### Step 4: Remove old `get_task_details` step
**Files:** `apps/kanban/src/content/skills/kanban-create/SKILL.md`
**Requirements:** FR1, FR4, FR5, FR6

- [x] Delete the entire old `get_task_details` step (lines 112-131)
- [x] Verify no dangling references to `get_task_details` in other steps
- [x] Verify `create_task_file` step still references correct variables (title, priority from new steps)

**Verify:** No duplicate title or priority prompts, file parses correctly

### Step 5: Final verification
- [x] Step order is: `get_next_id` → `get_task_title` → `search_product_docs` → `search_engineering_docs` → `get_priority` → `determine_label` → `create_task_file` → `commit`
- [x] `/kanban-create` without argument asks title first
- [x] `/kanban-create "Fix bug"` accepts title silently
- [x] Question order matches spec: title → doc search → priority → label
- [x] No regressions in task file creation or commit

## Testing Strategy

- **Automated:** None required (skill file is declarative markdown, not executable code)
- **Manual:**
  - Run `/kanban-create` without arguments, verify title question appears first
  - Run `/kanban-create "Test task"`, verify title accepted without prompt
  - Complete full flow, verify question order: title → domain (if needed) → priority → label
  - Verify created task file has correct frontmatter
- **Regression:** Verify existing `/kanban-create "title"` flow still works (title from argument, then priority, then label)

## Edge Cases

- User runs `/kanban-create` with empty string argument ("") — treat as no argument, ask for title
- Product docs directory doesn't exist — skip doc search step, proceed to priority (existing behavior preserved)
- User provides very short title — best practices check suggests improvement (existing behavior preserved)

## Potential Pitfalls

- Step variable dependencies — `get_task_title` must output `title` before `search_product_docs` uses it; verify `outputs` attribute is correct
- Line number drift — spec references specific line numbers that will shift during editing; use step names and content patterns to locate code instead of relying on exact line numbers
