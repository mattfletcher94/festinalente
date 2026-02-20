---
id: "utilities/id-generation"
title: "ID Generation"
type: feature
tldr: "Generate sequential padded task IDs"
summary: "Scans existing tasks to find highest ID and returns next available ID with configurable zero-padding (e.g., 001, 002, 003)."
keywords: [id, generation, sequential, padding, next-id]
aliases: [next-id, task-id, id-generator]
boundary: "Does NOT create task files; only returns next available ID"
related: [tasks/create]
updated: 2026-02-20
---

# ID Generation

> **TL;DR:** Generate sequential padded task IDs

## Overview

ID Generation provides the next available task ID. It scans `.kanban/tasks/` to find the highest existing ID, increments it, and returns a padded string (e.g., "001", "002"). Used by task creation to ensure unique IDs.

**Summary:** Sequential ID generation for task creation.

## How It Works

1. Scan `.kanban/tasks/` folder names
2. Parse numeric IDs from folder names
3. Find maximum ID
4. Increment by 1
5. Pad to configured width
6. Return as JSON

### Key Workflows

**Usage:**
```bash
node .kanban/scripts/next-id.cjs
```

**Output:**
```json
{
  "nextId": "004",
  "currentHighest": 3,
  "padding": 3
}
```

**Summary:** Returns next ID with metadata.

## Examples

### Typical Usage

```bash
# With tasks 001, 002, 003 existing:
node .kanban/scripts/next-id.cjs

# Output:
# { "nextId": "004", "currentHighest": 3, "padding": 3 }
```

### Empty Tasks Folder

```bash
# With no existing tasks:
node .kanban/scripts/next-id.cjs

# Output:
# { "nextId": "001", "currentHighest": 0, "padding": 3 }
```

**Summary:** Handles empty state and existing tasks.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Create task folders
- **Does NOT:** Reserve IDs (concurrent creates could conflict)
- **Does NOT:** Support custom ID formats

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| idPadding | Number of digits | 3 |
| idPrefix | Optional prefix | "" |

## Interactions

- **Task creation**: Uses next-id before creating folder

## Limitations

- No reservation (race condition possible)
- Numeric IDs only (no custom formats)
- Scans all folders each time
