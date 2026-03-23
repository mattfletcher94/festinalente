---
id: "conventions/oxlint"
title: "Oxlint Convention"
type: convention
tldr: "All code is linted by oxlint using a shared root config; correctness rules are errors, imports must be sorted, unused vars prefixed with underscore"
summary: "Oxlint provides fast, zero-config-needed linting across the monorepo via a single .oxlintrc.json at the repository root, enforcing correctness as errors and consistent import ordering as warnings"
keywords: [oxlint, lint, linter, rules, convention, code-quality, correctness, imports, typescript]
aliases: [linting, lint-rules]
boundary: "Does not cover formatting, type-checking, or ESLint migration details"
references: []
uses: [systems/cli, systems/vscode-extension]
paths: [.oxlintrc.json, package.json, turbo.json]
updated: 2026-03-05
---

# Oxlint Convention

> **TL;DR:** All code is linted by oxlint using a shared root config; correctness rules are errors, imports must be sorted, unused vars prefixed with underscore.

## Overview

Oxlint provides fast, zero-config linting across the monorepo with correctness as errors and import ordering as warnings.

## Rule

The repository uses **oxlint** as its sole linter, configured via a single `.oxlintrc.json` at the repository root. The following rules apply:

1. **Correctness category is set to error.** All rules in the `correctness` category are enforced as errors. These catch genuine bugs such as unreachable code, invalid comparisons, and incorrect API usage.

2. **Imports must be sorted.** The `eslint/sort-imports` rule is set to `warn`. Group and order import statements consistently.

3. **Unused variables must be underscore-prefixed.** The `typescript/no-unused-vars` rule is set to `error` with `argsIgnorePattern: "^_"` and `varsIgnorePattern: "^_"`. If a variable or parameter is intentionally unused, prefix it with `_`.

4. **Enabled plugins are `eslint`, `typescript`, and `import`.** These three plugins provide the full rule set. No additional plugins should be added without discussion.

5. **Several strict TypeScript rules are intentionally disabled.** The following rules are turned off because they conflict with patterns used in this codebase:
   - `typescript/no-useless-constructor`
   - `typescript/no-extraneous-class`
   - `typescript/no-non-null-assertion`
   - `typescript/no-dynamic-delete`
   - `typescript/no-explicit-any`
   - `typescript/no-empty-object-type`
   - `eslint/no-empty-pattern`

6. **Ignored directories:** `node_modules`, `dist`, `.turbo`, `coverage`, and `scripts` are excluded from linting.

## Rationale

1. **Speed.** Oxlint is written in Rust and runs significantly faster than ESLint, making it practical to lint the entire monorepo in seconds without caching.
2. **Single source of truth.** One `.oxlintrc.json` at the root means every package shares the same rules. No per-package config drift.
3. **Correctness-first.** Treating the entire correctness category as errors catches real bugs early while keeping stylistic rules minimal.
4. **Pragmatic overrides.** Rules like `no-explicit-any` and `no-non-null-assertion` are disabled because the codebase uses these TypeScript features deliberately in specific patterns (e.g., capability factories, dynamic object manipulation).
5. **Import hygiene.** Sorted imports reduce merge conflicts and improve readability without requiring a formatter.

## Examples

### Running the linter

```bash
# From the repository root
pnpm lint

# Via turbo (runs across the monorepo)
pnpm turbo lint
```

### Correct: unused variable with underscore prefix

```typescript
// The parameter is unused but prefixed with _, so no error
function handleEvent(_event: Event, data: string): void {
  console.log(data);
}
```

### Incorrect: unused variable without prefix

```typescript
// This will produce an error: 'event' is defined but never used
function handleEvent(event: Event, data: string): void {
  console.log(data);
}
```

### Correct: sorted imports

```typescript
import { readFile } from 'fs/promises';
import { join } from 'path';

import { createCapability } from '../capabilities/factory.capability';
import { parseXml } from '../computers/xml-parser.computer';
```

### Incorrect: unsorted imports

```typescript
import { parseXml } from '../computers/xml-parser.computer';
import { join } from 'path';
import { createCapability } from '../capabilities/factory.capability';
import { readFile } from 'fs/promises';
```

## Exceptions

- **The `scripts/` directory is excluded.** Build scripts, tooling helpers, and one-off automation scripts are not linted because they often use patterns (dynamic requires, loose typing) that would generate noise.
- **Disabling a rule inline.** If a specific line genuinely needs to bypass a rule, use an `// oxlint-ignore` comment with the rule name. This should be rare and accompanied by a justifying comment.
- **Adding new rule overrides.** If a new rule from the correctness category produces false positives for a legitimate pattern, it may be turned off in `.oxlintrc.json`. Document the reason in a comment or commit message.

## Boundaries

This convention does **not** cover:

- **Code formatting.** Oxlint is a linter, not a formatter. Whitespace, semicolons, and brace style are outside its scope.
- **Type checking.** Type errors are caught by `tsc` via the `typecheck` turbo task, not by oxlint.
- **ESLint.** The repository does not use ESLint. Oxlint replaces it entirely. Do not add `.eslintrc` files.
- **Per-package overrides.** There are no per-package oxlint configs. All linting configuration lives at the root.
- **Editor integration.** IDE-specific oxlint plugin setup is a developer preference, not a repository convention.

## Enforcement

- **CI / Turbo pipeline.** The `lint` task in `turbo.json` runs `oxlint` with no caching, ensuring every pipeline execution checks the current source.
- **Local development.** Run `pnpm lint` before committing to catch issues early.
