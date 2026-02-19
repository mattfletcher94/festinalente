---
id: "patterns/capability"
title: "Capability Pattern"
type: pattern
tldr: "Abstract IPC calls behind typed interfaces for testability"
summary: "Capabilities wrap Electron IPC calls with promise-based interfaces, isolating renderer from main process"
keywords: [capability, ipc, electron, abstraction, interface]
aliases: [ipc-capability, electron-bridge]
boundary: "Capabilities do not manage state or contain business logic"
related:
  - patterns/orchestrator
  - systems/gui
paths:
  - apps/gui/src/tasks/tasks-api.capability.ts
  - apps/gui/src/settings/settings.capability.ts
  - apps/gui/src/terminal/pty.capability.ts
updated: 2026-02-19
verified: 2026-02-19
code_refs:
  - apps/gui/src/tasks/tasks-api.capability.ts:1-30
---

# Capability Pattern

> **TL;DR:** Abstract IPC calls behind typed interfaces for testability

## Problem

Direct `window.electronAPI` calls scatter IPC usage across components, making it hard to:
- Mock for testing
- Track all external dependencies
- Change IPC implementation

## Solution

Create capability functions that:
1. Wrap `window.electronAPI` methods with typed interfaces
2. Return promise-based APIs
3. Handle any response transformation
4. Are injected into orchestrators

**Summary:** Capabilities isolate IPC, enabling testing and abstraction.

## When to Use

- Any call to `window.electronAPI`
- Any external data source (APIs, file system)
- When you need mockable interfaces for testing

## When NOT to Use

- State management -> Use [orchestrator](./orchestrator.md) instead
- Pure calculations -> Use [computer](./computer.md) instead
- Vue component logic -> Keep in component

## Quick Reference

| Aspect | Rule |
|--------|------|
| Dependencies | Only `window.electronAPI` |
| State | None (stateless) |
| Return | Promise-based typed interface |
| Testing | Easily mockable |

**Dependency Rule:** Capabilities depend only on IPC; orchestrators depend on capabilities.

## Validation Checklist

- [ ] No state management (no ref/reactive)
- [ ] All methods return Promises
- [ ] Explicit return type interface
- [ ] No business logic
- [ ] Single responsibility (one IPC domain)

**Summary:** Stateless, promise-based, single-domain.

## Examples

### Correct Example

```typescript
// apps/gui/src/tasks/tasks-api.capability.ts
export interface CreateTasksApiCapabilityReturn {
  listTasks(projectPath: string): Promise<Task[]>;
  getAvailableFiles(projectPath: string, taskId: TaskId): Promise<TaskFiles>;
  readTaskFile(projectPath: string, taskId: TaskId): Promise<string>;
  readSpecFile(projectPath: string, taskId: TaskId): Promise<string>;
  readPlanFile(projectPath: string, taskId: TaskId): Promise<string>;
}

export function createTasksApiCapability(): CreateTasksApiCapabilityReturn {
  async function listTasks(projectPath: string): Promise<Task[]> {
    const result = await window.electronAPI.listTasks(projectPath);
    return result as Task[];
  }

  async function readTaskFile(projectPath: string, taskId: TaskId): Promise<string> {
    return window.electronAPI.readTaskFile(projectPath, taskId);
  }

  // ... other methods

  return { listTasks, getAvailableFiles, readTaskFile, readSpecFile, readPlanFile };
}
```

### Incorrect Example

```typescript
// DON'T do this
export function createTasksApiCapability() {
  // State in capability - should be in orchestrator
  const cache = ref<Map<string, Task[]>>(new Map());

  async function listTasks(projectPath: string): Promise<Task[]> {
    // Caching logic - should be in orchestrator
    if (cache.value.has(projectPath)) {
      return cache.value.get(projectPath)!;
    }
    const result = await window.electronAPI.listTasks(projectPath);
    cache.value.set(projectPath, result);
    return result;
  }

  return { listTasks, cache };
}
// Because: State and caching logic belong in orchestrator; capability should be pure IPC wrapper
```

**Summary:** Keep capabilities stateless and focused on IPC.

## Boundaries

What this pattern does NOT apply to:

- **Does NOT:** Manage reactive state -> Use [orchestrator](./orchestrator.md) instead
- **Does NOT:** Contain business logic -> Use [computer](./computer.md) instead
- **Does NOT:** Cache data -> Orchestrator responsibility

## Systems Using This Pattern

- [gui](../systems/gui/_index.md) - tasks-api, settings, pty, hook-config capabilities

## Common Violations

- Adding reactive state (`ref`, `shallowRef`)
- Caching responses (move to orchestrator)
- Business logic in response transformation
- Multiple unrelated IPC domains in one capability
