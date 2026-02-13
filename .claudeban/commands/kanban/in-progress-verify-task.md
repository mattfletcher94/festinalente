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

Checks are defined as skill files in `.kanban/skills/` and referenced in `board.yaml`:

```yaml
commands:
  kanban:in-progress-verify-task:
    skills:
      - .kanban/skills/check-typescript.md
      - .kanban/skills/check-tests.md
```

## Outcomes

- **All pass**: Prompts "Continue to Review? Y/N" → moves to Verify status
- **Any fail**: Records failure in plan Iterations section → stays In Progress

## Example

`/kanban:in-progress-verify-task 001`

Runs all configured verification checks and reports results.
