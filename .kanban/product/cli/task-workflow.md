---
id: cli/task-workflow
title: "Task Workflow"
type: feature
summary: "10-column kanban workflow that guides tasks from idea to merged PR with git commits at each phase"
keywords: [workflow, kanban, columns, backlog, refine, scope, plan, implement, codecheck, qa, pr, done]
related: [cli/branching, cli/commands]
updated: 2026-02-17
---

# Task Workflow

## Overview

Task Workflow is the core feature that moves tasks through a 10-column kanban board. Each column represents a phase in the development lifecycle, and transitions between columns require specific slash commands that the AI follows.

## How It Works

1. User creates a task via `/kanban-create "title"`
2. Task progresses through columns via slash commands
3. Git commits are created at most phases, documenting the task's journey
4. Result: Complete git history of task lifecycle from idea to merged PR

### Key Workflows

**Happy Path:**
- `/kanban-create` -> Backlog
- `/kanban-refine` -> Refined (clarify requirements via Q&A)
- `/kanban-scope` -> Scoped (creates task branch, writes spec)
- `/kanban-plan` -> Planned (creates implementation plan)
- `/kanban-implement` -> In Progress (AI writes code)
- `/kanban-codecheck` -> Code Check -> QA (runs checks, auto-advances)
- `/kanban-approve` -> Update Docs (commits code after human QA)
- `/kanban-docs` -> PR (updates docs, pushes branch)
- `/kanban-merge` -> Done (merges PR, deletes branch)

**Rework Path:**
- `/kanban-rework` can be called from QA or PR to return task to In Progress

## Key Concepts

- **Column**: A phase in the workflow (e.g., Backlog, Refined, Scoped)
- **Transition**: Moving from one column to another via a slash command
- **Phase commit**: Git commit created when transitioning between columns

## Columns

| Column | Description |
|--------|-------------|
| Backlog | New tasks awaiting refinement |
| Refined | Tasks with clarified requirements |
| Scoped | Tasks with spec, on task branch |
| Planned | Tasks with implementation plan |
| In Progress | Code being written |
| Code Check | AI running automated checks |
| QA | Human testing the application |
| Update Docs | Documentation needs updating |
| PR | Awaiting GitHub PR review |
| Done | PR merged, task complete |

## Interactions

- **Branching**: Scope creates task branch; merge returns to main
- **Commands**: Each column transition has a corresponding slash command
- **Git**: Commits are created at most transitions

## Limitations

- Tasks must progress through columns in order (with exceptions for rework)
- Cannot skip columns in the workflow
- Human QA is required before code can be committed
