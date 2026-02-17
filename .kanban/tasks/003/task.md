---
id: "003"
title: "Add tabbed navigation for product and engineering docs in GUI"
status: "backlog"
priority: "medium"
labels: [feature]
created: 2026-02-17
updated: 2026-02-17
completed:
spec: "tasks/003/spec.md"
plan: "tasks/003/plan.md"
affects: [gui/docs-viewer]
engineering: [systems/gui]
---

# Add tabbed navigation for product and engineering docs in GUI

## Description
Add tabs to the left-hand side panel to switch between Tasks, Engineering docs, and Product docs. Both engineering and product tabs should display files in a list format similar to the task list. Clicking an item in the list should display the documentation content in the middle pane, mirroring the task detail view behavior.

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
- Left panel should have tabs: Tasks | Engineering | Product
- Engineering and Product tabs list markdown files from `.kanban/engineering/` and `.kanban/product/`
- Clicking a doc item shows its content in the middle pane (similar to task detail view)
- Consider reusing existing list and detail view components
