---
id: "conventions/file-naming"
title: "File Naming Convention"
type: convention
tldr: "kebab-case with architectural suffix: .handler.ts, .computer.ts, .capability.ts, .orchestrator.ts"
summary: "Consistent naming with architectural suffixes makes files predictable and indicates their layer in the DAG"
keywords: [naming, kebab-case, suffix, files, convention, handler, computer, capability, orchestrator]
aliases: [file-naming, naming-convention]
boundary: "Does not apply to config files, scripts, or non-TypeScript files"
references: []
uses: [patterns/dag-architecture]
paths: [apps/festinalente/src/cli, apps/vscode/src]
intent: reference
prerequisites: []
updated: "2026-04-05"
---

# File Naming Convention

> **TL;DR:** kebab-case with architectural suffix: .handler.ts, .computer.ts, .capability.ts, .orchestrator.ts

## Rule

All TypeScript source files use **kebab-case** naming with an **architectural suffix** that indicates which DAG layer the file belongs to.

| Suffix | Layer | Example |
|--------|-------|---------|
| `.handler.ts` | Handler (business logic) | `task.handler.ts` |
| `.computer.ts` | Computer (pure logic) | `xml-parser.computer.ts` |
| `.capability.ts` | Capability (I/O) | `file-system.capability.ts` |
| `.orchestrator.ts` | Orchestrator (composition) | `tasks.orchestrator.ts` |

Entry points (`dispatcher.ts`, `extension.ts`, `registry.ts`, `types.ts`) and barrel files (`index.ts`) have no suffix.

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

## Rationale

Suffixes tell you the file's architectural role at a glance. You know a `.computer.ts` contains pure functions and a `.capability.ts` contains I/O without opening the file. This makes code review faster and prevents accidental layer violations.

**Summary:** The suffix is a contract — it declares what kind of code the file contains.

## Examples

### Correct

```
apps/festinalente/src/cli/
├── handlers/
│   ├── task.handler.ts
│   ├── search.handler.ts
│   └── validation.handler.ts
├── computers/
│   ├── xml-parser.computer.ts
│   ├── search.computer.ts
│   └── task-resolver.computer.ts
├── capabilities/
│   └── file-system.capability.ts
├── orchestrator.ts
├── dispatcher.ts
├── registry.ts
└── types.ts
```

### Incorrect

```
apps/festinalente/src/cli/
├── handlers/
│   ├── TaskHandler.ts          # PascalCase, missing suffix
│   ├── search.ts               # Missing suffix
│   └── validation_handler.ts   # snake_case
// Violates: kebab-case and suffix requirements
```

**Summary:** kebab-case + suffix for typed files, no suffix for entry points.

## Boundaries

When this convention does NOT apply:

- Config files (`.oxlintrc.json`, `tsconfig.json`, `package.json`)
- Build scripts in `tools/` and `bin/`
- Template and content files (`.md`)

## Enforcement

Caught by CI linting and code review. Oxlint does not enforce file naming directly, but the pattern is consistent enough that violations are obvious in review.
