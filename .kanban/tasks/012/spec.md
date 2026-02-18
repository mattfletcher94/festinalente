---
task: "012"
created: 2026-02-18
updated: 2026-02-18
---

# Functional Specification: Delete a task skill: kanban-delete

## Context

There is no way to remove tasks that were created by mistake or are no longer relevant. Tasks accumulate in the Backlog and Refined columns with no cleanup mechanism, cluttering the board and making it harder to focus on active work.

This skill allows users to permanently delete tasks from Backlog or Refined status, keeping the kanban board clean and focused.

## Scope

### In Scope
- Delete tasks in `backlog` or `refined` status only
- Require user confirmation before deletion
- Remove entire task folder (task.md, spec.md, plan.md if they exist)
- Create git commit documenting the deletion
- Branch validation (must be on main)

### Out of Scope
- Deleting tasks in other statuses (scoped, planned, in-progress, etc.)
- Soft delete / archive functionality
- Undo capability
- Batch deletion of multiple tasks

## Functional Requirements

- FR1: The system shall verify the user is on the main branch before proceeding
- FR2: The system shall accept a task ID as an argument or prompt for selection from eligible tasks
- FR3: The system shall validate the task exists and is in `backlog` or `refined` status
- FR4: The system shall display task details (ID, title, status, description excerpt) before deletion
- FR5: The system shall require explicit user confirmation before deleting
- FR6: The system shall remove the entire task folder `.kanban/tasks/{id}/` including all files
- FR7: The system shall create a git commit with format `docs({id}): delete - {title}`
- FR8: The system shall display a success message with the commit hash after deletion
- FR9: The system shall display an error and exit without changes if the task is not in backlog/refined status

## Affected Files

- `apps/kanban/src/scripts/delete-task.ts` (create) - Script to validate and delete task folder
- `apps/kanban/src/content/skills/kanban-delete/SKILL.md` (create) - Skill definition
- `apps/kanban/src/content/kanban-workflow.yaml` (modify) - Add delete commit format

## Existing Patterns

- **Script pattern:** JSON output with error handling, gray-matter for frontmatter
  - Reference: `apps/kanban/src/scripts/find-task.ts`

- **Skill structure:** YAML frontmatter with allowed-tools, process steps, AskUserQuestion for user input
  - Reference: `apps/kanban/src/content/skills/kanban-create/SKILL.md`
  - Reference: `apps/kanban/src/content/skills/kanban-refine/SKILL.md`

- **Branch verification:** Check current branch before operations
  - Reference: `apps/kanban/src/content/partials/branch-verify-main.md`

- **Confirmation pattern:** AskUserQuestion with Yes/No options
  - Reference: `apps/kanban/src/content/skills/kanban-refine/SKILL.md:117-125`

## Technical Constraints

- Must use existing helper scripts pattern (find-task.cjs for lookup)
- Script must return JSON for consistent parsing
- Skill must follow existing kanban skill conventions
- Git operations must use allowed Bash patterns from other skills

## Dependencies

### External
- gray-matter (already in use)
- Node.js fs module (already in use)

### Internal
- `find-task.cjs` - Used to look up task before deletion
- `list-tasks.cjs` - Used to list eligible tasks when no ID provided

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Accidental deletion of important task | High | Require explicit confirmation, show task details before delete |
| Deletion of in-progress work | High | Status validation (only backlog/refined allowed) |
| Orphaned references to deleted task | Low | Tasks in early stages rarely have external references |

## Open Questions

- [x] Should delete be added to workflow.yaml commits section? **Yes**
- [x] Should a separate delete script be created? **Yes - delete-task.ts**
- [x] Where should skill source be added? **apps/kanban/src/content/skills/kanban-delete/**
