---
id: overview
title: "Claude Kanban Engineering Overview"
type: overview
summary: "High-level technical overview of the Claude Kanban monorepo"
keywords: [architecture, tech-stack, overview, monorepo, electron, vue]
related: []
paths: []
updated: 2026-02-17
---

# Claude Kanban Engineering Overview

## Tech Stack

| Category | Technology |
|----------|------------|
| Language | TypeScript |
| Package Manager | pnpm (workspaces) |
| Monorepo | Turborepo |
| GUI Framework | Vue 3 + Vite |
| Desktop | Electron |
| Terminal | node-pty + xterm.js |
| UI Components | Reka UI + Tailwind CSS 4 |
| Build (CLI) | tsdown |
| Templating | Handlebars |

## Architecture Summary

Claude Kanban is a pnpm monorepo containing two main applications: a CLI tool (`apps/kanban`) for installing kanban workflows into projects, and a GUI application (`apps/gui`) built with Electron + Vue for visual task management. The GUI embeds Claude Code via PTY for AI-assisted workflow execution.

## Directory Structure

```
claudeban/
├── apps/
│   ├── kanban/           # CLI tool (npm package)
│   │   ├── src/
│   │   │   ├── content/  # Handlebars templates for skills, workflow
│   │   │   └── scripts/  # Helper scripts (list-tasks, find-task, etc.)
│   │   ├── tools/        # Build tooling
│   │   └── bin/          # CLI entry point
│   │
│   └── gui/              # Electron + Vue desktop app
│       ├── electron/
│       │   ├── main/     # Main process (IPC handlers, PTY service)
│       │   └── preload/  # Context bridge
│       └── src/
│           ├── app/      # App-level orchestrator
│           ├── tasks/    # Task management system
│           ├── terminal/ # Terminal/PTY integration
│           ├── settings/ # Settings management
│           └── components/
│               └── ui/   # Reusable UI components (shadcn-vue style)
│
├── .kanban/              # Installed kanban instance
│   ├── tasks/            # Task folders (id/task.md, spec.md, plan.md)
│   ├── engineering/      # Engineering documentation
│   ├── templates/        # Markdown templates
│   ├── scripts/          # Runtime scripts (compiled from apps/kanban)
│   └── workflow.yaml     # Workflow definition
│
└── turbo.json            # Turborepo configuration
```

## Key Patterns

- [acyclic-architecture](patterns/acyclic-architecture.md) - DAG-based dependency structure ensuring no circular imports
- [capability-computer-orchestrator](patterns/capability-computer-orchestrator.md) - Three-layer architecture (C/C/O) separating side effects, computation, and coordination
- [ipc-bridge](patterns/ipc-bridge.md) - Electron IPC communication pattern
- [handlebars-partials](patterns/handlebars-partials.md) - Handlebars partial system for skill composition

## Systems

- [kanban](systems/kanban/index.md) - CLI tool and kanban workflow system
- [gui](systems/gui/index.md) - Electron + Vue desktop application

## Conventions

- [file-naming](conventions/file-naming.md) - File naming conventions
- [component-structure](conventions/component-structure.md) - Vue component structure conventions
