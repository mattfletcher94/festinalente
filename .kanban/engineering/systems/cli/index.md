---
id: "systems/cli"
title: "CLI System"
type: system
tldr: "NPM package providing scripts, skills, and templates for kanban workflow"
summary: "Node.js CLI toolkit installed per-project that enables Claude Code workflow automation"
keywords: [cli, npm, scripts, skills, templates, node]
aliases: [kanban-cli, npm-package]
boundary: "Does not handle GUI rendering or Electron operations"
related:
  - systems/gui
paths:
  - apps/kanban
updated: 2026-02-19
verified: 2026-02-19
code_refs:
  - apps/kanban/bin/install.cjs
  - apps/kanban/src/scripts/
  - apps/kanban/src/content/skills/
---

# CLI System

> **TL;DR:** NPM package providing scripts, skills, and templates for kanban workflow

## Overview

The CLI system is an NPM package (`claude-kanban`) that installs scripts, skills, and templates into a project's `.kanban/` and `.claude/` directories. It provides the automation layer for Claude Code to manage tasks through structured workflows.

**Why it exists:** Claude Code needs structured prompts (skills) and helper scripts to reliably manage task workflows. The CLI package standardizes these across projects.

**Summary:** Installable toolkit enabling Claude Code kanban automation.

## Components

| Component | Purpose | File |
|-----------|---------|------|
| [installer](./installer.md) | Installs package contents to project | `apps/kanban/bin/install.cjs` |
| [scripts](./scripts.md) | CLI helper scripts (list-tasks, find-task, etc.) | `apps/kanban/src/scripts/` |
| [skills](./skills.md) | Claude Code workflow prompts | `apps/kanban/src/content/skills/` |
| [templates](./templates.md) | Config and workflow templates | `apps/kanban/src/content/templates/` |

**Summary:** Installer copies skills/scripts/templates to project directories.

## Key Patterns

This system follows these patterns from `patterns/`:

- JSON output from all scripts for Claude parsing
- Handlebars templating for skill compilation
- CommonJS modules for Node.js compatibility

## Installation Flow

```
npx claude-kanban
        │
        ▼
┌─────────────────┐
│  install.cjs    │
│  (entry point)  │
└────────┬────────┘
         │
    ┌────┼────┬────────┐
    │    │    │        │
    ▼    ▼    ▼        ▼
Skills  Scripts  Templates  Workflow
(.claude/)  (.kanban/scripts/)  (.kanban/templates/)  (.kanban/workflow.yaml)
```

## Script Categories

| Category | Scripts | Purpose |
|----------|---------|---------|
| Task Management | find-task, list-tasks, delete-task, next-id | CRUD operations on tasks |
| Product Docs | search-product, list-product, check-product | Product documentation |
| Engineering Docs | search-engineering, list-engineering, check-engineering | Engineering documentation |
| Validation | validate-xml, validate-yaml, validate-docs | File validation |
| Utilities | get-date-time, get-hook-config, expand-query | Helper functions |

## Data Flow

```
Claude Command (/kanban-create)
        │
        ▼
┌─────────────────┐
│  Skill (SKILL.md)│
│  loaded by Claude│
└────────┬────────┘
         │ calls
         ▼
┌─────────────────┐
│  Helper Scripts │
│  (JSON output)  │
└────────┬────────┘
         │ writes
         ▼
┌─────────────────┐
│  Task Files     │
│  (.kanban/tasks)│
└─────────────────┘
```

## Interactions

| System | Relationship | Notes |
|--------|--------------|-------|
| [gui](../gui/index.md) | GUI runs skills via PTY | Terminal executes `/kanban-*` commands |
| Claude Code | Loads and executes skills | Skills guide Claude through workflows |
| Git | Skills commit changes | Using workflow.yaml commit formats |

**Summary:** Skills guide Claude, scripts provide data, GUI provides execution environment.

## Boundaries

What this system does NOT handle:

- **Does NOT:** Provide GUI -> See [gui](../gui/index.md)
- **Does NOT:** Execute AI prompts -> Claude Code handles that
- **Does NOT:** Manage Electron IPC -> GUI responsibility

## Configuration

| Setting | Description | File |
|---------|-------------|------|
| Hooks | Per-command directives | `.kanban/config.yaml` |
| Glossary | Domain terminology | `.kanban/glossary.yaml` |
| Workflow | Column and label definitions | `.kanban/workflow.yaml` |

## Build Process

```
tools/build.ts
      │
      ├── Register Handlebars partials
      ├── Compile skill templates
      ├── Copy scripts to dist/
      └── Package for npm publish
```
