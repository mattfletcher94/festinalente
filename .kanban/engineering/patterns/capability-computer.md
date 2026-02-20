---
id: "patterns/capability-computer"
title: "Capability/Computer Separation"
type: pattern
tldr: "Separate I/O operations (Capabilities) from pure logic (Computers)"
summary: "Capabilities handle side effects and I/O; Computers contain pure functions"
keywords: [capability, computer, pure-functions, side-effects, separation]
aliases: [mechanism-policy, io-separation]
boundary: "Not for simple scripts where separation adds overhead without benefit"
related:
  - patterns/factory-di
paths:
  - apps/vscode/src/capabilities
  - apps/vscode/src/computers
updated: 2026-02-20
verified: 2026-02-20
code_refs:
  - apps/vscode/src/capabilities/tasks-view.capability.ts
  - apps/vscode/src/computers/task-parser.computer.ts
---

# Capability/Computer Separation

> **TL;DR:** Separate I/O operations (Capabilities) from pure logic (Computers)

## Problem

Code that mixes I/O with logic is:
- Hard to test (requires mocking I/O)
- Hard to reason about (side effects hidden in logic)
- Hard to reuse (logic tied to specific I/O)

## Solution

Split code into two categories:

1. **Capabilities** - Handle HOW things happen (mechanism)
   - File system operations
   - VSCode API calls
   - Terminal commands
   - Network requests

2. **Computers** - Handle WHAT happens (policy/logic)
   - Data transformation
   - Business rules
   - Parsing and formatting
   - State calculations

**Summary:** Capabilities do I/O, Computers compute. Keep them separate.

## When to Use

- VSCode extension development
- Any system with significant I/O and logic
- When testability is important

## When NOT to Use

- Simple CLI scripts (one file, straightforward logic)
- Scripts that are mostly I/O with minimal logic
- Performance-critical code where separation adds overhead

## Quick Reference

| Aspect | Capability | Computer |
|--------|------------|----------|
| Suffix | `.capability.ts` | `.computer.ts` |
| Contains | I/O, side effects | Pure functions |
| Dependencies | External APIs, fs | Other computers only |
| Testing | Requires mocking | Direct unit tests |
| Example | `file-system.capability.ts` | `task-parser.computer.ts` |

## Validation Checklist

- [ ] Capability files only in `capabilities/` directory
- [ ] Computer files only in `computers/` directory
- [ ] Computers have no imports of `fs`, `vscode`, or external APIs
- [ ] Capabilities use factory-di pattern
- [ ] Orchestrator (extension.ts) wires capabilities to computers

**Summary:** Check file location, imports, and composition.

## Examples

### Correct Example - Capability

```typescript
// apps/vscode/src/capabilities/tasks-view.capability.ts
// This is a CAPABILITY - it handles VSCode TreeView I/O

export function createTasksViewCapability(
  deps: TasksViewCapabilityDeps
): CreateTasksViewCapabilityReturn {
  const onDidChangeTreeData = new vscode.EventEmitter<TreeItem | undefined>();

  function refresh(): void {
    onDidChangeTreeData.fire(undefined);  // I/O: fires VSCode event
  }

  function createTreeDataProvider(): vscode.TreeDataProvider<TreeItem> {
    return {
      onDidChangeTreeData: onDidChangeTreeData.event,
      getTreeItem(element) { return element; },
      getChildren(element) {
        // Uses injected computer for logic
        return deps.getChildren(element);
      }
    };
  }

  return { refresh, createTreeDataProvider };
}
```

### Correct Example - Computer

```typescript
// apps/vscode/src/computers/task-grouping.computer.ts
// This is a COMPUTER - pure function, no I/O

export function createTaskGroupingComputer(): CreateTaskGroupingComputerReturn {
  const columns: readonly ColumnDefinition[] = [
    { id: 'backlog', name: 'Backlog' },
    { id: 'scoped', name: 'Scoped' },
    // ...
  ];

  function getColumns(): readonly ColumnDefinition[] {
    return columns;  // Pure: returns data
  }

  function groupByStatus(tasks: readonly Task[]): Map<TaskStatus, Task[]> {
    const grouped = new Map<TaskStatus, Task[]>();
    for (const task of tasks) {
      const existing = grouped.get(task.status) ?? [];
      grouped.set(task.status, [...existing, task]);
    }
    return grouped;  // Pure: transforms input to output
  }

  return { getColumns, groupByStatus };
}
```

### Incorrect Example

```typescript
// DON'T do this - mixing I/O and logic
export function createTaskManager() {
  function loadAndGroupTasks(): Map<string, Task[]> {
    // BAD: File I/O mixed with grouping logic
    const files = fs.readdirSync('.kanban/tasks');
    const tasks = files.map(f => {
      const content = fs.readFileSync(f, 'utf8');
      return parseXml(content);
    });

    // Grouping logic here...
    const grouped = new Map();
    // ...
    return grouped;
  }
  // Because: Can't test grouping without mocking fs
}
```

**Summary:** Capabilities wrap I/O APIs; Computers are pure data transformers.

## Boundaries

What this pattern does NOT apply to:

- **Does NOT:** Require separate files for trivial functions
- **Does NOT:** Apply to simple utility modules with no I/O

## Systems Using This Pattern

- [vscode-extension](../systems/vscode-extension/_index.md) - Primary implementation

## Common Violations

1. **I/O in computers:** Importing `fs` or `vscode` in a `.computer.ts` file
2. **Logic in capabilities:** Complex business rules inside capability functions
3. **Missing orchestrator:** Capabilities and computers not composed at startup
4. **Wrong directory:** Capability file in `computers/` or vice versa
