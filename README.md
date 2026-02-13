# Claude Kanban

A file-based kanban board for AI-assisted development. Task and planning data lives with your code - transparent, versionable, and accessible to both humans and AI.

## The Workflow

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                           │
│   define-task         refine-task         scope-task          plan-task                   │
│   + commit            + commit            + commit            + commit                    │
│       │                   │                   │                   │                       │
│       ▼                   ▼                   ▼                   ▼                       │
│   ┌────────┐         ┌─────────┐         ┌────────┐         ┌─────────┐                   │
│   │Backlog │────────▶│ Refined │────────▶│ Scoped │────────▶│ Planned │──────────┐       │
│   │        │         │         │         │        │         │         │          │       │
│   └────────┘         └─────────┘         └────────┘         └─────────┘          │       │
│                                                                                   │       │
│                                                                  implement-task   │       │
│                                                                  (no commit)      │       │
│                                                                                   ▼       │
│                                                                            ┌───────────┐  │
│                                                                            │In Progress│  │
│                                                                            │           │  │
│                                                                            └─────┬─────┘  │
│                                                                                  │        │
│                                                         ┌────────────────────────┤        │
│                                                         │ wip-commit             │        │
│                                                         │ + commit               │        │
│                                                         ▼                        │        │
│                                                         └────────────────────────┘        │
│                                                                                   │       │
│                                                                      verify-task  │       │
│                                                                      (no commit)  ▼       │
│                                                                            ┌─────────┐    │
│                                                                            │ Verify  │    │
│                                                                            │         │    │
│                                                                            └────┬────┘    │
│                                                                   ┌─────────────┴─────┐   │
│                                                                   │                   │   │
│                                                           verify-pass          verify-fail│
│                                                           (no commit)          + commit   │
│                                                                   │                   │   │
│                                                                   ▼                   │   │
│                                                              ┌─────────┐              │   │
│                                                              │ Review  │              │   │
│                                                              │         │              │   │
│                                                              └────┬────┘              │   │
│                                                                   │                   │   │
│                                                     ┌─────────────┴─────┐             │   │
│                                                     │                   │             │   │
│   ┌──────┐         ┌────────────┐         review-pass          review-fail            │   │
│   │ Done │◀────────│Update Docs │◀────────+ commit code        + commit docs          │   │
│   │      │         │            │                               │                     │   │
│   └──────┘         └────────────┘                               └──────▶ In Progress ◀┘   │
│       ▲                   ▲                                                               │
│       │                   │                                                               │
│   (auto)              update-docs                                                         │
│                       + commit                                                            │
│                                                                                           │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

Each command is a stopping point. Run a command, review the result, then run the next command. **Commits happen at each phase** - your git history tells the story of your task lifecycle.

## Columns

| Column | Purpose |
|--------|---------|
| **Backlog** | New tasks awaiting refinement |
| **Refined** | Tasks refined with problem, value, and acceptance criteria |
| **Scoped** | Tasks with functional specification ready for planning |
| **Planned** | Tasks with a plan ready for implementation |
| **In Progress** | Tasks currently being implemented (code uncommitted) |
| **Verify** | Implementation complete, running automated checks |
| **Review** | Checks passed, awaiting human code review |
| **Update Docs** | Review passed, code committed, documentation needs updating |
| **Done** | Docs committed, task complete |

## Commands

Commands are named with their **source column prefix** so you always know where the task must be to use the command.

| Command | Source | Destination | Commit |
|---------|--------|-------------|--------|
| `kanban:define-task "title"` | (new) | Backlog | `docs({id}): define - {title}` |
| `kanban:backlog-refine-task [id]` | Backlog | Refined | `docs({id}): refine - {title}` |
| `kanban:refined-scope-task [id]` | Refined | Scoped | `docs({id}): scope - {title}` |
| `kanban:scoped-plan-task [id]` | Scoped | Planned | `docs({id}): plan - {title}` |
| `kanban:planned-implement-task [id]` | Planned | In Progress | None (code uncommitted) |
| `kanban:in-progress-wip-commit [id]` | In Progress | In Progress | `wip({id}): {progress summary}` |
| `kanban:in-progress-verify-task [id]` | In Progress | Verify | None (on failure: `docs({id}): verify-fail - {title}`) |
| `kanban:verify-pass-task [id]` | Verify | Review | None |
| `kanban:verify-fail-task [id]` | Verify | In Progress | `docs({id}): verify-fail - {title}` |
| `kanban:review-pass-task [id]` | Review | Update Docs | `feat/fix({id}): {title}` |
| `kanban:review-fail-task [id]` | Review | In Progress | `docs({id}): review-fail - {title}` |
| `kanban:update-docs-complete-task [id]` | Update Docs | Done | `docs({id}): product - {message}` |

### Command Naming Convention

The prefix tells you which column the task must be in:
- `backlog-*` commands require task in Backlog
- `refined-*` commands require task in Refined
- `scoped-*` commands require task in Scoped
- `planned-*` commands require task in Planned
- `in-progress-*` commands require task in In Progress
- `verify-*` commands require task in Verify
- `review-*` commands require task in Review
- `update-docs-*` commands require task in Update Docs

This prevents running the wrong command on a task.

## Git History

A complete task lifecycle creates this commit history:

```
docs(001): define - Add user authentication
docs(001): refine - Add user authentication
docs(001): scope - Add user authentication
docs(001): plan - Add user authentication
wip(001): completed auth routes and middleware      # optional, if interrupted
docs(001): verify-fail - Add user authentication    # optional, if verify fails
docs(001): review-fail - Add user authentication    # optional, if review fails
feat(001): Add user authentication                  # when review passes
docs(001): product - add authentication guide       # final step
```

### Searching Git History

The commit format `{type}({id}): {action} - {description}` makes it easy to search:

```bash
# All commits for task 001
git log --grep="(001)"

# All define phase commits
git log --grep="define -"

# All scope phase commits
git log --grep="scope -"

# All feature commits
git log --grep="^feat"

# All verification failures
git log --grep="verify-fail"

# All review failures
git log --grep="review-fail"
```

## Templates

Templates are centralized markdown files that define the structure for tasks, specs, and plans. Skills reference these templates instead of embedding format inline.

**Location:** `.claudeban/templates/`

| Template | Purpose |
|----------|---------|
| `task.md` | Master template for kanban task files |
| `spec.md` | Functional specification template |
| `plan.md` | Implementation plan template |
| `product-doc.md` | Product documentation template |

### How Templates Work

Each skill references the appropriate template and specifies which sections to fill for that phase:

```markdown
Create task file at `.kanban/tasks/{id}-{slug}.md`:
- Follow template at `.claudeban/templates/task.md`
- Fill sections for this phase:
  - Frontmatter: `id`, `title`, `status`, `created`
  - Body: `## Description`
```

This ensures consistent structure across all documents while allowing skills to focus on workflow logic.

## Task File Format

Tasks are stored as markdown files in `.kanban/tasks/`:

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

### Task Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier (e.g., "001") |
| `title` | Yes | Short task title |
| `status` | Yes | Current column status |
| `priority` | No | Priority (high/medium/low) |
| `labels` | No | Array of label IDs |
| `created` | Yes | Creation date (YYYY-MM-DD) |
| `updated` | No | Last update date |
| `completed` | No | Completion date |
| `spec` | No | Path to functional specification |
| `plan` | No | Path to plan file |
| `product-docs` | No | IDs of related product documentation |

### Acceptance Criteria (Gherkin Format)

Acceptance criteria use the Given/When/Then format:

```gherkin
Given a user is logged in
And they are on the dashboard page
When they click the logout button
Then they are redirected to the login page
And their session is invalidated
And a success message is displayed
```

**Keywords:**
- `Given` - preconditions/context
- `When` - action/trigger
- `Then` - expected outcome
- `And` - additional conditions/outcomes
- `But` - negative conditions (optional)

## Functional Specification

Specs are created during the `scope-task` phase and stored in `.kanban/specs/`:

**Location:** `.kanban/specs/{id}.spec.md`

```markdown
---
task: "001"
created: 2026-02-13
updated: 2026-02-13
---

# Functional Specification: Add user authentication

## Context
Users need to securely log in to access their data.

## Scope
### In Scope
- Email/password authentication
- Session management

### Out of Scope
- OAuth providers
- Password reset (separate task)

## Functional Requirements
- FR1: The system shall validate email format
- FR2: The system shall hash passwords with bcrypt
- FR3: The system shall issue JWT tokens on login

## Affected Files
- `src/routes/auth.ts` (create) - Auth endpoints
- `src/middleware/jwt.ts` (create) - Token middleware

## Existing Patterns
- **Pattern:** Route handlers
  - Reference: `src/routes/users.ts:15`

## Technical Constraints
- Must use existing Express setup
- JWT tokens expire in 24 hours

## Dependencies
### External
- bcrypt, jsonwebtoken

### Internal
- User model must exist

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Token theft | high | Use httpOnly cookies |

## Open Questions
- [ ] Should we add rate limiting?
```

## Product Documentation

Product docs describe features for non-technical stakeholders (PMs, customer success) and provide context for the LLM during task work.

**Location:** `.kanban/product/`

### Product Doc Format

```markdown
---
id: authentication
title: User Authentication
summary: Email/password and OAuth login with JWT sessions
keywords: [auth, login, logout, oauth, jwt, session]
related: [user-management]
uses: []
extends: []
updated: 2026-02-13
---

# User Authentication

## Overview
Secure user authentication supporting email/password and OAuth providers.

## How It Works
Users can sign in via email/password or OAuth providers (Google, GitHub).

## Key Concepts
- **Session**: A JWT token stored in an httpOnly cookie
- **OAuth**: Third-party authentication delegation

## Configuration
OAuth providers configured in Settings > Integrations.

## Interactions
Works with [User Management](user-management.md) for account creation.

## Limitations
- Maximum 3 active sessions per user
```

### Product Doc Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier (matches filename) |
| `title` | Yes | Human-readable feature name |
| `summary` | Yes | One sentence description |
| `keywords` | Yes | Searchable terms for discovery |
| `related` | No | Related feature IDs ("see also") |
| `uses` | No | Features this depends on |
| `extends` | No | Features this builds upon |
| `updated` | Yes | Last update date |

### Task Linkage

Tasks reference product docs via the `product-docs` frontmatter field:

```yaml
---
id: "015"
title: "Add OAuth login"
product-docs: [authentication]
---
```

The LLM populates this field during define/refine phases when connections are apparent.

### When Product Docs Are Updated

During the `update-docs-complete-task` phase:
1. LLM identifies relevant product docs from task's `product-docs` field
2. Updates existing docs or creates new ones as needed
3. Docs reflect current state (no changelog - git history provides that)

## Labels

| Label | Purpose | Color | Commit Type |
|-------|---------|-------|-------------|
| **Bug** | Bug fixes | Red | `fix` |
| **Feature** | New functionality | Blue | `feat` |
| **Docs** | Documentation only | Purple | `docs` |
| **Refactor** | Code restructuring | Gray | `refactor` |

## Priorities

| Priority | Color |
|----------|-------|
| **High** | Red |
| **Medium** | Amber |
| **Low** | Green |

## Custom Skills

Skills are markdown files with instructions the AI follows. Configure them per-command in `board.yaml`:

```yaml
commands:
  "kanban:define-task":
    skills:
      - .claude/skills/task-template.md

  "kanban:scoped-plan-task":
    skills:
      - .claude/skills/coding-standards.md
      - .claude/skills/architecture.md

  "kanban:planned-implement-task":
    skills:
      - .claude/skills/coding-standards.md

  "kanban:in-progress-verify-task":
    skills:
      - .kanban/skills/check-typescript.md
      - .kanban/skills/check-tests.md
      - .kanban/skills/check-lint.md

  "kanban:review-pass-task":
    skills:
      - .claude/skills/code-review-checklist.md

  "kanban:update-docs-complete-task":
    skills:
      - .claude/skills/documentation-standards.md
```

When a command runs, it loads and follows all configured skills as mandatory guidance.

### Example: Verification Check Skill

Create `.kanban/skills/check-typescript.md`:

```markdown
# Check: TypeScript

Run `pnpm typecheck`

### Pass criteria
Exit code 0, no errors in output.

### Common failures
- "Cannot find module X" — missing dependency, run `pnpm install`
- "Type X is not assignable to Y" — type mismatch, fix the code
```

## Board Configuration

The `.kanban/board.yaml` file defines your board:

```yaml
name: My Project

columns:
  - id: backlog
    name: Backlog
  - id: refined
    name: Refined
  - id: scoped
    name: Scoped
  - id: planned
    name: Planned
  - id: in-progress
    name: In Progress
  - id: verify
    name: Verify
  - id: review
    name: Review
  - id: update-docs
    name: Update Docs
  - id: done
    name: Done

labels:
  - id: bug
    name: Bug
    color: "#ef4444"
  - id: feature
    name: Feature
    color: "#3b82f6"
  - id: docs
    name: Docs
    color: "#8b5cf6"
  - id: refactor
    name: Refactor
    color: "#6b7280"

priorities:
  - id: high
    name: High
    color: "#ef4444"
  - id: medium
    name: Medium
    color: "#f59e0b"
  - id: low
    name: Low
    color: "#22c55e"

commands:
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

settings:
  version: "2.0"
  idPrefix: ""
  idPadding: 3
  archiveOnComplete: false
```

## Typical Workflow Example

```bash
# 1. Create a new task
/kanban:define-task "Add dark mode support"
# → Creates task 001 in Backlog
# → Commits: docs(001): define - Add dark mode support

# 2. Refine the task (Q&A to clarify requirements)
/kanban:backlog-refine-task 001
# → AI asks clarifying questions
# → Fills problem, value, acceptance criteria (Gherkin)
# → Commits: docs(001): refine - Add dark mode support

# 3. Scope the task (research and create spec)
/kanban:refined-scope-task 001
# → AI searches codebase for patterns
# → Creates .kanban/specs/001.spec.md
# → Commits: docs(001): scope - Add dark mode support

# 4. Create implementation plan
/kanban:scoped-plan-task 001
# → Creates .kanban/plans/001.plan.md
# → Moves task to Planned
# → Commits: docs(001): plan - Add dark mode support

# 5. Implement the plan
/kanban:planned-implement-task 001
# → AI writes code following the plan
# → Moves task to In Progress
# → NO COMMIT - code stays uncommitted

# 5b. (Optional) Save partial progress if interrupted
/kanban:in-progress-wip-commit 001
# → Commits: wip(001): completed theme context and toggle

# 6. Run verification checks
/kanban:in-progress-verify-task 001
# → Runs configured check skills
# → If pass: moves to Verify
# → If fail: commits docs(001): verify-fail - ...

# 7. Move to review
/kanban:verify-pass-task 001
# → Moves task to Review

# 8a. If review passes
/kanban:review-pass-task 001
# → Commits code: feat(001): Add dark mode support
# → Moves task to Update Docs

# 8b. If review fails
/kanban:review-fail-task 001
# → Commits notes: docs(001): review-fail - Add dark mode support
# → Moves task back to In Progress for fixes

# 9. Update documentation
/kanban:update-docs-complete-task 001
# → Updates relevant docs (README, etc.)
# → Commits: docs(001): product - add dark mode documentation
# → Moves task to Done
```

## Philosophy

- **Commit at each phase.** Your git history tells the story of your task lifecycle.
- **Each command is a stopping point.** You review, then continue.
- **Skills are mandatory guidance.** When configured, the AI must follow them.
- **Data lives with code.** Tasks are markdown files in your repo.
- **Human in the loop.** You control when to proceed to each step.
- **Command names tell you where you are.** The source column prefix shows which column the task must be in.
- **Transparency over magic.** All task state is visible in plain text files.
- **No auto-push.** You push to remote when you're ready.
- **Templates ensure consistency.** All documents follow the same structure.

## Project Structure

```
project/
├── .kanban/
│   ├── board.yaml              # Board configuration
│   ├── config/
│   │   ├── schema.task.json    # Task frontmatter schema
│   │   └── schema.plan.json    # Plan frontmatter schema
│   ├── tasks/
│   │   ├── 001-add-feature.md  # Task file
│   │   └── 002-fix-bug.md      # Another task
│   ├── specs/
│   │   └── 001.spec.md         # Functional specification
│   ├── plans/
│   │   └── 001.plan.md         # Implementation plan
│   ├── product/                 # Product documentation
│   │   └── authentication.md   # Feature documentation
│   └── skills/
│       ├── check-typescript.md # Verification check
│       └── check-tests.md      # Another check
├── .claudeban/                  # (or .claude/)
│   ├── templates/
│   │   ├── board.yaml          # Board initialization template
│   │   ├── task.md             # Task file template
│   │   ├── spec.md             # Functional specification template
│   │   ├── plan.md             # Implementation plan template
│   │   └── product-doc.md      # Product documentation template
│   ├── commands/
│   │   └── kanban/             # Kanban commands
│   └── skills/
│       └── kanban-*/           # Built-in kanban skills
└── ... your code ...
```
