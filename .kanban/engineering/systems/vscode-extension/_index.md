---
id: "systems/vscode-extension"
title: "VSCode Extension"
type: system
tldr: "Visual task management UI with TreeView, CodeLens, and terminal integration"
summary: "VSCode extension providing visual interface for Claude Kanban task management"
keywords: [vscode, extension, ui, treeview, codelens, terminal, distribution, npx, install]
aliases: [vscode, extension, ui]
boundary: "Does not implement data logic - delegates to CLI scripts"
related:
  - systems/cli
  - systems/storage
  - systems/distribution
  - patterns/capability-computer
paths:
  - apps/vscode/src
  - apps/vscode/bin
updated: 2026-02-21
verified: 2026-02-21
code_refs:
  - apps/vscode/src/extension.ts
  - apps/vscode/src/capabilities/tasks-view.capability.ts
  - apps/vscode/src/capabilities/terminal.capability.ts
  - apps/vscode/src/capabilities/config-view.capability.ts
  - apps/vscode/src/computers/task-parser.computer.ts
  - apps/vscode/bin/install.cjs
  - apps/vscode/package.json
---

# VSCode Extension

> **TL;DR:** Visual task management UI with TreeView, CodeLens, and terminal integration

## Overview

The VSCode extension provides a visual interface for Claude Kanban. It renders tasks in a TreeView panel, adds CodeLens actions to task files, and executes kanban commands via integrated terminal. The extension follows a three-layer architecture: Orchestrator, Capabilities, and Computers.

**Why it exists:** Provides a visual UI for task management while delegating data operations to CLI scripts, maintaining clean separation of concerns.

**Summary:** Visual interface layer that renders data and triggers CLI commands.

## Architecture Layers

### Orchestrator Layer

The `extension.ts` file acts as the orchestrator, making policy decisions (when/whether to act) and coordinating between capabilities and computers.

| Responsibility | Description |
|----------------|-------------|
| Activation | Starts on `onStartupFinished`, initializes all capabilities |
| File monitoring | Watches `.kanban/tasks/**/*.xml` for changes |
| Command routing | Routes VSCode commands to appropriate handlers |
| Composition | Wires capabilities and computers together |

**File:** `apps/vscode/src/extension.ts`

### Capabilities Layer (Mechanism/How)

Capabilities handle I/O and side effects. They wrap VSCode APIs and file system operations.

| Component | Purpose | File |
|-----------|---------|------|
| file-system | File I/O wrapper (read, write, exists) | `capabilities/file-system.capability.ts` |
| tasks-view | TreeView rendering and management | `capabilities/tasks-view.capability.ts` |
| terminal | Terminal lifecycle (fresh per action) | `capabilities/terminal.capability.ts` |
| codelens | CodeLens provider for quick actions | `capabilities/codelens.capability.ts` |
| config-view | TreeView for config.yaml access | `capabilities/config-view.capability.ts` |

#### TreeItem Types in tasks-view

The tasks-view capability defines these TreeItem types:

| TreeItem | Parent | Purpose |
|----------|--------|---------|
| StatusGroupItem | root | Column header (e.g., "Backlog", "In Progress") |
| TaskItem | StatusGroupItem | Task entry with ID, title, priority, label |
| ActionItem | TaskItem | Workflow action (primary: green play, secondary: orange reply) |
| FileItem | TaskItem | Task file (task.xml, spec.xml, plan.xml) |

ActionItems appear as the first children when expanding a TaskItem (unless task is in "done" status). Tasks may have multiple actions: primary action (index 0) uses green play icon, secondary actions (index > 0) use orange reply icon.

#### TreeItem Types in config-view

The config-view capability defines:

| TreeItem | Parent | Purpose |
|----------|--------|---------|
| ConfigItem | root | Config file entry (gear icon, click-to-open) |

ConfigItem uses `kanban.openFile` command to open config.yaml in editor.

### Computers Layer (Pure Functions)

Computers contain pure functions with no side effects. They transform data.

| Component | Purpose | File |
|-----------|---------|------|
| task-parser | Parses XML task files using fast-xml-parser | `computers/task-parser.computer.ts` |
| task-grouping | Groups tasks by status, defines columns | `computers/task-grouping.computer.ts` |
| task-actions | Generates available actions per task status | `computers/task-actions.computer.ts` |

### Types Layer

Type definitions shared across the extension.

| Component | Purpose | File |
|-----------|---------|------|
| task-types | Task, TaskStatus, TaskPriority, TaskAction interfaces | `types/task-types.ts` |

**Summary:** Three layers separate concerns: Orchestrator (when), Capabilities (how), Computers (what).

## Key Patterns

This system follows these patterns:

- [capability-computer](../patterns/capability-computer.md) - Strict separation of I/O from pure functions
- [factory-di](../patterns/factory-di.md) - All components use factory functions for dependency injection
- Event Emitter pattern for state updates (VSCode EventEmitters trigger UI refresh)

## Data Flow

```
VSCode Extension (activate)
  ↓
Orchestrator loads .kanban folder
  ↓
Read task.xml files via FileSystem Capability
  ↓
Parse via TaskParser Computer
  ↓
Group via TaskGrouping Computer
  ↓
Render TreeView via TasksView Capability
  ↓
Generate CodeLens via CodeLens Capability
  ↓
User clicks action → Execute command via Terminal Capability
  ↓
Terminal runs CLI script → Returns JSON
  ↓
File watcher detects change → Refresh cycle
```

## Interactions

| System | Relationship | Notes |
|--------|--------------|-------|
| [cli](../cli/_index.md) | Executes commands | Runs `claude "/kanban-{action} {id}"` via terminal |
| [storage](../storage/_index.md) | Reads files | Monitors `.kanban/tasks/**/*.xml` |
| [distribution](../distribution/_index.md) | Distributed via | Published to GitHub Packages, installed via npx |

**Summary:** Extension reads files, renders UI, and sends commands to CLI via terminal.

## Distribution

The extension is distributed via GitHub Packages as an npm package containing the bundled .vsix file.

### Installation

```bash
npx @mattfletcher94/claudeban-vscode
```

### How It Works

1. Extension is built and packaged into a .vsix file
2. npm package includes `bin/install.cjs` and the .vsix file
3. When user runs npx, installer finds the .vsix and runs `code --install-extension`

### Package Structure

```
@mattfletcher94/claudeban-vscode
├── bin/
│   └── install.cjs      # CLI installer
├── claude-kanban-vscode-*.vsix  # Bundled extension
└── package.json         # npm package with bin entry
```

See [distribution](../distribution/_index.md) for full publishing workflow.

## Boundaries

What this system does NOT handle:

- **Does NOT:** Implement search algorithms → See [search](../search/_index.md)
- **Does NOT:** Validate or transform data → Delegates to CLI scripts
- **Does NOT:** Persist data → See [storage](../storage/_index.md)

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `kanban.enable` | Enable/disable extension | true |
| `kanban.showInactiveColumns` | Show columns with no tasks | false |

## Known Issues

| Severity | Issue | Location |
|----------|-------|----------|
| HIGH | Dependency version mismatch (fast-xml-parser 4.x vs 5.x in CLI) | `package.json` |
| MEDIUM | Silent failures in parsing errors | `extension.ts:93-95` |
| MEDIUM | No error feedback for terminal commands | `terminal.capability.ts` |
| LOW | Potential N+1 loading pattern | `extension.ts:72-102` |
