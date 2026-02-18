---
id: "009"
title: "Add dropdown menu to Add Task button with Create Task and Discover options"
status: "pr"
priority: "high"
labels: [feature]
created: 2026-02-18
updated: 2026-02-18
planned: 2026-02-18
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
The kanban-discover skill (added in task 008) is not triggerable from the GUI. Currently, users must switch to the CLI to use the Discover feature, which fragments the task creation workflow.

## What value would it provide if solved?
Workflow completeness - users expect both task creation methods (direct create and exploratory discover) available from the same entry point in the GUI. This provides a unified experience where users can choose their approach without leaving the application.

## Acceptance Criteria

Given the user is viewing the kanban board
When they look at the task creation button
Then they see a button labeled "New +" with a prominent variant styling

Given the user is viewing the kanban board
When they click the "New +" button
Then a dropdown menu appears with two options

Given the dropdown menu is open
When the user views the "Create Task" option
Then they see the title "Create Task" with description "Add a task directly"

Given the dropdown menu is open
When the user views the "Discover" option
Then they see the title "Discover" with description "Explore ideas through Q&A"

Given the dropdown menu is open
When the user clicks "Create Task"
Then the current add task dialog/modal opens
And the dropdown closes

Given the dropdown menu is open
When the user clicks "Discover"
Then Claude Code opens with the /kanban-discover command
And the dropdown closes

## Notes
- Use shadcn dropdown menu component
- The kanban-discover skill was recently added in task 008
- Each menu item needs title + description layout
- Button changes from "+" icon to "New +" text with more prominent variant
