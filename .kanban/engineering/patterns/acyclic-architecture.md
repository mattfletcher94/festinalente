---
id: "patterns/acyclic-architecture"
title: "Acyclic Architecture Pattern"
type: pattern
summary: "DAG-based dependency structure ensuring no circular imports"
keywords: [dag, acyclic, dependencies, architecture, imports]
related: ["patterns/capability-computer-orchestrator", "systems/gui"]
paths: ["apps/gui/src/"]
updated: 2026-02-17
---

# Acyclic Architecture Pattern

The GUI follows a Directed Acyclic Graph (DAG) architecture where dependencies flow in one direction only. This prevents circular imports and makes the codebase easier to reason about.

## Quick Reference

```
┌─────────────────────────────────────────────────────────────┐
│                    Vue Components                            │
│                         ↓                                    │
├─────────────────────────────────────────────────────────────┤
│                      Providers                               │
│                         ↓                                    │
├─────────────────────────────────────────────────────────────┤
│                    Orchestrators                             │
│                    ↓         ↓                               │
├────────────────────┴─────────┴──────────────────────────────┤
│         Capabilities         │         Computers             │
│              ↓               │            (leaf)             │
├──────────────────────────────┴──────────────────────────────┤
│                    External APIs                             │
│            (Electron IPC, window.electronAPI)                │
└─────────────────────────────────────────────────────────────┘
```

## Dependency Rules

| Layer | Can Import | Cannot Import |
|-------|------------|---------------|
| Components | Providers, Types | Orchestrators, Capabilities, Computers |
| Providers | Orchestrators, Types | Components, Other Providers |
| Orchestrators | Capabilities, Computers, Types | Providers, Components |
| Capabilities | Types, External APIs | Orchestrators, Computers, Providers |
| Computers | Types only | Everything else |

## Validation Checklist

- [ ] No circular imports (run `check:dpdm` to verify)
- [ ] Computers only import types (pure functions)
- [ ] Capabilities don't import orchestrators
- [ ] Components access state only via providers (`inject`)
- [ ] Orchestrators receive dependencies via constructor options

## Examples

### Correct

```typescript
// Computer - only imports types
import type { Task, TaskColumn, TaskStatus } from './task-types';

export function groupByColumn(
  tasks: readonly Task[],
  columns: TaskColumn[]
): Record<TaskStatus, readonly Task[]> {
  // Pure function, no side effects
}

// Capability - imports types and external APIs
import type { Task, TaskFiles, TaskId } from './task-types';

export function createTasksApiCapability() {
  async function listTasks(projectPath: string): Promise<Task[]> {
    return window.electronAPI.listTasks(projectPath);  // External API
  }
  return { listTasks };
}

// Orchestrator - imports capabilities and computers
import type { CreateTasksApiCapabilityReturn } from './tasks-api.capability';
import type { CreateTaskGroupingComputerReturn } from './task-grouping.computer';

export function createTasksOrchestrator(options: {
  tasksApi: CreateTasksApiCapabilityReturn;
  groupingComputer: CreateTaskGroupingComputerReturn;
}) {
  // Coordinates capabilities and computers
}
```

### Incorrect

```typescript
// BAD: Circular dependency
// orchestrator.ts
import { useCapability } from './capability';  // ✓
// capability.ts
import { useOrchestrator } from './orchestrator';  // ✗ Circular!

// BAD: Computer importing capability
// task-grouping.computer.ts
import { createTasksApiCapability } from './tasks-api.capability';  // ✗

// BAD: Component importing orchestrator directly
// TaskList.vue
import { createTasksOrchestrator } from './tasks.orchestrator';  // ✗
// Should use: const tasks = injectTasks();
```

## Verification

Run the circular dependency checker:

```bash
pnpm check:dpdm
```

This runs `dpdm` with `--exit-code circular:1` to fail on any circular imports.

## Common Violations

1. **Importing orchestrator from capability** - Breaks DAG, use dependency injection
2. **Importing capability from computer** - Computers must be pure
3. **Component creating orchestrator** - Use provider injection instead
4. **Shared state between features** - Pass through App-level orchestrator instead
