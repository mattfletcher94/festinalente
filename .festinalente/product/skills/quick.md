---
id: skills/quick
title: "Quick Implementation"
type: feature
tldr: "Fast path for simple fixes with minimal Q&A and single commit"
summary: "The /festina-quick skill handles simple tasks like typo fixes and config changes with just two questions (problem, done), optional research, and a single commit workflow."
keywords: [quick, fast, simple, single-commit, minimal]
aliases: [festina-quick, fast, simple-fix]
boundary: "Does not handle complex multi-file changes - use full workflow for those"
references: [docs/product]
uses: [systems/cli, systems/data-model]
updated: 2026-03-01
---

# Quick Implementation

> **TL;DR:** Fast path for simple fixes with minimal Q&A and single commit

## Overview

The `/festina-quick` skill is designed for simple tasks that don't need the full create→scope→plan→implement workflow. It asks just two questions, does the work, and commits - all in one session.

**Why it exists:** Not every change needs a formal spec and plan.

**Summary:** Quick is the escape hatch for tasks too simple for the full workflow.

## How It Works

```mermaid
flowchart LR
    Start[/festina-quick] --> QA[2 Questions]
    QA --> Research{Research?}
    Research -->|No| Impl[Implement]
    Research -->|Yes| Explore[Explore Codebase]
    Explore --> Impl
    Impl --> Review{Review?}
    Review -->|Yes| Wait[User Reviews]
    Review -->|No| Commit[Single Commit]
    Wait --> Commit
    Commit --> Merge{Merge?}
    Merge -->|Yes| Done[Merged]
    Merge -->|No| Branch[Stay on Branch]
```

### Minimal Q&A

Only two questions:

1. **Problem**: What problem are you solving?
2. **Done**: What does done look like?

No value proposition, no acceptance criteria, no priority - just the essentials.

### Optional Research

```
Want me to research the codebase first?
[No (Recommended)] Jump straight to implementation
[Yes] Explore the codebase to find affected files
```

If yes, quick will glob/grep to find affected files and store findings in quick.xml.

### Quick Task Storage

Quick tasks are stored separately from full tasks:

```
.festinalente/quick/
├── 000/
│   └── quick.xml
├── 001/
│   └── quick.xml
```

**Summary:** Quick tasks have their own ID space and simpler XML structure.

## Examples

### Simple Fix Without Research

```
/festina-quick Fix typo in login button

What problem are you solving?
> The button says "Sing In" instead of "Sign In"

What does done look like?
> Button text spelled correctly

Want me to research the codebase first?
> No

Created branch quick/000
Fixing typo in src/components/LoginButton.tsx...

Ready to commit? > Yes, commit

Committed: quick(000): Fix typo in login button

Merge to main? > Yes
Merged quick/000 into main.

Quick task 000 complete!
```

### With Research

```
/festina-quick Add loading spinner to API calls

What problem are you solving?
> Users don't know when API calls are in progress

What does done look like?
> A spinner shows during API requests

Want me to research the codebase first?
> Yes

Found 3 potentially affected files:
- src/api/client.ts: Main API client
- src/components/Spinner.tsx: Existing spinner
- src/hooks/useApi.ts: API hook

Implementing with existing Spinner component...
```

**Summary:** Research helps locate affected files quickly.

## Boundaries

What this skill does NOT do:

- **Does NOT:** Create spec.xml or plan.xml
- **Does NOT:** Handle complex multi-file changes
- **Does NOT:** Spawn subagents for implementation

When to use full workflow instead:
- Multiple files need coordinated changes
- You need to document the approach
- Others need to review before merge

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Branch prefix | Quick task branch prefix | quick/ |

## Interactions

- **Directives**: Applies `phase="quick"` rules if defined
- **Product Docs**: Optional doc updates after commit

## Limitations

- Must be on main/master branch to start
- Best for changes touching 1-3 files
- No parallel execution (single-threaded)
