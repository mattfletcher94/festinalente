---
id: "vscode/terminal"
title: "Terminal Integration"
type: feature
tldr: "Integrated terminal for executing Claude kanban commands with autoplay support"
summary: "Manages VSCode integrated terminal for running Claude CLI kanban commands. Creates fresh terminal for each action and supports autoplay for single-path workflow transitions."
keywords: [terminal, cli, claude, commands, integration, fresh, context, autoplay, pseudoterminal]
aliases: [terminal-capability, command-execution, autoplay]
boundary: "Autoplay only for single-path statuses; multi-choice statuses require manual action"
related: [vscode/codelens, vscode/kanban-view]
updated: 2026-02-24
verified: 2026-02-24
code_refs:
  - apps/vscode/src/terminal/kanban-terminal.ts
  - apps/vscode/src/capabilities/terminal.capability.ts
  - apps/vscode/src/extension.ts
---

# Terminal Integration

> **TL;DR:** Integrated terminal for executing Claude kanban commands with autoplay support

## Overview

Terminal Integration manages the VSCode integrated terminal for running kanban commands. It uses a pseudoterminal to intercept output, detect completion markers, and optionally auto-trigger the next workflow action. Fresh terminals are created for each action to ensure clean Claude context.

**Summary:** Bridge between VSCode UI and Claude CLI with context isolation and autoplay support.

## How It Works

1. Action triggered (CodeLens click, command palette)
2. Pseudoterminal spawns Claude CLI process
3. Output intercepted and displayed in terminal
4. Completion marker `[KANBAN_COMPLETE]` detected in output
5. If autoplay enabled, next action auto-triggered after delay
6. File watcher detects changes and refreshes UI

### Key Workflows

**Terminal lifecycle:**
- Fresh pseudoterminal created for each action
- Named "Kanban: {taskId}" for identification
- Spawns Claude CLI as child process
- Intercepts stdout/stderr for marker detection
- Disposed automatically when process exits

**Command execution:**
- Commands run via pseudoterminal
- Format: `claude "/kanban-{action} {id}"`
- Claude CLI handles the rest

**Autoplay (when enabled):**
- Detects `[KANBAN_COMPLETE]` marker in output
- Waits 1.5 seconds for user visibility
- Re-reads task.xml to get current status
- Auto-triggers next action for single-path statuses
- Stops for multi-choice statuses (user must decide)

**Summary:** Managed terminal for Claude command execution with autoplay.

## Examples

### Typical Usage

```
// User clicks "Scope" on task 003

// Terminal opens/focuses with:
$ claude "/kanban-scope 003"

// Claude CLI executes the scoping workflow
Scoping task 003 "Add dark mode toggle"...
```

### Autoplay in Action

```
// User clicks "Implement" on task 005 with autoplay enabled
// Status bar shows: "$(sync~spin) Autoplay: task 005"

$ claude "/kanban-implement 005"
// Claude implements the feature...
[KANBAN_COMPLETE]

// 1.5 second delay for visibility
// Fresh terminal created automatically

$ claude "/kanban-codecheck 005"
// Claude runs code checks...
[KANBAN_COMPLETE]

// Autoplay STOPS here - codecheck has approve/rework choice
// User must manually click Approve or Rework
```

### Create Task via Command Palette

```
// User runs "Kanban: Create Task"
// Input box appears: "Enter task title"
// User enters: "Fix login redirect bug"

// Terminal runs:
$ claude "/kanban-create Fix login redirect bug"
```

**Summary:** Commands executed via Claude CLI in terminal with optional autoplay.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Autoplay for multi-choice statuses (codecheck, qa, pr)
- **Does NOT:** Handle interactive input (skills run non-interactively)
- **Does NOT:** Run commands without Claude CLI
- **Does NOT:** Provide interactive prompts (Claude handles that)

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `kanban.autoplay` | Auto-trigger next action after completion | false |
| Terminal name | Name for dedicated terminal | Kanban: {taskId} |

### Single-Path vs Multi-Choice Statuses

Autoplay only triggers for statuses with a single next action:

| Status | Autoplay | Reason |
|--------|----------|--------|
| planned | Yes | Single action: Implement |
| in-progress | Yes | Primary action: Continue |
| update-docs | Yes | Single action: (next step) |
| codecheck | No | Choice: Approve or Rework |
| qa | No | Choice: Approve or Rework |
| pr | No | Choice: Merge or Rework |

## Interactions

- **CodeLens**: Triggers command execution
- **Create task**: Uses input box then terminal
- **All actions**: Route through terminal

## Limitations

- Requires Claude CLI installed
- Terminal history cleared between actions (by design for context isolation)
- Autoplay stops on non-zero exit code (error stops the chain)
- User closing terminal stops any autoplay in progress
