---
id: "005"
title: "kanban-merge skill doesn't consistently update task status before merging"
status: "backlog"
priority: "high"
labels: [bug]
created: 2026-02-18
updated: 2026-02-18
completed:
spec: "tasks/005/spec.md"
plan: "tasks/005/plan.md"
affects: [cli/task-workflow]
engineering: []
---

# kanban-merge skill doesn't consistently update task status before merging

## Description
The kanban-merge skill in /apps/kanban/src/content/skills doesn't update the task status before finishing/merging. This behavior appears to be inconsistent - sometimes the status is updated, sometimes it is not. The skill needs to be refined to ensure task status is always properly updated before completing the merge operation.

## What problem are you trying to solve?
{Filled during refine phase via Q&A - user may skip or have LLM fill in}

## What value would it provide if solved?
{Filled during refine phase via Q&A - user may skip or have LLM fill in}

## Acceptance Criteria

<!-- Use Gherkin format (Given/When/Then) -->

Given {precondition}
When {action}
Then {expected outcome}
And {additional outcome}

## Notes
- Location: /apps/kanban/src/content/skills (kanban-merge skill)
- Issue appears intermittent/inconsistent
