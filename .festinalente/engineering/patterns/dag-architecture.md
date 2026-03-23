---
id: "patterns/dag-architecture"
title: "DAG Architecture Pattern"
type: pattern
tldr: "Acyclic dependency graph: orchestrators → capabilities → computers"
summary: "Directed Acyclic Graph ensuring dependencies flow downward with no cycles"
keywords: [dag, architecture, layers, orchestrator, capability, computer, acyclic]
aliases: [layered-architecture, dependency-graph]
boundary: "Does not define specific layer implementations - see individual systems"
references: [patterns/factory-di]
uses: [systems/cli, systems/vscode-extension]
paths: [apps/festinalente/src/cli, apps/vscode/src]
updated: 2026-03-23
---

# DAG Architecture Pattern

> **TL;DR:** Acyclic dependency graph: orchestrators → capabilities → computers

## Overview

Organize code into a Directed Acyclic Graph with strict downward-only dependencies across 5 layers.

## Problem

Complex applications tend to develop circular dependencies over time, making code hard to test, maintain, and reason about. When I/O operations are mixed with business logic, testing requires mocking entire subsystems.

## Solution

Organize code into a **Directed Acyclic Graph (DAG)** with clear layers:

1. **Entry Points** - `extension.ts`, `dispatcher.ts` (top)
2. **Orchestrators** - Coordinate and compose lower layers
3. **Handlers** - Implement specific commands/features
4. **Capabilities** - I/O and side effects (file system, terminal, git)
5. **Computers** - Pure functions, no side effects (bottom)

Dependencies flow **downward only**. No layer imports from a layer above it.

**Summary:** Layered architecture with strict downward dependencies.

## Structure

```mermaid
flowchart TB
    subgraph Layer1["Layer 1: Entry Points"]
        EXT["extension.ts"]
        DISP["dispatcher.ts"]
    end

    subgraph Layer2["Layer 2: Orchestrators"]
        ORCH["*Orchestrator"]
    end

    subgraph Layer3["Layer 3: Handlers"]
        HAND["*Handler"]
    end

    subgraph Layer4["Layer 4: Capabilities (I/O)"]
        FS["FileSystem"]
        TERM["Terminal"]
        GIT["Git"]
    end

    subgraph Layer5["Layer 5: Computers (Pure)"]
        XML["XmlParser"]
        YAML["YamlParser"]
        SEARCH["Search"]
    end

    Layer1 --> Layer2
    Layer2 --> Layer3
    Layer3 --> Layer4
    Layer3 --> Layer5
```

**Key Rule:** Arrows only point down. No cycles allowed.

## Layer Definitions

| Layer | Purpose | Side Effects | Examples |
|-------|---------|--------------|----------|
| Entry | Composition root | Yes (startup) | `extension.ts`, `dispatcher.ts` |
| Orchestrators | Coordinate layers | Minimal | `*Orchestrator.ts` |
| Handlers | Feature implementation | Via capabilities | `*Handler.ts` |
| Capabilities | I/O abstractions | Yes | `file-system.capability.ts` |
| Computers | Pure logic | None | `*-parser.computer.ts` |

## When to Use

- Building CLI tools with multiple commands
- VSCode extensions with multiple views
- Any application needing testable business logic
- Separating I/O from pure computation

## When NOT to Use

- Simple scripts with no complexity
- Single-file utilities → Just write procedural code
- Prototypes → Add structure later

## Quick Reference

### Naming Conventions

| Layer | File Suffix | Factory Name |
|-------|-------------|--------------|
| Orchestrator | `.orchestrator.ts` | `create*Orchestrator()` |
| Handler | `.handler.ts` | `create*Handler()` |
| Capability | `.capability.ts` | `create*Capability()` |
| Computer | `.computer.ts` | `create*Computer()` |

### Dependency Rules

```
✅ Orchestrator → Handler
✅ Orchestrator → Capability
✅ Orchestrator → Computer
✅ Handler → Capability
✅ Handler → Computer
✅ Capability → (nothing or external APIs)
✅ Computer → (nothing)

❌ Handler → Orchestrator
❌ Capability → Handler
❌ Computer → Capability
❌ Any circular import
```

## Validation Checklist

- [ ] Entry point only creates orchestrator(s)
- [ ] Orchestrators compose handlers/capabilities/computers
- [ ] Handlers receive capabilities/computers via constructor (DI)
- [ ] Capabilities handle all I/O (file, network, terminal)
- [ ] Computers are pure functions (no I/O, no side effects)
- [ ] No imports from higher layers

**Summary:** Check each file only imports from same or lower layers.

## Examples

### Correct Example

```typescript
// apps/festinalente/src/cli/orchestrator.ts
export function createCliOrchestrator(): CliOrchestrator {
  // Layer 4: Create capabilities (I/O)
  const fs = createFileSystemCapability();

  // Layer 5: Create computers (pure logic)
  const xmlParser = createXmlParserComputer();
  const yamlParser = createYamlParserComputer();

  // Layer 3: Create handlers with injected deps
  const taskHandler = createTaskHandler({ fs, xmlParser });
  const specHandler = createSpecHandler({ fs, xmlParser });

  // Layer 2: Register and compose
  const registry = createCommandRegistry();
  for (const command of taskHandler.getCommands()) {
    registry.register(command);
  }

  return { registry };
}
```

### Incorrect Example

```typescript
// DON'T do this
// computers/task-parser.computer.ts
import { createFileSystemCapability } from '../capabilities/file-system.capability';

export function createTaskParserComputer() {
  const fs = createFileSystemCapability(); // ❌ Computer importing Capability!

  function parseTask(id: string) {
    const content = fs.readFile(`tasks/${id}/task.xml`); // ❌ I/O in Computer!
    return parse(content);
  }

  return { parseTask };
}
// Because: Computers must be pure. Pass content as argument instead.
```

**Summary:** Orchestrator wires everything; computers stay pure.

## Boundaries

What this pattern does NOT apply to:

- **Does NOT:** Define how to structure capabilities → That's implementation detail
- **Does NOT:** Prescribe testing strategy → Use [factory-di](factory-di.md) for testability
- **Does NOT:** Cover UI architecture → VSCode has its own patterns (TreeDataProvider)

## Systems Using This Pattern

- [cli](../systems/cli/_index.md) - Orchestrator → Registry → Handlers → Capabilities/Computers
- [vscode-extension](../systems/vscode-extension/_index.md) - Extension → Orchestrators → Capabilities/Computers

## How to Add a New Handler

Step-by-step walkthrough for adding a handler to the CLI system.

### Step 1: Create the handler file

```typescript
// BEFORE: No notification handler exists
// AFTER: apps/festinalente/src/cli/handlers/notification.handler.ts

export interface NotificationHandlerDeps {
  readonly fs: FileSystemCapability;
  readonly yamlParser: YamlParserComputer;
}

export interface NotificationHandler {
  readonly listNotifications: (args: string[]) => CliResult<NotificationList>;
  readonly getCommands: () => readonly CliCommand[];
}

export function createNotificationHandler(deps: NotificationHandlerDeps): NotificationHandler {
  const { fs, yamlParser } = deps;

  function listNotifications(args: string[]): CliResult<NotificationList> {
    // Layer 3 (Handler) → Layer 4 (Capability) → Layer 5 (Computer)
    const readResult = fs.readFile('.festinalente/notifications.yaml');
    if (!readResult.ok) return error(readResult.error.message);
    return success(yamlParser.parseYaml(readResult.value));
  }

  function getCommands(): readonly CliCommand[] {
    return [
      defineCommand('list-notifications', 'List notifications', 'list-notifications', listNotifications),
    ];
  }

  return { listNotifications, getCommands };
}
```

### Step 2: Wire into the orchestrator

```typescript
// BEFORE: orchestrator.ts
const taskHandler = createTaskHandler({ fs, xmlParser });

// AFTER: orchestrator.ts — add after existing handler creation
const notificationHandler = createNotificationHandler({ fs, yamlParser });

// Register commands
for (const command of notificationHandler.getCommands()) {
  registry.register(command);
}
```

### Step 3: Verify layer rules

```
✅ notification.handler.ts imports from capabilities/ (Layer 4) — OK
✅ notification.handler.ts imports from computers/ (Layer 5) — OK
✅ orchestrator.ts creates and wires the handler — OK
❌ Would be wrong: notification.handler.ts importing from orchestrator.ts (Layer 2)
```

### Checklist

- [ ] Handler file created at `handlers/{name}.handler.ts`
- [ ] `{Name}HandlerDeps` interface with only lower-layer deps
- [ ] `{Name}Handler` return interface with public methods + `getCommands()`
- [ ] `create{Name}Handler(deps)` factory function
- [ ] Wired in `orchestrator.ts` with `registry.register()`
- [ ] No imports from same or higher layers

## How to Add a New Computer

### Step 1: Create the computer file

```typescript
// apps/festinalente/src/cli/computers/markdown.computer.ts

export interface MarkdownComputer {
  readonly extractHeadings: (content: string) => readonly string[];
}

export function createMarkdownComputer(): MarkdownComputer {
  // Pure function — NO I/O, NO file reads, NO side effects
  function extractHeadings(content: string): readonly string[] {
    return content.split('\n')
      .filter(line => line.startsWith('# '))
      .map(line => line.replace(/^#+\s*/, ''));
  }

  return { extractHeadings };
}
```

### Step 2: Inject where needed

```typescript
// BEFORE: orchestrator.ts
const taskHandler = createTaskHandler({ fs, xmlParser });

// AFTER: orchestrator.ts
const markdownComputer = createMarkdownComputer();
const taskHandler = createTaskHandler({ fs, xmlParser, markdown: markdownComputer });
```

### Key Rule

Computers receive **data as arguments**, never fetch it themselves. If your computer needs file content, the handler reads the file and passes the content string.

## Common Violations

| Violation | Fix |
|-----------|-----|
| Computer reading files | Pass content as argument |
| Handler creating capability | Inject via constructor |
| Circular import | Move shared code to lower layer |
| Orchestrator doing business logic | Move to handler or computer |
| Capability containing logic | Extract to computer |
