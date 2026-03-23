---
id: "conventions/file-naming"
title: "File Naming Convention"
type: convention
tldr: "kebab-case with functional suffix: name.capability.ts, name.computer.ts"
summary: "Consistent naming makes files predictable and indicates architectural layer"
keywords: [naming, kebab-case, suffix, files, convention]
aliases: [naming-convention, file-names]
boundary: "Does not apply to config files (package.json, tsconfig.json)"
references: [patterns/dag-architecture]
uses: [systems/cli, systems/vscode-extension]
paths: [apps/festinalente/src/cli, apps/vscode/src]
updated: 2026-03-01
---

# File Naming Convention

> **TL;DR:** kebab-case with functional suffix: name.capability.ts, name.computer.ts

## Overview

File naming convention using kebab-case with layer-indicating suffixes for predictable discovery.

## Rule

All TypeScript files use **kebab-case** with a **functional suffix** indicating their architectural layer:

```
{name}.{layer}.ts
```

| Layer | Suffix | Example |
|-------|--------|---------|
| Capability | `.capability.ts` | `file-system.capability.ts` |
| Computer | `.computer.ts` | `xml-parser.computer.ts` |
| Handler | `.handler.ts` | `task.handler.ts` |
| Orchestrator | `.orchestrator.ts` | `terminal.orchestrator.ts` |
| Types | `.types.ts` or `-types.ts` | `task-types.ts` |

## Rationale

1. **Predictability**: Knowing the layer tells you what to expect (I/O vs pure logic)
2. **Searchability**: Glob patterns like `*.capability.ts` find all capabilities
3. **DAG Enforcement**: Suffix reveals import violations (computer importing capability)
4. **Onboarding**: New developers understand architecture from filenames

**Summary:** Suffix indicates layer, kebab-case for readability.

## Examples

### Correct

```
apps/festinalente/src/cli/
├── capabilities/
│   └── file-system.capability.ts    ✅ kebab-case + .capability
├── computers/
│   ├── xml-parser.computer.ts       ✅ kebab-case + .computer
│   ├── yaml-parser.computer.ts      ✅
│   └── search.computer.ts           ✅
├── handlers/
│   ├── task.handler.ts              ✅ kebab-case + .handler
│   ├── config.handler.ts            ✅
│   └── validation.handler.ts        ✅
├── orchestrators/
│   └── terminal.orchestrator.ts     ✅ (if present)
├── types.ts                         ✅ shared types (no suffix needed)
├── registry.ts                      ✅ standalone module (no suffix needed)
├── orchestrator.ts                  ✅ main orchestrator (no suffix needed)
└── dispatcher.ts                    ✅ entry point (no suffix needed)
```

```typescript
// Correct imports show layer relationships
import { createFileSystemCapability } from '../capabilities/file-system.capability';
import { createXmlParserComputer } from '../computers/xml-parser.computer';
```

### Incorrect

```
├── FileSystemCapability.ts          ❌ PascalCase
├── file_system_capability.ts        ❌ snake_case
├── filesystem.ts                    ❌ missing suffix
├── file-system.cap.ts               ❌ abbreviated suffix
├── FileSystem.capability.ts         ❌ mixed case
└── file-system-capability.ts        ❌ suffix in name, not separated by dot
```

```typescript
// Incorrect: no suffix makes layer unclear
import { readFile } from '../utils/file-system';  // ❌ Is this a capability?
```

**Summary:** Always use kebab-case with proper dot-separated suffix.

## Boundaries

When this convention does NOT apply:

- **Config files**: `package.json`, `tsconfig.json` (external conventions)
- **Entry points**: `extension.ts`, `dispatcher.ts` (no layer suffix needed)
- **Index files**: `index.ts` for barrel exports
- **Shared types**: `types.ts` for module-wide types

## Enforcement

- **Code review**: Reviewers check file naming
- **No automated linting**: TypeScript doesn't enforce filenames
- **Pattern matching**: CI could check with glob patterns

### Potential Lint Rule

```bash
# Check for files missing layer suffix in capability folder
find apps/*/src/cli/capabilities -name "*.ts" ! -name "*.capability.ts" -type f
```
