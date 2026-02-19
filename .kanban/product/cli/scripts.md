---
id: "cli/scripts"
title: "Helper Scripts"
type: feature
tldr: "CLI utilities for task operations, documentation search, and validation"
summary: "Node.js scripts that provide programmatic access to tasks, documentation, and validation functions used by skills and external tools"
keywords: [scripts, utilities, cli, search, validation, list, find]
aliases: [helper-scripts, utilities, cli-tools]
boundary: "Does not provide interactive workflows - scripts return JSON for programmatic use"
related: [cli/lifecycle, cli/discovery, cli/quality]
updated: 2026-02-19
---

# Helper Scripts

> **TL;DR:** CLI utilities for task operations, documentation search, and validation

## Overview

Helper Scripts allow programmatic access to Claudeban data and operations. This is important because skills, the GUI, and external tools need reliable ways to query and manipulate tasks and documentation.

**Summary:** JSON-returning scripts for task and documentation operations.

## How It Works

1. Script is invoked via Node.js
2. Script reads from `.kanban/` directory
3. Result: JSON output to stdout

### Usage Pattern

```bash
node .kanban/scripts/{script}.cjs [args] [--options]
```

**Summary:** All scripts return JSON and read from .kanban directory.

## Task Scripts

### find-task.cjs

Locates a task by ID and returns metadata.

```bash
node .kanban/scripts/find-task.cjs TASK-003
```

**Output:**
```json
{
  "found": true,
  "path": ".kanban/tasks/TASK-003/task.xml",
  "id": "TASK-003",
  "title": "Add notifications",
  "status": "scoped",
  "priority": "medium",
  "labels": ["feature"]
}
```

### list-tasks.cjs

Lists all tasks with optional filtering.

```bash
node .kanban/scripts/list-tasks.cjs [--status=X] [--label=X] [--priority=X]
```

**Output:**
```json
{
  "count": 5,
  "tasks": [
    {"id": "TASK-001", "title": "...", "status": "done", ...},
    ...
  ]
}
```

### next-id.cjs

Generates the next available task ID.

```bash
node .kanban/scripts/next-id.cjs
```

**Output:**
```json
{"nextId": "TASK-006"}
```

### delete-task.cjs

Removes a task directory.

```bash
node .kanban/scripts/delete-task.cjs TASK-003
```

### find-spec.cjs / find-plan.cjs

Locates task spec.xml or plan.xml files.

```bash
node .kanban/scripts/find-spec.cjs TASK-003
node .kanban/scripts/find-plan.cjs TASK-003
```

## Documentation Scripts

### list-product.cjs / list-engineering.cjs

Lists documentation with optional filtering.

```bash
node .kanban/scripts/list-product.cjs [--type=feature] [--domain=auth]
node .kanban/scripts/list-engineering.cjs [--type=pattern] [--system=auth]
```

**Output:**
```json
{
  "count": 8,
  "docs": [
    {"id": "auth/login", "title": "Login", "type": "feature", ...},
    ...
  ]
}
```

### search-product.cjs / search-engineering.cjs

Fuzzy search documentation by keywords.

```bash
node .kanban/scripts/search-product.cjs auth login [--min-score=0.3]
node .kanban/scripts/search-engineering.cjs error handling
```

**Output:**
```json
{
  "query": ["auth", "login"],
  "results": [
    {"id": "auth/login", "score": 0.95, "matchSource": "exactKeyword", ...},
    ...
  ]
}
```

### search-hybrid.cjs

Combined search across product and engineering docs.

```bash
node .kanban/scripts/search-hybrid.cjs auth error [--type=product]
```

### expand-query.cjs

Expands search terms using project glossary.

```bash
node .kanban/scripts/expand-query.cjs auth
```

**Output:**
```json
{
  "original": ["auth"],
  "expanded": ["auth", "authentication", "login", "session"]
}
```

### check-product.cjs / check-engineering.cjs

Checks if specific docs exist.

```bash
node .kanban/scripts/check-product.cjs auth/login auth/session
node .kanban/scripts/check-engineering.cjs patterns/error-handling
```

## Context Scripts

### select-context.cjs

Selects relevant documentation for a task.

```bash
node .kanban/scripts/select-context.cjs TASK-003 [--tier=standard] [--max=5]
```

**Tiers:**
- `minimal`: ~50 tokens per doc (tldr only)
- `standard`: ~200 tokens per doc (overview + summary)
- `full`: ~500-1000 tokens per doc (complete content)

### check-freshness.cjs

Identifies stale documentation.

```bash
node .kanban/scripts/check-freshness.cjs [--stale-days=30] [--type=product]
```

**Output:**
```json
{
  "stale": [
    {"id": "auth/login", "verified": "2026-01-01", "reason": "code_changed", ...}
  ],
  "fresh": [...]
}
```

### get-hook-config.cjs

Retrieves hook configuration for a command.

```bash
node .kanban/scripts/get-hook-config.cjs kanban-codecheck
```

**Output:**
```json
{
  "hook": "kanban-codecheck",
  "directives": ["npm test", "npm run lint"],
  "tier": "standard"
}
```

## Validation Scripts

### validate-docs.cjs

Validates documentation structure and completeness.

```bash
node .kanban/scripts/validate-docs.cjs [--type=product]
```

### validate-yaml.cjs

Validates YAML configuration files.

```bash
node .kanban/scripts/validate-yaml.cjs
```

### validate-xml.cjs

Validates XML in task files.

```bash
node .kanban/scripts/validate-xml.cjs
```

## Utility Scripts

### get-date-time.cjs

Returns current date/time for timestamps.

```bash
node .kanban/scripts/get-date-time.cjs
```

**Output:**
```json
{"iso": "2026-02-19T15:30:00.000Z", "date": "2026-02-19"}
```

## Boundaries

What this feature does NOT do:

- **Does NOT:** Provide interactive workflows (JSON output only)
- **Does NOT:** Modify files without explicit parameters
- **Does NOT:** Handle authentication or permissions

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| None | Scripts read from .kanban directory | N/A |

## Limitations

- Scripts must be run from project root
- All output is JSON (not human-readable by default)
- No interactive mode (pipe output to other tools)
