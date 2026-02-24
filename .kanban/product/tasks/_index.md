---
id: "tasks/_index"
title: "Task Management"
type: domain
tldr: "Core task lifecycle from backlog to done with specs and plans"
summary: "The tasks domain handles all task CRUD operations, workflow transitions, and the structured progression from backlog through scoped, planned, in-progress, check, update-docs, pr, to done."
keywords: [tasks, workflow, backlog, kanban, lifecycle]
aliases: [task-management, task-workflow, kanban-board]
boundary: "Does NOT cover documentation search, validation rules, or VSCode UI rendering"
contains: [tasks/workflow, tasks/create, tasks/scope, tasks/plan, tasks/implement, tasks/check, tasks/rework]
related: [docs/_index, validation/_index]
updated: 2026-02-24
---

# Task Management

> **TL;DR:** Core task lifecycle from backlog to done with specs and plans

## Overview

The Task Management domain handles the complete lifecycle of development tasks within Claude Kanban. Tasks flow through a 9-column workflow, with Claude Code consuming task data (specs, plans) to understand what to implement.

**Why it exists:** Provides structure for AI-assisted development work, ensuring Claude Code has the context it needs and that code goes through proper quality gates before completion.

**Summary:** This domain provides task lifecycle management with documentation linkage for Claude Code workflows.

## Boundaries

This domain does NOT cover documentation search or validation rules. For that, see [docs](../docs/_index.md) and [validation](../validation/_index.md).

- **Does NOT:** Search product or engineering documentation
- **Does NOT:** Validate XML/YAML syntax (that's validation domain)
- **Does NOT:** Render UI (that's vscode domain)
- **See instead:** [docs](../docs/_index.md) for documentation features

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| [workflow](./workflow.md) | 9-column task progression from backlog to done | stable |
| [create](./create.md) | Create new tasks via CLI or VSCode | stable |
| [scope](./scope.md) | Define task scope with functional specification | stable |
| [plan](./plan.md) | Create implementation plan for scoped tasks | stable |
| [implement](./implement.md) | Execute plan and write code | stable |
| [check](./check.md) | Code verification, QA, and commit | stable |
| [rework](./rework.md) | Handle failures and return tasks for fixes | stable |

**Summary:** This domain contains 7 features covering the complete task lifecycle.

## Key Concepts

- **Task**: A unit of work stored as XML in `.kanban/tasks/{id}/task.xml`
- **Spec**: Functional specification in `spec.xml` defining what to build
- **Plan**: Implementation plan in `plan.xml` defining how to build it
- **Column**: Workflow state (backlog, scoped, planned, in-progress, check, update-docs, pr, done)

## Relationships

| Related Domain | Relationship |
|----------------|--------------|
| [docs](../docs/_index.md) | Tasks link to product/engineering docs via `<affects>` and `<engineering>` fields |
| [validation](../validation/_index.md) | Task XML validated for syntax and structure |
| [vscode](../vscode/_index.md) | Tasks displayed in TreeView and editable via CodeLens |

**Summary:** This domain primarily interacts with docs (for context), validation (for integrity), and vscode (for UI).
