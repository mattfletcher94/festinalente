---
id: skills/create
title: "Create Task"
type: feature
tldr: "Create and refine tasks through conversational Q&A with automatic doc linking"
summary: "The /festina-create skill captures problem, value, and acceptance criteria through iterative dialogue, then saves a new task to Backlog with automatic product/engineering doc linking. Git operations are handled by the git.xml directive if mapped."
keywords: [create, task, qa, backlog, acceptance-criteria, gherkin]
aliases: [festina-create, new-task, add-task]
boundary: "Does not scope or plan tasks - only captures requirements and creates task.xml"
references: [skills/scope, skills/plan, docs/product, docs/engineering]
uses: [systems/cli, systems/data-model]
updated: 2026-03-01
---

# Create Task

> **TL;DR:** Create and refine tasks through conversational Q&A with automatic doc linking

## Overview

The `/festina-create` skill is the entry point for all new work in Festina Lente. It guides users through a structured conversation to capture the problem being solved, the value it provides, and clear acceptance criteria in Gherkin format.

**Why it exists:** To ensure every task has well-defined requirements before any implementation begins.

**Summary:** Create validates that tasks are properly understood before adding them to the backlog.

## How It Works

```mermaid
sequenceDiagram
    User->>+Create: /festina-create "title"
    Create->>Create: Generate next task ID
    Create->>Create: Search product/engineering docs
    Create-->>User: Propose understanding
    User-->>Create: Validate/correct
    Create->>Create: Write task.xml
    Create->>Directives: Run directive rules
    Create-->>-User: Next: /festina-scope
```

### Key Workflow

1. **Title capture** - From argument or Q&A
2. **Doc search** - Find related product/engineering docs
3. **Priority/label** - Auto-detect from keywords, user confirms
4. **Q&A dialogue** - Propose understanding, user validates
5. **Task creation** - Write task.xml with Gherkin acceptance criteria
6. **Directive rules** - Git commit, issue sync, etc. (directive-driven)

**Summary:** Create follows a propose-then-validate pattern to minimize user effort.

### Acceptance Criteria Format

```gherkin
Given {precondition}
And {additional precondition if needed}
When {action}
Then {expected outcome}
And {additional outcome if needed}
```

## Examples

### Creating a Bug Fix

```
/festina-create Fix login redirect bug

Creating task...
Auto-detected label: bug
Related product docs: auth/login (score: 0.72)

I understand the problem as: After login, users go to /home
instead of their original destination. Is this accurate?
> Yes

Task 002 created in Backlog
Next: /festina-scope 002
```

### Creating a New Feature

```
/festina-create Add dark mode toggle

No matching product docs found (new feature detected).
What domain should it belong to?
> gui

Created stub doc: .festinalente/product/gui/dark-mode.md

Task 003 created in Backlog
- Affects: gui/dark-mode (stub created)
```

**Summary:** Create handles both existing features and new feature stubs automatically.

## Boundaries

What this skill does NOT do:

- **Does NOT:** Research the codebase for technical approach → See [scope](./scope.md)
- **Does NOT:** Create implementation plans → See [plan](./plan.md)
- **Does NOT:** Ask about technical implementation details

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Labels | Available task labels | bug, feature, docs, refactor |
| Priorities | Available priorities | high, medium, low |

## Interactions

- **Product Docs**: Searches for related docs, creates stubs if new feature
- **Engineering Docs**: Searches for related patterns, creates stubs if needed
- **Directives**: Applies any `phase="create"` directive rules

## Limitations

- Requires `.festinalente/` to be initialized
- Branch requirements (e.g., must be on main/master) are enforced by the `git.xml` directive, not the skill
