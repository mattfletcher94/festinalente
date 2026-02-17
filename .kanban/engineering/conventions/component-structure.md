---
id: "conventions/component-structure"
title: "Component Structure Convention"
type: convention
summary: "Structure conventions for Vue components and feature modules"
keywords: [vue, components, structure, conventions]
related: ["systems/gui", "conventions/file-naming"]
paths: ["apps/gui/src/components/", "apps/gui/src/"]
updated: 2026-02-17
---

# Component Structure Convention

## Rules

1. **Feature modules** are organized by domain (tasks, terminal, settings, app)
2. **Each feature** exports from `index.ts`:
   - The provider injection function
   - The orchestrator creation function
   - Types needed by consumers
3. **UI components** follow shadcn-vue structure:
   - Each component in its own folder
   - Main component as `ComponentName.vue`
   - Exports from `index.ts`
4. **Orchestrators** receive dependencies via options object
5. **Providers** use `createContext()` utility for typed injection

## Feature Module Structure

```typescript
// tasks/index.ts
export { injectTasks, provideTasks } from './tasks.provider';
export { createTasksOrchestrator } from './tasks.orchestrator';
export type { Task, TaskStatus, TaskId } from './task-types';
```

## Provider Pattern

```typescript
// tasks/tasks.provider.ts
import { createContext } from '@/lib/utils';
import type { CreateTasksOrchestratorReturn } from './tasks.orchestrator';

export const [injectTasks, provideTasks, TASKS_KEY] =
  createContext<CreateTasksOrchestratorReturn>('Tasks');
```

## Orchestrator Pattern

```typescript
// tasks/tasks.orchestrator.ts
export interface CreateTasksOrchestratorOptions {
  readonly tasksApi: CreateTasksApiCapabilityReturn;
  readonly actionsComputer: CreateTaskActionsComputerReturn;
  readonly groupingComputer: CreateTaskGroupingComputerReturn;
}

export function createTasksOrchestrator(
  options: CreateTasksOrchestratorOptions
): CreateTasksOrchestratorReturn {
  const { tasksApi, actionsComputer, groupingComputer } = options;

  // State
  const tasks = shallowRef<readonly Task[]>([]);

  // Actions
  async function loadTasks(projectPath: string) { ... }

  return {
    tasks,
    loadTasks,
    // ...
  };
}
```

## UI Component Structure

```
components/ui/button/
├── Button.vue      # Main component
└── index.ts        # export { default as Button } from './Button.vue';

components/ui/card/
├── Card.vue
├── CardHeader.vue
├── CardTitle.vue
├── CardContent.vue
├── CardFooter.vue
└── index.ts        # Export all card-related components
```

## Examples

### Good

```typescript
// App.vue setup
const settingsOrchestrator = createSettingsOrchestrator({
  settingsApi: createSettingsCapability(),
});
provideSettings(settingsOrchestrator);

// Consuming component
const settings = injectSettings();
const projectPath = computed(() => settings.projectPath.value);
```

### Bad

```typescript
// BAD: Direct Vue provide/inject (not typed)
provide('settings', settingsOrchestrator);
const settings = inject('settings');  // any type

// BAD: Creating capability inside orchestrator
function createTasksOrchestrator() {
  const tasksApi = createTasksApiCapability();  // Should be injected
}

// BAD: Exposing internal state directly
return {
  _internalState,  // Prefix with _ but still exposed
};
```

## Exceptions

- Root `App.vue` creates and provides all orchestrators
- Simple utility functions don't need the full pattern
