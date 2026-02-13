# Claude Kanban

A file-based kanban board for AI-assisted development. Task and planning data lives with your code - transparent, versionable, and accessible to both humans and AI.

## Quick Start

### 1. Initialize

```bash
/kanban:init
```

This creates the `.kanban/` directory structure in your project:

```
.kanban/
├── config.yaml    # Your board configuration
├── tasks/         # Task files
├── specs/         # Functional specifications
├── plans/         # Implementation plans
├── product/       # Product documentation
└── skills/        # Your verification checks
```

### 2. Document Your Product (Optional but Recommended)

For **existing codebases** with features but no documentation:
```bash
/kanban:map-product
```
The AI analyzes your code, asks clarifying questions, and generates product docs.

For **new projects** where you want to define vision first:
```bash
/kanban:define-product
```
The AI asks "What problem are you trying to solve?" and guides you through defining features.

Both create docs in `.kanban/product/` that give the AI context for future task work.

### 3. Create Your First Task

```bash
/kanban:define-task "Add user authentication"
```

This creates a task file, assigns it an ID (e.g., `001`), and commits it to git.

### 4. Work Through the Workflow

Each task progresses through columns. Run `/clear` before each command to reset context:

```bash
# On main branch
/clear
/kanban:backlog-refine-task 001      # Clarify requirements via Q&A

/clear
/kanban:refined-scope-task 001       # Research codebase, create spec
                                     # Creates task/001 branch automatically

# Now on task/001 branch
/clear
/kanban:scoped-plan-task 001         # Create implementation plan

/clear
/kanban:planned-implement-task 001   # Write the code

/clear
/kanban:in-progress-verify-task 001  # Run automated checks

/clear
/kanban:verify-pass-task 001         # Move to human review

/clear
/kanban:review-pass-task 001         # Approve and commit code

/clear
/kanban:update-docs-complete-task 001 # Update docs, create PR

/clear
/kanban:awaiting-merge-merge-task 001 # Merge PR, delete branch, done!
                                      # Returns to main branch
```

That's it. Your PR is merged and git history tells the story of your task.

---

## The Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                 │
│  MAIN BRANCH                                                                                    │
│  ═══════════                                                                                    │
│   define-task         refine-task         scope-task                                            │
│   + commit            + commit            + creates task/{id} branch                            │
│       │                   │                   │                                                 │
│       ▼                   ▼                   ▼                                                 │
│   ┌────────┐         ┌─────────┐         ┌────────┐                                             │
│   │Backlog │────────▶│ Refined │────────▶│ Scoped │─────────────────────────────────────────┐   │
│   └────────┘         └─────────┘         └────────┘                                         │   │
│                                                                                             │   │
│  TASK BRANCH (task/{id})                                                                    │   │
│  ═══════════════════════                                                                    │   │
│                                               plan-task        implement-task               │   │
│                                               + commit         (no commit)                  │   │
│                                                   │                │                        │   │
│                                                   ▼                ▼                        │   │
│                                              ┌─────────┐    ┌───────────┐                   │   │
│                                              │ Planned │───▶│In Progress│◀──────────┐      │   │
│                                              └─────────┘    └─────┬─────┘           │      │   │
│                                                                   │                 │      │   │
│                                                          verify-task               │      │   │
│                                                          (no commit)               │      │   │
│                                                                   │                 │      │   │
│                                                                   ▼                 │      │   │
│                                                              ┌─────────┐            │      │   │
│                                                              │ Verify  │            │      │   │
│                                                              └────┬────┘            │      │   │
│                                                    ┌──────────────┴──────┐          │      │   │
│                                                    │                     │          │      │   │
│                                            verify-pass            verify-fail       │      │   │
│                                                    │              + commit ─────────┘      │   │
│                                                    ▼                                       │   │
│                                               ┌─────────┐                                  │   │
│                                               │ Review  │                                  │   │
│                                               └────┬────┘                                  │   │
│                                     ┌──────────────┴──────┐                                │   │
│                                     │                     │                                │   │
│   ┌──────┐    ┌────────────────┐  review-pass      review-fail                             │   │
│   │ Done │◀───│ Awaiting Merge │◀─+ commit code    + commit ───────────────────────────────┘   │
│   └──────┘    └───────┬────────┘        │                                                      │
│       ▲               │                 ▼                                                      │
│       │               │          ┌────────────┐                                                │
│       │               │          │Update Docs │                                                │
│       │               │          └─────┬──────┘                                                │
│       │               │                │                                                       │
│       │               │         update-docs-complete                                           │
│       │               │         + commit + creates PR                                          │
│       │               │                │                                                       │
│       │               └────────────────┘                                                       │
│       │                                                                                        │
│       │         merge-task (merges PR, deletes branch, returns to main)                        │
│       └────────────────────────────────────────────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Key principles:**
- **Branch isolation:** Task work happens on `task/{id}` branches, keeping main clean
- **PR-based review:** Code is merged via pull request for proper code review
- **Each command is a stopping point:** You run a command, review the result, then decide to continue
- **Commits happen at most phases:** Git history tells the complete story

---

## Branching Strategy

Claude Kanban uses a `task/{id}` branching strategy for code isolation and PR-based review:

### Branch Lifecycle

1. **Define & Refine on main:** Task creation and refinement happen on main (no code changes yet)
2. **Scope creates branch:** When you scope a task, a `task/{id}` branch is created automatically
3. **All work on task branch:** Planning, implementation, verification, and review happen on the task branch
4. **PR for merge:** When docs are complete, a PR is created from `task/{id}` to `main`
5. **Merge completes task:** Merging the PR deletes the branch and returns you to main

### Branch Requirements by Command

| Phase | Commands | Required Branch |
|-------|----------|-----------------|
| **Early** | `define-task`, `backlog-refine-task` | `main` |
| **Transition** | `refined-scope-task` | `main` → creates `task/{id}` |
| **Work** | All other task commands | `task/{id}` |
| **Complete** | `awaiting-merge-merge-task` | `task/{id}` → returns to `main` |

### Switching Branches

If you're on the wrong branch, commands will error with a helpful message:

```
Error: This command must be run on branch task/001. Current branch: main
Suggestion: Switch to task branch with `git checkout task/001`
```

### PR Workflow

When you run `update-docs-complete-task`, a PR is automatically created:
- Title: `{type}(001): Add user authentication`
- Body includes: Summary, changes, acceptance criteria, task reference
- Task moves to "Awaiting Merge" column

Then choose:
- `awaiting-merge-merge-task 001` - Merge the PR, delete branch, complete task
- `awaiting-merge-fail-task 001` - Close PR, return to In Progress for fixes

---

## Complete Workflow Example

Here's a full task lifecycle from start to finish. Run `/clear` before each command to reset context:

```bash
# 0. Initialize (first time only)
/kanban:init
# → Creates .kanban/ directory structure

# 0b. Document your product (recommended, first time only)
/clear
/kanban:map-product    # For existing codebases
# OR
/clear
/kanban:define-product # For new projects
# → Creates product docs in .kanban/product/
# → Gives AI context for future task work

# 1. Create task
/clear
/kanban:define-task "Add dark mode support"
# → Creates .kanban/tasks/001-add-dark-mode-support.md
# → Commits: docs(001): define - Add dark mode support

# 2. Refine (Socratic Q&A)
/clear
/kanban:backlog-refine-task 001
# → AI asks: "What problem are you trying to solve?"
# → AI asks: "What value would it provide?"
# → AI asks: "What does 'done' look like?"
# → Fills acceptance criteria in Gherkin format
# → Commits: docs(001): refine - Add dark mode support

# 3. Scope (research and spec)
/clear
/kanban:refined-scope-task 001
# → AI searches codebase for existing patterns
# → Creates .kanban/specs/001.spec.md with:
#   - Functional requirements
#   - Affected files
#   - Technical constraints
# → Creates branch: task/001
# → Commits: docs(001): scope - Add dark mode support

# --- Now on task/001 branch ---

# 4. Plan (implementation steps)
/clear
/kanban:scoped-plan-task 001
# → Creates .kanban/plans/001.plan.md with checkboxes
# → Commits: docs(001): plan - Add dark mode support

# 5. Implement
/clear
/kanban:planned-implement-task 001
# → AI executes each checkbox in the plan
# → Writes actual code
# → NO COMMIT - code stays uncommitted for review

# 5b. (Optional) Save progress if interrupted
/clear
/kanban:in-progress-wip-commit 001
# → Commits: wip(001): completed theme context and toggle

# 6. Verify
/clear
/kanban:in-progress-verify-task 001
# → Runs your configured checks (tests, typecheck, lint)
# → If pass: moves to Verify column
# → If fail: stays in In Progress, commits failure notes

# 7. Pass verification
/clear
/kanban:verify-pass-task 001
# → Moves to Review column for human approval

# 8a. Review passes
/clear
/kanban:review-pass-task 001
# → Commits code: feat(001): Add dark mode support
# → Moves to Update Docs

# 8b. Review fails (alternative)
/clear
/kanban:review-fail-task 001
# → Documents issues in plan
# → Returns to In Progress for fixes
# → Commits: docs(001): review-fail - Add dark mode support

# 9. Update docs and create PR
/clear
/kanban:update-docs-complete-task 001
# → Updates product documentation
# → Commits: docs(001): product - add dark mode guide
# → Creates Pull Request to main
# → Moves to Awaiting Merge

# 10. Merge and complete
/clear
/kanban:awaiting-merge-merge-task 001
# → Merges the PR
# → Deletes task/001 branch
# → Switches back to main
# → Commits: docs(001): done - Add dark mode support
# → Task is Done!

# 10b. If PR needs changes (alternative)
/clear
/kanban:awaiting-merge-fail-task 001
# → Closes the PR
# → Documents issues in plan
# → Returns to In Progress for fixes
# → Commits: docs(001): merge-fail - Add dark mode support
```

Your git log now shows the full story:
```
docs(001): define - Add dark mode support
docs(001): refine - Add dark mode support
docs(001): scope - Add dark mode support        # task/001 branch created here
docs(001): plan - Add dark mode support
feat(001): Add dark mode support
docs(001): product - add dark mode guide
# PR merged here
docs(001): done - Add dark mode support         # back on main
```

---

## Commands Reference

Commands are named with their **source column prefix** so you always know where the task must be:

| Command | From | To | Branch | Commits |
|---------|------|-----|--------|---------|
| `kanban:init` | — | — | any | No |
| `kanban:status [id]` | — | — | any | No |
| `kanban:define-task "title"` | (new) | Backlog | main | Yes |
| `kanban:backlog-refine-task [id]` | Backlog | Refined | main | Yes |
| `kanban:refined-scope-task [id]` | Refined | Scoped | main → task/{id} | Yes |
| `kanban:scoped-plan-task [id]` | Scoped | Planned | task/{id} | Yes |
| `kanban:planned-implement-task [id]` | Planned | In Progress | task/{id} | No |
| `kanban:in-progress-wip-commit [id]` | In Progress | In Progress | task/{id} | Yes |
| `kanban:in-progress-verify-task [id]` | In Progress | Verify | task/{id} | On fail |
| `kanban:verify-pass-task [id]` | Verify | Review | task/{id} | No |
| `kanban:verify-fail-task [id]` | Verify | In Progress | task/{id} | Yes |
| `kanban:review-pass-task [id]` | Review | Update Docs | task/{id} | Yes |
| `kanban:review-fail-task [id]` | Review | In Progress | task/{id} | Yes |
| `kanban:update-docs-complete-task [id]` | Update Docs | Awaiting Merge | task/{id} | Yes + PR |
| `kanban:awaiting-merge-merge-task [id]` | Awaiting Merge | Done | task/{id} → main | Yes |
| `kanban:awaiting-merge-fail-task [id]` | Awaiting Merge | In Progress | task/{id} | Yes |

**Utility commands:**

| Command | Purpose |
|---------|---------|
| `kanban:status` | Show board status and suggest next command |
| `kanban:status [id]` | Show detailed status for a specific task |

**Product discovery commands:**

| Command | Purpose |
|---------|---------|
| `kanban:map-product` | Analyze existing codebase and create product docs |
| `kanban:define-product` | Define a new product through Q&A before coding |

---

## Resuming Work

Lost context mid-task? Use the status command to see where you are:

```bash
/kanban:status
```

This shows all tasks grouped by column and suggests what to run next:

```
## Board Status

**In Progress (1)**
- 001: Add dark mode support — 3/7 steps

**Review (1)**
- 002: Fix login redirect bug

**Suggested next command:**

/clear
/kanban:planned-implement-task 001

Task 001 is in progress with 4 steps remaining. Resume implementation to continue.
```

For detailed status on a specific task:

```bash
/kanban:status 001
```

This shows plan progress, WIP notes, and any previous failures — everything you need to pick up where you left off.

**Tip:** Before stopping work mid-implementation, run `/kanban:in-progress-wip-commit` to save progress with continuation hints.

---

## Custom Skills

Skills are markdown files that provide guidance to the AI during specific commands. There are two main uses:

1. **Verification checks** - Run during `verify-task` to validate implementation
2. **Guidance skills** - Provide coding standards, architecture rules, or other instructions

### Configuring Skills

Edit `.kanban/config.yaml` to attach skills to commands:

```yaml
commands:
  "kanban:planned-implement-task":
    skills:
      - .claude/skills/coding-standards.md
      - .claude/skills/architecture.md

  "kanban:in-progress-verify-task":
    skills:
      - .kanban/skills/check-typescript.md
      - .kanban/skills/check-tests.md
      - .kanban/skills/check-lint.md

  "kanban:review-pass-task":
    skills:
      - .claude/skills/code-review-checklist.md
```

When a command runs, the AI reads and follows all configured skills as mandatory guidance.

### Creating Verification Checks

Verification checks run during `verify-task`. Create them in `.kanban/skills/`:

**`.kanban/skills/check-typescript.md`**
```markdown
# Check: TypeScript

Run `pnpm typecheck`

### Pass criteria
Exit code 0, no errors in output.

### Common failures
- "Cannot find module X" — missing dependency, run `pnpm install`
- "Type X is not assignable to Y" — type mismatch, fix the code
```

**`.kanban/skills/check-tests.md`**
```markdown
# Check: Tests

Run `pnpm test`

### Pass criteria
Exit code 0, all tests pass.

### Common failures
- "Test suite failed" — review failing test output
- "Cannot find module" — missing test dependency
```

**`.kanban/skills/check-lint.md`**
```markdown
# Check: Lint

Run `pnpm lint`

### Pass criteria
Exit code 0, no lint errors.

### Common failures
- "Unexpected console statement" — remove console.log or add eslint-disable
- "Missing return type" — add TypeScript return type annotation
```

The AI runs each check in order. On first failure, it stops, records the error in the plan's Iterations section, and commits the failure. Fix the issue and re-run verify.

### Creating Guidance Skills

Guidance skills provide instructions the AI follows during implementation or other phases:

**`.claude/skills/coding-standards.md`**
```markdown
# Coding Standards

## TypeScript
- Use strict mode
- Prefer interfaces over types for object shapes
- Use named exports, not default exports

## React
- Functional components only
- Use hooks for state management
- Colocate styles with components

## Testing
- Write tests for all new functions
- Use describe/it blocks
- Mock external dependencies
```

**`.claude/skills/architecture.md`**
```markdown
# Architecture

## Directory Structure
- `/src/components` - React components
- `/src/hooks` - Custom hooks
- `/src/services` - API and business logic
- `/src/types` - TypeScript types

## Patterns
- Use repository pattern for data access
- Use React Query for server state
- Use Zustand for client state
```

### Skill Loading Order

1. Command starts (e.g., `implement-task`)
2. AI reads `.kanban/config.yaml`
3. AI loads all skills listed for that command
4. AI follows skill instructions as mandatory guidance
5. AI proceeds with the command's normal steps

---

## Product Discovery

Before creating tasks, you may want to document your product. Two commands help:

### For Existing Codebases

```bash
/kanban:map-product
```

The AI will:
1. Analyze your codebase (features, architecture, integrations)
2. Present findings and ask clarifying questions one at a time
3. Write product docs incrementally to `.kanban/product/`
4. Commit all docs when done

Use this when you have working code but no product documentation.

### For New Projects

```bash
/kanban:define-product
```

The AI will:
1. Ask "What problem are you trying to solve?"
2. Explore users, features, constraints through dialogue
3. Write product docs incrementally as you discuss
4. Commit all docs when done

Use this when starting fresh and want to document vision before coding.

Both commands write to `.kanban/product/` and create docs that help the AI understand context during future task work.

---

## Git History

The commit format makes your git history searchable:

```bash
# All commits for task 001
git log --grep="(001)"

# All feature commits
git log --grep="^feat"

# All verification failures
git log --grep="verify-fail"

# All commits in the define phase
git log --grep="define -"
```

Complete task lifecycle in git:
```
docs(001): define - Add user authentication     # on main
docs(001): refine - Add user authentication     # on main
docs(001): scope - Add user authentication      # creates task/001 branch
docs(001): plan - Add user authentication       # on task/001
wip(001): completed auth routes                 # optional, on task/001
docs(001): verify-fail - Add user authentication  # optional, on task/001
feat(001): Add user authentication              # when review passes, on task/001
docs(001): product - add authentication guide   # on task/001, creates PR
# PR merged to main
docs(001): done - Add user authentication       # on main, task complete
```

---

## File Formats

### Task Files

Location: `.kanban/tasks/{id}-{slug}.md`

```markdown
---
id: "001"
title: "Add user authentication"
status: backlog
priority: high
labels: [feature]
created: 2026-02-13
updated: 2026-02-13
spec: "specs/001.spec.md"
plan: "plans/001.plan.md"
product-docs: [authentication]
---

# Add user authentication

## Description
Add user authentication with email/password login.

## What problem are you trying to solve?
Users cannot securely access their accounts.

## What value would it provide if solved?
Users can safely store and retrieve their data.

## Acceptance Criteria

Given a user is on the login page
And they have entered valid credentials
When they click the login button
Then they are redirected to the dashboard
And their session is established

## Notes
Use JWT for session tokens. Follow existing auth patterns.
```

### Functional Specifications

Location: `.kanban/specs/{id}.spec.md`

Created during `scope-task`. Contains:
- Context and scope boundaries
- Functional requirements (FR1, FR2, etc.)
- Affected files
- Existing patterns found in codebase
- Technical constraints
- Risks and mitigations

### Implementation Plans

Location: `.kanban/plans/{id}.plan.md`

Created during `plan-task`. Contains:
- Implementation steps as checkboxes
- References to functional requirements
- Iteration history (failures and fixes)
- WIP notes for resuming work

### Product Documentation

Location: `.kanban/product/{feature}.md`

Describes features for humans and AI context:
- Overview and how it works
- Key concepts
- Configuration options
- Limitations

---

## Labels and Commit Types

Labels on tasks determine commit type when review passes:

| Label | Commit Type |
|-------|-------------|
| `feature` | `feat(id): title` |
| `bug` | `fix(id): title` |
| `refactor` | `refactor(id): title` |
| `docs` | `docs(id): title` |

---

## Board Configuration

Your project's `.kanban/config.yaml`:

```yaml
name: My Project

commands:
  "kanban:init":
    skills: []
  "kanban:status":
    skills: []
  "kanban:define-task":
    skills: []
  "kanban:backlog-refine-task":
    skills: []
  "kanban:refined-scope-task":
    skills: []
  "kanban:scoped-plan-task":
    skills: []
  "kanban:planned-implement-task":
    skills: []
  "kanban:in-progress-wip-commit":
    skills: []
  "kanban:in-progress-verify-task":
    skills: []
  "kanban:verify-pass-task":
    skills: []
  "kanban:verify-fail-task":
    skills: []
  "kanban:review-pass-task":
    skills: []
  "kanban:review-fail-task":
    skills: []
  "kanban:update-docs-complete-task":
    skills: []
  "kanban:awaiting-merge-merge-task":
    skills: []
  "kanban:awaiting-merge-fail-task":
    skills: []
  "kanban:map-product":
    skills: []
  "kanban:define-product":
    skills: []

settings:
  version: "2.0"
  idPrefix: ""
  idPadding: 3
  archiveOnComplete: false
```

---

## Project Structure

```
your-project/
├── .kanban/                        # Your board data
│   ├── config.yaml                 # Board configuration
│   ├── tasks/
│   │   ├── 001-add-feature.md
│   │   └── 002-fix-bug.md
│   ├── specs/
│   │   └── 001.spec.md
│   ├── plans/
│   │   └── 001.plan.md
│   ├── product/
│   │   └── authentication.md
│   └── skills/                     # Your verification checks
│       ├── check-typescript.md
│       ├── check-tests.md
│       └── check-lint.md
│
├── .claudeban/                     # System files (don't edit)
│   ├── kanban-workflow.yaml        # Workflow schema
│   ├── kanban-templates/           # Document templates
│   ├── commands/kanban/            # Command definitions
│   └── skills/kanban-*/            # Built-in skills
│
└── ... your code ...
```

---

## Philosophy

- **Branch isolation.** Task work happens on `task/{id}` branches, keeping main clean.
- **PR-based review.** Code merges via pull request for proper code review.
- **Commit at each phase.** Git history tells your task's story.
- **Each command is a stopping point.** Review, then continue.
- **Skills are mandatory guidance.** The AI must follow them.
- **Data lives with code.** Tasks are markdown in your repo.
- **Human in the loop.** You decide when to proceed.
- **Transparency over magic.** All state is in plain text files.
- **No auto-push.** You push when ready.
