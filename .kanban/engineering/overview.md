---
id: overview
title: "Claude Kanban Monorepo Engineering Overview"
type: overview
summary: "High-level technical overview of the Claude Kanban task management system"
keywords: [architecture, tech-stack, overview, monorepo, typescript, vue, electron]
related: ["systems/kanban", "systems/gui", "patterns/ipc-bridge", "patterns/handlebars-partials", "conventions/file-naming", "conventions/component-structure"]
paths: ["apps/", ".kanban/"]
updated: 2026-02-17
---

# Claude Kanban Monorepo Engineering Overview

## Tech Stack

| Category | Technology |
|----------|------------|
| Language | TypeScript |
| Frontend Framework | Vue 3 (Composition API) |
| Desktop Framework | Electron |
| Build Tools | Vite, tsdown, Turborepo |
| Package Manager | pnpm (workspace) |
| Styling | Tailwind CSS 4 |
| UI Components | Reka UI (headless) |
| Terminal | xterm.js + node-pty |
| Template Engine | Handlebars (for skill compilation) |

## Architecture Summary

This is a pnpm monorepo with two apps: `claude-kanban` (CLI skill/template system for Claude Code) and `claude-kanban-gui` (Electron desktop app). The kanban app provides markdown-based skills and templates that are compiled with Handlebars and installed into projects. The GUI app provides a visual interface for managing kanban tasks with an integrated Claude terminal.

## Directory Structure

```
claudeban/
├── apps/
│   ├── kanban/           # CLI tool - skill compilation and installation
│   │   ├── bin/          # Installation scripts
│   │   ├── src/
│   │   │   ├── content/  # Source markdown (skills, templates, partials)
│   │   │   └── scripts/  # Helper scripts (find-task, list-tasks, etc.)
│   │   └── tools/        # Build tool (Handlebars compilation)
│   └── gui/              # Electron desktop application
│       ├── electron/     # Main process and preload scripts
│       │   ├── main/     # Electron main (IPC handlers, PTY service)
│       │   └── preload/  # Context bridge (exposes API to renderer)
│       └── src/          # Vue 3 renderer
│           ├── components/  # Vue components (TaskList, TaskDetail, Terminal)
│           └── lib/         # Utilities
├── .kanban/              # Installed kanban data (skills, templates, tasks)
├── turbo.json            # Turborepo configuration
└── pnpm-workspace.yaml   # pnpm workspace config
```

## Key Patterns

- [ipc-bridge](patterns/ipc-bridge.md) - Electron IPC pattern with contextBridge for secure renderer-main communication
- [handlebars-partials](patterns/handlebars-partials.md) - Skill templates composed via Handlebars partials

## Systems

- [kanban](systems/kanban/index.md) - CLI tool for skills, templates, and helper scripts
- [gui](systems/gui/index.md) - Electron desktop app with Vue frontend and terminal integration

## Conventions

- [file-naming](conventions/file-naming.md) - Kebab-case files, PascalCase Vue components
- [component-structure](conventions/component-structure.md) - Vue Composition API with script setup
