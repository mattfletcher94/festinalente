---
id: "systems/gui"
title: "GUI Desktop System"
type: system
summary: "Electron desktop app with Vue 3 frontend providing visual kanban management with integrated Claude terminal"
keywords: [electron, vue, desktop, terminal, pty, xterm]
related: ["patterns/ipc-bridge", "systems/kanban"]
paths: ["apps/gui/"]
updated: 2026-02-17
---

# GUI Desktop System

## Overview

The GUI system is an Electron desktop application that provides a visual interface for managing kanban tasks. It features a three-panel resizable layout with task list, task details, and an integrated Claude terminal powered by node-pty and xterm.js.

## Components

| Component | Purpose |
|-----------|---------|
| [main-process](main-process.md) | Electron main process with IPC handlers and PTY service |
| [preload](preload.md) | Context bridge exposing secure API to renderer |
| [renderer](renderer.md) | Vue 3 application with UI components |

## Key Patterns

- **IPC Bridge**: Uses Electron's contextBridge for secure main/renderer communication
- **PTY Service**: Spawns Claude CLI in pseudo-terminal for interactive sessions
- **Composition API**: All Vue components use `<script setup>` with ref/reactive

## Layout Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     ResizablePanelGroup                       │
├─────────────┬─────────────────────────┬──────────────────────┤
│  TaskList   │      TaskDetail         │   TerminalPanel      │
│  (15-30%)   │      (25%+ min)         │   (25%+ min)         │
│             │                         │                      │
│  - Task     │  - Task/Spec/Plan tabs  │  - xterm.js          │
│    cards    │  - Markdown content     │  - Claude CLI        │
│  - Actions  │  - Action buttons       │  - PTY integration   │
└─────────────┴─────────────────────────┴──────────────────────┘
```

## State Flow

1. **Project Selection**: User selects project folder with `.kanban/` directory
2. **Task Loading**: Tasks loaded from `.kanban/tasks/*/task.md` via IPC
3. **Task Selection**: Selected task displayed in TaskDetail panel
4. **Command Execution**: Actions trigger Claude CLI commands in terminal
5. **Refresh Cycle**: Terminal completion triggers task list refresh

## IPC Channels

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `dialog:openProject` | Renderer→Main | Open folder picker |
| `pty:spawn/runCommand` | Renderer→Main | Start PTY with Claude |
| `pty:data/exit` | Main→Renderer | PTY output and exit events |
| `tasks:list/read` | Renderer→Main | Task file operations |
| `settings:get/set` | Renderer→Main | Persist user preferences |

## Interactions

- **Kanban System**: Reads task files created by kanban templates
- **Claude CLI**: Spawns Claude in terminal and runs kanban slash commands
