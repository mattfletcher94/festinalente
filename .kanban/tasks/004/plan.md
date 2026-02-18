---
task: "004"
spec: "tasks/004/spec.md"
status: approved
created: 2026-02-17
generated_by: claude
model: claude-opus-4-5-20251101
version: 1
iteration: 1
complexity: simple
---

# Plan: Adding a new task doesn't refresh the task list

## Overview

Replace `refreshSelectedTask()` with `loadTasks()` in the terminal's `onExit` handler to ensure the full task list reloads after any command completes. This is a one-line fix: the current code exits early when no task is selected (which is always the case after creating a new task), so changing to `loadTasks()` ensures newly created tasks appear immediately.

See full specification: tasks/004/spec.md

## Technical Approach

The fix follows the existing patterns in the codebase:

- **Task loading pattern:** `loadTasks()` at `apps/gui/src/tasks/tasks.orchestrator.ts:101-111` uses ShallowRef with `triggerRef()` for reactivity
- **Orchestrator injection:** `TerminalPanel.vue:14` already injects the tasks orchestrator via `injectTasks()`

The `loadTasks()` method is already optimized with ShallowRef, so calling it on every command exit has minimal performance impact. This approach was chosen over a "smart" selective refresh for simplicity—the task list is small enough that full reload is acceptable.

## Implementation Steps

- [x] Step 1: Change `refreshSelectedTask()` to `loadTasks()` in `apps/gui/src/components/TerminalPanel.vue:75` (FR1, FR2)
- [x] Step 2: Verify error handling remains unchanged (console.log only, no user notification) (FR3)
- [x] Step 3: Manual verification — create task via GUI, confirm it appears without refresh

## Testing Strategy

- **Automated:** None required — this is a trivial one-line change in UI coordination code
- **Manual:**
  - Create a new task via `/kanban-create` in the terminal
  - Verify the new task appears in the task list immediately after command completes
  - Verify no error notifications appear if backend fails (console only)
- **Regression:**
  - Verify existing task refresh behavior still works when a task IS selected
  - Verify task detail panel still loads content correctly for selected tasks

## Edge Cases

- No task selected after create — handled: `loadTasks()` doesn't require selection
- Backend error on task load — handled: existing try/catch logs to console, no change needed
- Multiple rapid command completions — handled: each `loadTasks()` call is idempotent

## Potential Pitfalls

- Calling wrong method — verify you're calling `loadTasks(projectPath)` not `refreshSelectedTask(projectPath)`
- Forgetting projectPath argument — method requires the path parameter
