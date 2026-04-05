---
id: "tooling/oxlint"
title: "Oxlint Configuration"
type: feature
tldr: "Fast Rust-based linter configured at repo root with typescript, import, and eslint plugins"
summary: "Oxlint is installed as a root devDependency and configured via .oxlintrc.json to enforce correctness rules across the monorepo, with targeted overrides for TypeScript idioms."
keywords: [oxlint, lint, linter, code-quality, typescript, import, correctness, turbo]
aliases: [linting, lint-config]
boundary: "Does not replace type-checking; only applies static lint rules"
references: []
uses: []
intent: procedural
prerequisites: []
---

# Oxlint Configuration

> **TL;DR:** Fast Rust-based linter configured at repo root with typescript, import, and eslint plugins

## Overview

Oxlint provides static analysis for the monorepo. It runs from the repository root and checks all packages in a single pass. The configuration lives in `.oxlintrc.json` and uses three plugins: `eslint`, `typescript`, and `import`. All `correctness` category rules are set to error by default.

**Summary:** One command lints the entire monorepo.

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

## How It Works

### Running

```bash
pnpm lint
```

This executes `oxlint` from the repo root. Turbo also exposes a `lint` task with caching disabled (`cache: false`) so results are always fresh.

### Configuration

The `.oxlintrc.json` file at the repo root controls all behavior:

- **Plugins:** `eslint`, `typescript`, `import`
- **Categories:** `correctness` set to `error` (all correctness rules are errors by default)
- **Ignore patterns:** `node_modules`, `dist`, `.turbo`, `coverage`, `scripts`

### Rule Overrides

Nine rules are explicitly configured:

| Rule | Level | Notes |
|------|-------|-------|
| `eslint/sort-imports` | warn | Encourages consistent import ordering |
| `typescript/no-unused-vars` | error | Allows underscore-prefixed names (`^_`) |
| `typescript/no-useless-constructor` | off | Permitted for DI patterns |
| `typescript/no-extraneous-class` | off | Static-only classes allowed |
| `typescript/no-non-null-assertion` | off | Non-null assertions permitted |
| `typescript/no-dynamic-delete` | off | Dynamic delete permitted |
| `typescript/no-explicit-any` | off | Explicit any permitted |
| `typescript/no-empty-object-type` | off | Empty object types permitted |
| `eslint/no-empty-pattern` | off | Empty destructuring permitted |

## Examples

Lint the entire monorepo:

```bash
pnpm lint
```

Run via turbo (equivalent, but goes through the task pipeline):

```bash
turbo lint
```

## Boundaries

- **Does NOT:** Replace TypeScript type-checking (`pnpm typecheck` is separate)
- **Does NOT:** Auto-fix on save; oxlint is a check-only step
- **Does NOT:** Lint files in `node_modules`, `dist`, `.turbo`, `coverage`, or `scripts`
- **Does NOT:** Use ESLint; the prior dead eslint script was removed from `apps/vscode/package.json`
