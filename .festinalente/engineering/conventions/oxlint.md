---
id: "conventions/oxlint"
title: "Oxlint Convention"
type: convention
tldr: "Oxlint enforces correctness as errors and import ordering as warnings via .oxlintrc.json"
summary: "Fast zero-config linting across the monorepo with correctness rules as errors and consistent import ordering"
keywords: [oxlint, lint, linter, rules, convention, code-quality, correctness, imports, typescript]
aliases: [oxlint, linting]
boundary: "Does not enforce file naming, folder structure, or architectural patterns — only code-level rules"
references: []
uses: []
paths: [.oxlintrc.json, package.json, turbo.json]
intent: reference
prerequisites: []
updated: "2026-04-05"
---

# Oxlint Convention

> **TL;DR:** Oxlint enforces correctness as errors and import ordering as warnings via .oxlintrc.json

## Rule

The project uses Oxlint (Rust-based linter) with ESLint, TypeScript, and Import plugins. Correctness rules are errors. Import sorting is a warning. Unused variables must be prefixed with `_`.

Key rules:
- `correctness` category: **error** (catches real bugs)
- `eslint/sort-imports`: **warn** (consistent import ordering)
- `typescript/no-unused-vars`: **error** with `^_` ignore pattern
- `typescript/no-non-null-assertion`: **off** (allowed in this codebase)

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

## Rationale

Oxlint is significantly faster than ESLint for large codebases. By setting correctness to error, real bugs are caught at lint time. Import sorting as a warning keeps code tidy without blocking commits on ordering issues.

**Summary:** Fast linting that catches bugs (errors) without bikeshedding on style (warnings).

## Examples

### Correct

```typescript
import { createTaskHandler } from './handlers/task.handler';
import { createXmlParserComputer } from './computers/xml-parser.computer';
import type { TaskInfo } from './types';

const _unusedButIntentional = 'ok'; // prefixed with _
```

### Incorrect

```typescript
import type { TaskInfo } from './types';
import { createTaskHandler } from './handlers/task.handler'; // unsorted
// Violates: eslint/sort-imports (warning)

const unusedVar = 'error'; // no _ prefix
// Violates: typescript/no-unused-vars (error)
```

**Summary:** Prefix unused vars with `_`, keep imports sorted.

## Boundaries

When this convention does NOT apply:

- Generated files in `dist/`
- Config files (JSON, YAML)
- Markdown content files

## Enforcement

CI runs `oxlint` via Turbo. Errors block the build; warnings are reported but don't block.
