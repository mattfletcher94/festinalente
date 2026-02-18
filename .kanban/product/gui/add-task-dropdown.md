---
id: "gui/add-task-dropdown"
title: "Add Task Dropdown Menu"
type: feature
summary: "Dropdown menu on the New+ button providing Create Task and Discover options for task creation"
keywords: [dropdown, add task, new button, create task, discover, menu]
related: [gui/kanban-board]
updated: 2026-02-18
---

# Add Task Dropdown Menu

## Overview

The Add Task Dropdown Menu provides users with two ways to create tasks directly from the kanban board. Instead of a simple button that immediately opens the task creation dialog, the "New +" button reveals a dropdown menu with options for different task creation workflows.

## How It Works

1. User clicks the "New +" button on the kanban board
2. A dropdown menu appears with two options
3. User selects their preferred task creation method
4. The dropdown closes and the selected action is triggered

### Menu Options

**Create Task:**
- Title: "Create Task"
- Description: "Add a task directly"
- Action: Opens the standard task creation dialog/modal

**Discover:**
- Title: "Discover"
- Description: "Explore ideas through Q&A"
- Action: Opens Claude Code with the `/kanban-discover` command

## Key Concepts

- **Create Task**: Direct task creation for users who know exactly what they want to add
- **Discover**: Exploratory task creation through Socratic Q&A, useful when users want to explore a problem space before defining specific tasks

## Interactions

- **Task Creation Dialog**: The "Create Task" option opens the existing task creation interface
- **Claude Code CLI**: The "Discover" option triggers Claude Code with the kanban-discover skill

## Limitations

- The Discover option requires Claude Code CLI to be installed and accessible
- Dropdown requires a click to open (no hover activation)
