---
id: "001"
title: "Expand 'Next Up' button to full section with directive hooks display"
status: "refined"
priority: "medium"
labels: [feature]
created: 2026-02-17
updated: 2026-02-17
completed:
spec: "tasks/001/spec.md"
plan: "tasks/001/plan.md"
affects: [gui/desktop-app]
engineering: [systems/gui]
---

# Expand 'Next Up' button to full section with directive hooks display

## Description
Transform the current 'Next Up' button into a dedicated section that displays a brief explanation of the next action and lists the hooks (directives) connected with that action. This provides users with better visibility into what will happen next and which directives are involved.

## What problem are you trying to solve?
Users lack visibility into what the next workflow action will do, and they're unaware of which custom directives influence each workflow step. The current 'Next Up' button provides no context before clicking, leaving users uncertain about what will happen when they proceed.

## What value would it provide if solved?
Better transparency into the workflow - users understand what's coming next and can see their custom directives in action. This builds confidence and enables users to make informed decisions about when to proceed with workflow actions.

## Acceptance Criteria

Given a task is selected in the task detail panel
When the task detail view renders
Then a 'Next Up' section appears at the top of the panel
And the section displays an explanation of the next workflow action
And the section contains a 'Run' button to execute the action

Given a task's next workflow action has directives configured
When the 'Next Up' section renders
Then the section displays a list of directive names below the action explanation

Given a task's next workflow action has no directives configured
When the 'Next Up' section renders
Then the directives list is hidden entirely

Given a user views the 'Next Up' section
When they click the 'Run' button
Then the next workflow command executes in the terminal panel

## Notes
- Currently 'Next Up' is just a button
- New section should show explanation of the next workflow action
- Should display list of hooks/directives connected to the next action
