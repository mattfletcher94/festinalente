---
id: skills/implement
title: "Implement Task"
type: feature
tldr: "Execute plan tasks directly with progress persistence and quality verification"
summary: "The /festina-implement skill executes each plan task directly in the orchestrator context, tracks completion in plan.xml, runs quality verification, and moves completed tasks to finalize status."
keywords: [implement, execute, verification, progress, contracts, direct-execution]
aliases: [festina-implement, execute, run]
boundary: "Does not update documentation - that happens in finalize. Git operations are directive-driven."
references: [skills/plan, skills/finalize, cli/context]
uses: [systems/cli, systems/data-model]
updated: 2026-03-22
---

# Implement Task

> **TL;DR:** Execute plan tasks directly with progress persistence and quality verification

## Overview

The `/festina-implement` skill executes the plan by running each task directly in the orchestrator context. Progress is persisted immediately after each task completes, enabling resume if interrupted.

**Why it exists:** To execute complex plans reliably with verification at each step.

**Summary:** Implement executes tasks directly through the plan, persisting progress as it goes.

## How It Works

```mermaid
flowchart TB
    subgraph "Orchestrator"
        Parse[Parse Plan]
        Order[Calculate Order]
        Track[Track Progress]
        Quality[Quality Check]
    end

    subgraph "Per Task"
        ReadCtx[Read Context]
        Execute[Execute Action]
        Verify[Run Verification]
        ContractV[Contract Verification]
        DirVal[Directive Validation]
        Persist[Persist Completion]
    end

    Parse --> Order
    Order --> ReadCtx
    ReadCtx --> Execute
    Execute --> Verify
    Verify --> ContractV
    ContractV --> DirVal
    DirVal --> |pass or continue| Persist
    DirVal --> |fix now| Execute
    Persist --> |next task| ReadCtx
    Persist --> |all done| Quality
```

### Direct Execution

Each plan task is executed directly by the orchestrator:

1. **Read context** files listed in the task's context element, plus pattern reference if specified
2. **Execute action** directly using available tools (Read, Edit, Write, Bash), respecting spec boundaries and contracts from context
3. **Run verification** command and check result
4. **Contract verification** - If the spec has contracts, evaluate applicable contracts against the task's changes with structured pass/fail results and evidence. Failures prompt user with Fix now / Continue anyway
5. **Per-task directive validation** - Run directive validation checks (commands, patterns, checklists) scoped to the current task's files. Violations prompt user with Fix now / Continue anyway
6. **Persist immediately** - Mark `completed="true"` in plan.xml, including contract verification results if contracts were evaluated
6. **Continue** to next task or handle failure

**Summary:** Direct execution gives the orchestrator full visibility of prior task changes, enabling cross-task coherence.

### Progress Persistence

After each task completes:

```xml
<task id="1" type="auto" completed="true" completed_at="2026-03-01T12:00:00Z">
  ...
</task>
```

This enables:
- **Resume** - Continue from where you left off
- **Visibility** - See which tasks are done (also shown as a progress indicator in the sidebar kanban TreeView)
- **Audit** - Track when each step completed

### Quality Verification

After all tasks complete, orchestrator runs:

1. **Anti-pattern scan** - Find TODO, FIXME, HACK markers
2. **Requirement trace** - Verify each FR has implementation
3. **Wiring verification** - Ensure new files are imported

**Summary:** Quality checks catch incomplete work before finalize.

### Contract Verification

When the spec contains `<contracts>`, the implement skill runs structured contract verification after each plan task completes its verification command. For each task, the skill:

1. **Maps contracts to tasks** by matching the task's `requirements` field against each contract's `requirement` attribute. A contract is selected if any FR overlaps.
2. **Evaluates all four elements** — precondition, postcondition, invariant, and property — against the current code state, producing a pass/fail result with evidence (file:line reference or reasoning).
3. **Includes contract-test context** from the plan's testing section as complementary input to the evaluation.
4. **Handles failures** by presenting the user with which contract failed, why, and the evidence, then prompting with Fix now / Continue anyway.
5. **Persists results** in plan.xml as a `<contract-verification>` child element within each task, containing one `<result>` per contract evaluated.

When the spec has no contracts, this step is skipped entirely with no change to existing behavior.

### Boundary Handling

When the spec contains `<boundaries>`, the implement skill extracts them during the spec-reading step. Because the orchestrator executes tasks directly, boundaries remain available in context throughout execution without any injection needed.

The orchestrator respects boundary rules (always/ask-first/never) directly as it executes each task.

## Examples

### Full Implementation

```
/festina-implement 001

Reading plan: .festinalente/tasks/001/plan.xml
Found 3 tasks, 0 completed, order: 1, 2, 3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1/3] Create auth routes file
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Task 1 completed: Created src/routes/auth.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[2/3] Add login endpoint
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Task 2 completed: Added POST /login handler

All tasks complete. Moving to finalize.
Next: /festina-finalize 001
```

### Resume After Interruption

```
/festina-implement 002

Reading plan...
Found 5 tasks, 2 completed, order: 3, 4, 5

Resuming from task 3...
```

**Summary:** Implementation can be resumed at any point.

## Boundaries

What this skill does NOT do:

- **Does NOT:** Create the plan → See [plan](./plan.md)
- **Does NOT:** Handle git operations directly (directive-driven)
- **Does NOT:** Update documentation → See [finalize](./finalize.md)

## Interactions

- **Spec Boundaries**: If spec.xml contains `<boundaries>`, the always/ask-first/never rules are available in context during execution
- **Spec Contracts**: If spec.xml contains `<contracts>`, structured contract verification runs after each task with pass/fail results persisted in plan.xml
- **Directives**: Applies `phase="implement"` rules. Directives are loaded once and remain in context. Per-task directive validation runs after each task completes, before marking the task complete

## Limitations

- Task must have plan.xml (status: planned or in-progress)
- Branch requirements (e.g., must be on task branch) are enforced by the `git.xml` directive, not the skill
