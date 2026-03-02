---
id: overview
title: "Festina Lente Engineering Overview"
type: overview
tldr: "Spec-driven AI development framework with DAG architecture (orchestrators → capabilities → computers)"
summary: "High-level technical overview of Festina Lente architecture, tech stack, and design patterns"
keywords: [architecture, tech-stack, overview, monorepo, typescript, vscode, dag, orchestrator]
aliases: [engineering-overview, architecture-overview]
boundary: "Does not cover implementation details - see systems/ and patterns/"
references: [patterns/dag-architecture, patterns/factory-di, patterns/tagged-union-errors, patterns/command-registry, systems/cli, systems/vscode-extension, systems/content-build, systems/data-model, systems/distribution, conventions/file-naming, conventions/folder-structure, conventions/error-handling]
uses: []
paths: [apps/festinalente, apps/vscode]
updated: 2026-03-01
verified: 2026-03-01
code_refs: []
---

# Festina Lente Engineering Overview

> **TL;DR:** Spec-driven AI development framework with DAG architecture (orchestrators → capabilities → computers)

## Tech Stack

| Category | Technology |
|----------|------------|
| Language | TypeScript 5.9.3, Node.js 18+ |
| Framework | VSCode Extension API 1.85+ |
| Templating | Handlebars 4.7.8 |
| Parsing | fast-xml-parser 5.3.6, js-yaml 4.1.1, zod 3.25 |
| Search | fuse.js 7.1.0 (fuzzy search) |
| Build | pnpm 9.15+, Turbo, esbuild, tsdown |
| Database | None (file-based: XML, YAML, Markdown) |
| Testing | None configured (type safety as verification) |

**Summary:** TypeScript monorepo with file-based persistence, no database layer.

## Architecture Summary

Festina Lente uses a **Directed Acyclic Graph (DAG)** architecture where orchestrators compose capabilities (I/O) and computers (pure logic) without circular dependencies. This enables testability, clear separation of concerns, and predictable data flow.

**Why it exists:** AI agents need structured task workflows. The DAG ensures side effects are isolated in capabilities while business logic remains pure and testable in computers.

**Summary:** DAG architecture with orchestrator → capability → computer layering.

## System Architecture

```mermaid
flowchart TB
    subgraph IDE["VSCode IDE"]
        EXT["Extension<br/>extension.ts"]
        ORCH["Orchestrators<br/>(6 domains)"]
        CAP["Capabilities<br/>(I/O)"]
        COMP["Computers<br/>(Pure Logic)"]
    end

    subgraph CLI["CLI System"]
        DISP["Dispatcher"]
        REG["Registry"]
        HAND["Handlers"]
    end

    subgraph Data[".festinalente/"]
        TASKS["tasks/"]
        DOCS["product/ + engineering/"]
        CONFIG["config.yaml"]
    end

    EXT --> ORCH
    ORCH --> CAP
    ORCH --> COMP
    CAP --> Data

    DISP --> REG
    REG --> HAND
    HAND --> CAP
    HAND --> COMP
```

## DAG Dependency Flow

```mermaid
flowchart LR
    subgraph Layer1["Layer 1: Entry"]
        EXT["extension.ts"]
        DISP["dispatcher.ts"]
    end

    subgraph Layer2["Layer 2: Orchestrators"]
        ORCH["*Orchestrator"]
    end

    subgraph Layer3["Layer 3: Handlers"]
        HAND["*Handler"]
    end

    subgraph Layer4["Layer 4: Capabilities"]
        FS["FileSystem"]
        TERM["Terminal"]
        GIT["Git"]
    end

    subgraph Layer5["Layer 5: Computers"]
        XML["XmlParser"]
        YAML["YamlParser"]
        SEARCH["Search"]
    end

    Layer1 --> Layer2
    Layer2 --> Layer3
    Layer3 --> Layer4
    Layer3 --> Layer5
    Layer4 -.->|"I/O"| DB[(Files)]
```

**Key Rule:** Dependencies flow downward only. No layer may import from a higher layer.

## Directory Structure

```
claudeban/
├── apps/
│   ├── festinalente/           # CLI package
│   │   ├── src/cli/
│   │   │   ├── capabilities/   # I/O abstractions
│   │   │   ├── computers/      # Pure logic
│   │   │   ├── handlers/       # Command implementations
│   │   │   ├── orchestrator.ts # Wires everything
│   │   │   ├── registry.ts     # Command registry
│   │   │   └── dispatcher.ts   # Entry point
│   │   ├── src/content/        # Skill templates
│   │   └── tools/              # Build scripts
│   └── vscode/                 # VSCode extension
│       └── src/
│           ├── capabilities/   # VSCode I/O
│           ├── computers/      # Parsing logic
│           ├── orchestrators/  # Domain coordinators
│           └── extension.ts    # Entry point
├── .festinalente/              # Project data (user workspace)
│   ├── tasks/{id}/             # task.xml, spec.xml, plan.xml
│   ├── quick/{id}/             # quick.xml
│   ├── product/docs/           # Product documentation
│   ├── engineering/            # This documentation
│   ├── directives/             # LLM instruction sets
│   ├── config.yaml             # Project settings
│   └── workflow.yaml           # Workflow definitions
└── .claude/ + .opencode/       # Runtime skill definitions
```

**Summary:** Monorepo with CLI and VSCode extension, file-based data in `.festinalente/`.

## Boundaries

What this overview does NOT cover:

- **Does NOT:** Detail individual system implementations → See [systems/](systems/)
- **Does NOT:** Explain specific patterns → See [patterns/](patterns/)
- **Does NOT:** Document coding rules → See [conventions/](conventions/)

## Key Patterns

- [dag-architecture](patterns/dag-architecture.md) - Acyclic dependency graph with orchestrator → capability → computer layers
- [factory-di](patterns/factory-di.md) - Factory functions with dependency injection
- [tagged-union-errors](patterns/tagged-union-errors.md) - Result<T,E> discriminated unions for error handling
- [command-registry](patterns/command-registry.md) - Central registry for CLI command dispatch

## Systems

- [cli](systems/cli/_index.md) - Command-line dispatcher with handlers
- [vscode-extension](systems/vscode-extension/_index.md) - IDE integration with tree views
- [content-build](systems/content-build/_index.md) - Handlebars skill compilation
- [data-model](systems/data-model/_index.md) - File-based storage schemas
- [distribution](systems/distribution/_index.md) - NPM package publishing

## Conventions

- [file-naming](conventions/file-naming.md) - kebab-case with .capability/.computer/.handler suffixes
- [folder-structure](conventions/folder-structure.md) - Domain-driven capability/computer/handler folders
- [error-handling](conventions/error-handling.md) - Tagged union Result types
