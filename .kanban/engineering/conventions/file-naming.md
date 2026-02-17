---
id: "conventions/file-naming"
title: "File Naming Convention"
type: convention
summary: "Naming conventions for TypeScript files in the GUI system"
keywords: [naming, files, typescript, conventions]
related: ["systems/gui", "conventions/component-structure"]
paths: ["apps/gui/src/"]
updated: 2026-02-17
---

# File Naming Convention

## Rules

1. **Use kebab-case** for all file names
2. **Use suffixes** to indicate file purpose:
   - `.orchestrator.ts` - State coordination and business logic
   - `.provider.ts` - Vue provide/inject wrapper
   - `.capability.ts` - External API wrappers (IPC, fetch)
   - `.computer.ts` - Pure computation functions
   - `-types.ts` - Type definitions
3. **Feature folders** contain all related files with consistent naming:
   ```
   feature/
   ├── feature-types.ts
   ├── feature.capability.ts
   ├── feature-something.computer.ts
   ├── feature.orchestrator.ts
   ├── feature.provider.ts
   └── index.ts
   ```
4. **Vue components** use PascalCase: `TaskList.vue`, `TerminalPanel.vue`
5. **UI components** follow shadcn pattern: `component/Component.vue` with `index.ts` export

## Examples

### Good

```
tasks/
├── task-types.ts              # Type definitions
├── tasks-api.capability.ts    # IPC wrapper
├── task-actions.computer.ts   # Pure functions
├── task-grouping.computer.ts  # Pure functions
├── tasks.orchestrator.ts      # State coordination
├── tasks.provider.ts          # Vue injection
└── index.ts                   # Public exports

components/ui/button/
├── Button.vue
└── index.ts
```

### Bad

```
# BAD: CamelCase file names
taskOrchestrator.ts
TaskGrouping.ts

# BAD: Missing suffix
tasks.ts  # Is this orchestrator? capability? types?

# BAD: Inconsistent naming
task-api.ts      # Should be tasks-api.capability.ts
taskComputer.ts  # Should be task-something.computer.ts
```

## Exceptions

- `index.ts` files for barrel exports
- `main.ts` as Vue entry point
- `App.vue` as root component
- Electron files in `electron/` follow Electron conventions
