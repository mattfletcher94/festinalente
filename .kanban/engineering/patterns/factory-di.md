---
id: "patterns/factory-di"
title: "Factory Function Dependency Injection"
type: pattern
tldr: "Use factory functions to inject dependencies for testability and flexibility"
summary: "Dependencies are injected through factory functions that return interfaces with public APIs"
keywords: [dependency-injection, factory, testability, di, composition]
aliases: [factory-pattern, di-pattern]
boundary: "Not for simple utilities that have no dependencies"
related:
  - patterns/capability-computer
paths:
  - apps/vscode/src/capabilities
  - apps/vscode/src/computers
updated: 2026-02-20
verified: 2026-02-20
code_refs:
  - apps/vscode/src/capabilities/file-system.capability.ts:15-35
  - apps/vscode/src/capabilities/codelens.capability.ts:10-25
---

# Factory Function Dependency Injection

> **TL;DR:** Use factory functions to inject dependencies for testability and flexibility

## Problem

Components need dependencies (file system, parsers, other modules) but:
- Hard-coded dependencies make testing difficult
- Class-based DI is verbose in TypeScript
- Need to compose components at application startup

## Solution

Use factory functions that:
1. Accept dependencies as parameters (typed interface)
2. Define inner functions that use those dependencies
3. Return an object literal with the public API

**Summary:** Factory functions encapsulate dependencies and expose clean interfaces.

## When to Use

- Components that perform I/O (files, network, VSCode API)
- Components that need to be mocked in tests
- Components that are composed at startup

## When NOT to Use

- Pure utility functions with no dependencies → Use plain functions
- Simple one-off scripts → Overhead not justified
- Performance-critical tight loops → Factory overhead may matter

## Quick Reference

| Component Type | Dependencies | Factory Pattern? |
|----------------|--------------|------------------|
| Capability | VSCode API, fs | Yes |
| Computer | None (pure) | Yes (for consistency) |
| Script | fs, parsers | Sometimes |
| Utility | None | No |

## Validation Checklist

- [ ] Interface defines all public methods
- [ ] Dependencies typed via interface (e.g., `CodeLensCapabilityDeps`)
- [ ] Factory function named `createXxxCapability()` or `createXxxComputer()`
- [ ] Returns object literal matching interface
- [ ] No side effects in factory (side effects in returned methods)

**Summary:** Check interface, naming, return type, and purity.

## Examples

### Correct Example

```typescript
// apps/vscode/src/capabilities/file-system.capability.ts
export interface CreateFileSystemCapabilityReturn {
  exists(filePath: string): boolean;
  readFile(filePath: string): string;
  readDir(dirPath: string): string[];
  isDirectory(filePath: string): boolean;
  joinPath(...parts: string[]): string;
}

export function createFileSystemCapability(): CreateFileSystemCapabilityReturn {
  function exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  function readFile(filePath: string): string {
    return fs.readFileSync(filePath, 'utf8');
  }

  function readDir(dirPath: string): string[] {
    return fs.readdirSync(dirPath);
  }

  function isDirectory(filePath: string): boolean {
    try {
      return fs.statSync(filePath).isDirectory();
    } catch {
      return false;
    }
  }

  function joinPath(...parts: string[]): string {
    return path.join(...parts);
  }

  return { exists, readFile, readDir, isDirectory, joinPath };
}
```

### Dependency Injection Example

```typescript
// apps/vscode/src/capabilities/codelens.capability.ts
export interface CodeLensCapabilityDeps {
  parseTaskFromUri: (uri: vscode.Uri) => Task | undefined;
  getActions: (task: Task) => readonly TaskAction[];
}

export function createCodeLensCapability(deps: CodeLensCapabilityDeps): CreateCodeLensCapabilityReturn {
  // Uses deps.parseTaskFromUri and deps.getActions
  function provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const task = deps.parseTaskFromUri(document.uri);
    if (!task) return [];
    const actions = deps.getActions(task);
    // ... create CodeLenses from actions
  }

  return { provideCodeLenses, onDidChangeCodeLenses };
}
```

### Incorrect Example

```typescript
// DON'T do this
import * as fs from 'fs';

class FileManager {
  exists(path: string): boolean {
    return fs.existsSync(path);  // Hard-coded dependency
  }
}

export const fileManager = new FileManager();  // Singleton
// Because: Can't mock fs for testing, can't substitute implementations
```

**Summary:** Factory functions return interfaces, inject dependencies via typed params.

## Boundaries

What this pattern does NOT apply to:

- **Does NOT:** Replace simple utility functions → Use plain exports
- **Does NOT:** Require class syntax → Use function + object literal

## Systems Using This Pattern

- [vscode-extension](../systems/vscode-extension/_index.md) - All capabilities and computers
- [cli](../systems/cli/_index.md) - Shared library modules

## Common Violations

1. **Hard-coded imports:** Importing `fs` directly instead of injecting
2. **Missing interface:** Factory without explicit return type
3. **Side effects in factory:** Performing I/O during creation, not invocation
4. **Inconsistent naming:** Not using `createXxx` prefix
