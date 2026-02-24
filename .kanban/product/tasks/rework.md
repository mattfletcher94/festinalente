---
id: "tasks/rework"
title: "Rework Task"
type: feature
tldr: "Return task to in-progress when Check or PR review finds issues"
summary: "Moves a task from check or pr columns back to in-progress, documenting the issues found. Creates iteration record in plan.xml for tracking rework cycles."
keywords: [rework, fail, issues, iteration, check-fail, pr-reject]
aliases: [kanban-rework, check-fail, pr-reject, fix-issues]
boundary: "Does NOT fix issues; only documents them and returns task for fixing"
related: [tasks/check, tasks/implement, tasks/workflow]
updated: 2026-02-24
verified: 2026-02-24
code_refs:
  - apps/kanban/src/content/skills/kanban-rework/SKILL.md
---

# Rework Task

> **TL;DR:** Return task to in-progress when Check or PR review finds issues

## Overview

Rework Task handles failures during verification phases. When Check verification finds issues or PR review requests changes, this command documents the problems and returns the task to in-progress for fixing. Each rework creates an iteration record in plan.xml.

**Summary:** Controlled rework loop with issue documentation and tracking.

## How It Works

1. User runs `/kanban-rework {id}` on a check or pr status task
2. Claude prompts: "What issues need to be fixed?"
3. Claude increments iteration counter in plan.xml
4. Claude adds issues to Iterations section with checkboxes
5. If task was in pr: closes the PR
6. Update task status to in-progress
7. Git commit: `docs({id}): rework - {title}`

### Key Workflows

**Check Failure:**
- Human tests app during QA, finds bugs
- `/kanban-rework {id}` → documents issues
- `/kanban-implement {id}` → fix issues
- `/kanban-check {id}` → re-verify

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
Status: check

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
  <iteration number="2" phase="Check" date="2026-02-24">
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
- **Does NOT:** Re-run verification → See [tasks/check](./check.md)
- **Does NOT:** Create new PR → See later workflow steps

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| - | No specific configuration | - |

## Interactions

- **tasks/implement**: Next step to fix issues
- **tasks/check**: Re-verify after fixes
- **PR (GitHub)**: Closes PR if task was in pr status

## Limitations

- Task must be in check or pr status
- Must be on task/{id} branch
- Issues documented as free-form text
