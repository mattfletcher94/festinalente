---
task: "010"
spec: "tasks/010/spec.md"
status: approved
created: 2026-02-18
generated_by: claude
model: claude-opus-4-5-20251101
version: 1
iteration: 1
complexity: medium
---

# Plan: Autoplay mode: automatically run next command when current finishes

## Overview

Implement autoplay by adding per-task state in the tasks orchestrator (`Ref<Record<TaskId, boolean>>`) and a `handleCommandComplete` method in the app orchestrator that checks autoplay state, determines if the current phase is a review phase, and auto-runs the next action. The terminal exit handler calls this coordination method. The TaskDetail component adds a Switch in the "Next Up" header.

See full specification: tasks/010/spec.md

## Technical Approach

Following existing patterns:
- **State in orchestrator:** Reactive state with `ref<T>()` at `tasks.orchestrator.ts:77-80`
- **Coordination pattern:** App orchestrator coordinates between tasks and terminal at `app.orchestrator.ts:89-95`
- **Terminal exit handling:** `onExit` callback at `TerminalPanel.vue:65-81`
- **Action computation:** `getActions` returns available actions at `task-actions.computer.ts:61-179`

The autoplay state is session-only (not persisted) because it's a `ref` without any storage backing. Review phases are identified by their status values (`codecheck`, `qa`, `pr`) - same phases that have Approve/Rework options.

## Implementation Steps

### Step 1: Add autoplay state to tasks orchestrator
**Files:** `apps/gui/src/tasks/tasks.orchestrator.ts`
**Requirements:** FR2, FR5
**Pattern:** Reactive state at `tasks.orchestrator.ts:77-80`

- [ ] Add `autoplayEnabled: Ref<Record<TaskId, boolean>>` to state section
- [ ] Add `setAutoplay(taskId: TaskId, enabled: boolean): void` action
- [ ] Add `isAutoplayEnabled(taskId: TaskId): boolean` helper (computed from Record)
- [ ] Export in return object and interface

**Verify:** TypeScript compiles, new state accessible from components

### Step 2: Add handleCommandComplete to app orchestrator
**Files:** `apps/gui/src/app/app.orchestrator.ts`
**Requirements:** FR3, FR4, FR6
**Pattern:** Coordination at `app.orchestrator.ts:89-95`

- [ ] Add `handleCommandComplete(exitCode: number): void` method
- [ ] Check exit code is 0 (success) before proceeding
- [ ] Get selected task from tasks orchestrator
- [ ] Check if autoplay is enabled for this task via `tasks.isAutoplayEnabled(taskId)`
- [ ] Check if current status is a review phase (`codecheck`, `qa`, `pr`) - if so, return early
- [ ] Get first action from `tasks.actionsComputer.getActions(task)`
- [ ] If action exists, call `runCommand(action.command)`
- [ ] Export in return object and interface

**Verify:** Method signature correct, logic handles all branches

### Step 3: Wire terminal exit to handleCommandComplete
**Files:** `apps/gui/src/components/TerminalPanel.vue`
**Requirements:** FR3
**Pattern:** Exit handling at `TerminalPanel.vue:65-81`

- [ ] Import `injectApp` (already imported via `injectSettings`)
- [ ] In `terminal.onExit` callback, after refresh, call `app.handleCommandComplete(exitCode)`
- [ ] Pass exit code from the `onExit` callback parameter

**Verify:** Autoplay triggers after successful command completion

### Step 4: Add Switch UI in TaskDetail
**Files:** `apps/gui/src/components/TaskDetail.vue`
**Requirements:** FR1
**Pattern:** Component uses `injectTasks()` at line 8

- [ ] Import `Switch` from `./ui/switch`
- [ ] Import `Label` from `./ui/label` for accessibility
- [ ] In "Next Up" section header (line 138-140), add flex container with label + Switch
- [ ] Bind Switch to `tasks.isAutoplayEnabled(tasks.selectedTaskId.value)` computed
- [ ] On `update:checked`, call `tasks.setAutoplay(tasks.selectedTaskId.value, $event)`
- [ ] Only show when `actions.length > 0` (already in v-if)

**Verify:** Toggle visible in UI, state updates on click

### Step 5: Final verification
- [ ] All acceptance criteria from task met
- [ ] Autoplay enabled → next command runs after current completes
- [ ] Autoplay stops at codecheck, qa, pr phases
- [ ] State is session-only (resets on reload)
- [ ] Toggle not visible during kanban-create (no actions available)
- [ ] No regressions in existing task/terminal functionality

## Testing Strategy

- **Automated:** None required (UI state management, manual verification sufficient)
- **Manual:**
  - Enable autoplay, run a command, verify next command runs automatically
  - Enable autoplay, reach a review phase (qa), verify autoplay stops
  - Disable autoplay mid-workflow, verify manual intervention required
  - Refresh page, verify autoplay state resets
  - During kanban-create, verify no autoplay toggle visible
- **Regression:** Verify existing Run buttons still work, terminal exit still refreshes task

## Edge Cases

- Command fails (exit code !== 0) — do not auto-run next command, leave autoplay enabled for retry
- No next action available — do nothing, autoplay remains enabled for future phases
- Task changes during command execution — selectedTask may differ; use currentTaskId from terminal

## Potential Pitfalls

- Race condition with task refresh — `handleCommandComplete` must wait for `refreshSelectedTask` to complete before getting actions; call it sequentially after refresh
- Stale task ID — use `terminal.currentTaskId` rather than `tasks.selectedTaskId` since user may have clicked another task while command ran
