---
id: "003"
title: "Add tabbed navigation for product and engineering docs in GUI"
status: "refined"
priority: "medium"
labels: [feature]
created: 2026-02-17
updated: 2026-02-18
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
Documentation (product and engineering) is hard to access within the GUI and users may not know it exists. Currently, viewing docs requires leaving the app or using external tools, breaking the workflow.

## What value would it provide if solved?
Integrated doc access improves discoverability, keeps users in the workflow, and makes the kanban system more self-documenting. Users can reference product specs and engineering patterns without context-switching.

## Acceptance Criteria

Given the user is viewing the GUI left panel
When they look at the panel header
Then they see three tabs: Tasks | Engineering | Product
And the tabs use shadcn styling with text labels only

Given the user clicks the Engineering tab
When the tab content loads
Then they see a hierarchical list of files from `.kanban/engineering/`
And folders are collapsible to navigate the structure

Given the user clicks the Product tab
When the tab content loads
Then they see a hierarchical list of files from `.kanban/product/`
And folders are collapsible to navigate the structure

Given the user is viewing a doc list (Engineering or Product)
When they click on a markdown file
Then the doc content is displayed in the middle pane
And it replaces the task detail view

Given the user is viewing a doc in the middle pane
When they switch to a different tab
Then the tab shows its file list (not the previously viewed doc)
And the middle pane updates accordingly

## Notes
- Left panel should have tabs: Tasks | Engineering | Product
- Engineering and Product tabs list markdown files from `.kanban/engineering/` and `.kanban/product/`
- Clicking a doc item shows its content in the middle pane (similar to task detail view)
- Consider reusing existing list and detail view components
