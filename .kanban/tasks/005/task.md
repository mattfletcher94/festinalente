---
id: "005"
title: "kanban-merge skill doesn't consistently update task status before merging"
status: "done"
priority: "high"
labels: [bug]
created: 2026-02-18
updated: 2026-02-18
completed: 2026-02-18
spec: "tasks/005/spec.md"
plan: "tasks/005/plan.md"
affects: [cli/task-workflow]
engineering: []
---

# kanban-merge skill doesn't consistently update task status before merging

## Description
The kanban-merge skill in /apps/kanban/src/content/skills doesn't update the task status before finishing/merging. This behavior appears to be inconsistent - sometimes the status is updated, sometimes it is not. The skill needs to be refined to ensure task status is always properly updated before completing the merge operation.

## What problem are you trying to solve?
The kanban-merge skill doesn't consistently update task status to "done" before merging. When the LLM encounters unexpected situations during the merge process (such as uncommitted changes in unrelated files that require stashing), it can get distracted handling the edge case and skip the status update step. The merge and "done" commit still complete, but the task.md file retains "pr" status instead of "done". This breaks workflow consistency since the task's recorded status doesn't match its actual state.

## What value would it provide if solved?
Ensures workflow consistency - tasks will always reflect their true state regardless of edge cases encountered during the merge process. Users can trust that a merged task will show "done" status, maintaining the integrity of the kanban board and git history.

## Acceptance Criteria

Given a task in "pr" status
When the kanban-merge skill is invoked
Then the task status must be updated to "done" before the merge commit is created

Given a task in "pr" status
And there are uncommitted changes in unrelated files
When the kanban-merge skill handles the edge case (e.g., stashing)
Then the task status must still be updated to "done" before merging
And the edge case handling must not skip the status update step

Given a task in "pr" status
When the status update to "done" fails for any reason
Then the merge must be blocked entirely
And the user must be informed of the failure

Given a successful merge
When the operation completes
Then the user must see confirmation that status changed to "done"
And the user must see confirmation that the branch was cleaned up

## Notes
- Location: /apps/kanban/src/content/skills (kanban-merge skill)
- Issue appears intermittent/inconsistent
- Root cause: LLM gets distracted by edge cases and skips status update step
