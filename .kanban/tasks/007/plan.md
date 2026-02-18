---
task: "007"
spec: "tasks/007/spec.md"
status: approved
created: 2026-02-18
generated_by: claude
model: claude-opus-4-5-20251101
version: 1
iteration: 1
complexity: simple
---

# Plan: Middle panel does not refresh when a process completes

## Overview

Replace `loadTasks()` with `refreshSelectedTask()` in the terminal's `onExit` handler. The `refreshSelectedTask` method already exists in the tasks orchestrator and correctly reloads tasks, updates `selectedTask.value` to the new object reference, and reloads task content. This single-line change fixes the stale reference issue causing the "Next up" actions to not update.

See full specification: tasks/007/spec.md

## Technical Approach

The root cause is that `onExit` calls `loadTasks()` which updates the tasks array, but `selectedTask` still holds a reference to the old task object. The `actions` computed property in `TaskDetail.vue` derives from `selectedTask.value.status`, so actions don't update.

Following the existing pattern at `tasks.orchestrator.ts:157-169`, `refreshSelectedTask`:
1. Reloads all tasks via `loadTasks()`
2. Finds the updated task by ID
3. Updates `selectedTask.value` to the new object reference
4. Reloads task content (task.md, spec.md, plan.md)

This is a targeted fix - no new patterns or abstractions needed.

## Implementation Steps

- [x] Step 1: Change `loadTasks` to `refreshSelectedTask` in `onExit` handler `apps/gui/src/components/TerminalPanel.vue:75` (FR1, FR2, FR3)
- [x] Step 2: Wrap call in try/catch for error resilience `apps/gui/src/components/TerminalPanel.vue:72-77` (FR4)
- [x] Step 3: Verify: Run implement command, confirm "Next up" shows correct actions without navigation

## Testing Strategy

- **Automated:** None required (UI coordination, manual verification sufficient)
- **Manual:**
  - Run `/kanban-implement` on a task, verify "Next up" shows "Run checks" immediately after completion
  - Run `/kanban-scope` on a task, verify "Next up" updates to "Create plan" immediately
  - Cancel a running process (Ctrl+C), verify panel remains consistent with actual task status
- **Regression:** Verify terminal clear behavior still works after 1.5s delay

## Edge Cases

- Task deleted during process execution - `refreshSelectedTask` returns early if `selectedTask.value` is null, UI shows no task selected
- Project path becomes invalid - try/catch logs error, UI remains functional with stale data
- Multiple rapid process completions - each completion calls refresh, final state will be correct

## Potential Pitfalls

- None significant - this is a straightforward method substitution using an existing, tested pattern
