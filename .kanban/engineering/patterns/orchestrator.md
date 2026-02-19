---
id: "patterns/orchestrator"
title: "Orchestrator Pattern"
type: pattern
tldr: "Coordinate state and actions across capabilities and computers"
summary: "Orchestrators manage feature state using Vue reactivity and delegate to capabilities/computers"
keywords: [orchestrator, state, vue, reactivity, composition]
aliases: [state-orchestrator, feature-orchestrator]
boundary: "Orchestrators do not contain business logic or make IPC calls directly"
related:
  - patterns/capability
  - patterns/computer
  - patterns/provider
  - systems/gui
paths:
  - apps/gui/src/tasks/tasks.orchestrator.ts
  - apps/gui/src/settings/settings.orchestrator.ts
  - apps/gui/src/terminal/terminal.orchestrator.ts
  - apps/gui/src/app/app.orchestrator.ts
updated: 2026-02-19
verified: 2026-02-19
code_refs:
  - apps/gui/src/tasks/tasks.orchestrator.ts:15-45
---

# Orchestrator Pattern

> **TL;DR:** Coordinate state and actions across capabilities and computers

## Problem

Features need to manage reactive state, coordinate multiple data sources, and expose a clean API to Vue components. Without a pattern, this logic gets scattered across components, making it hard to test and maintain.

## Solution

Create orchestrator functions that:
1. Own reactive state using Vue's `ref()`, `shallowRef()`, and `computed()`
2. Depend on capabilities for external data (IPC calls)
3. Depend on computers for business logic (pure calculations)
4. Expose a typed return interface for components to consume

**Summary:** Orchestrators coordinate state, capabilities handle I/O, computers handle logic.

## When to Use

- Managing feature-level state (tasks, settings, terminal)
- Coordinating multiple data sources
- Exposing state and actions to Vue components

## When NOT to Use

- Simple component-local state -> Use `ref()` directly
- Pure calculations -> Use [computer](./computer.md) instead
- IPC/external calls -> Use [capability](./capability.md) instead

## Quick Reference

| Dependency | Role |
|------------|------|
| Capability | External data access (IPC, APIs) |
| Computer | Pure business logic calculations |
| ref/shallowRef | Reactive state storage |
| computed | Derived state |

**Dependency Rule:** Orchestrators can depend on capabilities and computers, but neither can depend on orchestrators (acyclic).

## Validation Checklist

- [ ] Orchestrator depends only on capabilities and computers
- [ ] State uses appropriate reactivity (`shallowRef` for arrays, `ref` for primitives)
- [ ] Return type is explicitly defined as interface
- [ ] Actions are async when calling capabilities
- [ ] No direct IPC calls (delegate to capability)

**Summary:** Ensure acyclic dependencies and proper reactivity usage.

## Examples

### Correct Example

```typescript
// apps/gui/src/tasks/tasks.orchestrator.ts
export interface CreateTasksOrchestratorOptions {
  tasksApi: CreateTasksApiCapabilityReturn;
  actionsComputer: CreateTaskActionsComputerReturn;
  groupingComputer: CreateTaskGroupingComputerReturn;
}

export interface CreateTasksOrchestratorReturn {
  readonly tasks: ShallowRef<readonly Task[]>;
  readonly selectedTask: Ref<Task | null>;
  readonly tasksByColumn: ComputedRef<Record<TaskStatus, readonly Task[]>>;

  loadTasks(projectPath: string): Promise<void>;
  selectTask(task: Task): void;
}

export function createTasksOrchestrator(
  options: CreateTasksOrchestratorOptions
): CreateTasksOrchestratorReturn {
  const { tasksApi, actionsComputer, groupingComputer } = options;

  // State
  const tasks = shallowRef<readonly Task[]>([]);
  const selectedTask = ref<Task | null>(null);

  // Derived state
  const tasksByColumn = computed(() =>
    groupingComputer.groupByColumn(tasks.value, columns.value)
  );

  // Actions (delegate to capability)
  async function loadTasks(projectPath: string): Promise<void> {
    const result = await tasksApi.listTasks(projectPath);
    tasks.value = result;
  }

  return { tasks, selectedTask, tasksByColumn, loadTasks, selectTask };
}
```

### Incorrect Example

```typescript
// DON'T do this
export function createTasksOrchestrator() {
  const tasks = shallowRef<Task[]>([]);

  async function loadTasks(projectPath: string): Promise<void> {
    // Direct IPC call - violates pattern
    const result = await window.electronAPI.listTasks(projectPath);
    tasks.value = result;
  }

  // Business logic in orchestrator - should be in computer
  function getActionsForTask(task: Task): TaskAction[] {
    switch (task.status) {
      case 'backlog': return [{ label: 'Scope', command: '...' }];
      // ...
    }
  }

  return { tasks, loadTasks, getActionsForTask };
}
// Because: Direct IPC calls should go through capability; business logic should be in computer
```

**Summary:** Delegate IPC to capabilities, logic to computers.

## Boundaries

What this pattern does NOT apply to:

- **Does NOT:** Handle IPC communication -> Use [capability](./capability.md) instead
- **Does NOT:** Contain business logic -> Use [computer](./computer.md) instead
- **Does NOT:** Provide dependency injection -> Use [provider](./provider.md) instead

## Systems Using This Pattern

- [gui](../systems/gui/_index.md) - All feature orchestrators (app, tasks, settings, terminal)

## Common Violations

- Making direct `window.electronAPI` calls instead of using capability
- Putting business logic (switch statements, calculations) in orchestrator
- Using `ref()` for large arrays instead of `shallowRef()`
- Missing explicit return type interface
