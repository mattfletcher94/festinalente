---
id: "012"
title: "Delete a task skill: kanban-delete"
status: "done"
priority: "medium"
labels: [feature]
created: 2026-02-18
updated: 2026-02-18
plan: "tasks/012/plan.md"
completed: 2026-02-18
spec: "tasks/012/spec.md"
affects: [cli/kanban-delete]
engineering: []
---

# Delete a task skill: kanban-delete

## Description
Create a new kanban skill that allows users to delete tasks from the kanban board.

## What problem are you trying to solve?
There is no way to remove tasks that were created by mistake or are no longer relevant. Tasks accumulate in the Backlog and Refined columns with no cleanup mechanism, cluttering the board and making it harder to focus on active work.

## What value would it provide if solved?
Keeps the kanban board clean and focused on relevant work. Allows users to quickly correct mistakes (accidental task creation, wrong info) and remove obsolete tasks without abandoned items cluttering the system.

## Acceptance Criteria

Given a task exists in Backlog or Refined status
And the user is on the main branch
When the user runs `/kanban-delete {taskId}`
Then the task details are displayed
And the user is prompted to confirm deletion

Given the user confirms deletion
When the deletion proceeds
Then the task folder and all files (task.md, spec.md, plan.md) are permanently removed
And a git commit is created with message "docs({taskId}): delete - {title}"
And a success message is displayed

Given a task exists in any status other than Backlog or Refined
When the user runs `/kanban-delete {taskId}`
Then an error message is displayed explaining deletion is only allowed for Backlog/Refined tasks
And no files are modified

Given the user is not on the main branch
When the user runs `/kanban-delete {taskId}`
Then an error message is displayed explaining the command must be run on main
And no files are modified

Given the user is prompted to confirm deletion
When the user declines/cancels
Then no files are modified
And a cancellation message is displayed

## Notes

