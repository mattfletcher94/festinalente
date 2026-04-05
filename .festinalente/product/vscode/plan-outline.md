---
id: vscode/plan-outline
title: "Plan Outline Navigation"
type: feature
tldr: "Document outline showing plan tasks for quick navigation"
summary: "The plan outline provider shows plan.xml tasks in VSCode's outline view, enabling quick navigation to specific implementation steps."
keywords: [outline, navigation, plan, tasks, symbols]
aliases: [plan-navigation, outline-view]
boundary: "Only provides navigation - does not execute tasks"
references: []
uses: [systems/vscode-extension]
intent: procedural
prerequisites: []
---

# Plan Outline Navigation

> **TL;DR:** Document outline showing plan tasks for quick navigation

## Overview

When viewing plan.xml, the outline panel shows each task as a navigable symbol. Click to jump directly to that task's definition.

**Summary:** Navigate plans quickly via outline.

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

## Outline Structure

```
OUTLINE
├── Task 1: Create auth routes
├── Task 2: Add login endpoint
├── Task 3: Add logout endpoint
└── Task 4: Write tests
```

## Features

- **Completion status**: Icons show completed vs pending
- **Click to navigate**: Jump to task definition
- **Task dependencies**: Grouped by dependency order

## Boundaries

- **Does NOT:** Work on task.xml or spec.xml
- **Does NOT:** Execute plan tasks
