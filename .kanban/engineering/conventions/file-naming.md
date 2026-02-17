---
id: "conventions/file-naming"
title: "File Naming Convention"
type: convention
summary: "Kebab-case for files, PascalCase for Vue components"
keywords: [naming, files, conventions, kebab-case, pascal-case]
related: []
paths: []
updated: 2026-02-17
---

# File Naming Convention

## Rules

1. **TypeScript/JavaScript files**: Use kebab-case
   - Example: `pty-service.ts`, `get-date-time.ts`, `index.ts`

2. **Vue components**: Use PascalCase
   - Example: `TaskList.vue`, `TaskDetail.vue`, `ResizablePanel.vue`

3. **Markdown files**: Use kebab-case
   - Example: `engineering-overview.md`, `ipc-bridge.md`

4. **Directories**: Use kebab-case
   - Example: `kanban-templates/`, `ui/`, `scroll-area/`

## Examples

### Good

```
apps/gui/src/components/TaskList.vue
apps/gui/src/components/ui/scroll-area/ScrollArea.vue
apps/kanban/src/scripts/find-task.ts
.kanban/engineering/patterns/ipc-bridge.md
```

### Bad

```
TaskList.ts            # Non-Vue TypeScript should be kebab-case
task-list.vue          # Vue components should be PascalCase
findTask.ts            # Use kebab-case, not camelCase
```

## Exceptions

- `index.ts` files are always lowercase
- Package entry points follow npm conventions (`package.json`)
- Configuration files follow tool conventions (`vite.config.ts`, `tsconfig.json`)
