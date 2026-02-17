---
id: "patterns/capability-computer-orchestrator"
title: "Capability/Computer/Orchestrator Pattern"
type: pattern
summary: "Three-layer architecture separating side effects, computation, and coordination"
keywords: [cco, capability, computer, orchestrator, architecture, separation]
related: ["patterns/acyclic-architecture", "systems/gui", "conventions/file-naming"]
paths: ["apps/gui/src/"]
updated: 2026-02-17
---

# Capability/Computer/Orchestrator Pattern

The C/C/O pattern separates code into three distinct layers based on their concerns: Capabilities for side effects, Computers for pure logic, and Orchestrators for coordination.

## Quick Reference

| Layer | Responsibility | Side Effects | State |
|-------|---------------|--------------|-------|
| **Capability** | External API access (IPC, fetch, storage) | Yes | No |
| **Computer** | Pure computation (transform, filter, derive) | No | No |
| **Orchestrator** | State coordination, compose C + C | Indirect | Yes (reactive) |
| **Provider** | Vue injection wrapper | No | Reference |

## Layer Details

### Capabilities (`*.capability.ts`)

- Wrap external APIs (Electron IPC, localStorage, fetch)
- Return plain functions or objects
- Handle API-specific error cases
- **File suffix**: `.capability.ts`

```typescript
export interface CreateTasksApiCapabilityReturn {
  listTasks(projectPath: string): Promise<Task[]>;
  readTaskFile(projectPath: string, taskId: TaskId): Promise<string>;
}

export function createTasksApiCapability(): CreateTasksApiCapabilityReturn {
  async function listTasks(projectPath: string): Promise<Task[]> {
    return window.electronAPI.listTasks(projectPath);
  }

  async function readTaskFile(projectPath: string, taskId: TaskId): Promise<string> {
    return window.electronAPI.readTaskFile(projectPath, taskId);
  }

  return { listTasks, readTaskFile };
}
```

### Computers (`*.computer.ts`)

- Pure functions only (same input = same output)
- No side effects, no external dependencies
- Easy to unit test
- **File suffix**: `.computer.ts`

```typescript
export interface CreateTaskGroupingComputerReturn {
  groupByColumn(tasks: readonly Task[], columns: TaskColumn[]): Record<TaskStatus, readonly Task[]>;
  getVisibleColumns(columns: TaskColumn[], grouped: Record<TaskStatus, readonly Task[]>): readonly TaskColumn[];
}

export function createTaskGroupingComputer(): CreateTaskGroupingComputerReturn {
  function groupByColumn(
    tasks: readonly Task[],
    columns: TaskColumn[]
  ): Record<TaskStatus, readonly Task[]> {
    // Pure computation - no API calls, no state mutation
    const result = {} as Record<TaskStatus, Task[]>;
    for (const col of columns) {
      result[col.status] = tasks.filter(t => t.status === col.status);
    }
    return result;
  }

  function getVisibleColumns(
    columns: TaskColumn[],
    grouped: Record<TaskStatus, readonly Task[]>
  ): readonly TaskColumn[] {
    return columns.filter(col => grouped[col.status]?.length > 0);
  }

  return { groupByColumn, getVisibleColumns };
}
```

### Orchestrators (`*.orchestrator.ts`)

- Coordinate capabilities and computers
- Manage reactive state (Vue refs)
- Expose clean public API
- Receive dependencies via options
- **File suffix**: `.orchestrator.ts`

```typescript
export interface CreateTasksOrchestratorOptions {
  readonly tasksApi: CreateTasksApiCapabilityReturn;
  readonly groupingComputer: CreateTaskGroupingComputerReturn;
}

export function createTasksOrchestrator(
  options: CreateTasksOrchestratorOptions
): CreateTasksOrchestratorReturn {
  const { tasksApi, groupingComputer } = options;

  // Reactive state
  const tasks = shallowRef<readonly Task[]>([]);
  const loading = ref(false);

  // Computed (uses computer)
  const tasksByColumn = computed(() =>
    groupingComputer.groupByColumn(tasks.value, columns.value)
  );

  // Actions (uses capability)
  async function loadTasks(projectPath: string): Promise<void> {
    loading.value = true;
    tasks.value = await tasksApi.listTasks(projectPath);
    loading.value = false;
  }

  return {
    tasks,
    loading,
    tasksByColumn,
    loadTasks,
  };
}
```

### Providers (`*.provider.ts`)

- Thin wrapper for Vue provide/inject
- Uses `createContext()` utility for type safety
- **File suffix**: `.provider.ts`

```typescript
import { createContext } from '@/lib/utils';
import type { CreateTasksOrchestratorReturn } from './tasks.orchestrator';

export const [injectTasks, provideTasks, TASKS_KEY] =
  createContext<CreateTasksOrchestratorReturn>('Tasks');
```

## Validation Checklist

- [ ] Capabilities only call external APIs
- [ ] Computers have no side effects (testable with no mocks)
- [ ] Orchestrators receive dependencies via options
- [ ] Providers are thin wrappers around `createContext()`
- [ ] File suffixes match layer type

## Common Violations

1. **Capability with state** - Move state to orchestrator
2. **Computer calling API** - Move to capability
3. **Orchestrator creating its own capabilities** - Inject via options
4. **Direct `inject()` without typed context** - Use `createContext()` helper
5. **Business logic in components** - Move to computers or orchestrators
