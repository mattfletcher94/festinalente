---
id: skills/finalize
title: "Finalize Task"
type: feature
tldr: "Validate, document, and move a task to awaiting-completion"
summary: "The /festina-finalize skill runs directive checks, spawns parallel agents to update documentation, and moves tasks to awaiting-completion. Git operations (committing, PR creation) are handled by directives. Task closure is handled by /festina-complete."
keywords: [finalize, docs, validation, awaiting-completion]
aliases: [festina-finalize, finish]
boundary: "Does not implement code or close tasks - only validates, documents, and transitions to awaiting-completion. Task closure is handled by /festina-complete."
references: [skills/implement, skills/complete, docs/product, docs/engineering]
uses: [systems/cli, systems/data-model]
updated: 2026-03-08
---

# Finalize Task

> **TL;DR:** Validate, document, and move a task to awaiting-completion

## Overview

The `/festina-finalize` skill is a three-phase orchestrator that moves a task through quality gates: validate implementation, update documentation, then transition to awaiting-completion. It's resumable - you can stop and restart from any phase. Git operations (committing, PR creation) are handled by directives — the skill itself is git-agnostic. Task closure (marking done) is handled separately by `/festina-complete`.

**Why it exists:** To ensure code quality and documentation before task closure.

**Summary:** Finalize is the quality gate between implementation and awaiting-completion.

## How It Works

```mermaid
flowchart LR
    subgraph "Phase 1: Validate"
        Checks[Run Directive Checks]
        Fix[Auto-fix Loop]
    end

    subgraph "Phase 2: Document"
        Analyze[Analyze Doc Impact]
        Agents[Spawn Doc Agents]
    end

    subgraph "Phase 3: Transition"
        Await[Move to Awaiting Completion]
        Directives[Run Directive Rules]
    end

    Checks --> Fix
    Fix --> Review[Spec Review]
    Review --> Analyze
    Analyze --> Agents
    Agents --> Await
    Await --> Directives
```

### Phase 1: Validate

1. **Verify plan completion** - All tasks marked complete
2. **Run directive checks** - TypeScript, tests, linting
3. **Auto-fix loop** - Fix issues, log to iterations, retry
4. **Spec compliance review** - Independent agent verifies implementation against spec

### Phase 2: Documentation

1. **Analyze impact** - Categorize docs as complete/update/create
2. **Pre-load context** - Smart context for doc agents
3. **Spawn parallel agents** - Product and/or Engineering doc agents
4. **Validate outputs** - Check agent results
5. **Update glossary/indexes** - Orchestrator handles these

### Phase 3: Transition

1. **Move to awaiting-completion** - Update task status
2. **Run directive rules** - Git commit, push, PR creation (directive-driven)

**Summary:** Three distinct phases, each resumable independently. Phase 1 includes an independent spec compliance review after directive checks. Git operations (committing, PR creation) are handled by directives, not the skill itself. Task closure is handled by `/festina-complete`.

## Examples

### Full Flow

```
/festina-finalize 001

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1: VALIDATE AND COMMIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Running check: TypeScript...
PASS: TypeScript

All checks passed!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2: DOCUMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Product Docs: Will COMPLETE auth/login
Spawning agents...
✓ Product Docs Agent completed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3: TRANSITION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task 001 moved to Awaiting Completion!

Next: /festina-complete 001
```

**Summary:** Each phase shows clear progress and outputs.

## Boundaries

What this skill does NOT do:

- **Does NOT:** Write implementation code → See [implement](./implement.md)
- **Does NOT:** Close tasks (mark as done) → See [complete](./complete.md)
- **Does NOT:** Handle git operations directly (committing, PR creation are directive-driven)

## Interactions

- **Directives**: Runs all configured checks in Phase 1; git/PR operations in Phase 3 are directive-driven
- **Complete**: After finalize, run `/festina-complete` to close the task
- **Spec Review**: Independent Explore agent verifies implementation against spec requirements
- **Product Docs**: Spawns agent if task has `affects` field
- **Engineering Docs**: Spawns agent if task has `engineering` field
- **Glossary**: Updates with new terms from doc agents

## Limitations

- Task should be in `finalize` status
- Moves to `awaiting-completion`, not `done` — run `/festina-complete` to close
- Git-related requirements (branch verification, clean working tree) are enforced by directives, not the skill
