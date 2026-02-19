---
id: "systems/gui"
title: "GUI System"
type: system
tldr: "Electron desktop app with Vue 3 kanban board and integrated Claude terminal"
summary: "Desktop application providing visual task management and Claude Code integration"
keywords: [electron, vue, desktop, terminal, pty, kanban]
aliases: [desktop-app, electron-app]
boundary: "Does not handle CLI scripts or skill execution logic"
related:
  - systems/cli
  - patterns/orchestrator
  - patterns/capability
  - patterns/computer
paths:
  - apps/gui
updated: 2026-02-19
verified: 2026-02-19
code_refs:
  - apps/gui/electron/main/index.ts
  - apps/gui/src/main.ts
  - apps/gui/src/App.vue
---

# GUI System

> **TL;DR:** Electron desktop app with Vue 3 kanban board and integrated Claude terminal

## Overview

The GUI system is an Electron desktop application that provides a visual kanban board for task management with an integrated terminal for running Claude Code commands. It bridges user interactions with the Claude CLI through PTY, providing real-time task updates and autoplay workflows.

**Why it exists:** Users need a visual interface to manage tasks while maintaining full access to Claude's AI capabilities. The integrated terminal eliminates context switching between a separate terminal and task management.

**Summary:** Desktop kanban board with embedded Claude terminal.

## Components

| Component | Purpose | File |
|-----------|---------|------|
| [main-process](./main-process.md) | Electron main process, window management, IPC | `apps/gui/electron/main/` |
| [renderer](./renderer.md) | Vue 3 application, UI components | `apps/gui/src/` |
| [pty-service](./pty-service.md) | PTY management for Claude CLI | `apps/gui/electron/main/pty-service.ts` |

**Summary:** Main process handles system operations, renderer handles UI, PTY bridges to Claude.

## Key Patterns

This system follows these patterns from `patterns/`:

- [orchestrator](../../patterns/orchestrator.md) - State management layer coordinating features
- [capability](../../patterns/capability.md) - IPC abstraction between renderer and main
- [computer](../../patterns/computer.md) - Pure business logic calculations
- [provider](../../patterns/provider.md) - Vue dependency injection for orchestrators

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Vue Components (UI Layer)                                  │
│  TaskList, TaskDetail, TerminalPanel, ProjectPicker        │
└────────────────┬────────────────────────────────────────────┘
                 │ inject()
┌─────────────────▼────────────────────────────────────────────┐
│  Orchestrators (State Management)                           │
│  AppOrchestrator, TasksOrchestrator, TerminalOrchestrator  │
└────┬─────────────┬──────────────────────────────────────────┘
     │             │
┌────▼──┐  ┌──────▼───────┐
│Comput-│  │ Capabilities │
│ers    │  │ (IPC Bridge) │
├────────┤  ├───────────────┤
│TaskAct-│  │TasksAPI       │
│ions    │  │Settings       │
│TaskGrp │  │PTY            │
│TermCmd │  │HookConfig     │
└────────┘  └───────────────┘
                   │ electronAPI
         ┌─────────▼──────────┐
         │  Electron Main     │
         │  IPC Handlers      │
         │  PTY Service       │
         └─────────┬──────────┘
                   │
         ┌─────────▼──────────┐
         │  File System       │
         │  (.kanban/)        │
         └────────────────────┘
```

## Data Flow

```
User Click → Vue Component → Orchestrator → Capability → IPC → Main Process → PTY/FileSystem
                                                                      ↓
UI Update ← Orchestrator ← Capability ← IPC ← Main Process ← PTY output/File data
```

## Interactions

| System | Relationship | Notes |
|--------|--------------|-------|
| [cli](../cli/index.md) | Executes CLI scripts via PTY | Terminal runs `/kanban-*` commands |
| File System | Reads/writes task XML | Via IPC handlers in main process |

**Summary:** GUI executes CLI commands via PTY and reads/writes task files via IPC.

## Boundaries

What this system does NOT handle:

- **Does NOT:** Execute skill logic -> See [cli](../cli/index.md)
- **Does NOT:** Parse skill templates -> Handled by Claude Code
- **Does NOT:** Manage git operations -> Delegated to Claude via terminal

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| projectPath | Active project directory | null |
| panelSizes | UI panel width percentages | `{taskList: 20, taskDetail: 40, terminal: 40}` |

## Known Issues

- Path traversal vulnerability in IPC handlers (validation needed)
- No caching for task list reads
- Hardcoded terminal dimensions (80x24)
