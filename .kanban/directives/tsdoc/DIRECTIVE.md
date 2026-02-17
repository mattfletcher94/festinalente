---
name: "TSDoc Standards"
description: "Validate that all public APIs have proper TSDoc documentation"
---

# TSDoc Standards

Validate that all public APIs have proper TSDoc documentation following codebase standards.

**This directive is normative: all public APIs MUST comply.**

---

## Quick Reference

### Forbidden Patterns (Check First - BLOCKING)

**Scan for these violations BEFORE checking what documentation exists. If found, reject immediately.**

| Pattern | Example | Why Forbidden |
|---------|---------|---------------|
| Banner/divider comments | `// --------` | Not documentation, just noise |
| File-level comments | TSDoc at line 1 | Document exports, not files |
| Shouty section headers | `// CONSTANTS` | Use code structure, not comments |
| Single-line TSDoc on exports | `/** Foo. */` | Not proper format |
| `@param` without hyphen | `@param x desc` | Format violation |
| Docs on re-exports | TSDoc on `export { }` | Document at definition site |

### What Requires TSDoc

| Element | Required |
|---------|----------|
| All exported symbols | Yes |
| Public/protected class members | Yes |
| Configuration interfaces | Yes |
| Generic type parameters | Yes |
| Function overload signatures | Yes |
| Private functions | No |
| Implementation signatures | No |

### Required Format

```ts
/**
 * Summary line in imperative tense.
 *
 * @remarks
 * Detailed explanation, tradeoffs, notes.
 *
 * @param name - Description of parameter.
 * @returns Description of return value.
 */
```

### Essential Tags

| Tag | When Required |
|-----|---------------|
| `@param` | Every parameter (with hyphen separator) |
| `@returns` | Non-obvious return values |
| `@throws` | All error conditions |
| `@typeParam` | Generic type parameters |
| `@defaultValue` | Optional config properties |
| `@remarks` | Complex APIs or performance notes |

---

## Validation Checklist

**Execute in this order. Stop at step 1 if violations found.**

1. **Check forbidden patterns FIRST** (blocking):
   - No divider comments (`// ----`, `// ====`)
   - No file-level TSDoc at line 1
   - No shouty headers (`// SECTION NAME`)
   - **If any found: STOP and reject. Do not proceed.**

2. **Check exports have TSDoc**:
   - Every `export function`, `export class`, `export interface`, `export type`
   - Multi-line format (not `/** single line */`)

3. **Check tag usage**:
   - `@param name - description` (hyphen required)
   - `@typeParam` for all generics
   - `@throws` for error conditions
   - `@defaultValue` for optional config

---

## Common Violations

### Missing Multi-line Format (REJECT)

```ts
// WRONG: Single-line TSDoc on export
/** Creates a task computer. */
export function createTaskComputer() { ... }

// CORRECT: Multi-line format
/**
 * Create a task computer for task operations.
 */
export function createTaskComputer() { ... }
```

### Missing Hyphen Separator (REJECT)

```ts
// WRONG: No hyphen
* @param timeout The timeout value

// CORRECT: With hyphen
* @param timeout - The timeout value in milliseconds.
```

### Missing Parameter Documentation (REJECT)

```ts
// WRONG: Missing @param
/**
 * Create a task with the given options.
 */
export function createTask(options: CreateTaskOptions): Task { ... }

// CORRECT: All params documented
/**
 * Create a task with the given options.
 *
 * @param options - Configuration for the new task.
 * @returns The created task instance.
 */
export function createTask(options: CreateTaskOptions): Task { ... }
```

### Documenting Re-exports (REJECT)

```ts
// WRONG: TSDoc on re-export
/**
 * Task computer for operations.
 */
export { createTaskComputer } from './task.computer';

// CORRECT: Document at definition site only
export { createTaskComputer } from './task.computer';
```

---

## Interface Documentation

### Configuration Interfaces

```ts
/**
 * Options for creating an app orchestrator.
 */
export interface CreateAppOrchestratorOptions {
  /**
   * The tasks capability for task operations.
   */
  readonly tasksCapability: TasksCapability;

  /**
   * The task computer for pure computations.
   */
  readonly taskComputer: TaskComputer;

  /**
   * Initial project path.
   *
   * @defaultValue undefined
   */
  readonly initialProjectPath?: string;
}
```

### Return Type Interfaces

```ts
/**
 * Return type for the task computer.
 */
export interface CreateTaskComputerReturn {
  /**
   * Parse a raw task ID string.
   *
   * @param raw - The raw ID string to parse.
   * @returns The parsed TaskId.
   * @throws Error if the ID format is invalid.
   */
  parseId(raw: string): TaskId;

  /**
   * Sort tasks by their status.
   *
   * @param tasks - The tasks to sort.
   * @returns A new array with tasks sorted by status.
   */
  sortByStatus(tasks: readonly Task[]): Task[];
}
```

---

## Factory Function Documentation

```ts
/**
 * Options for creating a task computer.
 */
export interface CreateTaskComputerOptions {
  // Empty interfaces are fine - document them anyway
}

/**
 * Return type for the task computer.
 */
export interface CreateTaskComputerReturn {
  /**
   * Parse a raw task ID string.
   *
   * @param raw - The raw ID string to parse.
   * @returns The parsed TaskId.
   */
  parseId(raw: string): TaskId;
}

/**
 * Create a task computer for pure task operations.
 *
 * @param options - Configuration options.
 * @returns The task computer instance.
 */
export function createTaskComputer(
  options?: CreateTaskComputerOptions
): CreateTaskComputerReturn {
  // Implementation
}
```

---

## Error Documentation

```ts
/**
 * Load a task by ID.
 *
 * @param id - The task ID to load.
 * @returns The loaded task.
 * @throws TaskNotFoundError if the task does not exist.
 * @throws NetworkError if the API request fails.
 */
export async function loadTask(id: TaskId): Promise<Task> {
  // Implementation
}
```

---

**This directive is the single source of truth for TSDoc usage.**
