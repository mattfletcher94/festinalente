---
id: "tasks/check"
title: "Check Task"
type: feature
tldr: "Run code checks, verify requirements, prompt for QA, and commit"
summary: "Combines automated checks (directives), requirements verification, and human QA into a single workflow step. Commits code when all verification passes."
keywords: [check, verification, qa, tests, lint, directives, commit]
aliases: [kanban-check, verification, code-check, quality-assurance]
boundary: "Does NOT skip QA prompt; always requires human confirmation before commit"
related: [tasks/implement, tasks/workflow, validation/_index, tasks/rework]
updated: 2026-02-24
verified: 2026-02-24
code_refs:
  - apps/kanban/src/content/skills/kanban-check/SKILL.md
---

# Check Task

> **TL;DR:** Run code checks, verify requirements, prompt for QA, and commit

## Overview

Check Task combines automated verification with human QA into a single workflow step. It runs configured directives (tests, lint, AI review), verifies that functional requirements are met, then prompts for manual QA confirmation. Only after all checks pass does it commit the code and move to update-docs.

**Summary:** Complete verification pipeline from automated checks to human approval.

## How It Works

1. User runs `/kanban-check {id}` on a check-status task
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
5. When all automated checks pass: verify requirements
6. Trace each functional requirement to implementation
7. Prompt for human QA with acceptance criteria
8. If QA passes: commit code, move to update-docs
9. If QA fails: suggest /kanban-rework

### Key Workflows

**Auto-fix loop:**
- Check fails → Claude offers fix → User approves → Claude fixes
- Fix committed with: `docs({id}): check-retry - {title}`
- All checks restart from beginning

**QA confirmation:**
- Shows task title and acceptance criteria
- User confirms all criteria are met
- Only then does code get committed

**No checks configured:**
- If no directives configured, proceeds to requirements verification
- Then prompts for QA confirmation

**Summary:** Automated checks → Requirements verification → Human QA → Commit.

## Examples

### Typical Usage

```
Running checks for task 001 "Add OAuth Login"...

Running check: TypeScript...
PASS: TypeScript

Running check: Tests...
PASS: Tests

All automated checks passed!

Verifying requirements...
- FR1: OAuth endpoint ✓
- FR2: Token validation ✓
All requirements verified.

**Task:** 001 - Add OAuth Login

**Acceptance Criteria:**
- Given valid OAuth credentials, user can log in
- Given invalid credentials, user sees error message

Have you tested and verified the acceptance criteria?
> Yes

Staging files...
Commit: e5f6g7h feat(001): Add OAuth Login

Task 001 moved to Update Docs

Next:
/clear
/kanban-docs 001
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
Commit: a1b2c3d docs(001): check-retry - Add OAuth Login

Restarting checks...
PASS: TypeScript
PASS: Tests

All automated checks passed!

[QA prompt and commit flow continues...]
```

### Edge Case: QA Fails

```
[All automated checks pass...]

Have you tested and verified the acceptance criteria?
> No

Use `/kanban-rework 001` to document issues and return to implementation.
```

**Summary:** Complete verification with fix loop and QA gate.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Skip QA prompt → Always requires human confirmation
- **Does NOT:** Define check rules → Those are in directives
- **Does NOT:** Test user-facing behavior → That's the human QA part

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| directives.kanban-check | Array of check directive names | [] |

## Interactions

- **Directives**: Defines what automated checks to run
- **tasks/implement**: Previous step (code to check)
- **tasks/rework**: If QA fails or issues found
- **tasks/docs**: Next step after commit

## Limitations

- Must be on task/{id} branch
- Task must be in check status
- Checks restart from beginning after any fix
- Requires human confirmation before commit
