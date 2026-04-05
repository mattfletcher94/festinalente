---
id: vscode/codelens
title: "CodeLens Actions"
type: feature
tldr: "Inline action buttons on task.xml files based on current status"
summary: "CodeLens provides clickable action buttons above task.xml content that show only valid next-step commands for the task's current status."
keywords: [codelens, actions, inline, buttons, status-aware]
aliases: [inline-actions, task-actions]
boundary: "Does not show actions on non-task files"
references: []
uses: [systems/vscode-extension]
intent: procedural
prerequisites: []
---

# CodeLens Actions

> **TL;DR:** Inline action buttons on task.xml files based on current status

## Overview

When viewing a task.xml file, CodeLens shows clickable action buttons above the content. Actions are context-aware - only valid commands for the current status appear.

**Summary:** One click to run the right command.

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

## Status-Based Actions

| Status | Available Actions |
|--------|-------------------|
| backlog | Scope |
| scoped | Plan |
| planned | Implement |
| in-progress | Implement (resume) |
| finalize | Finalize, Rework |
| done | (none) |

## UI Example

```
[▶ Scope] [📋 View Plan]
<task id="001" status="backlog">
  <title>Add user authentication</title>
  ...
```

## Boundaries

- **Does NOT:** Appear on spec.xml or plan.xml
- **Does NOT:** Show invalid actions for current status
