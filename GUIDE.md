# Claude Kanban: Complete Guide

This guide walks you through using Claude Kanban from start to finish. By the end, you'll understand the complete workflow for taking a task from idea to merged code.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Understanding the Workflow](#understanding-the-workflow)
3. [Step-by-Step Walkthrough](#step-by-step-walkthrough)
4. [Handling Failures](#handling-failures)
5. [Resuming Work](#resuming-work)
6. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### Install Claude Kanban

Run this once per project:

```bash
npx claude-kanban@latest
```

This creates both `.claude/` (skills and scripts) and `.kanban/` (your board data):

```
.kanban/
├── config.yaml    # Your board configuration
├── tasks/         # Task folders (each contains task.md, spec.md, plan.md)
│   └── 001/       # Task folder (ID only, no slug)
│       ├── task.md   # Task definition
│       ├── spec.md   # Functional specification
│       └── plan.md   # Implementation plan
├── product/       # Product documentation ({feature}.md)
└── skills/        # Your verification checks ({name}.md)
```

**File structure:** Each task gets its own folder (e.g., `001/`) containing `task.md`, `spec.md`, and `plan.md`. User-defined skills in `.kanban/skills/` are simple `.md` files (not directories).

### Document Your Product (Recommended)

Before creating tasks, document what your product does. This gives the AI context for future work.

**For existing codebases:**
```bash
/kanban-map-product
```
The AI analyzes your code and asks questions to create documentation.

**For new projects:**
```bash
/kanban-define-product
```
The AI guides you through defining your vision before coding.

Both create docs in `.kanban/product/` organized by domain:

```
.kanban/product/
├── overview.md           # Product overview (always created first)
├── auth/                 # Domain folder
│   ├── login.md         # Feature doc (id: auth/login)
│   └── permissions.md   # Concept doc (id: auth/permissions)
└── billing/
    └── subscriptions.md  # Feature doc (id: billing/subscriptions)
```

Each doc has an ID matching its path (e.g., `auth/login` for `.kanban/product/auth/login.md`).

### How Product Docs Work

Product docs represent the **current state** of your application. They're updated after implementation, not before.

**During task creation:** The AI searches product docs for related features and sets the `affects` field.

**During refinement/scoping:** The AI reads affected docs for context.

**After implementation:** During `/kanban-docs`, the AI updates existing docs or creates new ones.

---

## Understanding the Workflow

### The 10 Columns

Tasks flow through these columns:

```
Backlog → Refined → Scoped → Planned → In Progress → Code Check → QA → Update Docs → PR → Done
```

### Branch Strategy

Claude Kanban uses branch isolation to keep your main branch clean:

```
main branch:     [create] → [refine] → [scope creates branch]
                                              ↓
task/001 branch:                    [plan] → [implement] → [codecheck] → [QA] → [docs] → [PR]
                                                                                        ↓
main branch:                                                                [merge] ← [PR merged]
```

**Key points:**
- Early work (create, refine) happens on `main`
- Scoping creates a `task/{id}` branch automatically
- All implementation work happens on the task branch
- A PR is created when docs are complete
- Merging the PR completes the task and returns you to `main`

### The /clear Command

Always run `/clear` before each kanban command. This resets the AI's context so it can focus on the current step.

```bash
/clear
/kanban-refine 001
```

---

## Step-by-Step Walkthrough

### Step 1: Create a Task

**Branch:** `main`

```bash
/kanban-create "Add password reset functionality"
```

**What happens:**
- Creates a task file with a unique ID (e.g., `001`)
- Auto-detects the task type from the title (feature, bug, etc.)
- Commits the task definition

**Example output:**
```
Task 001 created in Backlog
- Title: Add password reset functionality
- Labels: [feature]
- Related product docs: auth/login (score 0.6)
- Affects: [auth/login, auth/password-reset]
- File: .kanban/tasks/001/task.md

Commit: docs(001): create - Add password reset functionality

Next: /kanban-refine 001
```

The `affects` field links this task to:
- `auth/login` - existing doc that may need updates
- `auth/password-reset` - new doc to be created during `/kanban-docs`

---

### Step 2: Refine the Task

**Branch:** `main`

```bash
/clear
/kanban-refine 001
```

**What happens:**
- AI asks clarifying questions about the task
- You answer to define the problem, value, and acceptance criteria
- Criteria are formatted in Gherkin (Given/When/Then) style
- Commits the refinement

**Example dialogue:**
```
Q: What problem are you trying to solve?
> Users forget passwords and can't log in

Q: What value would it provide if solved?
> Users can recover access without contacting support

Q: What does 'done' look like?
> User requests reset, gets email, clicks link, sets new password

Acceptance Criteria:
  Given a user has forgotten their password
  When they request a password reset
  Then they receive an email with a reset link
  And clicking the link allows them to set a new password

Commit: docs(001): refine - Add password reset functionality
```

---

### Step 3: Scope the Task (Creates Branch)

**Branch:** `main` → creates `task/001`

```bash
/clear
/kanban-scope 001
```

**What happens:**
- AI researches your codebase for relevant patterns
- Creates a functional specification with requirements
- **Creates the `task/001` branch**
- Commits the spec on the new branch

**Example output:**
```
Searching codebase for patterns...
- Found auth patterns in src/auth/
- Found email service in src/services/email.ts

Creating spec: .kanban/tasks/001/spec.md
- 5 functional requirements
- 4 files to modify

Creating branch task/001...
Switched to branch 'task/001'

Commit: docs(001): scope - Add password reset functionality
```

**From this point forward, all work happens on the task branch.**

---

### Step 4: Plan the Task

**Branch:** `task/001`

```bash
/clear
/kanban-plan 001
```

**What happens:**
- Reads the functional spec
- Creates an implementation plan with checkboxes
- Each step maps to a functional requirement
- Commits the plan

**Example output:**
```
Creating plan: .kanban/tasks/001/plan.md

Implementation Steps:
- [ ] Create password reset token model (FR1)
- [ ] Add /forgot-password endpoint (FR2)
- [ ] Add /reset-password endpoint (FR3)
- [ ] Create email template (FR4)
- [ ] Write tests (FR5)

Commit: docs(001): plan - Add password reset functionality
```

---

### Step 5: Implement the Task

**Branch:** `task/001`

```bash
/clear
/kanban-implement 001
```

**What happens:**
- AI executes each checkbox in the plan
- Actually writes the code
- Marks checkboxes as complete
- **No commit** - code stays uncommitted for review

**Example output:**
```
[1/5] Create password reset token model (FR1)
  Creating src/models/resetToken.ts...
  Done

[2/5] Add /forgot-password endpoint (FR2)
  Creating src/routes/forgot-password.ts...
  Done

[3/5] Add /reset-password endpoint (FR3)
  Creating src/routes/reset-password.ts...
  Done

[4/5] Create email template (FR4)
  Creating src/templates/password-reset.html...
  Done

[5/5] Write tests (FR5)
  Creating src/__tests__/password-reset.test.ts...
  Done

Implementation complete!
Files modified: 6 (uncommitted)

Next: /kanban-codecheck 001
```

**Save progress if interrupted:**
```bash
/kanban-save 001
```
This commits your work-in-progress so you don't lose it.

---

### Step 6: Run Code Checks

**Branch:** `task/001`

```bash
/clear
/kanban-codecheck 001
```

**What happens:**
- Runs your configured check skills (command-based or AI-driven reviews)
- If checks fail: AI shows the issues and asks if you want it to attempt a fix
- On success: Auto-advances to QA column

**Example output (success):**
```
Running check: TypeScript... PASS
Running check: Tests... PASS
Running check: Coding Patterns... PASS

All checks passed!
Moving to QA...

Task 001 moved to QA

Next: /kanban-approve 001
```

**Example output (fix requested):**
```
Running check: TypeScript... PASS
Running check: Tests... FAIL

Error: Expected token to be defined

Should I try to fix this? (y/n)
> y

Analyzing failure...
Fixed: Added session token assignment

Restarting checks...

Running check: TypeScript... PASS
Running check: Tests... PASS

All checks passed!
Task 001 moved to QA
```

---

### Step 7: Approve After Human QA

**Branch:** `task/001`

```bash
/clear
/kanban-approve 001
```

**What happens:**
- You confirm the implementation meets acceptance criteria
- Commits all implementation code with conventional commit type
- Moves to Update Docs

**Example output:**
```
Have you tested the application? [Y/n]
> Y

Staging files:
- src/models/resetToken.ts
- src/routes/forgot-password.ts
- src/routes/reset-password.ts
- src/templates/password-reset.html
- src/__tests__/password-reset.test.ts

Commit: feat(001): Add password reset functionality

Task 001 moved to Update Docs
```

---

### Step 8: Update Docs

**Branch:** `task/001`

```bash
/clear
/kanban-docs 001
```

**What happens:**
- Prompts for documentation updates
- Updates product docs if needed
- Commits documentation changes
- Pushes branch to remote
- Moves to PR

**Example output:**
```
Product Doc Analysis for Task 001:

Will UPDATE (doc exists):
- auth/login - User login via email/password and OAuth

Will CREATE (new feature):
- auth/password-reset - (new doc needed)

Proceed with documentation? [Y/n]
> Y

Updating .kanban/product/auth/login.md...
- Added reference to password reset flow

Creating .kanban/product/auth/password-reset.md...
- Documenting email-based reset flow

Commit: docs(001): product - add password reset documentation

Pushing branch...
Branch pushed to remote.

Task 001 moved to PR.

Create PR on GitHub, then run:
/kanban-merge 001
```

The AI intelligently determines which docs to update and which to create based on the task's `affects` field.

---

### Step 9: Merge the PR

**Branch:** `task/001` → returns to `main`

```bash
/clear
/kanban-merge 001
```

**What happens:**
- Merges the PR on GitHub
- Deletes the `task/001` branch
- Switches back to `main`
- Commits final task completion

**Example output:**
```
Ready to merge this PR? [Y/n]
> Y

Merging PR...
PR merged successfully!

Switching to main...
Deleting branch task/001...

Commit: docs(001): done - Add password reset functionality

Task 001 completed!
- Status: done
- Current branch: main

Congratulations! Task complete.
```

---

## Handling Failures

### Code Check Failures

If a check fails during code check, the AI:
1. Shows you the error or issues found
2. Asks: "Should I try to fix this?"
3. If you say yes: attempts the fix and re-runs all checks
4. If you say no: exits so you can fix manually

To resume after manual fixes:
```bash
/clear
/kanban-codecheck 001
```

### QA or PR Rejected

If human QA or PR review finds issues:

```bash
/clear
/kanban-rework 001
```

This:
- Documents the issues in the plan
- Returns task to In Progress
- You fix the issues and go through codecheck/QA again

---

## Resuming Work

### Check Board Status

```bash
/kanban-status
```

Shows all tasks grouped by column and suggests what to do next.

### Check Specific Task

```bash
/kanban-status 001
```

Shows detailed status including:
- Current column
- Plan progress
- WIP notes
- Previous failures

### Resume Implementation

If you stopped mid-implementation:

```bash
/clear
/kanban-implement 001
```

The AI picks up where it left off (checkboxes track progress).

### Wrong Branch?

Commands will tell you if you're on the wrong branch:

```
Error: This command must be run on branch task/001. Current branch: main
Suggestion: Switch with `git checkout task/001`
```

---

## Tips & Best Practices

### 1. Always Use /clear

Run `/clear` before each kanban command. This resets context and prevents confusion.

```bash
/clear
/kanban-scope 001
```

### 2. One Task at a Time

Focus on completing one task before starting another. The branch strategy assumes you're working on one task per branch.

### 3. Commit WIP When Stopping

If you need to stop mid-implementation:

```bash
/kanban-save 001
```

This saves your progress with notes on where to resume.

### 4. Configure Verification Checks

Add your checks to `.kanban/config.yaml`:

```yaml
user-skills:
  "kanban-codecheck":
    skills:
      - check-typescript    # Reads .claude/skills/check-typescript/SKILL.md
      - check-tests         # Reads .claude/skills/check-tests/SKILL.md
      - check-lint          # Reads .claude/skills/check-lint/SKILL.md
```

### 5. Use Labels for Commit Types

Labels determine the commit type when QA passes:

| Label | Commit |
|-------|--------|
| `feature` | `feat(001): title` |
| `bug` | `fix(001): title` |
| `refactor` | `refactor(001): title` |
| `docs` | `docs(001): title` |

### 6. Review the Git History

Your git history tells the complete story:

```bash
git log --grep="(001)"
```

```
docs(001): done - Add password reset functionality
docs(001): product - add password reset documentation
feat(001): Add password reset functionality
docs(001): plan - Add password reset functionality
docs(001): scope - Add password reset functionality
docs(001): refine - Add password reset functionality
docs(001): create - Add password reset functionality
```

---

## Quick Reference

| Step | Command | Branch |
|------|---------|--------|
| Create | `/kanban-create "title"` | main |
| Refine | `/kanban-refine 001` | main |
| Scope | `/kanban-scope 001` | main → task/001 |
| Plan | `/kanban-plan 001` | task/001 |
| Implement | `/kanban-implement 001` | task/001 |
| Code Check | `/kanban-codecheck 001` | task/001 |
| Approve | `/kanban-approve 001` | task/001 |
| Docs | `/kanban-docs 001` | task/001 |
| Merge | `/kanban-merge 001` | task/001 → main |
| Rework | `/kanban-rework 001` | task/001 |

---

## Next Steps

You now know the complete workflow. Start with:

```bash
npx claude-kanban@latest
/kanban-define-product   # or /kanban-map-product for existing code
/kanban-create "Your first task"
```

And follow the flow from there. Each command tells you what to run next.

Happy building!
