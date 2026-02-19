---
id: overview
title: "Claude Kanban Engineering Overview"
type: overview
tldr: "Monorepo with Electron/Vue GUI and Node.js CLI for AI-powered kanban workflow"
summary: "High-level technical overview of Claude Kanban architecture, tech stack, and directory structure"
keywords: [architecture, tech-stack, overview, electron, vue, typescript, monorepo]
aliases: [engineering-overview, architecture-overview]
boundary: "Does not cover implementation details of individual systems or patterns"
related: []
paths:
  - apps/gui
  - apps/kanban
updated: 2026-02-19
verified: 2026-02-19
code_refs: []
---

# Claude Kanban Engineering Overview

> **TL;DR:** Monorepo with Electron/Vue GUI and Node.js CLI for AI-powered kanban workflow

## Tech Stack

| Category | Technology |
|----------|------------|
| Language | TypeScript 5.9.3 |
| Framework | Vue 3.5.28 + Electron 29.4.6 |
| Database | File-based (XML/YAML/Markdown) |
| Build Tool | Vite 5.4.21 + Turbo 2.8.10 |
| Testing | None (validation scripts only) |
| Styling | Tailwind CSS 4.2.0 |
| Terminal | node-pty + xterm.js |

**Summary:** TypeScript monorepo using Vue 3 for UI, Electron for desktop, and file-based storage with XML/YAML/Markdown formats.

## Architecture Summary

Two-tier architecture: a desktop GUI application (Electron + Vue 3) providing visual kanban board with integrated terminal, and a CLI toolkit (Node.js) providing scripts and Claude AI skills for workflow automation.

**Why it exists:** Combines visual task management with Claude Code AI automation. The GUI provides fast navigation and status tracking, while CLI skills guide Claude through structured workflows.

**Summary:** Desktop GUI + CLI toolkit working together via PTY and file system.

## Directory Structure

```
/
├── apps/
│   ├── gui/                    # Electron + Vue 3 desktop app
│   │   ├── electron/           # Main process (IPC, PTY)
│   │   │   ├── main/           # Window creation, IPC handlers
│   │   │   └── preload/        # Context bridge for renderer
│   │   └── src/                # Renderer process (Vue app)
│   │       ├── app/            # App orchestrator
│   │       ├── tasks/          # Task management feature
│   │       ├── settings/       # Settings feature
│   │       ├── terminal/       # Terminal feature
│   │       └── components/     # UI components
│   └── kanban/                 # CLI toolkit (npm package)
│       ├── src/
│       │   ├── scripts/        # CLI scripts (list-tasks, find-task, etc.)
│       │   └── content/        # Skills and templates
│       └── tools/              # Build tooling
└── .kanban/                    # Runtime directory (installed per-project)
    ├── tasks/                  # Task storage (XML files)
    ├── product/                # Product documentation
    ├── engineering/            # Engineering documentation
    ├── scripts/                # Installed CLI scripts
    └── workflow.yaml           # Workflow definitions
```

**Summary:** Monorepo with `apps/gui` (desktop), `apps/kanban` (CLI), and `.kanban` (runtime data).

## Boundaries

What this overview does NOT cover:

- **Does NOT:** Detailed system implementation -> See [systems/](systems/)
- **Does NOT:** Specific patterns or conventions -> See [patterns/](patterns/) and [conventions/](conventions/)
- **Does NOT:** Product features or user workflows -> See `product/` documentation

## Key Patterns

- [orchestrator](patterns/orchestrator.md) - State management with capabilities and computers
- [capability](patterns/capability.md) - IPC abstraction layer between renderer and main process
- [computer](patterns/computer.md) - Pure business logic functions
- [barrel-exports](patterns/barrel-exports.md) - Feature module exports

## Systems

- [gui](systems/gui/_index.md) - Electron desktop application with Vue 3 UI
- [cli](systems/cli/_index.md) - Node.js CLI toolkit with scripts and skills

## Conventions

- [file-naming](conventions/file-naming.md) - PascalCase components, kebab-case features
- [error-handling](conventions/error-handling.md) - Try-catch with graceful defaults
