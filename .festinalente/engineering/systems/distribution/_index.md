---
id: "systems/distribution"
title: "Package Distribution"
type: system
tldr: "NPM packages published to GitHub Package Registry"
summary: "Build, publish, and install workflow for CLI and VSCode extension packages"
keywords: [distribution, npm, github-packages, publish, vsix]
aliases: [publishing, packages]
boundary: "Does not build content - see content-build"
references: [systems/content-build, systems/cli, systems/vscode-extension]
uses: []
paths: [apps/festinalente, apps/vscode]
updated: 2026-03-01
verified: 2026-03-01
code_refs: []
---

# Package Distribution

> **TL;DR:** NPM packages published to GitHub Package Registry

## Overview

Festina Lente distributes two packages via GitHub Package Registry: the CLI tool (`@mattfletcher94/festinalente`) and the VSCode extension (`@mattfletcher94/festinalente-vscode`).

**Why it exists:** Users install the CLI via `npx` and the extension via VSCode marketplace or VSIX. Publishing to GitHub Packages enables private distribution with authentication.

**Summary:** CLI + Extension → GitHub Packages → User Install

## Packages

| Package | Type | Registry | Version |
|---------|------|----------|---------|
| `@mattfletcher94/festinalente` | CLI | npm.pkg.github.com | 1.0.1 |
| `@mattfletcher94/festinalente-vscode` | VSCode Extension | npm.pkg.github.com | 0.1.1 |

## Build & Publish Flow

```mermaid
flowchart LR
    subgraph CLI["CLI Package"]
        C1["pnpm build"] --> C2["tsdown bundle"]
        C2 --> C3["dist/"]
        C3 --> C4["npm publish"]
    end

    subgraph Extension["VSCode Package"]
        E1["pnpm build"] --> E2["esbuild bundle"]
        E2 --> E3["dist/extension.js"]
        E3 --> E4["vsce package"]
        E4 --> E5["*.vsix"]
        E5 --> E6["npm publish"]
    end

    C4 --> REG["GitHub Packages"]
    E6 --> REG
```

## CLI Build

```bash
# In apps/festinalente/
pnpm build           # Compiles content + CLI
pnpm publish         # Publishes to GitHub Packages
```

**Artifacts:**
- `bin/install.cjs` - NPM binary entry point
- `dist/cli/` - Compiled CLI code
- `dist/content/` - Compiled skills and templates

## VSCode Build

```bash
# In apps/vscode/
pnpm build           # esbuild bundles extension
pnpm package         # vsce creates .vsix
pnpm publish         # Publishes to GitHub Packages
```

**Artifacts:**
- `dist/extension.js` - Single bundled file
- `*.vsix` - VSCode extension package

## Installation

### CLI

```bash
# Configure npm for GitHub Packages
npm config set @mattfletcher94:registry https://npm.pkg.github.com

# Install globally or use npx
npx @mattfletcher94/festinalente init
```

### VSCode Extension

```bash
# Install from VSIX
code --install-extension festinalente-vscode-0.1.1.vsix
```

Or install from Marketplace (if published there).

## Monorepo Build

```bash
# Root level
pnpm build           # Turbo builds all packages
pnpm typecheck       # TypeScript type checking
pnpm clean           # Remove dist/ folders
```

**Turbo Configuration:**
- Parallel builds across workspaces
- Dependency-aware task ordering
- Build caching

## Interactions

| System | Relationship | Notes |
|--------|--------------|-------|
| [content-build](../content-build/_index.md) | Compiles before publish | Skills compiled to dist/ |
| [cli](../cli/_index.md) | Published as package | Users install via npm |
| [vscode-extension](../vscode-extension/_index.md) | Published as VSIX | Users install in VSCode |

**Summary:** Content build outputs to distribution, which publishes packages.

## Boundaries

What this system does NOT handle:

- **Does NOT:** Compile content → See [content-build](../content-build/_index.md)
- **Does NOT:** Define CLI commands → See [cli](../cli/_index.md)
- **Does NOT:** Define extension UI → See [vscode-extension](../vscode-extension/_index.md)

## Configuration

### package.json (CLI)

```json
{
  "name": "@mattfletcher94/festinalente",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  },
  "bin": {
    "festinalente": "./bin/install.cjs"
  }
}
```

### package.json (Extension)

```json
{
  "name": "@mattfletcher94/festinalente-vscode",
  "engines": {
    "vscode": "^1.85.0"
  }
}
```
