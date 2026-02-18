---
id: "cli/kanban-discover"
title: "Kanban Discover"
type: feature
summary: "Explore questions and analyze codebases through Socratic Q&A before creating tasks"
keywords: [kanban-discover, exploration, audit, research, analysis, socratic, discovery]
related: [cli/kanban-create-ux, cli/task-workflow]
updated: 2026-02-18
---

# Kanban Discover

## Overview

The `/kanban-discover` skill enables exploratory analysis before committing to task creation. Users can audit codebases, research implementation approaches, or analyze systems through conversational Socratic Q&A. Findings are presented conversationally and can optionally be converted into tasks via `/kanban-create`.

## How It Works

1. User runs `/kanban-discover` with an optional exploration question
2. Skill uses Socratic questioning to understand the exploration intent
3. Exploration is performed using codebase tools or web research as appropriate
4. Findings are presented conversationally (no files are created)
5. User is offered the option to create tasks from findings

### Exploration Types

**Codebase audit:**
- Find issues, patterns, bottlenecks, or opportunities in the code
- Uses Glob, Grep, and Read tools to analyze files

**Research:**
- Investigate implementation approaches, best practices, or how other systems solve problems
- Uses WebSearch and WebFetch to find relevant resources

**Analysis:**
- Understand how something works, trace data flow, or map dependencies
- Combines codebase tools with web research as needed

## Key Concepts

- **Socratic Q&A**: The skill asks clarifying questions to deeply understand the exploration intent before beginning
- **Conversational findings**: All exploration output is conversational, no files are persisted
- **Optional task creation**: After presenting findings, users can choose to create tasks for any or all findings
- **Chained invocation**: When creating tasks, the skill invokes `/kanban-create` with a suggested title

## Interactions

- **kanban-create**: Discover chains to create when the user confirms task creation for a finding
- **kanban-refine**: Created tasks appear in Backlog ready for refinement

## Limitations

- Findings are not persisted to files; they exist only in the conversation
- Tasks are not created automatically; each finding requires explicit user confirmation
- The skill requires clarification before exploration; it does not skip the intent-understanding phase
