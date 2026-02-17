---
id: "002"
title: "Inconsistent keyboard navigation for Q&A prompts in kanban skills"
status: "backlog"
priority: "high"
labels: [bug]
created: 2026-02-17
updated: 2026-02-17
completed:
spec: "tasks/002/spec.md"
plan: "tasks/002/plan.md"
affects: [cli/question-prompts]
engineering: []
---

# Inconsistent keyboard navigation for Q&A prompts in kanban skills

## Description
During kanban skill Q&A flows, the Claude Code `AskUserQuestion` tool sometimes presents interactive keyboard-navigable options (up/down arrows, enter to select), but other times it just prints text and requires typing a response. This inconsistent behavior makes the UX confusing and less efficient.

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
- May require web research during scoping to understand Claude Code's `AskUserQuestion` tool behavior
- Need to investigate when/why the interactive keyboard navigation appears vs plain text prompts
- Could be related to question format, option count, or terminal capabilities
