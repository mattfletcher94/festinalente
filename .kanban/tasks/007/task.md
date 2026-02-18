---
id: "007"
title: "Middle panel does not refresh when a process completes"
status: "backlog"
priority: "high"
labels: [bug]
created: 2026-02-18
updated: 2026-02-18
completed:
spec: "tasks/007/spec.md"
plan: "tasks/007/plan.md"
affects: [gui/panel-refresh]
engineering: []
---

# Middle panel does not refresh when a process completes

## Description
After running a process like 'implement', the middle panel's "Next up" actions don't automatically refresh to show the updated state (e.g., 'Run checks'). The user has to manually navigate away to another task and back to see the correct actions.

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
Example: After running implement, the next up actions didn't auto refresh to 'Run checks'. User has to open another task and then go back to that one.
