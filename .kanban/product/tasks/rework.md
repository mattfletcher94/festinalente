---
id: "tasks/rework"
title: "Rework Task"
type: feature
tldr: "Return task to in-progress when QA or PR review finds issues"
summary: "Moves a task from qa or pr columns back to in-progress, documenting the issues found. Creates iteration record in plan.xml for tracking rework cycles."
keywords: [rework, fail, issues, iteration, qa-fail, pr-reject]
aliases: [kanban-rework, qa-fail, pr-reject, fix-issues]
boundary: "Does NOT fix issues; only documents them and returns task for fixing"
related: [tasks/codecheck, tasks/implement, tasks/workflow]
updated: 2026-02-20
---

# Rework Task

> **TL;DR:** Return task to in-progress when QA or PR review finds issues

## Overview

Rework Task handles failures during human review phases. When QA testing finds issues or PR review requests changes, this command documents the problems and returns the task to in-progress for fixing. Each rework creates an iteration record in plan.xml.

**Summary:** Controlled rework loop with issue documentation and tracking.

## How It Works

1. User runs `/kanban-rework {id}` on a qa or pr status task
2. Claude prompts: "What issues need to be fixed?"
3. Claude increments iteration counter in plan.xml
4. Claude adds issues to Iterations section with checkboxes
5. If task was in pr: closes the PR
6. Update task status to in-progress
7. Git commit: `docs({id}): rework - {title}`

### Key Workflows

**QA Failure:**
- Human tests app, finds bugs
- `/kanban-rework {id}` → documents issues
- `/kanban-implement {id}` → fix issues
- `/kanban-codecheck {id}` → re-verify

**PR Rejection:**
- Reviewer requests changes
- `/kanban-rework {id}` → documents feedback, closes PR
- Fix and re-verify
- Create new PR

**Summary:** Documented rework loop with iteration tracking.

## Examples

### Typical Usage

```
Handling rework for task 001 "Add user authentication"...

Task: 001 - Add user authentication
Status: qa

What issues need to be fixed?
> 1. Password validation is missing minimum length check
> 2. JWT token expiry is not being checked
> 3. Error messages expose internal details

Updating plan with iteration...

Task 001 returned to In Progress for rework.
- Iteration: 2
- Status: in-progress
- Issues to address: 3
```

### Plan Iterations Section

```xml
<iterations>
  <iteration number="2" phase="QA Failed" date="2026-02-20">
    <result>failed</result>
    <issues>
      <issue status="open">Password validation missing minimum length</issue>
      <issue status="open">JWT token expiry not checked</issue>
      <issue status="open">Error messages expose internal details</issue>
    </issues>
    <action>Address issues above, then re-verify</action>
  </iteration>
</iterations>
```

**Summary:** Issues documented with checkboxes for tracking fixes.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Fix the issues → See [tasks/implement](./implement.md)
- **Does NOT:** Re-run code checks → See [tasks/codecheck](./codecheck.md)
- **Does NOT:** Create new PR → See later workflow steps

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| - | No specific configuration | - |

## Interactions

- **tasks/implement**: Next step to fix issues
- **tasks/codecheck**: Re-verify after fixes
- **PR (GitHub)**: Closes PR if task was in pr status

## Limitations

- Task must be in qa or pr status
- Must be on task/{id} branch
- Issues documented as free-form text
