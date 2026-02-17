---
id: "002"
title: "Inconsistent keyboard navigation for Q&A prompts in kanban skills"
status: "planned"
priority: "high"
labels: [bug]
created: 2026-02-17
updated: 2026-02-17
planned: 2026-02-17
completed:
spec: "tasks/002/spec.md"
plan: "tasks/002/plan.md"
affects: [cli/question-prompts]
engineering: []
---

# Inconsistent keyboard navigation for Q&A prompts in kanban skills

## Description
During kanban skill Q&A flows, the Claude Code `AskUserQuestion` tool sometimes presents interactive keyboard-navigable options (up/down arrows, enter to select), but other times it just prints text and requires typing a response. This inconsistent behavior makes the UX confusing and less efficient.

## What problem are you trying to solve?
Kanban skill Q&A flows have inconsistent user experience. Some prompts use keyboard navigation (arrow keys to select, enter to confirm), while others require typing responses. The inconsistency likely stems from variation in how questions are structured in the source files at `apps/kanban/src` (the `.claude/skills/kanban-*` files are compiled outputs).

## What value would it provide if solved?
Consistent, predictable UX for users running kanban workflows. Keyboard navigation is faster and less error-prone than typing responses. Users can develop muscle memory and move through workflows efficiently without context-switching between interaction modes.

## Acceptance Criteria

Given a user is running any kanban skill workflow
When a Q&A prompt is presented with predefined options
Then the prompt uses keyboard navigation (arrow keys + enter)
And the user does not need to type their selection

Given a user is running any kanban skill workflow
When they complete the entire workflow
Then all prompts with options used keyboard navigation consistently
And no plain text prompts appeared unless absolutely necessary

## Notes
- Source files are in `apps/kanban/src`, not `.claude/skills/kanban-*` (those are compiled)
- May require web research during scoping to understand Claude Code's `AskUserQuestion` tool behavior
- Need to audit all kanban skill source files for Q&A prompt usage patterns
- Focus on ensuring consistent usage of the AskUserQuestion tool across all skills
