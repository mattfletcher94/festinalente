---
id: "{id}"
title: "{title}"
status: backlog|refined|scoped|planned|in-progress|verify|review|update-docs|done
priority: high|medium|low
labels: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
completed: YYYY-MM-DD
spec: "specs/{id}.spec.md"
plan: "plans/{id}.plan.md"
product-docs: []
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
