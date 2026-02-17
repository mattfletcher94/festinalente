---
id: cli/branching
title: "Git Branching Strategy"
type: feature
summary: "Task branch isolation strategy with main -> task/{id} -> main lifecycle"
keywords: [git, branch, task-branch, main, merge, isolation]
related: [cli/task-workflow, cli/commands]
updated: 2026-02-17
---

# Git Branching Strategy

## Overview

Claude Kanban uses a `task/{id}` branching strategy to isolate task work and enable PR-based code review. Early phases happen on main (no code changes), then a dedicated branch is created for implementation.

## How It Works

1. Create and refine tasks on main branch (documentation only)
2. `/kanban-scope` creates `task/{id}` branch from main
3. All implementation work happens on the task branch
4. PR is created from task branch to main
5. `/kanban-merge` merges PR and deletes task branch

### Branch Lifecycle

**On main branch:**
- `/kanban-create` - Creates task file
- `/kanban-refine` - Clarifies requirements

**Branch transition:**
- `/kanban-scope` - Creates `task/{id}` branch, switches to it

**On task/{id} branch:**
- `/kanban-plan` - Creates implementation plan
- `/kanban-implement` - Writes code
- `/kanban-codecheck` - Runs checks
- `/kanban-approve` - Commits code after QA
- `/kanban-docs` - Updates documentation, pushes

**Return to main:**
- `/kanban-merge` - Merges PR, deletes branch, returns to main

## Key Concepts

- **Main branch**: Where task metadata lives; kept clean of incomplete work
- **Task branch**: `task/{id}` format; isolated workspace for implementation
- **PR-based review**: All code merges via pull request

## Interactions

- **Task Workflow**: Branch requirements enforce workflow discipline
- **Commands**: Each command verifies it's on the correct branch

## Limitations

- Commands enforce branch requirements (e.g., scope must be on main)
- Cannot work on multiple tasks simultaneously (one branch at a time)
