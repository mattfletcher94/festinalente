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
  - patterns/orchestrator
  - patterns/capability-computer
paths:
  - apps/kanban/src/scripts
  - apps/vscode/src
updated: 2026-02-27
verified: 2026-02-27
code_refs:
  - apps/festinalente/src/scripts/next-id.ts
---

# File Naming Convention

> **TL;DR:** kebab-case for files, PascalCase for types/interfaces

## Overview

This convention establishes consistent naming patterns across the codebase. File names use kebab-case for filesystem compatibility, type names use PascalCase for visibility, and task folders use numeric-prefix-plus-slug format for human readability.

**Summary:** Predictable names enable faster navigation and searching.

## Rule

1. **File names:** Use `kebab-case.ts` (lowercase with hyphens)
2. **Type/Interface names:** Use `PascalCase`
3. **Task folder names:** Use `{number}-{slug}` format (e.g., `021-support-task-id-slugs`)
4. **Suffixes:** Add role suffix before extension
   - `.orchestrator.ts` for orchestrators (domain policy)
   - `.capability.ts` for capabilities (I/O mechanism)
   - `.computer.ts` for computers (pure logic)
   - `.ts` (no suffix) for scripts and entry points

## Rationale

- kebab-case is filesystem-safe across all platforms
- PascalCase distinguishes types from variables
- Role suffixes make file purpose clear at a glance

**Summary:** Predictable names enable faster navigation and searching.

## Examples

### Naming Pattern Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FILE NAMING RULES                        │
├─────────────────────────────────────────────────────────────┤
│  FILE TYPE           │  PATTERN              │  EXAMPLE     │
├──────────────────────┼───────────────────────┼──────────────┤
│  Script              │  kebab-case.ts        │  find-task   │
│  Orchestrator        │  name.orchestrator.ts │  tasks       │
│  Capability          │  name.capability.ts   │  file-system │
│  Computer            │  name.computer.ts     │  task-parser │
│  Type definitions    │  name-types.ts        │  task-types  │
│  Task folder         │  {num}-{slug}         │  021-add-auth│
├──────────────────────┼───────────────────────┼──────────────┤
│  Interface/Type      │  PascalCase           │  TaskStatus  │
│  Function            │  camelCase            │  parseTask   │
│  Constant            │  UPPER_SNAKE          │  MAX_RETRIES │
└──────────────────────┴───────────────────────┴──────────────┘
```

### Task Folders

```
.festinalente/tasks/
├── 001-initial-setup/           # slug from "Initial Setup"
├── 021-support-task-id-slugs/   # slug from "Support task ID slugs"
└── 022-add-dark-mode-toggle/    # slug from "Add dark mode toggle"
```

- Numeric prefix: 3 digits, zero-padded
- Slug: auto-generated via slugify, max 50 chars, lowercase with hyphens
- Lookup: Scripts match by numeric prefix for backwards compatibility

### Correct

```
apps/festinalente/src/scripts/
├── find-task.ts           # kebab-case script
├── list-tasks.ts          # plural when listing
├── validate-xml.ts        # action-object naming
└── search-hybrid.ts       # descriptive name

apps/vscode/src/
├── orchestrators/
│   ├── tasks.orchestrator.ts        # domain orchestrator
│   └── quicks.orchestrator.ts
├── capabilities/
│   ├── file-system.capability.ts    # kebab-case + suffix
│   ├── tasks-view.capability.ts
│   └── terminal.capability.ts
├── computers/
│   ├── task-parser.computer.ts
│   └── task-grouping.computer.ts
├── types/
│   └── task-types.ts                # types in dedicated file
└── extension.ts                     # composition root (entry point)
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
