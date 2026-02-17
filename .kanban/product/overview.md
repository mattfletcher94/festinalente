---
id: overview
title: "Claude Kanban"
type: overview
summary: "A workflow system that ensures proper specification, planning, and review before AI writes code"
keywords: [kanban, claude-code, ai-workflow, spec-driven, task-management]
updated: 2026-02-17
---

# Claude Kanban

## What is this?

Claude Kanban is a spec-driven development workflow system that helps developers using Claude Code ensure proper specification, planning, and review before AI writes code.

## Key Capabilities

- **File-based task management**: All task data lives in your repo as markdown files, version-controlled alongside your code
- **Structured workflow**: 10-column workflow from Backlog to Done with mandatory git commits at each phase
- **Branch isolation**: Task work happens on `task/{id}` branches, keeping main clean for PR-based review
- **Product documentation**: Domain-organized docs in `.kanban/product/` provide context for AI when working on tasks
- **Desktop GUI**: Optional Electron app with embedded terminal for visual task management

## Target Users

- **Developers using Claude Code**: Software developers who want structured AI-assisted development workflows
- **Solo developers & small teams**: Individuals or small teams wanting disciplined specification before implementation

## Value Proposition

- **Prevents AI spaghetti code**: Forces proper specification and planning before AI writes code
- **Audit trail for AI work**: Git history documents every phase of AI-assisted development
