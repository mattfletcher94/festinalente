---
id: overview
title: "Claude Kanban"
type: overview
tldr: "Spec-driven task management system for Claude Code workflows"
summary: "Claude Kanban provides structured task management through a kanban-style workflow, enabling developers to manage tasks from backlog to completion with specs, plans, and linked documentation."
keywords: [kanban, task-management, claude-code, spec-driven, workflow]
aliases: [claudeban, kanban-system, task-workflow]
boundary: "Does NOT provide standalone project management; designed specifically for Claude Code integration"
updated: 2026-02-20
---

# Claude Kanban

> **TL;DR:** Spec-driven task management system for Claude Code workflows

## What is this?

Claude Kanban is a spec-driven task management system that helps developers using Claude Code organize and track development work through a structured workflow. It provides a kanban-style board with columns from backlog to done, along with specifications, implementation plans, and links to product/engineering documentation.

**Summary:** A task management layer for Claude Code that enforces a structured workflow with documentation integration.

## Key Capabilities

- **Task Lifecycle Management**: Create, scope, plan, implement, and complete tasks through a defined workflow (backlog → scoped → planned → in-progress → codecheck → qa → update-docs → pr → done)
- **Documentation Integration**: Link tasks to product and engineering docs for context-aware development
- **Validation & Quality**: Validate task XML, documentation quality, and directive compliance
- **VSCode Extension**: Visual kanban board with CodeLens actions and terminal integration
- **Smart Search**: Hybrid search across product and engineering docs with glossary-based query expansion

**Summary:** The product provides 5 core capabilities for developers using Claude Code.

## Target Users

- **Developers using Claude Code**: Software engineers who use Claude Code CLI for development tasks
- **AI-assisted development teams**: Teams that incorporate AI into their software development workflow
- **Solo developers with AI tools**: Individual developers leveraging Claude for coding assistance

**Summary:** Primary users are developers working with Claude Code, whether solo or in teams.

## Boundaries

What this product does NOT cover:

- **Does NOT:** Replace full project management tools (Jira, Linear, etc.)
- **Does NOT:** Provide team collaboration features (user assignment, permissions)
- **See instead:** Integrate with existing project management for team-level tracking
