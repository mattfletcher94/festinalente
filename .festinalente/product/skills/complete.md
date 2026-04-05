---
id: skills/complete
title: "Complete Task"
type: feature
tldr: "Move a task from awaiting-completion to done"
summary: "The /festina-complete skill closes a task by transitioning it from awaiting-completion to done. Lightweight by default — without directives, it simply marks the task as done. Directives (like github.xml) can add merge logic or other completion workflows via their complete phase rules."
keywords: [complete, task, done, awaiting-completion, merge, closure]
aliases: [festina-complete, close, finish, done]
boundary: "Does not validate or document - only closes tasks. Validation and docs are handled by /festina-finalize."
references: [skills/finalize, skills/rework]
uses: [systems/cli, systems/data-model]
intent: procedural
prerequisites: []
---

# Complete Task

> **TL;DR:** Move a task from awaiting-completion to done

## Overview

The `/festina-complete` skill handles the final step of the task lifecycle: closing the task. It transitions a task from `awaiting-completion` to `done`. By default, it simply marks the task as done and adds a completion date. Directives can extend this with custom completion workflows — for example, the `github.xml` directive adds PR status checking and squash merge logic.

**Why it exists:** To separate task closure from validation/documentation, providing a clean extension point for custom completion workflows (PR merge, deploy notifications, changelog updates, etc.).

**Summary:** Lightweight task closure that directives can extend with merge and workflow logic.

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

## How It Works

```mermaid
flowchart LR
    A[Read Task] --> B[Load Directives]
    B --> C[Mark Done]
    C --> D[Directive Compliance]
    D --> E[Output Result]
```

1. **Read task** - Find task in awaiting-completion status
2. **Load directives** - Apply complete phase rules if configured
3. **Mark done** - Set status to `done`, add completed date
4. **Directive compliance** - Run directive validation checks
5. **Output result** - Show completion summary

**Summary:** A lightweight skill that directives can hook into for custom completion logic.

## Examples

### Basic Completion (No Directives)

```
/festina-complete 007

Task: 007 - Add user authentication
Status: awaiting-completion

Updating task status...
- status: awaiting-completion -> done
- completed: 2026-03-08

Task 007 completed

Next: /festina-overview
```

### With GitHub Directive

```
/festina-complete 008

Task: 008 - Add password reset flow
Status: awaiting-completion

[Directives loaded: github.xml]
Checking PR #43 status...
PR approved. Merge now or wait?

> Merge

Squash merging PR #43...
Merged! Issue #42 auto-closed.

Task 008 completed
```

**Summary:** Without directives, it marks done instantly. With the GitHub directive, it checks PR approval and squash merges.

## Boundaries

What this skill does NOT do:

- **Does NOT:** Validate code or run checks -> See [finalize](./finalize.md)
- **Does NOT:** Update documentation -> See [finalize](./finalize.md)
- **Does NOT:** Fix issues -> See [rework](./rework.md)

## Interactions

- **Directives**: Applies `phase="complete"` rules if configured (e.g., GitHub PR merge)
- **Finalize**: Runs before complete to validate and document
- **Rework**: Alternative path from awaiting-completion back to in-progress

## Limitations

- Task should be in `awaiting-completion` status (warns if different)
- Without directives, simply marks done with no additional checks
