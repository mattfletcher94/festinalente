---
id: "cli/lifecycle"
title: "Lifecycle Skills"
type: feature
tldr: "Skills for task workflow from creation to completion"
summary: "Interactive skills that guide tasks through the kanban workflow: create, scope, plan, implement, codecheck, approve, and done"
keywords: [lifecycle, workflow, create, scope, plan, implement, codecheck, approve]
aliases: [task-workflow, workflow-skills, task-progression]
boundary: "Does not cover exploration, documentation mapping, or quality audits"
related: [cli/discovery, cli/docs, cli/quality]
updated: 2026-02-19
---

# Lifecycle Skills

> **TL;DR:** Skills for task workflow from creation to completion

## Overview

Lifecycle Skills allow users to progress tasks through the kanban workflow. This is important because it provides structured, AI-assisted task management from initial idea to completion.

**Summary:** Complete task workflow automation from create to done.

## How It Works

1. User invokes a skill via `/kanban-{name}` in Claude Code
2. Skill runs interactive Q&A or automated steps
3. Result: Task progresses to next workflow column

### Key Workflows

**Standard Task Flow:**
```
Backlog → Scoped → Planned → In Progress → Codecheck → QA → Update Docs → PR → Done
```

**Summary:** Tasks progress linearly through workflow columns.

## Skills

### /kanban-create

Creates a new task through conversational Q&A.

- **Transition**: None → Backlog
- **Collects**: Problem statement, value proposition, acceptance criteria (Gherkin)
- **Links**: Product and engineering documentation

```
/kanban-create "Add user notifications"
```

### /kanban-scope

Breaks down task into modules and requirements.

- **Transition**: Backlog → Scoped
- **Creates**: spec.xml with detailed requirements
- **Identifies**: Affected product/engineering documentation

```
/kanban-scope TASK-003
```

### /kanban-plan

Creates detailed implementation plan.

- **Transition**: Scoped → Planned
- **Creates**: plan.xml with task breakdown, dependencies, verification steps
- **Includes**: File modifications, test approach

```
/kanban-plan TASK-003
```

### /kanban-implement

Executes implementation plan step-by-step.

- **Transition**: Planned → In Progress → Codecheck
- **Loads**: Documentation context based on task affects/engineering fields
- **Checks**: Documentation freshness before starting

```
/kanban-implement TASK-003
```

### /kanban-codecheck

Runs automated verification (tests, typecheck, lint).

- **Transition**: Codecheck → QA (on success)
- **Uses**: Hook config directives for project-specific commands
- **Reports**: Pass/fail with detailed output

```
/kanban-codecheck TASK-003
```

### /kanban-approve

Final review, commit, and merge workflow.

- **Transition**: QA → Update Docs → PR → Done
- **Creates**: Git commit with proper format
- **Optionally**: Creates pull request

```
/kanban-approve TASK-003
```

### /kanban-save

Saves work-in-progress without completing task.

- **Transition**: None (stays in current column)
- **Creates**: WIP commit
- **Use case**: Pausing work to switch tasks

```
/kanban-save TASK-003
```

### /kanban-rework

Handles revision when QA requires changes.

- **Transition**: QA/PR → In Progress
- **Use case**: Failed review or merge conflicts

```
/kanban-rework TASK-003
```

### /kanban-delete

Removes task from backlog.

- **Transition**: Backlog → (deleted)
- **Use case**: Task no longer needed
- **Restriction**: Only works for Backlog tasks

```
/kanban-delete TASK-003
```

## Examples

### Typical Usage

```
User: /kanban-create "Fix login timeout bug"

Claude: I'll help you create a task for this bug fix...
[Q&A conversation]

Created: TASK-004 in Backlog
```

### Edge Case: Failed Codecheck

```
User: /kanban-codecheck TASK-003

Claude: Running tests...
[Output shows 2 failing tests]

Codecheck failed. Fix the issues and run again.
Task remains in Codecheck column.
```

### Edge Case: Merge Conflicts

```
User: /kanban-approve TASK-003

Claude: Creating commit...
[Git shows merge conflicts]

Merge conflicts detected. Resolve conflicts and run /kanban-rework.
```

**Summary:** Skills handle standard flow and common failure modes.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Explore codebase → See [Discovery Skills](./discovery.md)
- **Does NOT:** Map documentation → See [Documentation Skills](./docs.md)
- **Does NOT:** Audit quality → See [Quality Skills](./quality.md)

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Hook config | Project-specific commands in .kanban/config.yaml | None (uses defaults) |
| Commit format | Defined in .kanban/workflow.yaml | Conventional commits |

## Limitations

- Tasks can only progress forward (except rework)
- Skipping workflow steps is not allowed
- One task at a time per skill invocation
