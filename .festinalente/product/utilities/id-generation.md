---
id: "utilities/id-generation"
title: "ID Generation"
type: feature
tldr: "Generate sequential slug-based task IDs"
summary: "Scans existing tasks to find highest ID and returns next available ID with slug (e.g., 022-add-dark-mode-toggle). Uses slugify library for URL-safe slugs with 50-character max length."
keywords: [id, generation, sequential, padding, next-id, slug, slugify]
aliases: [next-id, task-id, id-generator]
boundary: "Does NOT create task files; only returns next available ID with slug"
related: [tasks/create]
updated: 2026-02-27
---

# ID Generation

> **TL;DR:** Generate sequential slug-based task IDs

## Overview

ID Generation provides the next available task ID with a human-readable slug. It scans `.festinalente/tasks/` to find the highest existing numeric prefix, increments it, generates a URL-safe slug from the task title, and returns a combined ID (e.g., "022-add-dark-mode-toggle"). Used by task creation to ensure unique, memorable IDs.

**Summary:** Sequential slug-based ID generation for task creation.

## How It Works

1. Parse `--title` argument (required)
2. Scan `.festinalente/tasks/` folder names
3. Extract numeric prefix from folder names using `/^(\d+)/` regex
4. Find maximum numeric ID
5. Increment by 1
6. Pad number to configured width (default: 3)
7. Generate slug from title using `slugify(title, { lower: true, strict: true })`
8. Truncate slug to 50 characters maximum
9. Combine: `{paddedNumber}-{slug}`
10. Return as JSON

### Key Workflows

**Usage:**
```bash
node .festinalente/scripts/next-id.cjs --title="Add dark mode toggle"
```

**Output:**
```json
{
  "nextId": "022-add-dark-mode-toggle",
  "currentHighest": "021",
  "padding": 3,
  "slug": "add-dark-mode-toggle"
}
```

**Summary:** Returns next ID with slug and metadata.

## Examples

### Typical Usage

```bash
# With tasks 001, 002, ..., 021 existing:
node .festinalente/scripts/next-id.cjs --title="Add user authentication"

# Output:
# {
#   "nextId": "022-add-user-authentication",
#   "currentHighest": "021",
#   "padding": 3,
#   "slug": "add-user-authentication"
# }
```

### Long Title (Truncated)

```bash
# Title longer than 50 characters when slugified:
node .festinalente/scripts/next-id.cjs --title="Implement comprehensive user authentication system with OAuth2 and JWT tokens"

# Output:
# {
#   "nextId": "022-implement-comprehensive-user-authentication-sys",
#   "currentHighest": "021",
#   "padding": 3,
#   "slug": "implement-comprehensive-user-authentication-sys"
# }
```

### Empty Tasks Folder

```bash
# With no existing tasks:
node .festinalente/scripts/next-id.cjs --title="First task"

# Output:
# {
#   "nextId": "001-first-task",
#   "currentHighest": null,
#   "padding": 3,
#   "slug": "first-task"
# }
```

### Missing Title Argument

```bash
# Without --title argument:
node .festinalente/scripts/next-id.cjs

# Output:
# { "error": true, "message": "Usage: next-id.cjs --title=\"Task title\"" }
# Exit code: 1
```

**Summary:** Handles empty state, long titles, and missing arguments.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Create task folders
- **Does NOT:** Reserve IDs (concurrent creates could conflict)
- **Does NOT:** Migrate existing numeric IDs to slug format

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| idPadding | Number of digits for numeric prefix | 3 |
| MAX_SLUG_LENGTH | Maximum slug characters | 50 (hardcoded) |

## Interactions

- **Task creation**: Uses next-id before creating folder
- **Slugify library**: Used with `{ lower: true, strict: true }` for URL-safe slugs

## Limitations

- No reservation (race condition possible)
- Slug truncated at 50 characters
- Special characters removed by slugify strict mode
- Scans all folders each time
