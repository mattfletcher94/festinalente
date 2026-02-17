---
task: "004"
created: 2026-02-17
updated: 2026-02-17
---

# Functional Specification: Adding a new task doesn't refresh the task list

## Context

When users create a task via the GUI using `/kanban-create`, the task list does not refresh automatically. The terminal command completes successfully, but the new task doesn't appear until the user manually refreshes. This happens because the `onExit` handler in `TerminalPanel.vue` calls `refreshSelectedTask()` which exits early when no task is selected—which is always the case after creating a new task.

## Scope

### In Scope
- Refreshing the task list after any terminal command completes
- Ensuring newly created tasks appear immediately

### Out of Scope
- Smart/selective refresh based on command type (deferred for simplicity)
- Error notifications to user (keep current silent fail behavior)
- Refresh behavior for edit/delete operations (covered by this fix but not specifically scoped)

## Functional Requirements

- FR1: The system shall reload the full task list when any terminal command exits successfully
- FR2: The system shall display newly created tasks in their correct column position without manual refresh
- FR3: The system shall preserve the current error handling behavior (console log only, no user notification)

## Affected Files

- `apps/gui/src/components/TerminalPanel.vue` (modify) - Change `refreshSelectedTask()` to `loadTasks()` in onExit handler

## Existing Patterns

- **Pattern:** Task loading with ShallowRef + triggerRef for reactivity
  - Reference: `apps/gui/src/tasks/tasks.orchestrator.ts:101-111`
- **Pattern:** Injecting tasks orchestrator in components
  - Reference: `apps/gui/src/components/TerminalPanel.vue:14`

## Technical Constraints

- Must follow Vue Integration directive (thin components, logic in orchestrators)
- Must use existing `loadTasks()` method from tasks orchestrator (no new methods needed)
- Cannot add toast/notification without adding UI dependency (keep silent fail)

## Dependencies

### External
- None

### Internal
- None

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Full reload on every command may be slower than selective refresh | Low | Task list is small; `loadTasks()` is already optimized with ShallowRef |
| Selected task reference may become stale after reload | Low | The fix only affects the task list; selected task handling unchanged |

## Open Questions

- None
