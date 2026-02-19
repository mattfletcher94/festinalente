---
id: "cli/_index"
title: "CLI Skills"
type: domain
tldr: "Command-line skills for task workflow, discovery, documentation, and quality"
summary: "Interactive Claude Code skills that automate task management through conversational workflows. Skills handle task lifecycle, codebase exploration, documentation mapping, and quality auditing."
keywords: [cli, skills, workflow, claude-code, automation, slash-commands]
aliases: [command-line, skills, slash-commands]
boundary: "Does not cover GUI features or visual task management"
contains: [cli/lifecycle, cli/discovery, cli/docs, cli/quality, cli/scripts]
related: [gui/_index]
updated: 2026-02-19
---

# CLI Skills

> **TL;DR:** Command-line skills for task workflow, discovery, documentation, and quality

## Overview

The CLI Skills domain handles all command-line interactions with Claudeban. Skills are invoked as slash commands in Claude Code (e.g., `/kanban-create`) and run as interactive conversational workflows.

**Why it exists:** Users need structured workflows for common development tasks. Skills guide users through task creation, planning, implementation, and verification with AI assistance.

**Summary:** This domain provides interactive workflow automation through Claude Code skills.

## Boundaries

This domain does NOT cover the desktop GUI. For that, see [GUI Application](../gui/_index.md).

- **Does NOT:** Provide visual task overview (use GUI for that)
- **Does NOT:** Run commands in background (interactive only)
- **Does NOT:** Replace Claude Code functionality (extends it)
- **See instead:** [GUI Application](../gui/_index.md) for visual management

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| [Lifecycle Skills](./lifecycle.md) | Task workflow from create to done | stable |
| [Discovery Skills](./discovery.md) | Codebase exploration and mapping | stable |
| [Documentation Skills](./docs.md) | Product and engineering documentation | stable |
| [Quality Skills](./quality.md) | Validation and auditing | stable |
| [Helper Scripts](./scripts.md) | CLI utilities for task and doc operations | stable |

**Summary:** This domain contains 5 feature groups covering the full task management lifecycle.

## Key Concepts

- **Skill**: An interactive workflow invoked via `/kanban-{name}` in Claude Code
- **Workflow Column**: Task status in the kanban board (Backlog, Scoped, Planned, etc.)
- **Hook Config**: Project-specific directives for workflow steps (e.g., test commands)
- **Review Phase**: Workflow step requiring human approval (codecheck, qa, pr)

## Common Mistakes

- **Workflow order**: Trying to skip steps (e.g., implement before scope). Each phase requires the previous phase to be complete.
- **Task transitions**: Tasks can only move forward in the workflow (with exceptions for rework).

## Example

```bash
# Task lifecycle workflow
/kanban-create "Implement user notifications"  # → Backlog
/kanban-scope TASK-005                         # → Scoped
/kanban-plan TASK-005                          # → Planned
/kanban-implement TASK-005                     # → In Progress → Codecheck
/kanban-codecheck TASK-005                     # → QA
/kanban-approve TASK-005                       # → Done

# Discovery and documentation
/kanban-discover "How does auth work?"
/kanban-map-product
/kanban-quality-check
```

## Relationships

| Related Domain | Relationship |
|----------------|--------------|
| [GUI](../gui/_index.md) | GUI executes CLI skills via integrated terminal |

**Summary:** This domain provides the workflow logic that the GUI executes.
