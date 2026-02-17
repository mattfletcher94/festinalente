---
id: "004"
title: "Adding a new task doesn't refresh the task list"
status: "refined"
priority: "high"
labels: [bug]
created: 2026-02-17
updated: 2026-02-17
completed:
spec: "tasks/004/spec.md"
plan: "tasks/004/plan.md"
affects: [gui/task-list-refresh]
engineering: []
---

# Adding a new task doesn't refresh the task list

## Description
When a new task is added via the GUI, the task list does not automatically refresh to show the newly created task. Users must manually refresh to see the new task appear.

## What problem are you trying to solve?
When users create a task via the GUI, the task list doesn't refresh automatically. This causes both confusion (users don't know if the task was actually created) and inconvenience (users must manually refresh to see their new task). The lack of immediate feedback creates a poor user experience and undermines confidence in the application.

## What value would it provide if solved?
Users will have immediate visual confirmation that their task was created successfully. This improves confidence in the application, eliminates the manual refresh step, and creates a smoother workflow. Users can trust that what they see reflects the current state.

## Acceptance Criteria

<!-- Use Gherkin format (Given/When/Then) -->

Given a user is viewing the task list in the GUI
When they create a new task
And the backend confirms the task was saved successfully
Then the task list automatically refreshes
And the new task appears in its natural position in the list

Given a user is viewing the task list in the GUI
When they create a new task
And the backend returns an error
Then the task list does not refresh
And an appropriate error message is displayed

## Notes
- Refresh should occur only after backend confirmation (not optimistic update)
- No special highlighting or auto-scrolling to the new task required
- Scope limited to create action only (edit/delete refresh is out of scope for this task)
