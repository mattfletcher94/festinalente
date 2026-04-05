---
id: "conventions/error-handling"
title: "Error Handling Convention"
type: convention
tldr: "Return CliResult<T> tagged unions from handlers — never throw in the CLI system"
summary: "Consistent error handling with tagged unions enables predictable failure modes across the CLI"
keywords: [errors, result, cli-result, tagged-union, convention, no-throw]
aliases: [error-convention, error-handling]
boundary: "VSCode extension uses try-catch in some orchestrators — this convention is strictly enforced in CLI only"
references: []
uses: [patterns/tagged-union-errors]
paths: [apps/festinalente/src/cli]
intent: reference
prerequisites: []
updated: "2026-04-05"
---

# Error Handling Convention

> **TL;DR:** Return CliResult<T> tagged unions from handlers — never throw in the CLI system

## Rule

All CLI handler functions must return `CliResult<T>`. All capability functions must return `Result<T, E>`. No function in the CLI system may throw an exception. Errors are values, checked via guard functions before accessing data.

| Layer | Return Type | Error Approach |
|-------|------------|----------------|
| Handler | `CliResult<T>` | `error("message")` |
| Capability | `Result<T, E>` | `err(new Error("..."))` |
| Computer | Direct return | Cannot fail (pure) |

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

## Rationale

Thrown exceptions are invisible in TypeScript's type system. A function signature `findTask(id: string): TaskInfo` gives no indication it can fail. By returning `CliResult<TaskInfo>`, callers are forced by the type system to handle both success and error paths.

**Summary:** Type-safe error handling eliminates uncaught exception classes.

## Examples

### Correct

```typescript
// Handler
function findTask(id: string): CliResult<TaskInfo> {
  const readResult = fs.readFile(filePath);
  if (!readResult.ok) {
    return error(`Failed to read task: ${readResult.error.message}`);
  }
  return success(parsed);
}

// Caller
const result = findTask('023');
if (isError(result)) {
  return error(result.message); // propagate
}
const task = result.data; // safe access
```

### Incorrect

```typescript
function findTask(id: string): TaskInfo {
  const content = fs.readFileSync(filePath); // throws
  return parseTask(content); // throws
  // Violates: no-throw rule, no CliResult return type
}
```

**Summary:** Return errors as values. Check before access.

## Boundaries

When this convention does NOT apply:

- VSCode extension orchestrators (may use try-catch for VSCode API calls)
- Build scripts and tooling
- Zod schema validation (throws by design, caught at handler boundary)

## Enforcement

Caught by CI and TypeScript type checking. Handler return types are explicitly typed as `CliResult<T>`, so the compiler catches missing error handling.
