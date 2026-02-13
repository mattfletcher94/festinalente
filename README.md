# Claude Kanban

A file-based kanban board for AI-assisted development. Task and planning data lives with your code - transparent, versionable, and accessible to both humans and AI.

## The Workflow

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                           │
│   define-task          refine-task          plan-task           implement-task            │
│   + commit             + commit             + commit            (no commit)               │
│       │                    │                    │                     │                   │
│       ▼                    ▼                    ▼                     ▼                   │
│   ┌────────┐          ┌────────┐          ┌─────────┐          ┌───────────┐              │
│   │Backlog │─────────▶│Backlog │─────────▶│ Planned │─────────▶│In Progress│───────┐      │
│   │        │          │(refined)│         │         │          │           │       │      │
│   └────────┘          └────────┘          └─────────┘          └───────────┘       │      │
│                                                                  ▲    │            │      │
│                                                                  │    │ wip-commit │      │
│                                                                  │    │ + commit   │      │
│                                                                  │    ▼            │      │
│                                                                  └────┘            │      │
│                                                                                    ▼      │
│                                                                              ┌─────────┐  │
│                                                                              │ Review  │  │
│                                                                              │         │  │
│                                                                              └────┬────┘  │
│                                                                                   │       │
│                                                              ┌────────────────────┴────┐  │
│                                                              │                         │  │
│   ┌──────┐          ┌────────────┐          ┌────────────────┴───┐     ┌───────────────┴┐ │
│   │ Done │◀─────────│Update Docs │◀─────────│   review-pass      │     │  review-fail   │ │
│   │      │          │            │          │   + commit code    │     │  + commit docs │ │
│   └──────┘          └────────────┘          └────────────────────┘     └───────┬────────┘ │
│       ▲                   ▲                                                    │          │
│       │                   │                                                    │          │
│   (auto)             update-docs                                               │          │
│                      + commit                              ┌───────────────────┘          │
│                                                            │                              │
│                                                            └──────────▶ In Progress       │
│                                                                                           │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

Each command is a stopping point. Run a command, review the result, then run the next command. **Commits happen at each phase** - your git history tells the story of your task lifecycle.

## Columns

| Column | Purpose |
|--------|---------|
| **Backlog** | New tasks awaiting refinement or planning |
| **Planned** | Tasks with a PLAN.md ready for implementation |
| **In Progress** | Tasks currently being implemented (code uncommitted) |
| **Review** | Implementation complete, awaiting code review |
| **Update Docs** | Review passed, code committed, documentation needs updating |
| **Done** | Docs committed, task complete |

## Commands

Commands are named with their **source column prefix** so you always know where the task must be to use the command.

| Command | Source | Destination | Commit |
|---------|--------|-------------|--------|
| `kanban:define-task "title"` | (new) | Backlog | `docs(add-task): <id> <title>` |
| `kanban:backlog-refine-task [id]` | Backlog | Backlog | `docs(refine-task): <id> <title>` |
| `kanban:backlog-plan-task [id]` | Backlog | Planned | `docs(plan-task): <id> <title>` |
| `kanban:planned-implement-task [id]` | Planned | Review | None (code uncommitted) |
| `kanban:in-progress-wip-commit [id]` | In Progress | In Progress | `wip(<id>): <progress summary>` |
| `kanban:review-pass-task [id]` | Review | Update Docs | `feat/fix(<id>): <title>` |
| `kanban:review-fail-task [id]` | Review | In Progress | `docs(review-fail): <id> <title>` |
| `kanban:update-docs-complete-task [id]` | Update Docs | Done | `docs(product-docs): <message>` |

### Command Naming Convention

The prefix tells you which column the task must be in:
- `backlog-*` commands require task in Backlog
- `planned-*` commands require task in Planned
- `in-progress-*` commands require task in In Progress
- `review-*` commands require task in Review
- `update-docs-*` commands require task in Update Docs

This prevents running the wrong command on a task.

## Git History

A complete task lifecycle creates this commit history:

```
docs(add-task): 001 Add user authentication
docs(refine-task): 001 Add user authentication      # optional
docs(plan-task): 001 Add user authentication
wip(001): completed auth routes and middleware      # optional, if interrupted
docs(review-fail): 001 Add user authentication      # optional, if review fails
feat(001): Add user authentication                  # when review passes
docs(product-docs): add authentication guide        # final step
```

## Labels

| Label | Purpose | Color | Commit Type |
|-------|---------|-------|-------------|
| **Bug** | Bug fixes | Red | `fix` |
| **Feature** | New functionality | Blue | `feat` |
| **Docs** | Documentation only | Purple | `docs` |
| **Refactor** | Code restructuring | Gray | `refactor` |
| **Needs Refinement** | Task is vague, needs `/backlog-refine-task` | Orange | — |
| **Refined** | Task has been refined and is ready for planning | Cyan | — |

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

  "kanban:backlog-plan-task":
    skills:
      - .claude/skills/coding-standards.md
      - .claude/skills/architecture.md

  "kanban:planned-implement-task":
    skills:
      - .claude/skills/coding-standards.md

  "kanban:review-pass-task":
    skills:
      - .claude/skills/code-review-checklist.md

  "kanban:update-docs-complete-task":
    skills:
      - .claude/skills/documentation-standards.md
```

When a command runs, it loads and follows all configured skills as mandatory guidance.

### Example: Coding Standards Skill

Create `.claude/skills/coding-standards.md`:

```markdown
# Coding Standards

When writing or reviewing code:

- Use TypeScript strict mode
- No `any` types - use proper typing
- Functions must have JSDoc comments
- Max function length: 50 lines
- Use early returns to reduce nesting
- Prefer composition over inheritance
```

### Example: Code Review Checklist Skill

Create `.claude/skills/code-review-checklist.md`:

```markdown
# Code Review Checklist

Evaluate the implementation against each item:

- [ ] Follows coding standards
- [ ] No obvious bugs or edge cases missed
- [ ] Error handling is appropriate
- [ ] Code is readable and maintainable
- [ ] No security vulnerabilities
- [ ] Performance is acceptable

Report pass/fail with specific findings.
```

## Task File Format

Tasks are stored as markdown files in `.kanban/tasks/`:

```markdown
---
id: "001"
title: Add user authentication
column: backlog
labels: [feature]
priority: high
created: 2026-02-13
---

## Description

Add user authentication with email/password login.

## Acceptance Criteria

- [ ] Users can register with email/password
- [ ] Users can log in
- [ ] Users can log out
- [ ] Sessions persist across browser refreshes
```

### Task Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier (e.g., "001") |
| `title` | Yes | Short task title |
| `column` | Yes | Current column ID |
| `labels` | No | Array of label IDs |
| `priority` | No | Priority ID (high/medium/low) |
| `created` | Yes | Creation date (YYYY-MM-DD) |
| `updated` | No | Last update date |
| `completed` | No | Completion date |

## Board Configuration

The `.kanban/board.yaml` file defines your board:

```yaml
name: My Project

columns:
  - id: backlog
    name: Backlog
  - id: planned
    name: Planned
  - id: in-progress
    name: In Progress
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
  - id: needs-refinement
    name: Needs Refinement
    color: "#f97316"
  - id: refined
    name: Refined
    color: "#06b6d4"

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
  "kanban:backlog-plan-task":
    skills: []
  "kanban:planned-implement-task":
    skills: []
  "kanban:in-progress-wip-commit":
    skills: []
  "kanban:review-pass-task":
    skills: []
  "kanban:review-fail-task":
    skills: []
  "kanban:update-docs-complete-task":
    skills: []

settings:
  version: "1.0"
  idPrefix: ""
  idPadding: 3
  archiveOnComplete: false
```

## Typical Workflow Example

```bash
# 1. Create a new task
/kanban:define-task "Add dark mode support"
# → Creates task 001 in Backlog
# → Commits: docs(add-task): 001 Add dark mode support

# 2. (Optional) Refine if requirements are unclear
/kanban:backlog-refine-task 001
# → AI asks clarifying questions, updates task description
# → Commits: docs(refine-task): 001 Add dark mode support

# 3. Create implementation plan
/kanban:backlog-plan-task 001
# → Creates .kanban/plans/001.plan.md
# → Moves task to Planned
# → Commits: docs(plan-task): 001 Add dark mode support

# 4. Implement the plan
/kanban:planned-implement-task 001
# → AI writes code following the plan
# → Moves task to Review
# → NO COMMIT - code stays uncommitted

# 4b. (Optional) Save partial progress if interrupted
/kanban:in-progress-wip-commit 001
# → Commits: wip(001): completed theme context and toggle

# 5a. If review passes
/kanban:review-pass-task 001
# → Commits code: feat(001): Add dark mode support
# → Moves task to Update Docs

# 5b. If review fails
/kanban:review-fail-task 001
# → Commits notes: docs(review-fail): 001 Add dark mode support
# → Moves task back to In Progress for fixes

# 6. Update documentation
/kanban:update-docs-complete-task 001
# → Updates relevant docs (README, etc.)
# → Commits: docs(product-docs): add dark mode documentation
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

## Project Structure

```
example-project/
├── .kanban/
│   ├── board.yaml              # Board configuration
│   ├── tasks/
│   │   ├── 001-add-feature/
│   │   │   └── 001-add-feature.md   # Task file
│   │   └── 002-fix-bug.md           # Simple task (no plan yet)
│   └── plans/
│       └── 001.plan.md              # Implementation plan
├── .claude/
│   ├── commands/
│   │   └── kanban/             # Kanban commands
│   └── skills/
│       ├── kanban-*/           # Built-in kanban skills
│       └── your-custom-skill.md    # Your custom skills
└── ... your code ...
```

Note: In this working directory, we are using .claudeban instead of .claude. But this is okay.
