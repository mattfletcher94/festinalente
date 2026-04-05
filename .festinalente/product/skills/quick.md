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
intent: procedural
prerequisites: []
---

# Quick Implementation

> **TL;DR:** Fast path for simple fixes with minimal Q&A

## Overview

The `/festina-quick` skill is designed for simple tasks that don't need the full create→scope→plan→implement workflow. It asks just two questions, does the work, and completes - all in one session. Git operations (branching, committing, merging) are handled by the `git.xml` directive if mapped.

**Why it exists:** Not every change needs a formal spec and plan.

**Summary:** Quick is the escape hatch for tasks too simple for the full workflow.

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

## How It Works

```mermaid
flowchart LR
    Start[/festina-quick] --> QA[2 Questions]
    QA --> Research{Research?}
    Research -->|Skip/Auto| Approach[Confirm Approach]
    Research -->|Yes| Explore[Explore Codebase]
    Explore --> Approach
    Approach -->|Proceed| Impl[Implement]
    Approach -->|Adjust| Approach
    Impl --> AntiPat[Anti-Pattern Scan]
    AntiPat --> Directives[Run Directive Rules]
    Directives --> Complete[Complete]
```

### Minimal Q&A

Only two questions:

1. **Problem**: What problem are you solving?
2. **Done**: What does done look like?

No value proposition, no acceptance criteria, no priority - just the essentials.

### Optional Research

The research step auto-assesses task complexity. For simple tasks (typo, config change, single-file edit), the user is offered an override choice rather than a simple Yes/No:

```
Simple task detected — skipping codebase research. Override?
[Skip research] Proceed without codebase research (recommended)
[Research anyway] Explore the codebase before implementing
```

For complex tasks (multi-file, unfamiliar area), research runs automatically without prompting.

If research runs, quick will glob/grep to find affected files and store findings in quick.xml. When new features are detected with no matching doc (relevance score < 0.3), the skill creates a stub doc (`stub: true`) and adds it to quick.xml `affects`.

### Approach Confirmation

After research (or skipping it), quick determines an implementation approach, constraints, and verification steps, then asks the user to confirm:

```
Approach: {brief description}
Constraints: {things to avoid or patterns to follow}
Verification: {how to confirm it works}

Proceed with this approach?
[Proceed] Start implementation
[Adjust] Change the approach
```

If the user selects Adjust, they can modify the approach before implementation begins.

### Anti-Pattern Scan

After implementation, quick scans modified files for incomplete work markers (TODO, FIXME, HACK, XXX). If markers are found, the user is prompted:

```
Found {n} incomplete markers in modified files.
[Fix now] Address these markers before continuing
[Proceed anyway] These are intentional or will be addressed later
```

If the user selects Fix now, the markers are addressed and the scan re-runs to confirm.

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

Simple task detected — skipping codebase research. Override?
> Skip research

Approach: Find the LoginButton component and fix the text string
Constraints: Only change the string, no refactoring
Verification: Button displays "Sign In" correctly

Proceed with this approach?
> Proceed

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

Task involves multi-file integration — researching codebase first.

Found 3 potentially affected files:
- src/api/client.ts: Main API client
- src/components/Spinner.tsx: Existing spinner
- src/hooks/useApi.ts: API hook

Approach: Add loading state to useApi hook, show Spinner component when loading
Constraints: Use existing Spinner component, don't modify API client directly
Verification: API calls show spinner while pending

Proceed with this approach?
> Proceed

Implementing with existing Spinner component...
```

**Summary:** Research auto-triggers for complex tasks; simple tasks default to skip with an override option.

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
- **Partials**: Uses `skill-complete` partial for final output and `directive-compliance` partial for directive validation

## Limitations

- Best for changes touching 1-3 files
- No parallel execution (single-threaded)
- Branch requirements (e.g., must be on main/master) are enforced by the `git.xml` directive, not the skill
