---
id: skills/overview
title: "Board Overview"
type: feature
tldr: "View board status, task details, or visual kanban through conversational interface"
summary: "The /festina-overview skill asks what view you want (current status, board overview, visual board, or task details), then delivers exactly that information with appropriate next-step suggestions."
keywords: [overview, status, board, kanban, visual, tasks]
aliases: [festina-overview, status, board]
boundary: "Does not modify tasks - view only"
references: [skills/create, cli/tasks]
uses: [systems/cli, systems/data-model]
updated: 2026-03-01
---

# Board Overview

> **TL;DR:** View board status, task details, or visual kanban through conversational interface

## Overview

The `/festina-overview` skill is the main entry point for understanding current state. Instead of dumping all information at once, it asks what you want to see, then delivers exactly that.

**Why it exists:** To provide focused information without overwhelming the user.

**Summary:** Overview asks first, then shows exactly what you need.

## How It Works

```mermaid
flowchart TB
    Start[/festina-overview]
    Start --> Ask{What to see?}

    Ask -->|Current status| Active[Show active tasks]
    Ask -->|Board overview| All[List by column]
    Ask -->|Visual board| ASCII[ASCII boxes]
    Ask -->|Other| Parse[Parse intent]

    Parse -->|Task ID| Details[Task details]
    Parse -->|Label| Filter[Filter by label]
    Parse -->|Priority| Priority[Filter by priority]
```

### View Options

| Option | What You See |
|--------|--------------|
| **Current status** | In-progress tasks, next actions |
| **Board overview** | All tasks grouped by column |
| **Visual board** | ASCII kanban boxes |
| **Other** | Task ID, label query, priority filter |

### Visual Board Format

```
┌─ IN PROGRESS (1) ─────────────────────┐
│ 007: Add user authentication [feature]│
└───────────────────────────────────────┘
┌─ PLANNED (2) ─────────────────────────┐
│ 008: Add password reset               │
│ 009: Email notifications              │
└───────────────────────────────────────┘

Done (2 tasks)
```

**Summary:** Visual board uses ASCII boxes for at-a-glance status.

### Next Step Suggestions

For each task shown, overview suggests the appropriate next command:

| Status | Suggested Command |
|--------|-------------------|
| backlog | `/festina-scope {id}` |
| scoped | `/festina-plan {id}` |
| planned | `/festina-implement {id}` |
| in-progress | `/festina-implement {id}` (resume) |
| finalize | `/festina-finalize {id}` |
| done | Task complete |

## Examples

### Current Status

```
/festina-overview
> Current status

## Current Status

**007: Add user authentication**
- Status: in-progress
- Progress: 4/8 steps
- Next: `/festina-implement 007`

**005: Fix login redirect**
- Status: finalize
- Next: `/festina-finalize 005`
```

### Task Details via "Other"

```
/festina-overview
> Other: 007

## Task 007: Add user authentication

**Status:** in-progress
**Labels:** [feature]
**Priority:** high

**Progress:** 4/8 steps complete

**Remaining steps:**
- [ ] Add session management
- [ ] Add logout endpoint

**Next:** `/festina-implement 007` (resume)
```

### Label Query

```
/festina-overview
> Other: show bugs

## Tasks labeled "bug"

- **005**: Fix login redirect
  - Status: finalize
  - Priority: high

**Total:** 1 task
```

**Summary:** "Other" input is parsed flexibly for task IDs, labels, or queries.

## Boundaries

What this skill does NOT do:

- **Does NOT:** Modify tasks
- **Does NOT:** Create tasks → See [create](./create.md)
- **Does NOT:** Provide implementation guidance

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Box width | ASCII box width | 40-60 chars |
| Column order | Workflow column order | backlog→done |

## Interactions

- **CLI tasks**: Uses list-tasks, find-task commands

## Limitations

- Read-only view
- Requires `.festinalente/` to be initialized
