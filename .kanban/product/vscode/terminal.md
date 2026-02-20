---
id: "vscode/terminal"
title: "Terminal Integration"
type: feature
tldr: "Integrated terminal for executing Claude kanban commands"
summary: "Manages VSCode integrated terminal for running Claude CLI kanban commands. Handles terminal lifecycle, command sending, and output buffering."
keywords: [terminal, cli, claude, commands, integration]
aliases: [terminal-capability, command-execution]
boundary: "Does NOT process command output; just sends and displays"
related: [vscode/codelens, vscode/kanban-view]
updated: 2026-02-20
---

# Terminal Integration

> **TL;DR:** Integrated terminal for executing Claude kanban commands

## Overview

Terminal Integration manages the VSCode integrated terminal for running kanban commands. It creates/reuses a dedicated terminal, sends commands like `/kanban-scope 001`, and handles terminal lifecycle. All kanban actions execute through this capability.

**Summary:** Bridge between VSCode UI and Claude CLI.

## How It Works

1. Action triggered (CodeLens click, command palette)
2. Terminal capability finds or creates terminal
3. Sends command text to terminal
4. Terminal shows Claude CLI interaction
5. File watcher detects changes and refreshes UI

### Key Workflows

**Terminal lifecycle:**
- Created on first action
- Reused for subsequent actions
- Named "Claude Kanban" for identification

**Command execution:**
- Commands sent as text input
- Format: `claude "/kanban-{action} {id}"`
- Claude CLI handles the rest

**Summary:** Managed terminal for Claude command execution.

## Examples

### Typical Usage

```
// User clicks "Scope" on task 003

// Terminal opens/focuses with:
$ claude "/kanban-scope 003"

// Claude CLI executes the scoping workflow
Scoping task 003 "Add dark mode toggle"...
```

### Create Task via Command Palette

```
// User runs "Kanban: Create Task"
// Input box appears: "Enter task title"
// User enters: "Fix login redirect bug"

// Terminal runs:
$ claude "/kanban-create Fix login redirect bug"
```

**Summary:** Commands executed via Claude CLI in terminal.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Parse command output
- **Does NOT:** Run commands without Claude CLI
- **Does NOT:** Provide interactive prompts (Claude handles that)

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Terminal name | Name for dedicated terminal | Claude Kanban |

## Interactions

- **CodeLens**: Triggers command execution
- **Create task**: Uses input box then terminal
- **All actions**: Route through terminal

## Limitations

- Requires Claude CLI installed
- No output parsing (relies on file changes)
- One terminal shared for all commands
