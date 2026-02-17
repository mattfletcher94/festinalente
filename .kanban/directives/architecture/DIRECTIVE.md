---
name: "Acyclic Architecture"
description: "Validate that the codebase's dependency graph is a DAG with clear layering"
---

# Acyclic Architecture

Validate that the codebase's dependency graph is a **Directed Acyclic Graph (DAG)** with clear layering, predictable data flow, and no hidden coupling.

**This directive is normative: all violations must be refactored.**

---

## Quick Reference

### Module Categories

| Category | Suffix | Can Import | Cannot Import |
|----------|--------|------------|---------------|
| **Computer** | `.computer.ts` | Other computers | Capabilities, Orchestrators |
| **Capability** | `.capability.ts` | Computers (direct) | Other capabilities, Orchestrators |
| **Orchestrator** | `.orchestrator.ts` | Computers, Capabilities (via DI) | - |

### Dependency Direction (Only These Allowed)

```
Computer     <- Capability
Computer     <- Orchestrator
Capability   <- Orchestrator
```

### Forbidden Patterns

| Pattern | Problem |
|---------|---------|
| `ensureXExists()` | Policy in capability |
| `getOrCreateX()` | Policy in capability |
| `maybeDoX()` | Policy in capability |
| `*Manager`, `*Service`, `*Helper` | Ambiguous naming |
| Capability importing capability | Lateral dependency |
| Circular imports | Violates DAG |
| Pure functions as module-level helpers | Uncategorized computation |
| Module-level computer instances | Hidden dependency, bypasses DI |

### Required Patterns

| Pattern | Purpose |
|---------|---------|
| Explicit DI via function params | Visible dependencies |
| `shouldX()` policy in orchestration | Policy separation |
| `createX()` mechanism in capabilities | Mechanism separation |
| Composition root for wiring | Single construction point |

---

## Validation Checklist

When checking architecture:

1. **Run automated circular dependency check**: `pnpm check:dpdm` (must report zero circular dependencies)

2. **Verify module classification**:
   - Every module has correct suffix (`.computer.ts`, `.capability.ts`, `.orchestrator.ts`)
   - Factory functions follow `create{Name}{Category}` pattern

3. **Check dependency direction**:
   - Computers only import other computers
   - Capabilities only import computers (direct, no DI needed)
   - Orchestrators inject capabilities via explicit DI

4. **Verify policy/mechanism separation**:
   - No `ensureX`, `getOrCreateX`, `maybeDoX` in capabilities
   - Cache/pool policy in orchestrators only
   - Lazy initialization in orchestrators only

5. **Check naming conventions**:
   - No `*Manager`, `*Service`, `*Helper`, `*Utils` names
   - Return types follow `Create{Name}{Category}Return` pattern

---

## Common Violations

### Policy in Capability (REJECT)

```ts
// WRONG: Capability decides WHEN to create
function ensureSession(): Session {
  if (session && session.isValid) return session;  // Policy!
  return createSession();
}

// CORRECT: Policy in orchestrator
// Capability:
function createSession(): Session {
  return api.createSession();
}
// Orchestrator:
function getSession(): Session {
  if (session && session.isValid) return session;  // Policy here
  return createSession();
}
```

### Capability Importing Capability (REJECT)

```ts
// WRONG: Lateral dependency
import { createSettingsCapability } from './settings.capability';

export function createTasksCapability() {
  const settings = createSettingsCapability();  // Forbidden!
}

// CORRECT: Both injected into orchestrator
export function createAppOrchestrator(options: {
  settingsCapability: SettingsCapability;
  tasksCapability: TasksCapability;
}) { ... }
```

### Pure Functions as Module-Level Helpers (REJECT)

```ts
// WRONG: Pure functions floating in capability file
// task-api.capability.ts
function parseTaskId(raw: string): TaskId { ... }  // Uncategorized!
function sortTasks(tasks: Task[]): Task[] { ... }  // Uncategorized!

export function createTaskApiCapability() {
  // uses the helpers above
}

// CORRECT: Pure functions belong in a computer factory
// task.computer.ts
export interface CreateTaskComputerReturn {
  parseId(raw: string): TaskId;
  sort(tasks: Task[]): Task[];
}

export function createTaskComputer(): CreateTaskComputerReturn {
  function parseId(raw: string): TaskId { ... }
  function sort(tasks: Task[]): Task[] { ... }
  return { parseId, sort };
}

// task-api.capability.ts
import { createTaskComputer } from './task.computer';

export function createTaskApiCapability() {
  const taskComputer = createTaskComputer();
  // uses taskComputer.parseId(), taskComputer.sort()
}
```

**Note:** Creating a computer for even 1-2 pure functions is proper categorization, not over-engineering.

### Module-Level Computer Instances (REJECT)

```ts
// WRONG: Computer instantiated at module level
import { createTaskComputer } from './task.computer';

const taskComputer = createTaskComputer();  // Hidden global state!

export function createSomeCapability() {
  // uses taskComputer - global instance
}

// CORRECT: Computer instantiated inside factory
import { createTaskComputer } from './task.computer';

export function createSomeCapability() {
  const taskComputer = createTaskComputer();  // Scoped to this instance
  // uses taskComputer
}
```

**Note:** Capabilities CAN instantiate computers internally (computers are pure, don't need mocking). Capabilities CANNOT instantiate other capabilities (must be injected via orchestrator).

---

**This directive is the single source of truth for architectural dependency management.**
