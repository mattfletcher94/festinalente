---
id: "tasks/quick"
title: "Quick Implementation"
type: feature
tldr: "Fast implementation for simple fixes with minimal Q&A and single commit"
summary: "Combines task creation, scoping, planning, and implementation into one streamlined skill for small fixes, config changes, and simple features."
keywords: [quick, fast, simple, fix, minimal, single-commit]
aliases: [kanban-quick, fast-implement, quick-fix]
boundary: "Does NOT handle complex multi-file changes or create full task.xml/spec.xml/plan.xml; use full workflow instead"
related: [tasks/implement, tasks/workflow, tasks/create]
updated: 2026-02-25
verified: 2026-02-25
code_refs:
  - .claude/skills/kanban-quick/SKILL.md
  - .kanban/templates/quick.xml
  - .kanban/scripts/next-quick-id.cjs
  - .kanban/scripts/find-quick.cjs
---

# Quick Implementation

> **TL;DR:** Fast implementation for simple fixes with minimal Q&A and single commit

## Overview

Quick Implementation provides a streamlined path for small fixes, config changes, and simple features. It combines task creation, scoping, planning, and implementation into a single skill with minimal Q&A, reducing the ceremony of the full workflow while preserving git hygiene (branching, atomic commits) and traceability via `quick.xml`.

**Summary:** One-step implementation for straightforward tasks that don't need the full kanban workflow.

## How It Works

```mermaid
flowchart TD
    A["/kanban-quick {title}"] --> B[Ask: Problem?]
    B --> C[Ask: Done?]
    C --> D{Research?}

    D -->|No| E[Create Branch quick/{id}]
    D -->|Yes| F[Search Codebase]
    F --> G[Store Findings]
    G --> E

    E --> H[Create quick.xml]
    H --> I[Determine Approach]
    I --> J[Implement Changes]
    J --> K{Ready to Commit?}

    K -->|Wait| L[Save Progress]
    K -->|Yes| M[Commit Changes]
    M --> N{Update Docs?}

    N -->|No| O[Complete]
    N -->|Yes| P[Update Docs]
    P --> Q[Amend Commit]
    Q --> O
```

1. User runs `/kanban-quick {title}` on main branch
2. Claude asks two questions: "What problem?" and "What does done look like?"
3. Optionally, Claude researches the codebase to find affected files
4. Creates branch `quick/{id}` and `quick.xml` artifact
5. Determines approach, constraints, and verification steps
6. Implements the changes
7. Offers review pause before committing
8. Commits with `quick({id}): {title}` message
9. Optionally updates product/engineering docs

### Key Workflows

**Minimal Q&A flow:**
- Only asks "problem" and "done" (no "value" question)
- Optional research step (skipped by default)
- Optional docs step (skipped by default)

**Resumable implementation:**
- Progress saved in `quick.xml` with `status="in-progress"`
- If user selects "Wait" at commit prompt, can resume later
- `quick.xml` contains context, approach, and findings for LLM resume

**Summary:** Two questions, optional research, implement, commit.

## Examples

### Typical Usage

```
/kanban-quick Fix typo in login button

Starting quick implementation...

Title: Fix typo in login button

What problem are you solving?
> The login button says "Sing In" instead of "Sign In"

What does done look like?
> The button text is spelled correctly

Want me to research the codebase first?
> No (Recommended)

Created branch quick/000
Created quick task: .kanban/quick/000/quick.xml

**Approach:** Find the LoginButton component and fix the text string
**Constraints:** Only change the string, no refactoring
**Verification:** Button displays "Sign In" correctly

Fixing the typo in src/components/LoginButton.tsx...

**Implementation complete.**

Ready to commit? [Yes, commit]

Committed: quick(000): Fix typo in login button

**Quick task 000 complete!**

- Branch: quick/000
- Commit: a1b2c3d
- Files: src/components/LoginButton.tsx

To merge to main:
git checkout main
git merge quick/000
```

### Edge Case: With Research

```
/kanban-quick Add loading spinner to API calls

...

Want me to research the codebase first?
> Yes

Found 3 potentially affected files:
- src/api/client.ts: Main API client
- src/components/Spinner.tsx: Existing spinner component
- src/hooks/useApi.ts: API hook used throughout the app

Created branch quick/001
(context section in quick.xml populated from research findings)

**Approach:** Add loading state to useApi hook, show Spinner component
**Constraints:** Use existing Spinner component, don't modify API client
**Verification:** API calls show spinner while pending

...
```

**Summary:** Simple fixes complete in under a minute; optional research for unfamiliar code.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Create task.xml/spec.xml/plan.xml → Uses quick.xml only
- **Does NOT:** Handle complex multi-file changes → Use [tasks/implement](./implement.md) instead
- **Does NOT:** Go through check phase or QA → Single commit to quick branch
- **Does NOT:** Ask about "value" → Keeps Q&A minimal

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Branch naming | quick/{id} branches for quick tasks | quick/{id} |
| ID format | 3-digit zero-padded ID | 000-999 |

## Interactions

- **tasks/implement**: Use for complex tasks; quick is for simple ones
- **tasks/workflow**: Quick bypasses the full workflow columns
- **docs/_index**: Optional doc updates via `ask_docs` step

## Limitations

- Must be on main/master branch to start
- Single-commit workflow (no incremental commits)
- No spec or plan phases (combined into approach)
- Limited to straightforward changes
