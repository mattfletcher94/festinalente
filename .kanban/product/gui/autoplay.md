---
id: "gui/autoplay"
title: "Autoplay"
type: feature
tldr: "Automatic sequential command execution until review phases"
summary: "When enabled, automatically runs the next workflow action after successful command completion, stopping at review phases that require human approval"
keywords: [autoplay, automation, sequential, review-gates, hands-off]
aliases: [auto-run, continuous-execution, workflow-automation]
boundary: "Does not skip review phases - always stops for human approval"
related: [gui/task-detail, gui/terminal]
updated: 2026-02-19
---

# Autoplay

> **TL;DR:** Automatic sequential command execution until review phases

## Overview

Autoplay allows users to progress tasks through multiple workflow steps hands-off. This is important because it saves time by automatically running sequential commands without requiring manual intervention at each step.

**Summary:** Time-saving automation that progresses tasks through workflow until human review is needed.

## How It Works

1. User enables autoplay toggle in Task Detail
2. User runs first command
3. Result: Subsequent commands run automatically until a review phase

### Key Workflows

**Enabling Autoplay:**
- Select task in Task List
- Toggle autoplay switch in Task Detail
- Run initial command
- Commands continue automatically

**Review Phase Stops:**
- Autoplay stops at: codecheck, qa, pr
- User reviews results
- User manually triggers next action

**Summary:** Enable toggle, run first command, watch automation progress.

## Examples

### Typical Usage

```
[✓] Autoplay enabled

Running: kanban-scope TASK-003
  → Exit: 0 (success)
  → Auto-running next: kanban-plan TASK-003

Running: kanban-plan TASK-003
  → Exit: 0 (success)
  → Auto-running next: kanban-implement TASK-003

Running: kanban-implement TASK-003
  → Exit: 0 (success)
  → STOPPED: Review phase (codecheck) reached

Awaiting human review...
```

### Edge Case: Command Fails

```
[✓] Autoplay enabled

Running: kanban-implement TASK-003
  → Exit: 1 (error)
  → STOPPED: Command failed

Autoplay paused. Fix error and retry manually.
```

**Summary:** Autoplay progresses through successful commands, stops at failures or reviews.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Skip review phases (codecheck, qa, pr always require manual approval)
- **Does NOT:** Persist between sessions (autoplay state is session-only)
- **Does NOT:** Retry failed commands automatically

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Autoplay toggle | Per-task session state | Off |
| Review phases | Hardcoded: codecheck, qa, pr | Not configurable |

## Interactions

- **Task Detail**: Provides autoplay toggle control
- **Terminal**: Triggers next command on successful exit

## Limitations

- Session-only state (resets when app closes)
- Cannot customize which phases stop autoplay
- Single task at a time (no parallel task autoplay)
- Manual intervention required on any failure
