# Implementation Plan: Reporting System

## Overview

Add 3 reporting commands to Claude Kanban that allow users to query task history and activity using natural language. These commands load relevant data from git history and task files, then answer user questions conversationally.

## Background

Claude Kanban is a file-based kanban board in `.kanban/` with an immutable system in `.claudeban/`. Tasks move through columns (backlog → refined → scoped → planned → in-progress → verify → review → update-docs → done) and each transition creates a structured git commit.

**Commit message formats** (from `.claudeban/workflow.yaml`):
- `docs({id}): define - {title}` - task created
- `docs({id}): refine - {title}` - task refined
- `docs({id}): scope - {title}` - spec created
- `docs({id}): plan - {title}` - plan created
- `wip({id}): {summary}` - work in progress
- `docs({id}): verify-fail - {title}` - verification failed
- `{type}({id}): {title}` - implementation committed (type = feat/fix/docs/refactor)
- `docs({id}): product - {message}` - docs updated

**Labels**: bug, feature, docs, refactor, needs-refinement
**Priorities**: high, medium, low

## Commands to Create

Create 3 command files in `.claudeban/commands/kanban/`. No skill files needed (read-only queries).

---

### 1. `report-task.md`

**Purpose**: Query a specific task's history and current state.

**Usage**: `/kanban:report-task {id} [question]`

**Data to gather**:
- Task file: `.kanban/tasks/{id}-*.md`
- Spec file (if exists): `.kanban/specs/{id}.spec.md`
- Plan file (if exists): `.kanban/plans/{id}.plan.md`
- Git commits: `git log --oneline --all --grep="({id})"`

**Behavior**:
- If no question provided → ask user what they want to know about the task
- If question provided → answer using the gathered data

**Example questions users might ask**:
- "What's the current status?"
- "When was this started?"
- "How many times did verification fail?"
- "What files were changed?"

---

### 2. `report-user.md`

**Purpose**: Query what tasks a git user has worked on.

**Usage**: `/kanban:report-user {name} [question]`

**Data to gather**:
1. Find task IDs touched by user: `git log --all --author="{name}" --format="%s" | grep -oP '\(\K\d+(?=\))' | sort -u`
2. For each task ID found, read the task file: `.kanban/tasks/{id}-*.md`
3. Get current board state (all task statuses)

**Behavior**:
- Focus on **tasks**, not raw commits (commits are just used to identify which tasks)
- If no question provided → ask user what they want to know
- If question provided → answer using the gathered data

**Example questions users might ask**:
- "How many tasks are they currently working on?"
- "What have they completed?"
- "What bugs have they fixed?"

---

### 3. `report-label.md`

**Purpose**: Query tasks filtered by label (bug, feature, docs, refactor).

**Usage**: `/kanban:report-label {label} [question]`

**Data to gather**:
1. Find all task files with matching label in frontmatter: search `.kanban/tasks/*.md` for `labels:` containing the label
2. For each matching task, read the task file
3. Optionally read specs/plans for those tasks

**Behavior**:
- If no question provided → ask user what they want to know
- If question provided → answer using the gathered data

**Example questions users might ask**:
- "How many bugs are open?"
- "What features are in progress?"
- "List all completed refactors"

---

## Command File Format

Each command file follows this structure (see existing commands for reference):

```yaml
---
name: report-{x}
description: {description}
allowed-tools: Read, Glob, Grep, Bash(git log *)
argument-hint: "{hint}"
---

# {Title}

{Description of what this command does}

## Usage

`/kanban:report-{x} {args}`

## Workflow

1. Parse arguments to extract {id/name/label} and optional question
2. Gather relevant data (files + git history)
3. If no question provided → ask user what they want to know
4. If question provided → answer conversationally using the data

## Data Sources

{List what data to gather and how}

## Examples

{Example invocations}
```

---

## Implementation Steps

1. [ ] Create `.claudeban/commands/kanban/report-task.md`
2. [ ] Create `.claudeban/commands/kanban/report-user.md`
3. [ ] Create `.claudeban/commands/kanban/report-label.md`
4. [ ] Test each command with the example project

---

## Files Reference

**Existing command examples** (for format reference):
- `.claudeban/commands/kanban/status.md`
- `.claudeban/commands/kanban/define-task.md`

**Task file location**: `.kanban/tasks/{id}-{slug}.md`
**Spec file location**: `.kanban/specs/{id}.spec.md`
**Plan file location**: `.kanban/plans/{id}.plan.md`

**Task frontmatter fields**: id, title, status, priority, labels, created, updated, spec, plan
