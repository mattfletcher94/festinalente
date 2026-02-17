---
id: "systems/kanban"
title: "Kanban CLI System"
type: system
summary: "CLI tool that installs kanban workflow files, templates, and scripts into projects"
keywords: [cli, kanban, workflow, templates, handlebars, skills]
related: ["systems/gui", "patterns/handlebars-partials"]
paths: ["apps/kanban/"]
updated: 2026-02-17
---

# Kanban CLI System

## Overview

The Kanban CLI (`claude-kanban` npm package) installs a complete kanban workflow system into projects. It compiles Handlebars skill templates, copies workflow definitions and templates, and sets up the `.kanban/` directory structure. The system integrates with Claude Code via slash commands (skills).

## Components

| Component | Purpose |
|-----------|---------|
| Installer (`bin/install.cjs`) | CLI entry point that copies files to `.kanban/` |
| Build System (`tools/build.ts`) | Compiles Handlebars templates to dist/ |
| Skills (`src/content/skills/`) | Claude Code slash command definitions |
| Templates (`src/content/kanban-templates/`) | Markdown templates for tasks, specs, plans |
| Scripts (`src/scripts/`) | Helper scripts for task management |
| Workflow (`src/content/kanban-workflow.yaml`) | Column, label, and transition definitions |

## Build Process

```
src/content/
├── skills/*.md          → Compile with Handlebars → dist/skills/*.md
├── partials/*.md        → Registered as partials ({{> partial-name}})
├── kanban-templates/*   → Copy as-is           → dist/templates/*
└── kanban-workflow.yaml → Copy as-is           → dist/workflow.yaml

dist/ → Install to .kanban/ when user runs `npx claude-kanban`
```

## Skills (Slash Commands)

Skills are markdown files that define Claude Code slash commands. They use XML-like process steps and can include Handlebars partials for reusable content.

Example structure:
```markdown
# Skill: Command Name

<purpose>What this skill does</purpose>

<context>Available tools and context</context>

<process>
  <step name="step_name">
    <action>Do something</action>
    <prompt>Ask the user something</prompt>
  </step>
</process>

<success_criteria>When to consider the skill complete</success_criteria>
```

## Scripts

Helper scripts compiled to `.kanban/scripts/*.cjs`:

| Script | Purpose |
|--------|---------|
| `list-tasks.cjs` | List tasks with optional filtering |
| `find-task.cjs` | Find task by ID or search term |
| `find-spec.cjs` | Find spec file for a task |
| `find-plan.cjs` | Find plan file for a task |
| `next-id.cjs` | Get next available task ID |
| `get-date-time.cjs` | Get current date/time in ISO format |
| `list-engineering.cjs` | List engineering documentation files |

## Workflow Definition

The `workflow.yaml` defines:

- **Columns**: backlog → refined → scoped → planned → in-progress → codecheck → qa → update-docs → pr → done
- **Labels**: bug, feature, docs, refactor (with commit-type mappings)
- **Priorities**: high, medium, low
- **Transitions**: Valid column transitions
- **Commits**: Commit message formats for each workflow action

## Key Patterns

- [Handlebars Partials](../../patterns/handlebars-partials.md) - Template composition for skills

## Interactions

- Installed into projects via `npx claude-kanban`
- Skills are invoked via Claude Code `/command` syntax
- GUI reads the resulting `.kanban/tasks/` files
