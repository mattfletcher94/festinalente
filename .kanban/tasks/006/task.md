---
id: "006"
title: "Ask for task description first before other questions in kanban-create"
status: "backlog"
priority: "medium"
labels: [feature]
created: 2026-02-18
updated: 2026-02-18
completed:
spec: "tasks/006/spec.md"
plan: "tasks/006/plan.md"
affects: [cli/kanban-create-ux]
engineering: []
---

# Ask for task description first before other questions in kanban-create

## Description
When running `/kanban-create` without a title argument, the skill should ask for a rough description/title FIRST before asking other questions (priority, label, domain, etc.). Currently, the LLM sometimes asks configuration questions before the user has described their task, forcing them to remember what they wanted while answering unrelated questions.

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
User observed that the correct behavior happened in this session (title was asked first), but wants to ensure this is consistently enforced in the skill definition.
