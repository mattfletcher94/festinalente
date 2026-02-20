---
id: "tasks/workflow"
title: "Task Workflow"
type: feature
tldr: "9-column kanban workflow from backlog to done"
summary: "Tasks progress through backlog, scoped, planned, in-progress, codecheck, qa, update-docs, pr, and done columns with defined transitions and rework paths."
keywords: [workflow, columns, transitions, kanban, status]
aliases: [task-status, task-columns, kanban-workflow]
boundary: "Does NOT define task content structure; only workflow states and transitions"
related: [tasks/create, tasks/scope, tasks/plan, tasks/implement, tasks/codecheck, tasks/rework]
updated: 2026-02-20
---

# Task Workflow

> **TL;DR:** 9-column kanban workflow from backlog to done

## Overview

Task Workflow defines how tasks progress through the Claude Kanban system. Tasks move through 9 columns in sequence, with rework paths allowing tasks to return to earlier stages when issues are found.

**Summary:** A structured 9-column workflow ensuring quality gates and documentation updates.

## How It Works

1. Developer creates task (enters **backlog**)
2. Claude scopes the task (moves to **scoped**)
3. Claude plans implementation (moves to **planned**)
4. Developer/Claude implements (moves to **in-progress**)
5. Automated checks run (moves to **codecheck**)
6. Human tests the app (moves to **qa**)
7. Documentation updated (moves to **update-docs**)
8. PR created and reviewed (moves to **pr**)
9. PR merged (moves to **done**)

### Key Workflows

**Happy Path:**
- backlog → scoped → planned → in-progress → codecheck → qa → update-docs → pr → done

**Rework Paths:**
- qa → in-progress (QA fails, needs code fix)
- pr → in-progress (PR review requires changes)

**Summary:** Linear progression with two rework loops for quality issues.

## Examples

### Typical Usage

```yaml
# .kanban/workflow.yaml
transitions:
  backlog: [scoped]
  scoped: [planned]
  planned: [in-progress]
  in-progress: [codecheck]
  codecheck: [qa]
  qa: [update-docs, in-progress]  # approve or rework
  update-docs: [pr]
  pr: [done, in-progress]  # merge or rework
```

### Edge Case: QA Failure

```bash
# Task fails QA testing
/kanban-rework 001 "Login button not working on mobile"
# Task moves from qa → in-progress with rework notes
```

**Summary:** Transitions defined in workflow.yaml, rework handled via kanban-rework command.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Define task XML structure → See [tasks/create](./create.md)
- **Does NOT:** Execute validation checks → See [validation/_index](../validation/_index.md)

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| transitions | Valid column transitions | Defined in workflow.yaml |

## Interactions

- **tasks/create**: New tasks enter backlog column
- **tasks/rework**: Moves tasks back to in-progress
- **vscode/kanban-view**: Displays tasks grouped by column

## Limitations

- Cannot skip columns (must follow defined transitions)
- No parallel columns (tasks in one column at a time)
- Rework always returns to in-progress (not intermediate columns)
