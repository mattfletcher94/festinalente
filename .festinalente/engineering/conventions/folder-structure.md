---
id: "conventions/folder-structure"
title: "Folder Structure Convention"
type: convention
tldr: "Domain-driven folders: capabilities/, computers/, handlers/, orchestrators/"
summary: "Organize code by architectural layer to enforce DAG and enable discovery"
keywords: [folders, structure, organization, layers, domain]
aliases: [directory-structure, project-layout]
boundary: "Does not apply to build output (dist/) or external configs"
references: [patterns/dag-architecture]
uses: [systems/cli, systems/vscode-extension]
paths: [apps/festinalente/src/cli, apps/vscode/src]
intent: reference
prerequisites: []
---

# Folder Structure Convention

> **TL;DR:** Domain-driven folders: capabilities/, computers/, handlers/, orchestrators/

## Overview

<!-- Each section must be self-contained: open with a context sentence, no back-references -->

Folder organization by architectural layer to enforce DAG dependencies and enable discovery.

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

## Rule

Organize source code by **architectural layer**, not by feature:

```
src/
├── capabilities/      # I/O and side effects
├── computers/         # Pure functions
├── handlers/          # Command implementations (CLI)
├── orchestrators/     # Composition and coordination (VSCode)
├── types/             # Type definitions (if many)
└── entry-point.ts     # Main entry
```

## Rationale

1. **DAG Enforcement**: Layer folders make import violations obvious
2. **Discoverability**: "Where are capabilities?" → `capabilities/`
3. **Consistency**: Same structure across CLI and VSCode packages
4. **Testing**: Easy to mock entire folders

**Summary:** Layer folders > feature folders for this architecture.

## Examples

### Correct

```
apps/festinalente/src/cli/
├── capabilities/                 ✅ All I/O in one folder
│   └── file-system.capability.ts
├── computers/                    ✅ All pure logic in one folder
│   ├── xml-parser.computer.ts
│   ├── yaml-parser.computer.ts
│   ├── search.computer.ts
│   └── validation.computer.ts
├── handlers/                     ✅ All command handlers
│   ├── task.handler.ts
│   ├── project.handler.ts
│   ├── spec.handler.ts
│   ├── config.handler.ts
│   └── search.handler.ts
├── types.ts                      ✅ Shared types at root
├── registry.ts                   ✅ Standalone modules at root
├── orchestrator.ts               ✅ Main orchestrator at root
├── dispatcher.ts                 ✅ Entry point at root
└── index.ts                      ✅ Barrel exports
```

```
apps/vscode/src/
├── capabilities/                 ✅ VSCode I/O
│   ├── file-system.capability.ts
│   ├── terminal.capability.ts
│   ├── tasks-view.capability.ts
│   ├── projects-view.capability.ts
│   └── codelens.capability.ts
├── computers/                    ✅ Parsing and logic
│   ├── task-parser.computer.ts
│   ├── task-actions.computer.ts
│   ├── project-parser.computer.ts
│   └── plan-parser.computer.ts
├── orchestrators/                ✅ Domain coordinators
│   ├── terminal.orchestrator.ts
│   ├── tasks.orchestrator.ts
│   ├── projects.orchestrator.ts
│   └── docs.orchestrator.ts
├── types/                        ✅ Type folder when many types
│   ├── task-types.ts
│   ├── project-types.ts
│   └── directives-types.ts
└── extension.ts                  ✅ Entry point
```

### Incorrect

```
src/
├── tasks/                        ❌ Feature-based (mixes layers)
│   ├── task.capability.ts
│   ├── task.computer.ts
│   └── task.handler.ts
├── search/                       ❌ Feature-based
│   ├── search.capability.ts
│   └── search.computer.ts
└── utils/                        ❌ Ambiguous "utils" folder
    └── file-helpers.ts
```

```
src/
├── services/                     ❌ Non-descriptive layer name
├── helpers/                      ❌ Ambiguous
├── lib/                          ❌ Ambiguous
└── core/                         ❌ Ambiguous
```

**Summary:** Use layer names (capability, computer, handler), not feature names.

## Monorepo Structure

```
festinalente/
├── apps/
│   ├── festinalente/             # CLI package
│   │   ├── src/
│   │   │   ├── cli/              # CLI source (layer folders inside)
│   │   │   └── content/          # Skill content (not layer-based)
│   │   ├── tools/                # Build scripts
│   │   └── package.json
│   └── vscode/                   # Extension package
│       ├── src/                  # Extension source (layer folders inside)
│       └── package.json
├── .festinalente/                # Project data (not source code)
├── .claude/                      # Claude runtime config
├── .opencode/                    # OpenCode runtime config
└── package.json                  # Root workspace
```

## Boundaries

When this convention does NOT apply:

- **Build output**: `dist/` follows build tool conventions
- **Content folders**: `src/content/` uses content-type folders (skills, templates)
- **Config directories**: `.festinalente/`, `.claude/` use domain folders
- **External packages**: `node_modules/` is external

## Enforcement

- **Code review**: Reviewers check new files are in correct folder
- **IDE snippets**: Create file snippets that prompt for layer
- **New file workflow**: "Creating a capability? Put in capabilities/"
