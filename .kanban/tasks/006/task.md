---
id: "006"
title: "Ask for task description first before other questions in kanban-create"
status: "pr"
priority: "medium"
labels: [feature]
created: 2026-02-18
updated: 2026-02-18
completed:
spec: "tasks/006/spec.md"
plan: "tasks/006/plan.md"
affects: [cli/kanban-create-ux]
engineering: []
---

# Ask for task description first before other questions in kanban-create

## Description
When running `/kanban-create` without a title argument, the skill should ask for a rough description/title FIRST before asking other questions (priority, label, domain, etc.). Currently, the LLM sometimes asks configuration questions before the user has described their task, forcing them to remember what they wanted while answering unrelated questions.

## What problem are you trying to solve?
In `kanban-create`, when no title argument is provided, the skill may ask configuration questions (like domain selection from product doc search) before the user has even described their task. This is confusing and creates poor UX - users are forced to answer questions about priority, domain, or labels while still trying to remember what task they wanted to create in the first place.

## What value would it provide if solved?
Better user experience - users always describe their task first, then answer configuration questions with full context of what they're configuring. This reduces cognitive load and makes the task creation flow feel more natural and intuitive.

## Acceptance Criteria

Given a user runs `/kanban-create` without a title argument
When the skill begins the task creation flow
Then the skill asks for the task title/description FIRST
And no other questions (priority, label, domain) are asked before the title is established

Given a user runs `/kanban-create` with a title argument (e.g., `/kanban-create Fix login bug`)
When the skill begins the task creation flow
Then the title is accepted silently without confirmation
And the remaining questions proceed in normal order

Given a user has provided a title (either via argument or prompt)
When the skill continues the task creation flow
Then the remaining question order is: doc search (with domain question if needed) → priority → label
And this order matches the current behavior (just repositioned after title)

## Notes
User observed that the correct behavior happened in this session (title was asked first), but wants to ensure this is consistently enforced in the skill definition. The fix requires reordering steps in the kanban-create skill so that step `get_task_details` (which asks for title) comes BEFORE steps `search_product_docs` and `search_engineering_docs`.
