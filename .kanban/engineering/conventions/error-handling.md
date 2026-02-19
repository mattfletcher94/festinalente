---
id: "conventions/error-handling"
title: "Error Handling Convention"
type: convention
tldr: "Try-catch with console.error and graceful defaults"
summary: "Errors are caught, logged, and handled with fallback values to maintain UI stability"
keywords: [error, exception, try-catch, logging, graceful]
aliases: [exception-handling]
boundary: "Does not apply to validation scripts which use process.exit"
related:
  - patterns/orchestrator
  - patterns/capability
  - systems/gui
  - systems/cli
paths:
  - apps/gui/src/
  - apps/kanban/src/scripts/
updated: 2026-02-19
verified: 2026-02-19
code_refs:
  - apps/gui/src/tasks/tasks.orchestrator.ts:105-120
---

# Error Handling Convention

> **TL;DR:** Try-catch with console.error and graceful defaults

## Rule

**GUI (Electron/Vue):**
1. Wrap async operations in try-catch
2. Log errors with `console.error()`
3. Return graceful defaults (empty arrays, null, false)
4. Never let errors crash the UI

**CLI Scripts:**
1. Return JSON with `error: true` flag
2. Use `process.exit(1)` for fatal errors
3. Include descriptive error messages

## Rationale

- **Graceful defaults** keep the UI functional even when operations fail
- **Console logging** enables debugging without disrupting user experience
- **JSON errors** allow Claude to parse and handle CLI failures programmatically

**Summary:** UI stays stable; errors are logged and recoverable.

## Examples

### Correct

```typescript
// GUI - Orchestrator pattern
async function loadTasks(projectPath: string): Promise<void> {
  loading.value = true;
  try {
    const result = await tasksApi.listTasks(projectPath);
    tasks.value = result;
  } catch (err) {
    console.error('Failed to load tasks:', err);
    tasks.value = []; // Graceful default
  }
  loading.value = false;
}

// GUI - Content loading with default message
async function loadTaskContent(projectPath: string): Promise<void> {
  try {
    const content = await tasksApi.readTaskFile(projectPath, task.id);
    taskContent.value = content;
  } catch (err) {
    console.error('Failed to load task content:', err);
    taskContent.value = 'Failed to load task content.'; // User-friendly default
  }
}

// CLI - JSON error response
function main(): void {
  const [id] = process.argv.slice(2);
  if (!id) {
    console.log(JSON.stringify({ error: true, message: 'Usage: find-task.cjs <id>' }));
    process.exit(1);
  }
  // ... proceed with valid input
}
```

### Incorrect

```typescript
// DON'T do this
async function loadTasks(projectPath: string): Promise<void> {
  // No try-catch - errors crash the UI
  const result = await tasksApi.listTasks(projectPath);
  tasks.value = result;
}

// DON'T do this
async function loadTaskContent(): Promise<void> {
  try {
    const content = await tasksApi.readTaskFile(projectPath, task.id);
    taskContent.value = content;
  } catch (err) {
    // Throwing propagates error - can crash UI
    throw new Error('Failed to load content');
  }
}

// DON'T do this in CLI
function main(): void {
  if (!id) {
    // Plain text error - Claude can't parse reliably
    console.log('Error: missing ID');
    process.exit(1);
  }
}
// Violates: Graceful defaults, JSON error format
```

**Summary:** Catch errors, log them, return safe defaults.

## Boundaries

When this convention does NOT apply:

- **Validation scripts** that should fail loudly (validate-xml, check-product)
- **Build scripts** where failure should halt the process
- **Type errors** which TypeScript handles at compile time

## Enforcement

- Code review
- Pattern established in existing orchestrators
- No automated linting currently
