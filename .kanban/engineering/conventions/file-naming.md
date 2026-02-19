---
id: "conventions/file-naming"
title: "File Naming Convention"
type: convention
tldr: "PascalCase for components, kebab-case with role suffix for features"
summary: "Consistent naming enables quick identification of file purpose and type"
keywords: [naming, files, pascalcase, kebab-case, convention]
aliases: [naming-convention]
boundary: "Does not apply to config files or third-party generated files"
related:
  - patterns/barrel-exports
  - systems/gui
paths:
  - apps/gui/src/
updated: 2026-02-19
verified: 2026-02-19
code_refs:
  - apps/gui/src/components/TaskList.vue
  - apps/gui/src/tasks/task-actions.computer.ts
---

# File Naming Convention

> **TL;DR:** PascalCase for components, kebab-case with role suffix for features

## Rule

1. **Vue components**: PascalCase (e.g., `TaskList.vue`, `Button.vue`)
2. **Feature files**: kebab-case with role suffix (e.g., `task-actions.computer.ts`)
3. **Type files**: kebab-case ending in `-types.ts` (e.g., `task-types.ts`)
4. **CLI scripts**: kebab-case (e.g., `find-task.ts`, `list-tasks.ts`)

## Role Suffixes

| Suffix | Purpose | Example |
|--------|---------|---------|
| `.computer.ts` | Pure business logic | `task-actions.computer.ts` |
| `.capability.ts` | IPC abstraction | `tasks-api.capability.ts` |
| `.orchestrator.ts` | State management | `tasks.orchestrator.ts` |
| `.provider.ts` | Vue injection | `tasks.provider.ts` |
| `-types.ts` | Type definitions | `task-types.ts` |

## Rationale

- **PascalCase components** match Vue conventions and JSX usage
- **Role suffixes** immediately identify file purpose without opening it
- **kebab-case** avoids case-sensitivity issues across OS

**Summary:** Names indicate purpose; suffixes indicate architectural role.

## Examples

### Correct

```
apps/gui/src/
├── components/
│   └── TaskList.vue           # PascalCase component
├── tasks/
│   ├── index.ts               # Barrel export
│   ├── task-types.ts          # Types file
│   ├── task-actions.computer.ts    # Computer
│   ├── tasks-api.capability.ts     # Capability
│   ├── tasks.orchestrator.ts       # Orchestrator
│   └── tasks.provider.ts           # Provider

apps/kanban/src/scripts/
├── find-task.ts               # CLI script
├── list-tasks.ts              # CLI script
└── validate-xml.ts            # CLI script
```

### Incorrect

```
apps/gui/src/tasks/
├── taskList.vue               # Should be TaskList.vue
├── TaskActions.ts             # Missing .computer suffix
├── tasks_api.ts               # Should be kebab-case with .capability suffix
├── TasksOrchestrator.ts       # Should be tasks.orchestrator.ts

// Violates: Component naming and role suffix conventions
```

**Summary:** Match casing to file type, always include role suffix.

## Boundaries

When this convention does NOT apply:

- `package.json`, `tsconfig.json`, config files (follow their conventions)
- Generated files from build tools
- Third-party library requirements

## Enforcement

- Code review
- IDE file templates
- No automated linting currently
