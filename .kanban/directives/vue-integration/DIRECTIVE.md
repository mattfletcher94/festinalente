# Vue Integration

Rules for integrating the Computer/Capability/Orchestrator architecture with Vue 3.

**Core principle:** Vue components are thin UI wrappers. All logic lives in orchestrators, capabilities, and computers.

---

## Quick Reference

### Layer Responsibilities

| Layer | Role | Vue Integration |
|-------|------|-----------------|
| **Computer** | Pure functions, data transforms | None - plain TypeScript |
| **Capability** | Single resource (IPC, storage, API) | None - plain TypeScript |
| **Orchestrator** | Coordinates capabilities, holds state | Creates Vue refs, provided via `provideX()` |
| **Provider** | Thin `createContext` + `provideX` wrapper | Only Vue integration layer |
| **Component** | Template + `injectX()` | Thin, calls orchestrator methods |

### Directory Structure

```
apps/gui/src/
├── computers/           # Pure computation, no side effects
│   └── *.computer.ts
├── capabilities/        # Resource management (Electron IPC, APIs)
│   └── *.capability.ts
├── orchestrators/       # Coordinates capabilities via DI, holds Vue refs
│   └── *.orchestrator.ts
├── providers/           # Vue provide/inject wrappers (thin)
│   └── *.provider.ts
├── components/          # Thin UI components
│   └── *.vue
├── types/               # Domain types
│   └── *.ts
└── lib/
    └── utils.ts         # createContext helper
```

---

## Required: createContext Pattern

**All shared state MUST use the `createContext` pattern.**

### The createContext Utility

```ts
// lib/utils.ts
import type { InjectionKey } from 'vue';
import { inject, provide } from 'vue';

export function createContext<ContextValue>(
  providerComponentName: string | string[],
  contextName?: string
) {
  const symbolDescription =
    typeof providerComponentName === 'string' && !contextName
      ? `${providerComponentName}Context`
      : contextName;

  const injectionKey: InjectionKey<ContextValue | null> = Symbol(symbolDescription);

  const injectContext = <T extends ContextValue | null | undefined = ContextValue>(
    fallback?: T
  ): T extends null ? ContextValue | null : ContextValue => {
    const context = inject(injectionKey, fallback);
    if (context) return context;
    if (context === null) return context as any;
    throw new Error(
      `Injection \`${injectionKey.toString()}\` not found. Component must be used within ${
        Array.isArray(providerComponentName)
          ? `one of the following components: ${providerComponentName.join(', ')}`
          : `\`${providerComponentName}\``
      }`
    );
  };

  const provideContext = (contextValue: ContextValue) => {
    provide(injectionKey, contextValue);
    return contextValue;
  };

  return [injectContext, provideContext, injectionKey] as const;
}
```

### Usage Pattern

```ts
// providers/AppProvider.ts
import { createContext } from '@/lib/utils';
import type { AppOrchestratorReturn } from '@/orchestrators/app.orchestrator';

export const [injectApp, provideApp, APP_KEY] = createContext<AppOrchestratorReturn>('App');

export { type AppOrchestratorReturn };
```

---

## Forbidden Patterns

### Direct provide/inject Calls (REJECT)

```ts
// WRONG: Raw provide/inject without type safety
const APP_KEY = Symbol('app');
provide(APP_KEY, appState);
const app = inject(APP_KEY);  // Type is unknown!

// CORRECT: Use createContext
const [injectApp, provideApp, APP_KEY] = createContext<AppState>('App');
provideApp(appState);
const app = injectApp();  // Fully typed, throws if missing
```

### Logic in Components (REJECT)

```ts
// WRONG: Business logic in component
<script setup>
const tasks = ref<Task[]>([]);
async function loadTasks() {
  const raw = await window.electronAPI.listTasks(projectPath);
  tasks.value = raw.sort((a, b) => a.status.localeCompare(b.status));
}
</script>

// CORRECT: Logic in orchestrator, component just consumes
<script setup>
const app = injectApp();
// app.tasks is already sorted, component just renders
</script>
```

### Composables with Side Effects (REJECT)

```ts
// WRONG: Composable that manages external resources
export function useTasks(projectPath: Ref<string>) {
  const tasks = ref<Task[]>([]);

  async function refresh() {
    tasks.value = await window.electronAPI.listTasks(projectPath.value);
  }

  return { tasks, refresh };
}

// CORRECT: Capability for IPC, orchestrator for state
// capabilities/electron-tasks.capability.ts
export function createElectronTasksCapability(): CreateElectronTasksCapabilityReturn {
  return {
    listTasks: (path: string) => window.electronAPI.listTasks(path)
  };
}

// orchestrators/app.orchestrator.ts
export function createAppOrchestrator(options: {
  tasksCapability: ElectronTasksCapability;
}): AppOrchestratorReturn {
  const tasks = shallowRef<Task[]>([]);

  async function refreshTasks(projectPath: string) {
    tasks.value = await options.tasksCapability.listTasks(projectPath);
  }

  return { tasks, refreshTasks };
}
```

---

## Vue Reactivity in Orchestrators

Orchestrators are the **only** layer that should use Vue reactivity:

```ts
// orchestrators/app.orchestrator.ts
import { ref, shallowRef, computed, triggerRef } from 'vue';

export function createAppOrchestrator(options: CreateAppOrchestratorOptions): AppOrchestratorReturn {
  // Use shallowRef for complex objects (performance)
  const tasks = shallowRef<Task[]>([]);

  // Use ref for primitives
  const selectedTaskId = ref<TaskId | null>(null);

  // Computed for derived state
  const selectedTask = computed(() =>
    tasks.value.find(t => t.id === selectedTaskId.value) ?? null
  );

  // Manual trigger after mutations
  function updateTask(id: TaskId, updates: Partial<Task>) {
    const task = tasks.value.find(t => t.id === id);
    if (task) {
      Object.assign(task, updates);
      triggerRef(tasks);  // Notify watchers
    }
  }

  return { tasks, selectedTaskId, selectedTask, updateTask };
}
```

---

## Composition Root

The App.vue is the composition root where all wiring happens:

```vue
<!-- App.vue -->
<script setup lang="ts">
import { createTaskComputer } from '@/computers/task.computer';
import { createElectronTasksCapability } from '@/capabilities/electron-tasks.capability';
import { createAppOrchestrator } from '@/orchestrators/app.orchestrator';
import { provideApp } from '@/providers/AppProvider';

// Create computers (pure)
const taskComputer = createTaskComputer();

// Create capabilities (resources)
const tasksCapability = createElectronTasksCapability();

// Create orchestrator (coordinates everything)
const app = createAppOrchestrator({
  tasksCapability,
  taskComputer,
});

// Provide to Vue tree
provideApp(app);
</script>

<template>
  <MainLayout />
</template>
```

---

## Summary

1. **Use `createContext`** for all provide/inject
2. **Components are thin** - just `injectX()` and template
3. **Orchestrators hold Vue state** - refs, shallowRefs, computed
4. **Capabilities are plain TypeScript** - no Vue reactivity
5. **Computers are pure functions** - no Vue, no side effects
6. **App.vue is composition root** - all wiring happens here

---

**This directive is the single source of truth for Vue integration patterns.**
