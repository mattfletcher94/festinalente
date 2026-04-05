---
id: projects/lifecycle
title: "Project Lifecycle"
type: feature
tldr: "Projects transition open → in-progress → done as their decomposed tasks complete"
summary: "The project lifecycle manages creation via /festina-create-project, automatic status transitions as child tasks progress, and completion verification via /festina-complete-project."
keywords: [lifecycle, status, open, in-progress, done, creation, completion, transitions]
aliases: [project-status, project-workflow]
boundary: "Does not manage individual task lifecycles - each task follows the standard workflow independently"
references: [skills/create-project, projects/requirements]
uses: [systems/data-model]
intent: procedural
prerequisites: []
---

# Project Lifecycle

> **TL;DR:** Projects transition open → in-progress → done as their decomposed tasks complete

## Overview

Projects follow a simple three-state lifecycle: **open** (created, tasks not yet started), **in-progress** (at least one task has moved beyond backlog), and **done** (all tasks completed and acceptance criteria verified). This is intentionally simpler than the task lifecycle — projects are containers, not work items.

**Why it exists:** Projects need a way to signal whether work has started and whether the original goal was met. The lifecycle enables progress tracking and completion verification.

**Summary:** The project lifecycle provides status visibility without adding workflow overhead.

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

## How It Works

```mermaid
stateDiagram-v2
    [*] --> open: /festina-create-project
    open --> in-progress: First task moves beyond backlog
    in-progress --> done: /festina-complete-project
    done --> [*]
```

### Status Definitions

| Status | Meaning | Transition Trigger |
|--------|---------|-------------------|
| `open` | Project created, tasks in backlog | Set at creation |
| `in-progress` | At least one task has moved beyond backlog | Automatic when any task is scoped/planned/implemented |
| `done` | All tasks completed, acceptance criteria met | Manual via `/festina-complete-project` |

### Creation

1. User runs `/festina-create-project "title"`
2. Skill guides Socratic Q&A capturing problem, value, scope, requirements, acceptance criteria
3. Skill auto-decomposes into 2-5 vertically-sliced tasks
4. Writes `project.xml` to `.festinalente/projects/{projectId}/`
5. Writes `task.xml` for each decomposed task to `.festinalente/tasks/{taskId}/`
6. Each task receives `project-id` and `project-requirements` attributes

### Progress Tracking

The CLI provides real-time progress queries:

```bash
# Get progress breakdown by status
node .festinalente/scripts/festinalente.cjs get-project-progress P001
# → { "total": 4, "backlog": 1, "scoped": 1, "planned": 0, "inProgress": 1, "done": 1, ... }

# Get all tasks with their current status
node .festinalente/scripts/festinalente.cjs get-project-tasks P001
```

### Completion

1. User runs `/festina-complete-project P001`
2. Skill verifies all child tasks have status `done`
3. Skill evaluates project-level acceptance criteria (Gherkin)
4. If all pass: sets project status to `done`, runs directive rules
5. If tasks remain: reports which tasks are incomplete

## Examples

### Full Project Lifecycle

```
# 1. Create
/festina-create-project User authentication system
→ P001-user-authentication-system created (open)
→ Tasks: 001, 002 created in backlog

# 2. Work on tasks (standard task workflow)
/festina-scope 001     → task scoped, project now "in-progress"
/festina-plan 001      → task planned
/festina-implement 001 → task implemented
/festina-finalize 001  → PR created
/festina-complete 001  → task done

/festina-scope 002     → ...same flow...
/festina-complete 002  → task done

# 3. Complete project
/festina-complete-project P001
→ All 2 tasks done ✓
→ Acceptance criteria verified ✓
→ Project P001 completed (done)
```

## Boundaries

- **Does NOT:** Control task ordering — tasks can be worked in any order
- **Does NOT:** Block task completion if project is open
- **Does NOT:** Auto-complete the project when all tasks finish — requires explicit `/festina-complete-project`
