---
id: "systems/gui"
title: "GUI System"
type: system
summary: "Electron + Vue desktop application for visual kanban management with embedded Claude Code terminal"
keywords: [electron, vue, gui, desktop, terminal, pty]
related: ["systems/kanban", "patterns/ipc-bridge"]
paths: ["apps/gui/"]
updated: 2026-02-17
---

# GUI System

## Overview

The GUI system is an Electron + Vue 3 desktop application that provides a visual interface for kanban task management. It embeds Claude Code via PTY (pseudo-terminal) to enable AI-assisted workflow execution directly within the app. The GUI reads task files from `.kanban/tasks/` and displays them in a kanban board layout.

## Components

| Component | Purpose |
|-----------|---------|
| Main Process | Electron main process handling window, IPC, and PTY service |
| Preload | Context bridge exposing safe APIs to renderer |
| App | Application-level orchestrator and settings |
| Tasks | Task listing, selection, and content display |
| Terminal | PTY integration with xterm.js |
| Settings | Persistent settings via electron-store |
| UI | Reusable UI components (shadcn-vue style) |

## Architecture Pattern

The GUI uses a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    Vue Components                        │
├─────────────────────────────────────────────────────────┤
│  Providers (provide/inject)                              │
├─────────────────────────────────────────────────────────┤
│  Orchestrators (state coordination)                      │
├───────────────────────┬─────────────────────────────────┤
│  Capabilities (IPC)   │    Computers (pure functions)    │
└───────────────────────┴─────────────────────────────────┘
```

### Layer Responsibilities

1. **Providers** (`*.provider.ts`) - Vue provide/inject wrappers using `createContext()` utility
2. **Orchestrators** (`*.orchestrator.ts`) - Coordinate state, combine capabilities and computers
3. **Capabilities** (`*.capability.ts`) - Wrap external APIs (Electron IPC, file system)
4. **Computers** (`*.computer.ts`) - Pure computation functions (grouping, filtering, actions)

## Key Patterns

- [IPC Bridge Pattern](../../patterns/ipc-bridge.md) - Safe Electron main/renderer communication
- Provider Pattern - Vue 3 provide/inject with typed contexts

## Interactions

- Reads task files from `.kanban/tasks/` directory
- Spawns Claude Code process via PTY for AI interactions
- Uses electron-store for persistent settings (project path, panel sizes)

## Directory Structure

```
apps/gui/
├── electron/
│   ├── main/
│   │   ├── index.ts      # Window creation, IPC handlers
│   │   └── pty-service.ts # PTY management for Claude
│   └── preload/
│       └── index.ts      # Context bridge
└── src/
    ├── main.ts           # Vue app entry
    ├── App.vue           # Root component
    ├── lib/
    │   └── utils.ts      # cn(), createContext()
    ├── app/
    │   ├── app.orchestrator.ts
    │   └── app.provider.ts
    ├── tasks/
    │   ├── task-types.ts
    │   ├── tasks-api.capability.ts
    │   ├── task-actions.computer.ts
    │   ├── task-grouping.computer.ts
    │   ├── tasks.orchestrator.ts
    │   └── tasks.provider.ts
    ├── terminal/
    │   └── (same pattern)
    ├── settings/
    │   └── (same pattern)
    └── components/
        ├── TaskList.vue
        ├── TaskDetail.vue
        ├── TerminalPanel.vue
        ├── ProjectPicker.vue
        └── ui/           # Reusable components
            ├── button/
            ├── card/
            ├── badge/
            └── ...
```
