---
id: skills/quick
title: "Quick Implementation"
type: feature
tldr: "Fast path for simple fixes with minimal Q&A"
summary: "The /festina-quick skill handles simple tasks like typo fixes and config changes with just two questions (problem, done), optional research, and a streamlined workflow. Git operations are handled by the git.xml directive if mapped."
keywords: [quick, fast, simple, minimal]
aliases: [festina-quick, fast, simple-fix]
boundary: "Does not handle complex multi-file changes - use full workflow for those"
references: [docs/product]
uses: [systems/cli, systems/data-model]
updated: 2026-03-23
---

# Quick Implementation

> **TL;DR:** Fast path for simple fixes with minimal Q&A

## Overview

The `/festina-quick` skill is designed for simple tasks that don't need the full create→scope→plan→implement workflow. It asks just two questions, does the work, and completes - all in one session. Git operations (branching, committing, merging) are handled by the `git.xml` directive if mapped.

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
    Review -->|No| Complete[Complete]
    Wait --> Complete
    Complete --> Directives[Run Directive Rules]
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

If yes, quick will glob/grep to find affected files and store findings in quick.xml. When new features are detected with no matching doc (relevance score < 0.3), the skill creates a stub doc (`stub: true`) and adds it to quick.xml `affects`.

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

Fixing typo in src/components/LoginButton.tsx...

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

## Interactions

- **Directives**: Applies `phase="quick"` rules if defined (including git operations from `git.xml`)
- **Product Docs**: Optional doc updates. During `detect_docs`, creates stub docs for new features with no matching documentation and adds them to quick.xml `affects`

## Limitations

- Best for changes touching 1-3 files
- No parallel execution (single-threaded)
- Branch requirements (e.g., must be on main/master) are enforced by the `git.xml` directive, not the skill
