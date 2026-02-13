# Claude Kanban - Evolution Plan

## Overview

This document captures the planned improvements to Claude Kanban, informed by analysis of the GSD (Get Shit Done) system and Socratic exploration of our workflow needs.

---

## Current State (Before Changes)

The existing system has:

**Directory Structure:**
```
.claudeban/                    # System files (commands, skills)
├── commands/kanban/           # 8 command definitions
└── skills/kanban-*/           # 8 skill implementations

example-project/.kanban/       # Project data (per-project)
├── board.yaml                 # Board configuration
├── config/                    # Schemas
├── tasks/                     # Task files
├── plans/                     # Plan files
├── docs/
└── archive/
```

**Existing Columns (6):**
```
Backlog → Planned → In Progress → Review → Update Docs → Done
```

**Existing Commands (8):**
- `define-task`, `backlog-refine-task`, `backlog-plan-task`
- `planned-implement-task`, `in-progress-wip-commit`
- `review-pass-task`, `review-fail-task`, `update-docs-complete-task`

**What's Changing:**
- 6 columns → 9 columns (adding Refined, Scoped, Verify)
- 8 commands → 12 commands (adding scope, verify pass/fail, updating names)
- New skill file structure with built-in validation
- Updated schemas for new status values

---

## Key Principles Adopted from GSD

| Principle | How We Apply It |
|-----------|-----------------|
| **Context Engineering** | Clear context before each command; all state persisted to markdown files |
| **Separated Concerns** | Distinct phases for product thinking vs engineering thinking |
| **Atomic Commits** | Every phase transition creates a conventional commit |
| **Structured Verification** | Automated checks before human review |

---

## New Column Structure (9 Columns)

```
Backlog → Refined → Scoped → Planned → In Progress → Verify → Review → Update Docs → Done
           ↑          ↑                                 ↑        ↑
        Product    Engineering                      Automated  Human
```

### Column Definitions

| # | Column | Purpose | Owner |
|---|--------|---------|-------|
| 1 | **Backlog** | Raw task with title + rough description | Anyone |
| 2 | **Refined** | Product requirements clarified via Socratic Q&A | Product thinking |
| 3 | **Scoped** | Functional spec added (codebase research, technical approach) | Engineering |
| 4 | **Planned** | Implementation checkboxes created in `.plan.md` | Engineering |
| 5 | **In Progress** | Executing checkboxes, code uncommitted | Engineering |
| 6 | **Verify** | Automated checks (tests, typecheck, build, linting, etc.) | Automated |
| 7 | **Review** | Human review of implementation | User |
| 8 | **Update Docs** | Review passed, code committed, documentation pending | Engineering |
| 9 | **Done** | Documentation committed, task complete | - |

---

## Commands

### Primary Flow Commands

| Command | From → To | Purpose |
|---------|-----------|---------|
| `define-task` | → Backlog | Create new task |
| `backlog-refine-task` | Backlog → Refined | Clarify product requirements (Socratic Q&A) |
| `refined-scope-task` | Refined → Scoped | Codebase research + functional specification |
| `scoped-plan-task` | Scoped → Planned | Create implementation checkboxes |
| `planned-implement-task` | Planned → In Progress | Begin implementation |
| `in-progress-verify-task` | In Progress → Verify | Run automated checks |
| `verify-pass-task` | Verify → Review | Checks passed, move to human review |
| `verify-fail-task` | Verify → In Progress | Checks failed, return to implementation |
| `review-pass-task` | Review → Update Docs | Human approved, commit code |
| `review-fail-task` | Review → In Progress | Human rejected, return to implementation |
| `update-docs-complete-task` | Update Docs → Done | Documentation complete |

### Supporting Commands

| Command | Column | Purpose |
|---------|--------|---------|
| `in-progress-wip-commit` | In Progress → In Progress | Save partial progress if interrupted |

---

## Conventional Commits

Each phase transition creates a commit following conventional commit format:

| Transition | Commit Message |
|------------|----------------|
| → Backlog | `docs(task): add {id} {title}` |
| → Refined | `docs(task): refine {id} {title}` |
| → Scoped | `docs(task): scope {id} {title}` |
| → Planned | `docs(plan): {id} {title}` |
| → In Progress | *no commit - implementation starting* |
| (wip) | `wip({id}): {progress summary}` |
| → Verify | *no commit - running checks* |
| Verify fail | `docs(verify): fail {id} {title}` |
| → Review | *no commit - awaiting human* |
| Review fail | `docs(review): fail {id} {title}` |
| → Update Docs | `feat({id}): {title}` / `fix({id}):` / `refactor({id}):` |
| → Done | `docs(product): {description}` |

### Example Git History

```
docs(task): add 001 add-oauth-login
docs(task): refine 001 add-oauth-login
docs(task): scope 001 add-oauth-login
docs(plan): 001 add-oauth-login
wip(001): auth routes and middleware          # optional
docs(verify): fail 001 add-oauth-login        # optional loop
docs(review): fail 001 add-oauth-login        # optional loop
feat(001): add-oauth-login
docs(product): add oauth login guide
```

---

## Phase Details

### 1. Define (→ Backlog)

**Input:** User idea or request
**Output:** Task file with title and rough description
**AI Role:** Capture the essence of what user wants

### 2. Refine (Backlog → Refined)

**Input:** Raw task
**Output:** Task with clear acceptance criteria, user stories, edge cases
**AI Role:** Socratic Q&A to clarify requirements
**Focus:** Product thinking - *what* do we want, not *how* to build it

### 3. Scope (Refined → Scoped)

**Input:** Refined task with clear requirements
**Output:** Task with Functional Specification section added
**AI Role:**
- Research codebase for relevant patterns, files, dependencies
- Identify affected areas
- Propose technical approach
- Document in functional spec

**Focus:** Engineering thinking - *how* will it work technically

**Functional Spec Contents:**
- Affected files/modules
- Existing patterns to follow
- Dependencies/libraries involved
- Technical approach summary
- Potential risks or considerations

### 4. Plan (Scoped → Planned)

**Input:** Scoped task with functional spec
**Output:** `.plan.md` file with implementation checkboxes
**AI Role:** Break down functional spec into atomic, executable steps

**Plan File Structure:**
```markdown
---
task: "001"
status: approved
created: 2026-02-13
iteration: 1
---
# Plan: {title}

## Overview
{brief summary referencing functional spec}

## Tasks
- [ ] Step 1: {atomic action}
- [ ] Step 2: {atomic action}
...
```

**After Failure (Iteration Tracking):**
```markdown
---
task: "001"
status: in-progress
created: 2026-02-13
iteration: 2
---
# Plan: {title}

## Overview
{brief summary referencing functional spec}

## Tasks
- [x] Step 1: {atomic action}
- [x] Step 2: {atomic action}

## Iterations

### Attempt 2 — Review Failed (2026-02-13)
**Phase:** review
**Result:** failed

**Issues:**
- [ ] Missing loading state on login button
- [ ] No error handling for OAuth rejection

**Action:** Address issues above, then re-verify

---

### Attempt 1 — Verify Failed (2026-02-13)
**Phase:** verify
**Result:** failed

**Errors:**
\`\`\`
pnpm test: FAILED
src/auth/oauth.test.ts:42
  Expected: token defined
  Received: undefined
\`\`\`

**Action:** Fix token generation in OAuth callback

---
```

**Key Elements:**
- `iteration` in frontmatter tracks attempt count
- Issues as checkboxes `- [ ]` so AI can track fixing them
- Most recent attempt listed first for immediate visibility
- `**Action:**` provides clear directive for next steps

### 5. Implement (Planned → In Progress)

**Input:** Approved plan with checkboxes
**Output:** Code changes (uncommitted), checkboxes marked complete
**AI Role:** Execute each checkbox, mark progress

**Key Behaviors:**
- Work through checkboxes sequentially
- Mark each complete as done
- Code stays uncommitted until verification passes
- Can use `wip-commit` to save progress if interrupted

### 6. Verify (In Progress → Verify)

**Input:** Completed implementation
**Output:** Automated check results
**AI Role:** Run configured verification checks

**Behavior:** Stop on first failure — fail fast, fix, retry.

**Check Configuration:**
Checks are user-defined skill files referenced in `board.yaml`:

```yaml
# board.yaml
commands:
  kanban:in-progress-verify-task:
    skills:
      - .kanban/skills/check-typescript.md
      - .kanban/skills/check-tests.md
      - .kanban/skills/check-tsdoc.md
      - .kanban/skills/check-patterns.md
```

**Check Skill Example:**
```markdown
# .kanban/skills/check-typescript.md

## Check: TypeScript

Run `pnpm typecheck`

### Pass criteria
Exit code 0, no errors in output.

### Common failures
- "Cannot find module X" — missing dependency, run `pnpm install`
- "Type X is not assignable to Y" — type mismatch, fix the code
```

**Outcomes:**
- All pass → Prompt user "Continue? Y/N" → Move to Review
- Any fail → Record failure in Iterations section → Return to In Progress

### 7. Review (Verify → Review)

**Input:** Verified implementation
**Output:** Human approval or rejection
**AI Role:** Present changes for human review

**Review Includes:**
- Summary of changes made
- Files modified
- How acceptance criteria were met

**Outcomes:**
- User approves → Commit code, move to Update Docs
- User rejects → Document issues, return to In Progress

### 8. Update Docs (Review → Update Docs)

**Input:** Approved, committed code
**Output:** Updated product documentation
**AI Role:** Update relevant documentation

**Documentation May Include:**
- README updates
- API documentation
- User guides
- Changelog entries

### 9. Done

**Input:** Completed documentation
**Output:** Archived task
**Behavior:** Task optionally moved to archive folder

---

## Directory Structure

Two separate directories serve different purposes:

### System Files (`.claudeban/`) — Shared/Global

```
.claudeban/
├── commands/kanban/                    # Command definitions
│   ├── define-task.md
│   ├── backlog-refine-task.md
│   ├── refined-scope-task.md
│   ├── scoped-plan-task.md
│   ├── planned-implement-task.md
│   ├── in-progress-wip-commit.md
│   ├── in-progress-verify-task.md
│   ├── verify-pass-task.md
│   ├── verify-fail-task.md
│   ├── review-pass-task.md
│   ├── review-fail-task.md
│   └── update-docs-complete-task.md
├── skills/
│   ├── kanban-define-task/SKILL.md
│   ├── kanban-backlog-refine-task/SKILL.md
│   ├── kanban-refined-scope-task/SKILL.md
│   ├── kanban-scoped-plan-task/SKILL.md
│   ├── kanban-planned-implement-task/SKILL.md
│   ├── kanban-in-progress-wip-commit/SKILL.md
│   ├── kanban-in-progress-verify-task/SKILL.md
│   ├── kanban-verify-pass-task/SKILL.md
│   ├── kanban-verify-fail-task/SKILL.md
│   ├── kanban-review-pass-task/SKILL.md
│   ├── kanban-review-fail-task/SKILL.md
│   └── kanban-update-docs-complete-task/SKILL.md
└── templates/
    └── board.yaml                      # Template for new projects
```

### Project Data (`.kanban/`) — Per-Project

```
.kanban/
├── board.yaml              # Board configuration (9 columns)
├── config/
│   ├── schema.task.json    # Task validation schema
│   └── schema.plan.json    # Plan validation schema
├── skills/                 # Project-specific skills (e.g., verify checks)
│   ├── check-typescript.md
│   ├── check-tests.md
│   └── check-patterns.md
├── tasks/
│   └── {id}-{slug}.md      # Task files
├── plans/
│   └── {id}.plan.md        # Plan files
├── docs/
└── archive/                # Completed tasks (optional)
```

### Command File Format

Each command file in `.claudeban/commands/kanban/` defines:

```markdown
---
name: backlog-refine-task
description: Refine a backlog task with Socratic Q&A to clarify requirements
allowed-tools:
  - Read
  - Edit
  - Write
  - Bash(git add * && git commit *)
argument-hint: <task-id>
---

Refines a task in the backlog column by conducting Socratic Q&A to clarify product requirements.

## Usage

/kanban:backlog-refine-task <task-id>

## Arguments

- `task-id` (required): The ID of the task to refine (e.g., "001")
```

### Skill File Format

Each skill file provides detailed instructions:

```markdown
# Skill: backlog-refine-task

## Context

You are refining a task to clarify product requirements. Focus on WHAT the user wants, not HOW to build it.

## Inputs

- Task ID provided as argument
- Task file at `.kanban/tasks/{id}-*.md`

## Steps

1. Read the task file at `.kanban/tasks/{id}-*.md`
2. Verify task status is `backlog` — if not, stop and inform user
3. Conduct Socratic Q&A:
   - Ask clarifying questions about requirements
   - Identify edge cases
   - Define acceptance criteria
4. Update the task file:
   - Add `## Acceptance Criteria` section with checkboxes
   - Update frontmatter: `status: refined`
   - Update frontmatter: `updated: {today's date}`
5. Commit: `git add .kanban/tasks/{id}-*.md && git commit -m "docs(task): refine {id} {title}"`

## Validation

All must pass. If any fail, fix and retry.

- [ ] `grep -q "^status: refined" .kanban/tasks/{id}-*.md`
- [ ] `grep -q "## Acceptance Criteria" .kanban/tasks/{id}-*.md`
- [ ] `git log -1 --oneline | grep -q "docs(task): refine {id}"`

## Completion

Confirm to user: "Task {id} refined. Acceptance criteria documented."
```

---

## Task File Structure

```markdown
---
id: '001'
title: Add OAuth Login
status: scoped
priority: medium
labels: [feature]
created: 2026-02-13T00:00:00.000Z
updated: 2026-02-13
---

# Add OAuth Login

## Description
{original description}

## Acceptance Criteria
- [ ] User can log in with Google
- [ ] User can log in with GitHub
- [ ] Session persists across browser refresh

## Functional Specification

### Affected Files
- `src/auth/oauth.ts` (new)
- `src/middleware/session.ts` (modify)
- `src/routes/auth.ts` (modify)

### Existing Patterns
- Auth middleware follows pattern in `src/middleware/auth.ts`
- Routes use Express Router pattern

### Technical Approach
1. Add Passport.js OAuth strategies
2. Extend session middleware for OAuth tokens
3. Add callback routes for each provider

### Dependencies
- passport-google-oauth20
- passport-github2
```

---

## Status Values

### Task Status (matches columns)
```
backlog | refined | scoped | planned | in-progress | verify | review | update-docs | done
```

### Plan Status
```
draft | approved | in-progress | completed
```

---

## Configuration (board.yaml)

```yaml
name: Project Name

columns:
  - backlog
  - refined
  - scoped
  - planned
  - in-progress
  - verify
  - review
  - update-docs
  - done

labels:
  - bug
  - feature
  - docs
  - refactor

priorities:
  - high
  - medium
  - low

commands:
  kanban:define-task:
    skills: []
  kanban:backlog-refine-task:
    skills: []
  kanban:refined-scope-task:
    skills: []
  kanban:scoped-plan-task:
    skills: []
  kanban:planned-implement-task:
    skills: []
  kanban:in-progress-wip-commit:
    skills: []
  kanban:in-progress-verify-task:
    skills: []
  kanban:verify-pass-task:
    skills: []
  kanban:verify-fail-task:
    skills: []
  kanban:review-pass-task:
    skills: []
  kanban:review-fail-task:
    skills: []
  kanban:update-docs-complete-task:
    skills: []

settings:
  version: "2.0"
  idPrefix: ""
  idPadding: 3
  archiveOnComplete: false
```

---

## Design Decisions

1. **Verify skill configuration** — Checks are user-defined skill files referenced in `board.yaml`. Each check is a markdown skill with run command, pass criteria, and common failure guidance.

2. **No skipping phases** — Strict flow enforced. Every task goes through all 9 phases. Consistency over convenience. No escape hatches for "trivial" tasks.

3. **Stop on first failure** — Verify phase stops at first failing check. Fail fast, fix, retry.

4. **User confirmation at transitions** — "Continue? Y/N" prompt before moving to next phase, even when automated checks pass.

5. **Built-in command validation** — Every command includes automatic validation checks that run before confirming completion. Lightweight, deterministic, no extra user action required.

---

---

## Built-in Command Validation

Every command includes automatic validation to ensure the AI correctly performed the operation. This catches mistakes before confirming completion to the user.

### How It Works

```
User runs /kanban:backlog-refine-task 001
         ↓
   AI does refinement work
         ↓
   AI runs validation checks (automatic, built-in)
         ↓
   Pass? → "Done. Task 001 refined."
   Fail? → AI fixes issue → re-validates → confirms
```

The user just runs the command. Validation is invisible — they only see the final result.

### Validation Characteristics

| Characteristic | Why |
|----------------|-----|
| **Deterministic** | Simple pass/fail checks, no LLM reasoning |
| **Lightweight** | Grep/git commands, minimal tokens |
| **Automatic** | Built into skill, no separate step |
| **Self-healing** | If check fails, AI fixes and retries |

### Skill File Structure

Each skill file includes a Validation section as mandatory final steps:

```markdown
# Skill: backlog-refine-task

## Steps

1. Read the task file
2. Conduct Socratic Q&A to clarify requirements
3. Update task with Acceptance Criteria section
4. Update frontmatter: `status: refined`
5. Commit: `docs(task): refine {id} {title}`

## Validation

All must pass. If any fail, fix and retry.

- `status: refined` exists in frontmatter
- `## Acceptance Criteria` section exists
- Git log shows `docs(task): refine {id}`

## Completion

Only after validation passes, confirm to user: "Task {id} refined and committed."
```

### Validation Checks by Command

| Command | Validation Checks |
|---------|-------------------|
| `define-task` | Task file exists, frontmatter valid, `status: backlog`, commit exists |
| `backlog-refine-task` | `status: refined`, Acceptance Criteria section exists, commit exists |
| `refined-scope-task` | `status: scoped`, Functional Specification section exists, commit exists |
| `scoped-plan-task` | `status: planned`, `.plan.md` file exists with valid frontmatter, commit exists |
| `planned-implement-task` | `status: in-progress`, plan checkboxes marked complete |
| `in-progress-verify-task` | All configured checks pass |
| `verify-pass-task` | `status: review` |
| `review-pass-task` | `status: update-docs`, code committed with correct message |
| `review-fail-task` | `status: in-progress`, Iterations section updated, commit exists |
| `update-docs-complete-task` | `status: done`, docs committed |

---

## Resolved Questions

- **Parallel tasks** — Already supported. Commands take task ID, so multiple tasks can be in different phases simultaneously. No change needed.

- **Labels** — Category only (`bug`, `feature`, `docs`, `refactor`). No state labels (columns handle that), no area labels, no flags. Keep it simple.

---

## README Structure

The README should document the system for new users. Structure:

```markdown
# Claude Kanban

File-based kanban for AI-assisted development.

## Overview
- What it is
- Key principles (file-based, git-integrated, skill-driven)
- Visual flow diagram

## Quick Start
- Installation/setup steps
- Initialize a project: `kanban:define-task`
- Walk through first task lifecycle

## Workflow

### The 9 Columns
- Table with column, purpose, command to enter

### Commands Reference
- Table of all 12 commands with usage

## Task Lifecycle
- Detailed walkthrough of a task from Backlog → Done
- Example task file at each stage
- Example git history

## Configuration

### board.yaml
- Full annotated example

### Custom Verify Checks
- How to create check skills
- Example check skill

## File Formats

### Task File
- Frontmatter fields
- Required sections by status

### Plan File
- Frontmatter fields
- Iteration tracking format

## Schemas
- Link to or embed JSON schemas

## FAQ / Troubleshooting
- Common issues and solutions
```

---

## Schema Changes

### Task Schema (`schema.task.json`)

Update status enum:

```json
{
  "properties": {
    "status": {
      "type": "string",
      "enum": [
        "backlog",
        "refined",
        "scoped",
        "planned",
        "in-progress",
        "verify",
        "review",
        "update-docs",
        "done"
      ]
    }
  }
}
```

### Plan Schema (`schema.plan.json`)

Add iteration field:

```json
{
  "properties": {
    "iteration": {
      "type": "integer",
      "minimum": 1,
      "default": 1
    }
  }
}
```

---

## Migration

For existing projects using the old 6-column system:

1. **Tasks in `backlog`** — Remain in `backlog`, will go through new flow
2. **Tasks in `planned`** — Move to `scoped` (they had implicit scoping)
3. **Tasks in `in-progress`** — Remain, continue through new verify/review flow
4. **Tasks in `review`** — Move to `verify` (run checks first)
5. **Tasks in `update-docs` or `done`** — No change needed

Migration is optional — old tasks can coexist, but new tasks follow the new flow.

---

## Implementation Order

Implementation should follow this sequence to avoid broken states:

### Phase 1: Schema & Config (Foundation)

1. Update `schema.task.json` — Add new status values
2. Update `schema.plan.json` — Add iteration field
3. Update `templates/board.yaml` — 9 columns, 12 commands

### Phase 2: New Commands & Skills

4. Create `refined-scope-task` command + skill
5. Create `in-progress-verify-task` command + skill
6. Create `verify-pass-task` command + skill
7. Create `verify-fail-task` command + skill

### Phase 3: Update Existing Commands & Skills

8. Rename `backlog-plan-task` → `scoped-plan-task` (source column changed)
9. Update all existing skills with Validation sections
10. Update commit message formats where needed

### Phase 4: Documentation

11. Update README with new flow
12. Update example-project with 9-column board.yaml
13. Create example verify check skills

### Phase 5: Testing

14. Walk through complete task lifecycle manually
15. Verify all validation checks work
16. Test failure/retry flows

---

## Next Steps

- [ ] Phase 1: Update schemas and board.yaml template
- [ ] Phase 2: Create new command and skill files (scope, verify)
- [ ] Phase 3: Update existing commands and add validation to all skills
- [ ] Phase 4: Update README and examples
- [ ] Phase 5: End-to-end testing
