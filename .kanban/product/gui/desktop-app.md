---
id: gui/desktop-app
title: "Desktop Application"
type: feature
summary: "Optional Electron app providing visual task management with embedded Claude Code terminal"
keywords: [gui, electron, desktop, app, terminal, vue, visual]
related: [gui/task-list, gui/task-detail, gui/terminal]
updated: 2026-02-17
---

# Desktop Application

## Overview

The Desktop Application is an optional Electron app that provides a visual interface for Claude Kanban. It combines a task list, task detail view, and embedded terminal in a resizable three-panel layout.

## How It Works

1. User launches the app and selects a project directory (must have `.kanban/` folder)
2. App displays tasks grouped by workflow status in the left panel
3. Clicking a task shows its content in the middle panel
4. Right panel has embedded terminal that runs Claude Code commands
5. Panel sizes are persisted across sessions

### Key Workflows

**Running a command:**
1. Select a task from the list
2. View the "Next Up" section showing available workflow actions
3. Each action shows an explanation of what it does
4. If directives are configured for the action, they appear as a comma-separated list
5. Click "Run" to execute the action in the embedded terminal
6. Task list auto-refreshes when command completes

## Key Concepts

- **Project path**: Directory containing `.kanban/` folder
- **Resizable panels**: Three-panel layout with draggable dividers
- **Embedded terminal**: xterm.js terminal running Claude Code via node-pty
- **Next Up section**: Shows available workflow actions with explanations and associated directives
- **Directives**: Custom instructions configured in `.kanban/config.yaml` that influence workflow actions

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `projectPath` | Last opened project directory | `null` |
| `panelSizes` | Width percentages for each panel | `{20, 40, 40}` |

## Interactions

- **CLI**: GUI runs the same slash commands as direct CLI usage
- **Task files**: GUI reads task/spec/plan markdown files directly

## Limitations

- Requires `.kanban/` folder to exist in project
- GUI is optional; CLI works standalone without it
- Single project at a time (no multi-project view)
