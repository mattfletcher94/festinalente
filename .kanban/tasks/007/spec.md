---
task: "007"
created: 2026-02-18
updated: 2026-02-18
---

# Functional Specification: Middle panel does not refresh when a process completes

## Context

When a user runs a status-changing command (e.g., `/kanban-implement 007`), the terminal process completes and the task list reloads, but the middle panel's "Next up" actions don't update. The user must navigate away from the task and back to see the correct next actions.

The root cause: the `onExit` handler in `TerminalPanel.vue` calls `tasks.loadTasks()` which updates the task list, but `selectedTask` still holds a stale reference to the old task object with the old status. The `actions` computed property in `TaskDetail.vue` derives from `selectedTask.value.status`, so actions don't update.

## Scope

### In Scope
- Refreshing the selected task's data when a terminal process completes
- Updating the "Next up" actions to reflect the new task status

### Out of Scope
- Real-time updates from external file changes (git commits from CLI)
- Polling or file watching mechanisms
- Changes to how actions are computed

## Functional Requirements

- FR1: The system shall refresh the selected task's data when a terminal process exits
- FR2: The system shall update `selectedTask` to reference the newly loaded task object
- FR3: The system shall reload task content (task.md, spec.md, plan.md) after process exit
- FR4: The system shall log errors to console if refresh fails, without disrupting the UI

## Affected Files
- `apps/gui/src/components/TerminalPanel.vue` (modify) - Change `onExit` handler to call `refreshSelectedTask` instead of `loadTasks`

## Existing Patterns

- **Pattern:** `refreshSelectedTask` method already exists in tasks orchestrator
  - Reference: `apps/gui/src/tasks/tasks.orchestrator.ts:157-169`
  - Reloads tasks, finds updated selected task, updates `selectedTask.value`, reloads content

- **Pattern:** Component subscribes to terminal `onExit` for coordination
  - Reference: `apps/gui/src/components/TerminalPanel.vue:65-77`
  - Components can coordinate between injected orchestrators

## Technical Constraints
- Must use existing `refreshSelectedTask` method - no new methods needed
- Must not change the 1.5s delay for terminal clear (existing UX decision)
- Must follow Vue Integration directive - component remains thin wrapper

## Dependencies

### External
- None

### Internal
- None

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `refreshSelectedTask` could fail (API error, file read error) | Low | Wrap in try/catch, console.log error, UI remains functional with stale data |

## Open Questions

None - implementation path is clear.
