---
id: "conventions/file-naming"
title: "File Naming Convention"
type: convention
tldr: "kebab-case for files, PascalCase for types/interfaces"
summary: "Consistent naming makes files predictable and searchable"
keywords: [naming, kebab-case, pascal-case, files]
aliases: [naming-convention]
boundary: "Does not apply to third-party or generated files"
related:
  - conventions/folder-structure
paths:
  - apps/kanban/src/scripts
  - apps/vscode/src
updated: 2026-02-20
verified: 2026-02-20
code_refs: []
---

# File Naming Convention

> **TL;DR:** kebab-case for files, PascalCase for types/interfaces

## Rule

1. **File names:** Use `kebab-case.ts` (lowercase with hyphens)
2. **Type/Interface names:** Use `PascalCase`
3. **Suffixes:** Add role suffix before extension
   - `.capability.ts` for capabilities
   - `.computer.ts` for computers
   - `.ts` (no suffix) for scripts

## Rationale

- kebab-case is filesystem-safe across all platforms
- PascalCase distinguishes types from variables
- Role suffixes make file purpose clear at a glance

**Summary:** Predictable names enable faster navigation and searching.

## Examples

### Correct

```
apps/kanban/src/scripts/
├── find-task.ts           # kebab-case script
├── list-tasks.ts          # plural when listing
├── validate-xml.ts        # action-object naming
└── search-hybrid.ts       # descriptive name

apps/vscode/src/
├── capabilities/
│   ├── file-system.capability.ts    # kebab-case + suffix
│   ├── tasks-view.capability.ts
│   └── terminal.capability.ts
├── computers/
│   ├── task-parser.computer.ts
│   └── task-grouping.computer.ts
└── types/
    └── task-types.ts                # types in dedicated file
```

### Type/Interface Naming

```typescript
// In task-types.ts
interface TaskStatus { ... }          // PascalCase
interface CreateTaskParserComputerReturn { ... }
type DeleteResult = DeleteSuccessResult | DeleteErrorResult;
```

### Incorrect

```
FindTask.ts              # Violates: should be kebab-case
find_task.ts             # Violates: no underscores
fileSystemCapability.ts  # Violates: missing suffix, camelCase
```

**Summary:** kebab-case files, PascalCase types, role suffixes for VSCode components.

## Boundaries

When this convention does NOT apply:

- Generated files (e.g., `*.d.ts` from build)
- Configuration files (`package.json`, `tsconfig.json`)
- Third-party code or dependencies

## Enforcement

- Code review
- TypeScript compiler errors catch type mismatches
- No automated linting currently configured
