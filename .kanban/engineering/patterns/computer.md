---
id: "patterns/computer"
title: "Computer Pattern"
type: pattern
tldr: "Pure functions for stateless business logic calculations"
summary: "Computers contain business logic as pure functions with no side effects or external dependencies"
keywords: [computer, pure-function, business-logic, calculation]
aliases: [calculator, pure-logic]
boundary: "Computers do not manage state or make external calls"
related:
  - patterns/orchestrator
  - systems/gui
paths:
  - apps/gui/src/tasks/task-actions.computer.ts
  - apps/gui/src/tasks/task-grouping.computer.ts
  - apps/gui/src/terminal/terminal-command.computer.ts
updated: 2026-02-19
verified: 2026-02-19
code_refs:
  - apps/gui/src/tasks/task-actions.computer.ts:1-50
---

# Computer Pattern

> **TL;DR:** Pure functions for stateless business logic calculations

## Problem

Business logic mixed into orchestrators or components:
- Can't be unit tested in isolation
- Gets duplicated across components
- Creates coupling between state and logic

## Solution

Extract business logic into "computer" functions that:
1. Are pure functions (same input -> same output)
2. Have no side effects
3. Take data as input, return computed results
4. Are injected into orchestrators

**Summary:** Computers are testable, reusable pure logic.

## When to Use

- Deriving data from inputs (filtering, grouping, mapping)
- Business rules (status transitions, action availability)
- Formatting or transforming data
- Any logic that doesn't need external state

## When NOT to Use

- State management -> Use [orchestrator](./orchestrator.md) instead
- External data access -> Use [capability](./capability.md) instead
- Side effects needed -> Use orchestrator action

## Quick Reference

| Aspect | Rule |
|--------|------|
| Dependencies | None (pure) |
| State | None |
| Side effects | None |
| Return | Data (not Promises) |

**Dependency Rule:** Computers have no dependencies; orchestrators inject and use them.

## Validation Checklist

- [ ] No imports of `ref`, `computed`, `shallowRef`
- [ ] No `async` functions
- [ ] No `window.electronAPI` or IPC calls
- [ ] No side effects (console.log OK for debugging)
- [ ] Explicit return type interface
- [ ] All data passed as parameters

**Summary:** Pure, synchronous, no dependencies.

## Examples

### Correct Example

```typescript
// apps/gui/src/tasks/task-actions.computer.ts
export interface CreateTaskActionsComputerReturn {
  getActions(task: Task): readonly TaskAction[];
  getStatusVariant(status: string): 'default' | 'secondary' | 'outline';
  getLabelVariant(label: string): 'default' | 'secondary' | 'outline';
  getPriorityClasses(priority: string): string;
}

export function createTaskActionsComputer(): CreateTaskActionsComputerReturn {
  function buildCommand(action: string, id: TaskId): string {
    return `/kanban-${action} ${id}`;
  }

  function getActions(task: Task): readonly TaskAction[] {
    const { id, status } = task;
    switch (status) {
      case 'backlog':
        return [{
          label: 'Scope',
          command: buildCommand('scope', id),
          variant: 'default',
          description: 'Research codebase and create spec',
        }];
      case 'scoped':
        return [{
          label: 'Plan',
          command: buildCommand('plan', id),
          variant: 'default',
          description: 'Create implementation plan',
        }];
      // ... more cases
      default:
        return [];
    }
  }

  function getStatusVariant(status: string) {
    switch (status) {
      case 'in-progress':
      case 'codecheck':
        return 'default';
      case 'done':
        return 'secondary';
      default:
        return 'outline';
    }
  }

  return { getActions, getStatusVariant, getLabelVariant, getPriorityClasses };
}
```

### Incorrect Example

```typescript
// DON'T do this
export function createTaskActionsComputer() {
  // State in computer - should be in orchestrator
  const lastTask = ref<Task | null>(null);

  function getActions(task: Task): readonly TaskAction[] {
    // Side effect - tracking state
    lastTask.value = task;

    // External call - should be in capability
    const config = window.electronAPI.getConfig();

    switch (task.status) {
      // ...
    }
  }

  return { getActions, lastTask };
}
// Because: Computers must be pure with no state or external calls
```

**Summary:** No state, no side effects, no external calls.

## Boundaries

What this pattern does NOT apply to:

- **Does NOT:** Manage state -> Use [orchestrator](./orchestrator.md) instead
- **Does NOT:** Make IPC calls -> Use [capability](./capability.md) instead
- **Does NOT:** Have async behavior -> Use orchestrator for async coordination

## Systems Using This Pattern

- [gui](../systems/gui/index.md) - task-actions, task-grouping, terminal-command computers

## Common Violations

- Using `ref` or `shallowRef` for state
- Making `window.electronAPI` calls
- `async` functions (implies external dependency)
- Modifying passed-in objects instead of returning new ones
- Importing from orchestrators or capabilities
