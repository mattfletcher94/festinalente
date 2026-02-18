---
id: "007"
title: "Middle panel does not refresh when a process completes"
status: "done"
priority: "high"
labels: [bug]
created: 2026-02-18
updated: 2026-02-18
completed: 2026-02-18
spec: "tasks/007/spec.md"
plan: "tasks/007/plan.md"
affects: [gui/panel-refresh]
engineering: []
---

# Middle panel does not refresh when a process completes

## Description
After running a process like 'implement', the middle panel's "Next up" actions don't automatically refresh to show the updated state (e.g., 'Run checks'). The user has to manually navigate away to another task and back to see the correct actions.

## What problem are you trying to solve?
The middle panel showing "Next up" actions doesn't automatically update when a status-changing process completes. Users must manually navigate away from the task and back to see the correct next actions, which is confusing and disrupts workflow.

## What value would it provide if solved?
Smoother user experience where users immediately see the relevant next actions after completing any process. This reduces confusion, eliminates unnecessary navigation steps, and keeps users in flow.

## Acceptance Criteria

Given a user is viewing a task in the middle panel
When any status-changing action completes (implement, scope, plan, checks, etc.)
Then the middle panel's "Next up" actions refresh in-place immediately
And the panel reflects the new task state without page reload

Given a user runs the 'implement' action
When the implementation completes successfully
Then the "Next up" section immediately shows "Run checks" (or the appropriate next action)
And no manual navigation is required

Given a user is on a task
When a process fails or is cancelled
Then the panel state remains consistent with the actual task status

## Notes
Example: After running implement, the next up actions didn't auto refresh to 'Run checks'. User has to open another task and then go back to that one.
