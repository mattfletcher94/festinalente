---
id: gui/terminal
title: "Embedded Terminal"
type: feature
summary: "Right panel with xterm.js terminal running Claude Code commands via node-pty"
keywords: [terminal, xterm, node-pty, claude-code, embedded, command]
related: [gui/desktop-app, gui/task-detail]
updated: 2026-02-17
---

# Embedded Terminal

## Overview

The Embedded Terminal is the right panel that provides a full terminal interface running Claude Code. Commands can be triggered via action buttons or typed directly.

## How It Works

1. App spawns Claude Code via node-pty in the project directory
2. Terminal displays Claude's output in xterm.js
3. User can type commands or use action buttons
4. Terminal detects `[KANBAN_COMPLETE]` marker to signal command completion
5. On completion, terminal exits and task list refreshes

### Command Execution

**Via action buttons:**
1. User clicks action button in task detail
2. App spawns `claude [command]` with the slash command
3. Terminal shows output
4. On `[KANBAN_COMPLETE]`, process exits

**Manual typing:**
- User can type any text/commands into terminal
- Standard terminal interaction with Claude Code

## Key Concepts

- **node-pty**: Node.js pseudo-terminal for spawning Claude
- **xterm.js**: Terminal emulator rendering in browser
- **KANBAN_COMPLETE marker**: Signal that skill finished successfully
- **Auto-exit**: Terminal process exits when skill completes

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| cols | Terminal columns | 80 |
| rows | Terminal rows | 24 |

## Interactions

- **Task Detail**: Receives commands from action buttons
- **Task List**: Triggers refresh on command completion
- **PTY Service**: Manages Claude process lifecycle

## Limitations

- One command at a time (busy while running)
- Terminal must be killed if command hangs
- Requires Claude Code CLI installed globally
