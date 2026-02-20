---
id: "utilities/datetime"
title: "Date/Time"
type: feature
tldr: "Get current date/time in ISO and date formats"
summary: "Returns current timestamp in multiple formats: full ISO for precision logging and YYYY-MM-DD date for frontmatter fields."
keywords: [date, time, iso, timestamp, datetime]
aliases: [get-date-time, timestamp, current-date]
boundary: "Does NOT format historical dates; only returns current time"
related: [tasks/create, docs/product]
updated: 2026-02-20
---

# Date/Time

> **TL;DR:** Get current date/time in ISO and date formats

## Overview

Date/Time provides the current timestamp in standard formats. Used throughout kanban for `created`, `updated`, and `verified` fields in task and doc files.

**Summary:** Consistent timestamp generation for metadata.

## How It Works

1. Get current system time
2. Format as ISO string and YYYY-MM-DD date
3. Return as JSON

### Key Workflows

**Usage:**
```bash
node .kanban/scripts/get-date-time.cjs
```

**Output:**
```json
{
  "iso": "2026-02-20T15:33:40.936Z",
  "date": "2026-02-20"
}
```

**Summary:** Two formats for different uses.

## Examples

### Typical Usage

```bash
node .kanban/scripts/get-date-time.cjs

# Output:
# {
#   "iso": "2026-02-20T15:33:40.936Z",
#   "date": "2026-02-20"
# }
```

### In Skill Process

```
<command description="Get current date">node .kanban/scripts/get-date-time.cjs</command>
<action>Use `date` field for frontmatter</action>
```

**Summary:** Used by skills for consistent timestamps.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Format historical dates
- **Does NOT:** Handle timezones (uses UTC)
- **Does NOT:** Parse date strings

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| - | No configuration | - |

## Interactions

- **All skills**: Use for created/updated fields
- **Docs**: Use for updated/verified fields

## Limitations

- UTC only (no timezone support)
- Current time only (no date math)
