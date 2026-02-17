---
id: "systems/kanban"
title: "Kanban CLI System"
type: system
summary: "CLI tool that compiles Handlebars-based skills/templates and installs them into projects for Claude Code"
keywords: [cli, skills, templates, handlebars, installation]
related: ["patterns/handlebars-partials"]
paths: ["apps/kanban/"]
updated: 2026-02-17
---

# Kanban CLI System

## Overview

The kanban CLI system is responsible for compiling markdown-based skills and templates using Handlebars, and installing them into target projects. It provides the foundational skill definitions that guide Claude Code through spec-driven development workflows.

## Components

| Component | Purpose |
|-----------|---------|
| [build](build.md) | Handlebars compilation of skills with partials |
| [scripts](scripts.md) | Helper scripts for task/spec/plan lookup |
| [content](content.md) | Source markdown (skills, templates, partials, workflow) |

## Key Patterns

- **Handlebars Partials**: Skills are composed from reusable partials in `src/content/partials/`
- **YAML Frontmatter**: Templates use frontmatter for metadata (id, type, status, etc.)
- **CJS Output**: Scripts compile to CommonJS for Node.js runtime compatibility

## Build Pipeline

1. Register partials from `src/content/partials/*.md`
2. Compile skills from `src/content/skills/*/SKILL.md` with Handlebars
3. Copy templates from `src/content/kanban-templates/` to `dist/templates/`
4. Copy workflow config from `src/content/kanban-workflow.yaml` to `dist/workflow.yaml`

## Installation Flow

When `claude-kanban` is installed in a project:
1. Creates `.kanban/` directory structure
2. Copies compiled skills to `.claude/skills/`
3. Copies templates to `.kanban/templates/`
4. Copies scripts to `.kanban/scripts/`
5. Copies workflow to `.kanban/workflow.yaml`

## Interactions

- **GUI System**: GUI reads task files from `.kanban/tasks/` that this system's templates define
- **Claude Code**: Skills are loaded by Claude Code from `.claude/skills/` directory
