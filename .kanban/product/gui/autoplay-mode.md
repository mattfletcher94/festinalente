---
id: "gui/autoplay-mode"
title: "Autoplay Mode"
type: feature
summary: "Automatically runs the next kanban phase command when the current one completes, enabling hands-off task progression."
keywords: [autoplay, automation, workflow, phases, toggle]
related: []
updated: 2026-02-18
---

# Autoplay Mode

## Overview

Autoplay Mode allows users to automatically run the next kanban phase command when the current command completes. This is important because it eliminates tedious manual triggering of each phase, letting users focus on other work while tasks progress through phases automatically.

## How It Works

1. User selects a task and enables the autoplay toggle in the task detail pane
2. System runs the current phase command
3. When the command completes successfully, the system automatically runs the next available action
4. Result: Task progresses through phases without manual intervention until reaching a review phase

### Key Workflows

**Enabling Autoplay:**
- Open a task in the task detail pane
- Locate the autoplay toggle in the "Next Up" section header
- Enable the toggle to activate autoplay for that task

**Automatic Phase Progression:**
- Run a kanban command (e.g., /kanban-scope)
- Command completes successfully
- Next command (e.g., /kanban-plan) runs automatically

**Review Phase Stop:**
- Task reaches codecheck, qa, or pr phase
- Autoplay stops and waits for manual review
- User can approve or trigger rework to continue

## Key Concepts

- **Review Phases**: Phases that stop autoplay because they require human judgment: codecheck, qa, pr
- **Session State**: Autoplay state is per-task and session-only; it resets when the application closes

## Interactions

- **Task Selection**: Each task maintains its own autoplay state; switching tasks preserves settings
- **Command Execution**: Autoplay triggers immediately on successful command completion (exit code 0)

## Limitations

- Autoplay state is not persisted across sessions
- Not available during task creation (kanban-create)
- Only one task can be auto-playing at a time (the currently selected task)
- Commands must complete successfully for autoplay to continue
