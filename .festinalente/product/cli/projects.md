---
id: cli/projects
title: "Project Commands"
type: feature
tldr: "CRUD and progress tracking for projects via festinalente.cjs script"
summary: "Project commands provide next-project-id, find-project, list-projects, get-project-tasks, get-project-progress, and get-project-siblings operations with JSON output for skills and VSCode consumption."
keywords: [projects, crud, list, find, progress, siblings, commands, prefix, resolution]
aliases: [project-commands, project-crud]
boundary: "Does not provide AI workflows - use skills for interactive project management"
references: []
uses: [systems/cli, systems/data-model]
intent: procedural
prerequisites: []
---

# Project Commands

> **TL;DR:** CRUD and progress tracking for projects via festinalente.cjs script

## Overview

Project commands provide the foundational operations for managing projects programmatically. All commands return JSON for easy parsing by skills and VSCode.

**Summary:** Project commands are the persistence and query layer that project-related skills build upon.

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

## Commands

| Command | Purpose | Output |
|---------|---------|--------|
| `next-project-id --title="{title}"` | Get next available project ID | JSON with nextId, currentHighest, slug |
| `find-project {id}` | Get project path/metadata (supports prefix) | JSON with id, path, title, status, taskCount |
| `list-projects` | List all projects | JSON with count and projects array |
| `list-projects --status={s}` | Filter by status (open, in-progress, done) | Filtered projects |
| `get-project-tasks {project-id}` | Get all tasks belonging to a project | JSON with count and tasks array |
| `get-project-progress {project-id}` | Get progress counts by status | JSON with total, backlog, scoped, planned, etc. |
| `get-project-siblings {task-id}` | Get sibling tasks for a task within its project | JSON with projectId, projectTitle, siblings |

## Examples

```bash
# Get next project ID
node .festinalente/scripts/festinalente.cjs next-project-id --title="User Authentication System"
# → { "nextId": "P002-user-authentication-system", "currentHighest": 1, "slug": "user-authentication-system" }

# Find project by prefix
node .festinalente/scripts/festinalente.cjs find-project P001
# → { "id": "P001-skill-audit", "path": "...", "title": "...", "status": "open", "taskCount": 3 }

# List all open projects
node .festinalente/scripts/festinalente.cjs list-projects --status=open

# Get tasks for a project
node .festinalente/scripts/festinalente.cjs get-project-tasks P001-skill-audit

# Get progress breakdown
node .festinalente/scripts/festinalente.cjs get-project-progress P001-skill-audit
# → { "total": 5, "backlog": 2, "scoped": 1, "planned": 0, "inProgress": 1, "done": 1, ... }

# Get sibling tasks (other tasks in same project)
node .festinalente/scripts/festinalente.cjs get-project-siblings 001-first-task
```

## Project ID Format

Project IDs follow the pattern `P{3-digit-padded}-{slug}` (e.g., `P001-user-authentication-system`). The `next-project-id` command auto-generates the next available ID by scanning existing project folders and incrementing.

## Prefix Resolution

Project commands that accept an `{id}` argument support **prefix lookup**. Instead of passing the full project folder name (e.g., `P001-user-authentication-system`), you can pass just the prefix (e.g., `P001`). The CLI resolves the prefix to the matching project folder.

Resolution order:
1. Exact match first
2. P-prefix-only match (e.g., `P001` matches `P001-user-auth`)

## Boundaries

- **Does NOT:** Parse project XML content beyond metadata (just paths and summaries)
- **Does NOT:** Modify project status → Skills handle this
- **Does NOT:** Manage task-project associations → Skills set `project-id` attribute in task.xml
