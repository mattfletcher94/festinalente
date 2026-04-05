---
id: "conventions/folder-structure"
title: "Folder Structure Convention"
type: convention
tldr: "Organize code by architectural layer: handlers/, computers/, capabilities/, orchestrators/"
summary: "Code is organized by architectural layer to enforce the DAG pattern and enable discovery"
keywords: [folders, structure, organization, layers, domain, architecture]
aliases: [folder-structure, directory-convention]
boundary: "Does not apply to .festinalente/ project data or build output directories"
references: []
uses: [patterns/dag-architecture]
paths: [apps/festinalente/src/cli, apps/vscode/src]
intent: reference
prerequisites: []
updated: "2026-04-05"
---

# Folder Structure Convention

> **TL;DR:** Organize code by architectural layer: handlers/, computers/, capabilities/, orchestrators/

## Rule

Source code is organized into folders matching the DAG architecture layers. Each folder contains only files of that architectural type.

```
src/
├── capabilities/     # I/O operations (file system, terminal, UI)
├── computers/        # Pure functions (parsers, validators, search)
├── handlers/         # Business logic (CLI: command handlers)
├── orchestrators/    # Composition roots (VSCode: domain orchestrators)
├── types/            # Type definitions (if separate from types.ts)
├── orchestrator.ts   # Single orchestrator (CLI)
├── dispatcher.ts     # Entry point (CLI)
├── extension.ts      # Entry point (VSCode)
└── index.ts          # Barrel exports
```

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

## Rationale

Grouping by layer makes the DAG visible in the file system. When you open `handlers/`, you know every file contains business logic. When you open `computers/`, you know every file is pure. This physical separation reinforces the architectural constraint.

**Summary:** Folder names = DAG layers. The file system mirrors the architecture.

## Examples

### Correct

```
apps/festinalente/src/cli/
├── capabilities/
│   └── file-system.capability.ts
├── computers/
│   ├── xml-parser.computer.ts
│   ├── yaml-parser.computer.ts
│   ├── search.computer.ts
│   ├── graph.computer.ts
│   ├── task-resolver.computer.ts
│   └── validation.computer.ts
├── handlers/
│   ├── task.handler.ts
│   ├── spec.handler.ts
│   ├── search.handler.ts
│   └── ...
├── orchestrator.ts
├── dispatcher.ts
└── types.ts
```

### Incorrect

```
apps/festinalente/src/cli/
├── task/
│   ├── task.handler.ts
│   ├── task-resolver.computer.ts
│   └── task.types.ts
├── search/
│   ├── search.handler.ts
│   └── search.computer.ts
// Violates: organized by domain instead of by architectural layer
```

**Summary:** Group by layer (handlers/, computers/), not by domain (task/, search/).

## Boundaries

When this convention does NOT apply:

- `.festinalente/` project data — organized by content type (tasks, product, engineering)
- `dist/` build output — follows npm packaging conventions
- `tools/` and `bin/` — standalone scripts without layer structure

## Enforcement

Caught by CI. The folder names and file suffixes create a self-documenting structure that makes violations obvious during code review.
