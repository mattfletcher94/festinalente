# TypeScript Standards

Type safety, domain modeling, and API design requirements.

**This codebase assumes `strict: true`. All code must meet strict TypeScript standards.**

---

## Quick Reference

### Type Safety (BLOCKING)

| Pattern | Problem | Fix |
|---------|---------|-----|
| `any` | Disables type checking | Use `unknown` and narrow |
| `as any` | Escape hatch abuse | Fix the underlying type issue |
| `object` | Too broad | Use specific interface |
| `Function` | Untyped callable | Use explicit signature |
| `{}` | Allows anything except null/undefined | Use `Record<string, unknown>` or specific type |
| `String`, `Number`, `Boolean` | Boxed primitives | Use `string`, `number`, `boolean` |
| `// @ts-ignore` | Suppresses errors | Fix the type issue or link to issue |
| Non-null assertion (`!`) | Unsafe assumption | Use proper narrowing |

### Required Patterns

| Pattern | Purpose |
|---------|---------|
| Explicit return types on exports | API clarity |
| Domain types for IDs | Type safety for identifiers |
| Discriminated unions for states | Exhaustive handling |
| `readonly` on value objects | Immutability |
| `unknown` at boundaries | Safe external data handling |

---

## Type Safety Rules

### No `any` Type (BLOCKING)

```ts
// WRONG
function handleEvent(data: any) {
  return data.value;  // Unsafe access
}

// CORRECT
function handleEvent(data: unknown): number {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    const value = (data as { value: unknown }).value;
    if (typeof value === 'number') return value;
  }
  throw new Error('Invalid event data');
}
```

### Explicit Return Types on Exports (BLOCKING)

```ts
// WRONG: Missing return type
export function createTask(id: string) {
  return { id, status: 'pending' };
}

// CORRECT: Explicit return type
export function createTask(id: TaskId): Task {
  return { id, status: 'pending' };
}
```

---

## Domain Modeling

### Domain Types for Identifiers

```ts
// WRONG: Raw primitives
interface Task {
  id: string;
  projectId: string;
  userId: string;
}

// CORRECT: Domain types
type TaskId = string & { readonly __brand: 'TaskId' };
type ProjectId = string & { readonly __brand: 'ProjectId' };
type UserId = string & { readonly __brand: 'UserId' };

interface Task {
  readonly id: TaskId;
  readonly projectId: ProjectId;
  readonly assignee: UserId | null;
}
```

### Discriminated Unions for States

```ts
// WRONG: Boolean flags for state
interface Task {
  isLoading: boolean;
  hasError: boolean;
  isComplete: boolean;
  data?: TaskData;
  error?: Error;
}

// CORRECT: Discriminated union
type TaskState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'complete'; data: TaskData };
```

---

## Immutability

### Readonly for Value Objects

```ts
// WRONG: Mutable interface
interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// CORRECT: Immutable interface
interface Bounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
```

### Readonly Arrays

```ts
// WRONG: Mutable array
interface TaskCollection {
  tasks: Task[];
}

// CORRECT: Readonly array
interface TaskCollection {
  readonly tasks: readonly Task[];
}
```

---

## API Design

### Options Objects for Multiple Parameters

```ts
// WRONG: Too many parameters
export function createTask(
  id: string,
  title: string,
  description: string,
  status: string,
  priority: number,
  assignee: string | null
): Task { ... }

// CORRECT: Options object
export interface CreateTaskOptions {
  readonly id: TaskId;
  readonly title: string;
  readonly description?: string;
  readonly status?: TaskStatus;
  readonly priority?: number;
  readonly assignee?: UserId;
}

export function createTask(options: CreateTaskOptions): Task { ... }
```

### Factory Return Types

```ts
// All factories must define explicit return interfaces
export interface CreateTaskComputerOptions {
  // Empty is fine if no dependencies needed
}

export interface CreateTaskComputerReturn {
  parseId(raw: string): TaskId;
  sortByStatus(tasks: readonly Task[]): Task[];
  filterByLabel(tasks: readonly Task[], label: string): Task[];
}

export function createTaskComputer(
  options?: CreateTaskComputerOptions
): CreateTaskComputerReturn {
  // Implementation
}
```

---

## Forbidden Patterns

### Missing Types on Exports

```ts
// WRONG: Inferred types on export
export const handler = (e) => { ... };  // Implicit any

// CORRECT: Explicit types
export const handler = (e: MouseEvent): void => { ... };
```

### Boolean Flags for Exclusive States

```ts
// WRONG: Impossible to ensure consistency
const task = {
  isLoading: true,
  isComplete: true,  // Can both be true!
};

// CORRECT: Only one state possible
const task: TaskState = { status: 'loading' };
```

---

## Validation Checklist

When checking TypeScript quality:

1. **No `any` type** - Search for `any` in new/modified code
2. **Explicit return types** - All exported functions have return types
3. **Domain types** - IDs use branded types, not raw strings
4. **Discriminated unions** - States use unions, not boolean flags
5. **Immutability** - Value objects use `readonly`
6. **Options objects** - Functions with 3+ params use options objects

---

**This directive is the single source of truth for TypeScript standards.**
