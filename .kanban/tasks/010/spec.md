---
task: "010"
created: 2026-02-18
updated: 2026-02-18
---

# Functional Specification: Autoplay mode: automatically run next command when current finishes

## Context

Currently, users must manually click "Run" for each kanban phase (refine, scope, plan, implement, etc.). This is tedious and breaks focus when a user wants to let a task progress through multiple phases while they work on other things.

This feature adds an autoplay toggle that automatically runs the next phase command when the current one completes, stopping only at review phases that require human judgment.

## Scope

### In Scope
- Autoplay toggle UI in task detail pane
- Per-task autoplay state (session-only)
- Automatic execution of next phase command on completion
- Stopping at review phases (codecheck, qa, pr)

### Out of Scope
- Persisting autoplay state across sessions
- Autoplay during task creation (kanban-create)
- Countdown or delay before auto-running
- Autoplay for multiple tasks simultaneously

## Functional Requirements

- FR1: The system shall display an autoplay toggle (Switch component) in the "Next Up" section header when a task is selected and has available actions
- FR2: The system shall maintain autoplay state per-task within the session (switching tasks preserves each task's autoplay setting)
- FR3: The system shall automatically execute the next phase command when the current command completes successfully and autoplay is enabled
- FR4: The system shall stop autoplay and wait for manual action when reaching review phases: `codecheck`, `qa`, or `pr`
- FR5: The system shall reset all autoplay state when the application closes (session-only, not persisted)
- FR6: The system shall use the first available action from `actionsComputer.getActions()` when auto-running the next command

## Affected Files

- `apps/gui/src/tasks/tasks.orchestrator.ts` (modify) - Add autoplay state and actions
- `apps/gui/src/app/app.orchestrator.ts` (modify) - Add handleCommandComplete coordination method
- `apps/gui/src/components/TaskDetail.vue` (modify) - Add Switch UI in "Next Up" header
- `apps/gui/src/components/TerminalPanel.vue` (modify) - Call handleCommandComplete on exit
- `apps/gui/src/components/ui/switch/` (create) - Install shadcn-vue Switch component

## Existing Patterns

- **Orchestrator state pattern:** Reactive state with `ref<T>()` and exposed actions
  - Reference: `apps/gui/src/tasks/tasks.orchestrator.ts:77-80`
- **Coordination pattern:** App orchestrator coordinates between tasks, terminal, settings
  - Reference: `apps/gui/src/app/app.orchestrator.ts:89-95`
- **Terminal exit handling:** onExit callback triggers task refresh
  - Reference: `apps/gui/src/components/TerminalPanel.vue:65-81`
- **Action computation:** getActions returns available actions for a task status
  - Reference: `apps/gui/src/tasks/task-actions.computer.ts:61-179`

## Technical Constraints

- Must follow acyclic architecture: state in orchestrator, coordination in app orchestrator, thin components
- Must use shadcn-vue Switch component (install via CLI, not manually)
- Review phases are defined by having Approve/Rework options: `codecheck`, `qa`, `pr`
- Autoplay state type: `Ref<Record<TaskId, boolean>>`

## Dependencies

### External
- shadcn-vue Switch component (`npx shadcn-vue@latest add switch`)

### Internal
- None

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Command fails but autoplay continues | Medium | Only auto-run on successful exit (exit code 0) |
| User accidentally enables autoplay | Low | Toggle is explicit, easily disabled |

## Open Questions

- None
