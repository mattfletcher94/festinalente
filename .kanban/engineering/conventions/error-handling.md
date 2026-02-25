---
id: "conventions/error-handling"
title: "Error Handling Convention"
type: convention
tldr: "CLI scripts output JSON with error/success tags; use try-catch internally"
summary: "Consistent error handling enables reliable script composition"
keywords: [errors, json, cli, try-catch, exit-codes]
aliases: [error-convention]
boundary: "Internal module errors can use exceptions"
related:
  - patterns/tagged-union-errors
paths:
  - apps/kanban/src/scripts
updated: 2026-02-25
verified: 2026-02-25
code_refs:
  - apps/kanban/src/scripts/validate-xml.ts:25-35
---

# Error Handling Convention

> **TL;DR:** CLI scripts output JSON with error/success tags; use try-catch internally

## Rule

1. **CLI Output:** All scripts output JSON with `{ error: true, message }` or `{ success: true, ... }`
2. **Exit Codes:** Exit with code `1` on error, `0` on success
3. **Internal Errors:** Use try-catch with type guards for error extraction
4. **Error Messages:** Human-readable, actionable messages

## Rationale

- JSON output enables programmatic consumption by VSCode extension
- Exit codes enable shell script composition
- Type guards ensure safe error message extraction
- Actionable messages help users fix problems

```
┌─────────────────────────────────────────────────────────────┐
│                   ERROR HANDLING FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   CLI Script                    Consumer (VSCode)           │
│   ──────────                    ─────────────────           │
│                                                             │
│   ┌──────────────┐              ┌──────────────┐            │
│   │ try {        │              │ const result │            │
│   │   // work    │  ──JSON──>   │   = JSON     │            │
│   │ }            │              │   .parse()   │            │
│   └──────────────┘              └──────────────┘            │
│         │                              │                    │
│         ▼                              ▼                    │
│   ┌──────────────┐              ┌──────────────┐            │
│   │ catch (err)  │              │ if (result   │            │
│   │   ──────>    │              │   .error)    │            │
│   │ type guard   │              │   ──────>    │            │
│   └──────────────┘              │ show message │            │
│         │                       └──────────────┘            │
│         ▼                                                   │
│   exit(err ? 1 : 0)                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Summary:** Structured errors enable reliable automation and debugging.

## Examples

### Correct - CLI Script

```typescript
// apps/kanban/src/scripts/validate-xml.ts
function validateFile(filePath: string): ValidationError | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    parser.parse(content);
    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      file: filePath.replace(/\\/g, '/'),
      message
    };
  }
}

function main(): void {
  const errors = files.map(validateFile).filter(Boolean);

  if (errors.length > 0) {
    console.log(JSON.stringify({ error: true, errors }));
    process.exit(1);
  }

  console.log(JSON.stringify({ success: true, count: files.length }));
  process.exit(0);
}
```

### Correct - Type Guard

```typescript
// Safely extracting error message
catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  return { error: true, message };
}
```

### Incorrect

```typescript
// DON'T do this
function main(): void {
  try {
    // ... do work ...
    console.log('Done!');  // Violates: not JSON
  } catch (err) {
    console.error(err);    // Violates: not JSON
    // No exit code        // Violates: missing exit(1)
  }
}
```

```typescript
// DON'T do this
catch (err) {
  return { error: true, message: err.message };  // Violates: err might not be Error
}
```

**Summary:** JSON output, exit codes, type-guarded error extraction.

## Boundaries

When this convention does NOT apply:

- Internal library functions (can throw exceptions)
- Build tools and development scripts
- Test files

## Enforcement

- Code review
- VSCode extension fails silently if JSON parsing fails (catches issues)
- No automated linting currently
