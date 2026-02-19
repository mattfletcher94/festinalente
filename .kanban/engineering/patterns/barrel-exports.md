---
id: "patterns/barrel-exports"
title: "Barrel Exports Pattern"
type: pattern
tldr: "Re-export feature modules through organized index.ts files"
summary: "Barrel files provide clean public APIs by grouping exports by role"
keywords: [barrel, exports, index, module, import]
aliases: [index-exports, re-exports]
boundary: "Does not apply to component barrel files (different structure)"
related:
  - conventions/file-naming
  - systems/gui
paths:
  - apps/gui/src/tasks/index.ts
  - apps/gui/src/settings/index.ts
  - apps/gui/src/terminal/index.ts
updated: 2026-02-19
verified: 2026-02-19
code_refs:
  - apps/gui/src/tasks/index.ts:1-30
---

# Barrel Exports Pattern

> **TL;DR:** Re-export feature modules through organized index.ts files

## Problem

Without barrel files:
- Imports become verbose (`import { Task } from '@/tasks/task-types'`)
- Internal structure is exposed to consumers
- Refactoring internal files breaks imports

## Solution

Create `index.ts` files that:
1. Re-export all public types and functions
2. Group exports by category (Types, Computers, Capabilities, etc.)
3. Hide internal implementation details
4. Enable clean imports (`import { Task } from '@/tasks'`)

**Summary:** Single import point per feature with organized exports.

## When to Use

- Every feature folder (tasks, settings, terminal, app)
- Shared utility folders (lib)
- Component folders (for component + types)

## When NOT to Use

- Single-file modules
- Test files
- Build/config files

## Quick Reference

| Export Group | Contains |
|--------------|----------|
| Types | Interfaces, type aliases |
| Computers | Pure logic functions |
| Capabilities | IPC wrappers |
| Orchestrator | State management |
| Provider | Vue injection |

## Validation Checklist

- [ ] All public exports in index.ts
- [ ] Exports grouped by category
- [ ] Types exported with `export type`
- [ ] Functions exported with `export`
- [ ] Internal helpers not exported

**Summary:** Organized, complete, type-safe exports.

## Examples

### Correct Example

```typescript
// apps/gui/src/tasks/index.ts

// Types
export type {
  Task,
  TaskAction,
  TaskColumn,
  TaskFiles,
  TaskId,
  TaskPriority,
  TaskStatus,
} from './task-types';

// Computers
export {
  createTaskActionsComputer,
  type CreateTaskActionsComputerReturn,
} from './task-actions.computer';

export {
  createTaskGroupingComputer,
  type CreateTaskGroupingComputerReturn,
} from './task-grouping.computer';

// Capability
export {
  createTasksApiCapability,
  type CreateTasksApiCapabilityReturn,
} from './tasks-api.capability';

// Orchestrator
export {
  createTasksOrchestrator,
  type CreateTasksOrchestratorOptions,
  type CreateTasksOrchestratorReturn,
} from './tasks.orchestrator';

// Provider
export { injectTasks, provideTasks, TASKS_KEY, type TasksContext } from './tasks.provider';
```

### Incorrect Example

```typescript
// DON'T do this
// tasks/index.ts

// Missing organization - exports scattered
export * from './task-types';
export * from './task-actions.computer';
export * from './tasks.orchestrator';

// Internal helper exposed
export { parseTaskId } from './internal-utils';

// Type not using `export type`
export { Task } from './task-types'; // Should be `export type { Task }`
// Because: Unorganized, exposes internals, incorrect type exports
```

**Summary:** Organize by category, hide internals, use `export type`.

## Boundaries

What this pattern does NOT apply to:

- **Does NOT:** Apply to test files
- **Does NOT:** Export internal utilities
- **Does NOT:** Use `export * from` (explicit re-exports preferred)

## Systems Using This Pattern

- [gui](../systems/gui/index.md) - All feature folders

## Common Violations

- Using `export * from` instead of explicit exports
- Exporting internal helpers
- Missing `export type` for interfaces
- Unorganized/ungrouped exports
- Missing return type exports for factory functions
