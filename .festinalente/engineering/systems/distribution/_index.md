---
id: "systems/distribution"
title: "Package Distribution"
type: system
tldr: "Build, publish, and install workflow for CLI (npm) and VSCode extension (VSIX) packages"
summary: "Packages the CLI as a bundled npm package and the VSCode extension as a VSIX, publishing to GitHub Packages"
keywords: [distribution, npm, github-packages, publish, vsix, packaging, install]
aliases: [distribution, packaging]
boundary: "Does not handle content compilation — depends on content build system for compiled skills"
references: [systems/content-build]
uses: []
paths: [apps/festinalente, apps/vscode]
intent: reference
prerequisites: []
updated: "2026-04-05"
---

# Package Distribution

> **TL;DR:** Build, publish, and install workflow for CLI (npm) and VSCode extension (VSIX) packages

## Overview

The distribution system packages Festina Lente for end users. The CLI is bundled via tsdown into a self-contained CJS package published to GitHub Packages as `@mattfletcher94/festinalente`. The VSCode extension is bundled via esbuild into a VSIX published to GitHub Packages as `@mattfletcher94/festinalente-vscode`.

**Why it exists:** Users install Festina Lente in their projects without needing the monorepo. Bundling ensures all dependencies are included and the CLI works standalone.

**Summary:** Two distribution artifacts: npm package (CLI) and VSIX (VSCode extension), both via GitHub Packages.

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

## Build Artifacts

| Artifact | Build Tool | Package | Registry |
|----------|-----------|---------|----------|
| CLI | tsdown (CJS bundle) | `@mattfletcher94/festinalente` | GitHub Packages |
| VSCode Extension | esbuild (single file) | `@mattfletcher94/festinalente-vscode` | GitHub Packages |

## Build Pipeline

```mermaid
flowchart LR
    subgraph CLI["CLI Build"]
        A["TypeScript src"] --> B["tsdown"]
        C["Content Build"] --> D["Compiled skills"]
        B --> E["dist/cli.cjs"]
        D --> F["dist/skills/"]
    end

    subgraph VSCode["VSCode Build"]
        G["TypeScript src"] --> H["esbuild"]
        H --> I["dist/extension.js"]
        I --> J["vsce package"]
        J --> K["festinalente.vsix"]
    end

    E --> L["npm publish"]
    F --> L
    K --> M["vsce publish"]
```

## Install Process

Both packages include `bin/install.cjs` scripts that run post-install to set up the `.festinalente/` directory structure, copy templates, and configure the workspace.

## Interactions

| System | Relationship | Notes |
|--------|--------------|-------|
| [Content Build](../systems/content-build/_index.md) | Compiled skills included in CLI package | Must build content before packaging |

**Summary:** Distribution depends on content build for compiled skills; produces installable packages.

## Boundaries

What this system does NOT handle:

- **Does NOT:** compile skill templates → See [Content Build](../systems/content-build/_index.md)
- **Does NOT:** manage CI/CD pipelines → manual publish workflow
- **Does NOT:** handle auto-updates → standard npm/VSCode extension update mechanisms
