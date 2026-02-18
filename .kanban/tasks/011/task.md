---
id: "011"
title: "Prevent product docs from linking to non-existent related features"
status: "backlog"
priority: "high"
labels: [bug]
created: 2026-02-18
updated: 2026-02-18
completed:
spec: "tasks/011/spec.md"
plan: "tasks/011/plan.md"
affects: [cli/product-docs-validation]
engineering: []
---

# Prevent product docs from linking to non-existent related features

## Description
When completing a task lifecycle, product documentation is added at the end. However, the product documentation file that gets created includes a `related` item in the front matter that links to a related feature that doesn't exist in the product documentation. We need to validate that related links point to existing docs, or not include them if they don't exist.

## What problem are you trying to solve?
{Filled during refine phase via Q&A}

## What value would it provide if solved?
{Filled during refine phase via Q&A}

## Acceptance Criteria

<!-- Use Gherkin format (Given/When/Then) -->

Given {precondition}
When {action}
Then {expected outcome}
And {additional outcome}

## Notes
{Technical notes, constraints, additional context}
