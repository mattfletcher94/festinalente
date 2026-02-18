---
task: "005"
spec: "tasks/005/spec.md"
status: approved
created: 2026-02-18
generated_by: claude
model: claude-opus-4-5-20251101
version: 1
iteration: 1
complexity: simple
---

# Plan: kanban-merge skill doesn't consistently update task status before merging

## Overview

Reorder the kanban-merge skill's steps so the status update to "done" happens BEFORE the merge operation, not after. This matches the pattern used in kanban-approve and kanban-docs where status changes are committed while still on the task branch, ensuring the status change is included in the merge and cannot be skipped if the LLM gets distracted by edge cases.

See full specification: tasks/005/spec.md

## Technical Approach

Following the established pattern from kanban-approve (lines 185-190) where status is updated "Before commit so status is included". The current kanban-merge skill has the status update as the final step after branch deletion, which allows it to be skipped when edge cases distract the LLM.

The fix reorders:
1. **Current order:** merge -> cleanup branch -> update status -> commit
2. **New order:** update status -> commit (on task branch) -> merge (includes done commit) -> cleanup branch

This ensures the done commit is part of the task branch history that gets merged.

## Implementation Steps

- [x] Step 1: Move `move_to_done_and_commit` step before `merge_branch` step `.claude/skills/kanban-merge/SKILL.md` (FR1, FR2)
- [x] Step 2: Update the step to execute while still on task branch, with note explaining why `.claude/skills/kanban-merge/SKILL.md` (FR2)
- [x] Step 3: Rename step to `move_to_done_and_commit_on_branch` for clarity `.claude/skills/kanban-merge/SKILL.md`
- [x] Step 4: Verify merge_branch step remains unchanged (FR3, FR5) `.claude/skills/kanban-merge/SKILL.md`
- [x] Step 5: Verify cleanup_branch step remains unchanged (FR4) `.claude/skills/kanban-merge/SKILL.md`
- [x] Step 6: Manual verification - read through the updated skill to confirm step order is correct

## Testing Strategy

- **Automated:** None required (skill definition files, not executable code)
- **Manual:**
  - Read through the updated SKILL.md to verify step order: status update -> merge -> cleanup
  - Verify the note matches kanban-approve pattern: "Before merge so status is included"
  - Future: Run through a complete task lifecycle to verify behavior
- **Regression:** Verify merge command format unchanged, branch deletion still happens

## Edge Cases

- Merge conflict during merge — not affected by this change, handled by existing process
- Working tree dirty before merge — still caught by existing verify_ready_to_merge step
- User cancels at confirmation prompt — status won't be updated since we haven't reached that step yet

## Potential Pitfalls

- Step renaming must be consistent — ensure the step name change doesn't break any references (none exist, skills are self-contained)
- Note wording should match established pattern — use "Before merge so status is included" similar to kanban-approve's "Before commit so status is included"
