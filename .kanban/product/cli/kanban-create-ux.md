---
id: "cli/kanban-create-ux"
title: "Kanban Create UX"
type: feature
summary: "Task creation flow that asks for title/description first before configuration questions"
keywords: [kanban-create, task creation, ux, title first, question order]
related: [cli/question-prompts, cli/task-workflow]
updated: 2026-02-18
---

# Kanban Create UX

## Overview

The `/kanban-create` skill follows a specific question ordering to ensure good user experience. When creating a task, the skill always asks for the task title/description first, before asking any configuration questions like priority, labels, or domain selection.

## How It Works

1. User runs `/kanban-create` (with or without a title argument)
2. If no title provided, skill prompts for title/description first
3. After title is established, remaining questions follow in order: doc search (domain if needed) -> priority -> label
4. Task is created with all provided information

### Question Order

**With title argument (e.g., `/kanban-create Fix login bug`):**
- Title accepted silently
- Proceed directly to doc search, priority, and label questions

**Without title argument (e.g., `/kanban-create`):**
- Ask for title/description first
- Then proceed to doc search, priority, and label questions

## Key Concepts

- **Title-first flow**: The task description is always established before configuration questions, reducing cognitive load
- **Silent acceptance**: When a title is provided as an argument, it is used without confirmation prompts

## Limitations

- Title must be provided before any other configuration can proceed
- Cannot skip the title step when running without arguments
