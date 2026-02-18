---
id: "009"
title: "Add dropdown menu to Add Task button with Create Task and Discover options"
status: "backlog"
priority: "high"
labels: [feature]
created: 2026-02-18
updated: 2026-02-18
completed:
spec: "tasks/009/spec.md"
plan: "tasks/009/plan.md"
affects: [gui/add-task-dropdown]
engineering: []
---

# Add dropdown menu to Add Task button with Create Task and Discover options

## Description
Modify the existing "Add Task" button in the GUI to use a shadcn dropdown menu instead of triggering the add task action directly. The dropdown should contain two options:
1. **Create Task** - The current add task functionality
2. **Discover** - Triggers the new kanban-discover skill

Each dropdown item should display a title and a short description underneath using shadcn components.

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
- Use shadcn dropdown menu component
- The kanban-discover skill was recently added in task 008
- Each menu item needs title + description layout
