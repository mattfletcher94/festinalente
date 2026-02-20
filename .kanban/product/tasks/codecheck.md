---
id: "tasks/codecheck"
title: "Code Check"
type: feature
tldr: "Run configured checks (tests, lint, review) before QA"
summary: "Runs user-configured code checks from directives—automated commands (tests, typecheck) and AI-driven reviews (patterns, architecture). Offers to fix failures automatically."
keywords: [codecheck, tests, lint, validation, directives]
aliases: [kanban-codecheck, checks, verification]
boundary: "Does NOT commit code; runs checks on uncommitted changes before QA"
related: [tasks/implement, tasks/workflow, validation/_index]
updated: 2026-02-20
---

# Code Check

> **TL;DR:** Run configured checks (tests, lint, review) before QA

## Overview

Code Check runs user-configured validation checks before human QA. Checks are defined in `.kanban/directives/` and can be automated commands (tests, typecheck, lint) or AI-driven reviews (coding patterns, architecture compliance). When checks fail, Claude offers to fix the issues automatically.

**Summary:** Quality gate between implementation and human QA.

## How It Works

1. User runs `/kanban-codecheck {id}` on a codecheck-status task
2. Claude loads check directives from config.yaml
3. For each check directive:
   - Command checks: Execute command, check exit code
   - Pattern checks: Scan files with regex for violations
   - Checklist checks: AI self-assessment
4. If check fails:
   - Show error output or violations
   - Ask user: "Should I try to fix these issues?"
   - If yes: fix, commit fix, restart all checks
   - If no: exit for manual fix
5. When all checks pass: move status to qa
6. Code still uncommitted for QA review

### Key Workflows

**Auto-fix loop:**
- Check fails → Claude offers fix → User approves → Claude fixes
- Fix committed with: `docs({id}): codecheck-retry - {title}`
- All checks restart from beginning

**No checks configured:**
- If no directives configured, moves directly to QA
- User can add directives later

**Summary:** Iterative check-fix cycle until all checks pass.

## Examples

### Typical Usage

```
Running code checks for task 001 "Add OAuth Login"...

Running check: TypeScript...
PASS: TypeScript

Running check: Tests...
PASS: Tests

All checks passed!
Moving to QA...
```

### Edge Case: Check Failure with Auto-Fix

```
Running check: Tests...
FAIL: Tests

Error: OAuth callback > should set session token
Expected: token defined
Received: undefined

[User selects "Yes" to fix issues]

Fixing: Adding session token assignment in src/auth/oauth.ts:45
Committing fix...
Commit: e5f6g7h docs(001): codecheck-retry - Add OAuth Login

Restarting checks...
PASS: TypeScript
PASS: Tests

All checks passed!
```

**Summary:** Automated fix with restart of all checks.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Define check rules → Those are in directives
- **Does NOT:** Commit final code → Code commits after QA approval
- **Does NOT:** Test user-facing behavior → That's human QA

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| directives.kanban-codecheck | Array of check directive names | [] |

## Interactions

- **Directives**: Defines what checks to run
- **tasks/implement**: Previous step (code to check)
- **tasks/rework**: If QA fails after checks

## Limitations

- Must be on task/{id} branch
- Task must be in codecheck status
- Checks restart from beginning after any fix
