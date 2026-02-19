---
id: overview
title: "Claudeban"
type: overview
tldr: "AI-powered kanban workflow system with Claude-driven task management"
summary: "A kanban workflow system with AI-driven task management through Claude"
keywords: [kanban, workflow, task-management, claude, ai-assisted, automation]
aliases: [claude-kanban, kanban-for-claude]
boundary: "Does not cover general project management, team collaboration, or non-Claude AI integrations"
updated: 2026-02-19
---

# Claudeban

> **TL;DR:** AI-powered kanban workflow system with Claude-driven task management

## What is this?

Claudeban is an AI-powered kanban workflow system that helps developers manage tasks through Claude-driven automation. It combines a desktop GUI application with CLI skills that extend Claude Code.

**Summary:** A structured task workflow system that leverages Claude AI to automate task creation, planning, implementation, and documentation.

## Key Capabilities

- **GUI Application**: Electron-based desktop app with task list, detail panel, and integrated terminal
- **CLI Skills**: Interactive workflows for task lifecycle (create, scope, plan, implement, verify, approve)
- **Documentation System**: Product and engineering documentation with smart context selection
- **Search & Discovery**: Fuzzy search, keyword matching, and glossary-aware query expansion
- **Quality Auditing**: Documentation validation, freshness checking, and improvement workflows

**Summary:** The product provides 5 core capabilities for AI-assisted task management.

## Target Users

- **Solo developers**: Managing personal tasks with AI assistance for planning and implementation
- **AI-augmented teams**: Development teams using Claude Code who want structured workflows
- **Claude Code users**: Anyone using Claude Code who wants task management with workflow automation

**Summary:** Primary users are developers using Claude Code who want structured task workflows.

## Quick Start

```bash
# Create your first task
/kanban-create "Add user authentication"

# Progress through workflow
/kanban-scope TASK-001
/kanban-plan TASK-001
/kanban-implement TASK-001
/kanban-codecheck TASK-001
/kanban-approve TASK-001
```

## Boundaries

What this product does NOT cover:

- **Does NOT:** Replace general project management tools (Jira, Linear, etc.)
- **Does NOT:** Handle team collaboration features (assignments, notifications, permissions)
- **Does NOT:** Integrate with non-Claude AI systems
- **See instead:** Use existing project management tools for team-wide planning
