---
# Valid values defined in .claude/kanban-workflow.yaml
id: "{id}"
title: "{title}"
status: "{status}"
priority: "{priority}"
labels: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
completed: YYYY-MM-DD
spec: "tasks/{id}/spec.md"
plan: "tasks/{id}/plan.md"
affects: []
---

# {Title}

## Description
{Brief description of the task}

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
{Technical notes, constraints, additional context}
