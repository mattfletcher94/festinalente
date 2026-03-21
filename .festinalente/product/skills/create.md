---
id: skills/create
title: "Create Task"
type: feature
tldr: "Create and refine tasks through conversational Q&A with automatic doc linking"
summary: "The /festina-create skill captures problem, value, and acceptance criteria through iterative dialogue with systematic category probing across 5 AC categories, then saves a new task to Backlog with automatic product/engineering doc linking and opportunistic notes population. Git operations are handled by the git.xml directive if mapped."
keywords: [create, task, qa, backlog, acceptance-criteria, gherkin, category-probing, notes, context]
aliases: [festina-create, new-task, add-task]
boundary: "Does not scope or plan tasks - only captures requirements and creates task.xml"
references: [skills/scope, skills/plan, docs/product, docs/engineering]
uses: [systems/cli, systems/data-model]
updated: 2026-03-08
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
    Create->>Create: Re-search docs using full context
    Create-->>User: Prompt if new high-scoring matches found
    Create->>Create: Write task.xml
    Create->>Directives: Run directive rules
    Create-->>-User: Next: /festina-scope
```

### Key Workflow

1. **Title capture** - From argument or Q&A
2. **Doc search** - Find related product/engineering docs
3. **Priority/label** - Auto-detect from keywords, user confirms
4. **Q&A dialogue** - Propose understanding, user validates
5. **Category probing** - Systematically probe acceptance criteria across 5 categories (happy path, errors, edges, backwards compat, integration)
6. **Doc link refinement** - Extracts 10-20 keywords (nouns, verbs, domain terms, technical terms, system names) from full task context, expands them via glossary synonyms (`expand-query`), then re-searches docs with the expanded set. Deduplicates against already-linked docs and prompts user only if new high-scoring matches (score >= 0.5) are found; silently skips otherwise
7. **Project attachment** (optional) - When open projects exist, offers to attach the task to a project. If attached, the user selects which project requirements the task addresses, and sibling context is included in the task description. Skipped entirely when no open projects exist (zero additional friction)
8. **Task creation** - Write task.xml with Gherkin acceptance criteria
9. **Directive rules** - Git commit, issue sync, etc. (directive-driven)

**Summary:** Create follows a propose-then-validate pattern with systematic category probing to minimize user effort while ensuring thorough acceptance criteria.

### Acceptance Criteria Format

```gherkin
Given {precondition}
And {additional precondition if needed}
When {action}
Then {expected outcome}
And {additional outcome if needed}
```

### Acceptance Criteria Categories

Criteria are probed across 5 categories for thorough coverage:
- **Happy path** — Core success scenarios
- **Error/failure states** — What happens when things go wrong
- **Edge cases** — Boundary conditions, limits, empty states
- **Backwards compatibility** — What must NOT change
- **Integration** — How this interacts with existing features

Users can skip any category or say "You decide" for LLM-generated comprehensive criteria.

### Notes Population

When conversation context is available (research, integration points, design principles),
Create populates the `<notes>` field with structured, source-attributed content.
When invoked directly with minimal input, notes remain empty. Population is opportunistic,
not mandatory.

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
- **Projects**: When open projects exist, offers optional attachment. Attached tasks get a `project-id` attribute and `project-requirements` mapping, and a task-ref is added to the project.xml
- **Directives**: Applies any `phase="create"` directive rules

## Limitations

- Requires `.festinalente/` to be initialized
- Branch requirements (e.g., must be on main/master) are enforced by the `git.xml` directive, not the skill
