---
id: "gui/terminal"
title: "Terminal"
type: feature
tldr: "Right panel with integrated xterm.js terminal for command execution"
summary: "Pseudo-terminal panel that executes workflow commands from task actions, streams output in real-time, and reports exit status"
keywords: [terminal, pty, xterm, command-execution, output]
aliases: [terminal-panel, right-panel, command-runner]
boundary: "Does not determine what commands to run - receives commands from task actions"
related: [gui/task-detail, gui/autoplay]
updated: 2026-02-19
---

# Terminal

> **TL;DR:** Right panel with integrated xterm.js terminal for command execution

## Overview

Terminal allows users to execute workflow commands with visible output. This is important because it provides transparency into what Claude is doing and allows users to see command results in real-time.

**Summary:** Real-time command execution and output display panel.

## How It Works

1. User clicks "Run" on a task action
2. System spawns PTY process in project directory
3. Result: Command output streams to terminal, exit code reported

### Key Workflows

**Running a Command:**
- Click action button in Task Detail
- Terminal spawns PTY with command
- Output streams in real-time
- Exit code shown when complete

**After Command Completion:**
- Terminal displays exit status (success/failure)
- Task list refreshes to show updated status
- If autoplay enabled, next action runs automatically

**Summary:** Commands run in PTY with real-time output and status reporting.

## Examples

### Typical Usage

```
$ claude --dangerously-skip-permissions /kanban-scope TASK-003

[Claude Code output...]

Scope complete. Task moved to Scoped.

─────────────────────────────────
Exit: 0 (success)
```

### Edge Case: Command Failure

```
$ claude --dangerously-skip-permissions /kanban-codecheck TASK-003

[Test output...]

FAILED: 2 tests failed

─────────────────────────────────
Exit: 1 (error)
```

**Summary:** Commands show real-time output with clear exit status.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Determine what commands to run (receives from Task Detail)
- **Does NOT:** Support multiple terminal sessions simultaneously
- **Does NOT:** Provide shell access (only runs task commands)

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Panel size | Width of terminal panel | Persisted per session |
| Auto-resize | Terminal dimensions match panel size | Enabled |

## Interactions

- **Task Detail**: Receives commands when action buttons clicked
- **Autoplay**: Triggers next command on successful exit (if enabled)
- **Task List**: Triggers refresh after command completion

## Limitations

- Single terminal only (no split or multiple terminals)
- Commands run in project directory (cannot change directory)
- Manual retry required on failure (no automatic retry)
- Terminal clears between commands
