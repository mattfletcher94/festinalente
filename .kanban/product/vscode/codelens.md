---
id: "vscode/codelens"
title: "CodeLens Actions"
type: feature
tldr: "Inline action links above task.xml files"
summary: "VSCode CodeLens provider showing available kanban actions as clickable links above task.xml content. Actions are context-aware based on task status."
keywords: [codelens, actions, inline, task, commands]
aliases: [task-actions, inline-actions]
boundary: "Does NOT show on spec.xml or plan.xml; only task.xml files"
related: [vscode/kanban-view, vscode/terminal, tasks/workflow]
updated: 2026-02-20
---

# CodeLens Actions

> **TL;DR:** Inline action links above task.xml files

## Overview

CodeLens Actions adds clickable action links above task.xml file content. Actions are context-aware: a backlog task shows "Scope", a planned task shows "Implement", etc. Clicking an action runs the corresponding kanban command via terminal.

**Summary:** Status-aware quick actions for task workflow.

## How It Works

1. User opens a task.xml file
2. CodeLens provider parses task status
3. Computes available actions based on status
4. Displays actions as clickable links above content
5. Click runs command via terminal capability

### Key Workflows

**Action mapping by status:**
- backlog → Scope
- scoped → Plan
- planned → Implement
- in-progress → Codecheck, Save
- codecheck → (automatic)
- qa → Approve, Rework
- pr → Merge, Rework

**Action click flow:**
1. User clicks action link
2. Terminal opens/focuses
3. Command sent: `/kanban-{action} {id}`
4. Claude executes command

**Summary:** Status-based actions executed via terminal.

## Examples

### Typical Display

```
// In task.xml for a backlog task:

[Scope] [Delete]
────────────────────
<task id="003" status="backlog">
  <title>Add dark mode toggle</title>
  ...
</task>
```

```
// In task.xml for an in-progress task:

[Codecheck] [Save]
────────────────────
<task id="001" status="in-progress">
  <title>Add localStorage persistence</title>
  ...
</task>
```

**Summary:** Actions change based on task status.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Show on spec.xml or plan.xml
- **Does NOT:** Execute commands directly (uses terminal)
- **Does NOT:** Show custom actions

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| - | No specific configuration | - |

## Interactions

- **Terminal**: Executes commands on click
- **Kanban view**: Refreshes after action
- **Task files**: Parses status for actions

## Limitations

- Only works on task.xml files
- Actions are fixed per status (not customizable)
- Requires terminal for execution
