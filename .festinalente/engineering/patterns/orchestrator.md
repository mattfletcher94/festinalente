---
id: "patterns/orchestrator"
title: "Orchestrator Pattern"
type: pattern
tldr: "Orchestrators make policy decisions (when/whether to act) and compose capabilities with computers"
summary: "Orchestrators are the coordination layer that wires capabilities and computers together, making decisions about when and whether to perform actions"
keywords: [orchestrator, policy, composition, coordination, decomposition]
aliases: [policy-layer, composition-root]
boundary: "Not for simple scripts where a single entry point suffices"
related:
  - patterns/capability-computer
  - patterns/factory-di
paths:
  - apps/vscode/src/extension.ts
  - apps/vscode/src/orchestrators
updated: 2026-02-25
verified: 2026-02-25
code_refs:
  - apps/vscode/src/extension.ts
  - apps/vscode/src/orchestrators/terminal.orchestrator.ts
  - apps/vscode/src/orchestrators/tasks.orchestrator.ts
  - apps/vscode/src/orchestrators/quicks.orchestrator.ts
  - apps/vscode/src/orchestrators/docs.orchestrator.ts
  - apps/vscode/src/orchestrators/config.orchestrator.ts
---

# Orchestrator Pattern

> **TL;DR:** Orchestrators make policy decisions (when/whether to act) and compose capabilities with computers

## Problem

Without a clear coordination layer:
- Policy decisions (when to act) get scattered across capabilities
- Composition logic is unclear (who wires what to what?)
- Testing policy requires spinning up the whole system
- Large applications become monolithic and hard to maintain

## Solution

Create an **Orchestrator** layer that:
1. Makes **policy decisions** (when/whether to act)
2. **Composes** capabilities and computers together
3. **Routes** events and commands to appropriate handlers
4. Contains **no mechanism** (that belongs in capabilities)

```
Orchestrator (Policy: when/whether)
    ↓
Capabilities (Mechanism: how)
    ↓
Computers (Logic: what)
```

## Three-Layer Summary

| Layer | Responsibility | Contains | Example |
|-------|---------------|----------|---------|
| Orchestrator | Policy (when/whether) | Event routing, composition, decisions | `extension.ts` |
| Capability | Mechanism (how) | I/O, VSCode API, file system | `terminal.capability.ts` |
| Computer | Logic (what) | Pure functions, data transformation | `task-parser.computer.ts` |

**Key insight:** Capabilities provide `createTerminal()` (mechanism). Orchestrators decide `shouldCreateFreshTerminal()` (policy).

## When to Use

- Long-running applications (VSCode extensions, servers)
- Systems with multiple distinct domains
- When policy decisions need to be testable
- When composition logic is non-trivial

## When NOT to Use

- Simple CLI scripts (single entry point is fine)
- Scripts that are mostly I/O with minimal policy
- Stateless utilities invoked externally

## Orchestrator Decomposition

### When to Split an Orchestrator

Create multiple orchestrators when:

1. **Distinct domains emerge** - Different data types, independent refresh cycles, no shared policy
2. **File size exceeds ~300 lines** - Signals too many responsibilities
3. **More than 2-3 unrelated concerns** - Each concern deserves its own orchestrator
4. **Independent lifecycles** - Domains that could be enabled/disabled separately

### Signs You Need to Split

| Signal | Example |
|--------|---------|
| Multiple unrelated command groups | Task commands, Quick commands, Docs commands |
| Independent state management | Task cache, Quick cache, Settings cache |
| Different event sources | Task file watcher, Quick file watcher, Config watcher |
| Unrelated dependencies | Tasks need parser + grouping, Docs just need file listing |

### Decomposition Structure

```
apps/vscode/src/
├── extension.ts                    # Composition root (thin, ~178 lines)
├── orchestrators/
│   ├── terminal.orchestrator.ts    # Execution/runtime policy (86 lines)
│   ├── tasks.orchestrator.ts       # Task domain policy (279 lines)
│   ├── quicks.orchestrator.ts      # Quick task domain policy (178 lines)
│   ├── docs.orchestrator.ts        # Documentation domain policy (136 lines)
│   └── config.orchestrator.ts      # Config domain policy (109 lines)
├── capabilities/
└── computers/
```

This is the actual structure implemented in the VSCode extension.

### Composition Root vs Domain Orchestrators

| Aspect | Composition Root (`extension.ts`) | Domain Orchestrator |
|--------|-----------------------------------|---------------------|
| Responsibility | Initialize and wire orchestrators | Policy for one domain |
| Size | Minimal (50-100 lines) | Focused (100-300 lines) |
| Dependencies | All domain orchestrators | Domain's capabilities + computers |
| Testing | Integration tests only | Unit testable policy logic |

### Framework Exceptions

For VSCode extensions, `extension.ts` is the required entry point. Two valid approaches:

**Option A: extension.ts as orchestrator** (small extensions)
```typescript
// extension.ts contains all policy - acceptable for <300 lines
export function activate(context: vscode.ExtensionContext) {
  // All policy logic here
}
```

**Option B: extension.ts as composition root** (larger extensions)
```typescript
// extension.ts is thin, delegates to domain orchestrators
export function activate(context: vscode.ExtensionContext) {
  const tasksOrch = createTasksOrchestrator(deps);
  const quicksOrch = createQuicksOrchestrator(deps);
  // Wire them together, register with VSCode
}
```

## Quick Reference

| Aspect | Orchestrator |
|--------|--------------|
| Suffix | `.orchestrator.ts` or `extension.ts` (VSCode) |
| Contains | Policy decisions, composition, event routing |
| Imports | Capabilities + Computers |
| Avoids | Direct I/O, business logic |
| Testing | Policy logic can be unit tested |

## Validation Checklist

- [ ] Policy decisions (when/whether) are in orchestrators, not capabilities
- [ ] Orchestrators compose capabilities and computers via dependency injection
- [ ] No direct I/O in orchestrators (delegate to capabilities)
- [ ] Large orchestrators (>300 lines) are decomposed into domain orchestrators
- [ ] Domain orchestrators don't import each other (communicate via composition root)
- [ ] Composition root is thin and focused on wiring

## Examples

### Correct - Thin Composition Root

```typescript
// apps/vscode/src/extension.ts
// This is a COMPOSITION ROOT - it wires orchestrators together

import { createTasksOrchestrator } from './orchestrators/tasks.orchestrator';
import { createQuicksOrchestrator } from './orchestrators/quicks.orchestrator';

export function activate(context: vscode.ExtensionContext) {
  const kanbanPath = findKanbanFolder(vscode.workspace.workspaceFolders);
  if (!kanbanPath) return;

  // Create shared capabilities
  const fs = createFileSystemCapability();
  const terminal = createTerminalCapability();

  // Create domain orchestrators
  const tasksOrch = createTasksOrchestrator({ kanbanPath, fs, terminal });
  const quicksOrch = createQuicksOrchestrator({ kanbanPath, fs, terminal });

  // Register commands (routing only)
  context.subscriptions.push(
    vscode.commands.registerCommand('kanban.runAction', tasksOrch.handleRunAction),
    vscode.commands.registerCommand('kanban.createQuick', quicksOrch.handleCreate),
  );

  // Register views
  context.subscriptions.push(
    vscode.window.createTreeView('kanbanTasks', { treeDataProvider: tasksOrch.treeProvider }),
    vscode.window.createTreeView('kanbanQuicks', { treeDataProvider: quicksOrch.treeProvider }),
  );
}
```

### Correct - Domain Orchestrator

```typescript
// apps/vscode/src/orchestrators/tasks.orchestrator.ts
// This is a DOMAIN ORCHESTRATOR - it owns policy for the Tasks domain

export interface TasksOrchestratorDeps {
  kanbanPath: string;
  fs: FileSystemCapability;
  terminal: TerminalCapability;
}

export function createTasksOrchestrator(deps: TasksOrchestratorDeps) {
  // Create domain-specific capabilities and computers
  const taskParser = createTaskParserComputer();
  const taskGrouping = createTaskGroupingComputer();
  const tasksView = createTasksViewCapability({ /* ... */ });

  // Policy: Load tasks from file system
  function loadAllTasks(): Task[] {
    const taskFolders = deps.fs.listDirectories(`${deps.kanbanPath}/tasks`);
    return taskFolders
      .map(folder => deps.fs.readFile(`${folder}/task.xml`))
      .filter(content => content !== null)
      .map(content => taskParser.parseTaskXml(content));
  }

  // Policy: Decide whether to use YOLO mode
  function shouldUseYoloMode(): boolean {
    const settings = readClaudeSettings();
    return settings?.dangerouslySkipPermissions === true;
  }

  // Policy: Handle run action command
  function handleRunAction(action: TaskAction): void {
    const command = buildCommand(action, shouldUseYoloMode());
    deps.terminal.sendCommand(command);  // Delegate mechanism to capability
  }

  return {
    treeProvider: tasksView.createTreeDataProvider(),
    handleRunAction,
    refresh: tasksView.refresh,
  };
}
```

### Incorrect - Policy in Capability

```typescript
// DON'T do this - capability contains policy decisions
export function createTerminalCapability() {
  function runTaskAction(action: TaskAction) {
    // BAD: Policy decision (YOLO mode) in capability
    const settings = readSettings();
    const useYolo = settings?.dangerouslySkipPermissions === true;

    // BAD: Command construction is policy, not mechanism
    const command = useYolo
      ? `claude --dangerously-skip-permissions "${action.command}"`
      : `claude "${action.command}"`;

    sendToTerminal(command);
  }
  // Because: Capability should just provide sendCommand(str),
  // orchestrator decides what command to send
}
```

### Incorrect - Monolithic Orchestrator

```typescript
// DON'T do this - one massive orchestrator handling all domains
export function activate(context: vscode.ExtensionContext) {
  // 500+ lines handling:
  // - Task loading, parsing, grouping, actions
  // - Quick task loading, parsing, actions
  // - Documentation tree views
  // - Config view
  // - Terminal management
  // - File watchers for all domains
  // - CodeLens providers
  // Because: Split into domain orchestrators when >300 lines
  // or >2-3 unrelated concerns
}
```

## Boundaries

What this pattern does NOT cover:

- **Does NOT:** Prescribe how capabilities should be structured internally
- **Does NOT:** Apply to simple scripts where a single function suffices
- **Does NOT:** Require orchestrators for stateless CLI utilities

## Systems Using This Pattern

- [vscode-extension](../systems/vscode-extension/_index.md) - Primary implementation

## Common Violations

1. **Policy in capabilities:** Capability decides when/whether to act instead of just how
2. **Monolithic orchestrator:** Single file handling 5+ unrelated domains
3. **No composition root:** Capabilities import each other directly
4. **Business logic in orchestrator:** Data transformation belongs in computers
5. **Missing suffix:** Orchestrator file without `.orchestrator.ts` suffix (except framework entry points)
