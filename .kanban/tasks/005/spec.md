---
task: "005"
created: 2026-02-18
updated: 2026-02-18
---

# Functional Specification: kanban-merge skill doesn't consistently update task status before merging

## Context
The kanban-merge skill updates task status to "done" as the final step, after the merge and branch cleanup. When the LLM encounters edge cases during merge/cleanup (uncommitted changes, merge conflicts, stashing), it can complete those operations but get distracted and skip the status update. This leaves tasks with "pr" status despite being merged.

Other skills (kanban-approve, kanban-docs) follow a pattern of updating status BEFORE critical operations, ensuring the status change is included in the commit and cannot be skipped.

## Scope

### In Scope
- Reordering kanban-merge steps so status update happens before merge
- Updating the commit sequence to match the new order
- Adding clarifying comments consistent with other skills

### Out of Scope
- Adding new validation or checkpoint logic
- Changing the merge strategy or branch cleanup behavior
- Modifying other skills

## Functional Requirements

- FR1: The skill shall update task status to `done` BEFORE the merge operation
- FR2: The skill shall commit the status change with `docs({taskId}): done - {title}` while still on the task branch
- FR3: The skill shall then merge the task branch (which now includes the done commit) into main
- FR4: The skill shall delete the task branch after successful merge
- FR5: The merge commit message shall remain `Merge branch 'task/{taskId}'`

## Affected Files
- `.claude/skills/kanban-merge/SKILL.md` (modify) - Reorder steps to update status before merge

## Existing Patterns

- **Pattern:** Status update before commit with explanatory note
  - Reference: `.claude/skills/kanban-approve/SKILL.md:185-190`
  - Code: `<note>Before commit so status is included</note>`

- **Pattern:** Status update followed by task file write, then commit
  - Reference: `.claude/skills/kanban-docs/SKILL.md:285-311`

## Technical Constraints
- Must maintain the same git history structure (merge commit + done commit visible in history)
- The done commit will now appear in the task branch before merge, rather than on main after merge
- Must not change the prohibited section behaviors

## Dependencies

### External
- None

### Internal
- None

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Done commit on task branch changes git history appearance | Low | History still shows done commit, just in different position |

## Open Questions

- [x] Should status update happen before or after merge? → Before (consistent with other skills)
