---
id: "patterns/tagged-union-errors"
title: "Tagged Union Error Handling"
type: pattern
tldr: "Use discriminated unions with error/success flags for CLI JSON output"
summary: "All CLI scripts return JSON with { error: true, message } or { success: true, data }"
keywords: [error-handling, discriminated-union, json, cli, typescript]
aliases: [discriminated-union, result-pattern]
boundary: "Not for internal function returns - use exceptions or Result types there"
related:
  - patterns/factory-di
paths:
  - apps/kanban/src/scripts
updated: 2026-02-20
verified: 2026-02-20
code_refs:
  - apps/kanban/src/scripts/find-task.ts:8-20
  - apps/kanban/src/scripts/delete-task.ts:5-17
---

# Tagged Union Error Handling

> **TL;DR:** Use discriminated unions with error/success flags for CLI JSON output

## Problem

CLI scripts need to communicate results to callers (VSCode, other tools):
- Must distinguish success from failure
- Must include error details when failing
- Must be parseable as JSON
- Must be type-safe in TypeScript

## Solution

Define discriminated union types with a tag field (`error` or `success`):

```typescript
interface SuccessResult {
  readonly success: true;
  readonly data: T;
}

interface ErrorResult {
  readonly error: true;
  readonly message: string;
}

type Result = SuccessResult | ErrorResult;
```

**Summary:** Tagged unions enable type-safe error handling with clear JSON output.

## When to Use

- CLI script output (always)
- JSON API responses
- Any boundary where errors must be serializable

## When NOT to Use

- Internal function calls (use exceptions or Result<T, E>)
- Synchronous code within a module
- When you need stack traces (exceptions better)

## Quick Reference

| Scenario | Output |
|----------|--------|
| Success | `{ "success": true, "data": {...} }` |
| Error | `{ "error": true, "message": "..." }` |
| Not found | `{ "error": true, "message": "Task not found" }` |
| Validation | `{ "error": true, "message": "Invalid ID" }` |

## Validation Checklist

- [ ] Type uses `readonly` modifier on tag field
- [ ] Success type has `success: true` (not `error: false`)
- [ ] Error type has `error: true` (not `success: false`)
- [ ] Error includes human-readable `message`
- [ ] JSON output uses `JSON.stringify(result)`
- [ ] Process exits with code 1 on error

**Summary:** Check tag fields, readonly, message presence, exit codes.

## Examples

### Correct Example

```typescript
// apps/kanban/src/scripts/delete-task.ts
interface DeleteSuccessResult {
  readonly success: true;
  readonly id: string;
  readonly title: string;
  readonly path: string;
}

interface DeleteErrorResult {
  readonly error: true;
  readonly message: string;
}

type DeleteResult = DeleteSuccessResult | DeleteErrorResult;

function deleteTask(id: string): DeleteResult {
  const taskPath = path.join('.kanban/tasks', id);

  if (!fs.existsSync(taskPath)) {
    return { error: true, message: `Task ${id} not found` };
  }

  // ... delete logic ...

  return {
    success: true,
    id,
    title: task.title,
    path: taskPath
  };
}

function main(): void {
  const result = deleteTask(process.argv[2]);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.error ? 1 : 0);
}
```

### Type Guard Example

```typescript
// Using the result with type narrowing
const result = deleteTask(id);

if (result.error) {
  // TypeScript knows: result is DeleteErrorResult
  console.error(result.message);
} else {
  // TypeScript knows: result is DeleteSuccessResult
  console.log(`Deleted ${result.title}`);
}
```

### Incorrect Example

```typescript
// DON'T do this
function deleteTask(id: string): { success: boolean; message?: string; data?: any } {
  if (!exists) {
    return { success: false, message: 'Not found' };  // Ambiguous tag
  }
  return { success: true, data: task };
}
// Because: success: false is not as clear as error: true
// Because: Using `any` loses type safety
// Because: Optional fields make type narrowing harder
```

**Summary:** Use distinct tag values (error/success), not boolean fields.

## Boundaries

What this pattern does NOT apply to:

- **Does NOT:** Replace exceptions for internal errors (use try/catch)
- **Does NOT:** Work for streaming output (JSON per line instead)

## Systems Using This Pattern

- [cli](../systems/cli/_index.md) - All scripts follow this pattern

## Common Violations

1. **Boolean flag:** Using `success: false` instead of `error: true`
2. **Missing message:** Error result without explanation
3. **No exit code:** Not setting `process.exit(1)` on error
4. **Mixed patterns:** Some scripts use different formats
5. **Optional fields:** Using `data?: T` instead of discriminated union
