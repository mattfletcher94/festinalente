---
name: in-progress-verify-task
description: Run automated verification checks on completed implementation
allowed-tools: Read, Write, Bash(*)
argument-hint: "[task id]"
---

# Verify Kanban Task

Run automated verification checks (tests, typecheck, linting) on completed implementation.

## Usage

`/kanban:in-progress-verify-task [task-id]`

## Workflow

1. Invoke the **kanban-in-progress-verify-task** skill
2. Pass `$ARGUMENTS` as the task ID (if provided)
3. Skill runs configured checks and reports results

## Check Configuration

Checks are defined as skill files in `.kanban/skills/` and referenced in `config.yaml`:

```yaml
commands:
  kanban:in-progress-verify-task:
    skills:
      - .kanban/skills/check-typescript.md
      - .kanban/skills/check-tests.md
```

## Column Transition

```
in-progress → verify (if all pass)
in-progress → in-progress (if any fail)
```

See `.claudeban/kanban-workflow.yaml` for valid transitions.

## Commit

On failure, uses `commits.verify-fail` format from `.claudeban/kanban-workflow.yaml`.

## Example

`/kanban:in-progress-verify-task 001`

Runs all configured verification checks and reports results.
