---
id: skills/plan
title: "Plan Task"
type: feature
tldr: "Transform functional specification into executable implementation steps"
summary: "The /festina-plan skill reads the spec.xml, derives implementation tasks with verification criteria, and creates a self-contained plan.xml that subagents can execute without re-reading the spec."
keywords: [plan, implementation, tasks, verification, xml, self-contained, contracts, contract-test]
aliases: [festina-plan, planning, implementation-plan]
boundary: "Does not execute implementation - only creates the plan document"
references: [skills/scope, skills/implement, docs/product, docs/engineering]
uses: [systems/cli, systems/data-model]
updated: 2026-03-01
---

# Plan Task

> **TL;DR:** Transform functional specification into executable implementation steps

## Overview

The `/festina-plan` skill converts a functional specification into an actionable implementation plan. Each plan task is self-contained with enough context that implementing subagents don't need to re-read the spec.

**Why it exists:** To break complex work into verifiable atomic steps that can be executed reliably.

**Summary:** Plan creates the roadmap that implement will follow step by step.

## How It Works

```mermaid
flowchart LR
    Spec[spec.xml] --> Assess[Assess Complexity]
    Assess --> Research[Research Docs]
    Research --> Derive[Derive Sections]
    Derive --> Create[Create Tasks]
    Create --> Validate[Validate Plan]
    Validate --> Plan[plan.xml]
```

### Complexity Assessment

Plans scale detail based on complexity:

| Criteria | Simple | Medium | Complex |
|----------|--------|--------|---------|
| Affected files | 1-2 | 3-5 | 6+ |
| Functional requirements | ≤3 | 4-6 | 7+ |
| New files created | 0 | 1-2 | 3+ |
| External dependencies | 0 | 0-1 | 2+ |

**Summary:** Higher complexity = more detailed plan tasks.

### Plan Task Structure

Each task in the plan includes:

```xml
<task id="1" type="auto" depends="">
  <name>Implementation step name</name>
  <files>path/to/file.ts (create|modify)</files>
  <requirements>FR1, FR2</requirements>
  <pattern>Pattern at file:line</pattern>
  <context>
    <file>path/to/read/first.ts</file>
  </context>
  <action>
    - Step by step instructions
    - With code snippets if helpful
  </action>
  <verify>npm run build</verify>
  <done>Observable outcome, not implementation detail</done>
</task>
```

### Validation Checks

Before saving, plans are validated for:

- **Requirement coverage** - Every FR has an addressing task
- **Dependency cycles** - No circular dependencies
- **Scope sanity** - Warning if >7 tasks
- **Done criteria quality** - Outcomes, not implementation details
- **Wiring check** - New files are imported somewhere

**Summary:** Validation catches plan issues before implementation begins.

### Contracts in Plans

When the spec contains behavioral contracts, the plan skill incorporates them in two ways:

**Contract-test elements in testing:** For each contract, the plan derives test cases in a `<contract-test>` element within the `<testing>` section. Each contract-test includes a positive test (verifying the postcondition holds), a negative test (verifying behavior when the precondition is violated), and a property-based test description. Contract-tests reference specific contract IDs (C1, C2, etc.).

**Contract context in tasks:** When a plan task addresses requirements that have associated contracts, the relevant contracts are included in the task's `<context>` element as a `<contracts>` sub-element. This gives the implementing subagent visibility into the behavioral expectations for the requirements it is implementing.

A directive can require contract-test elements to be present when contracts exist in the spec. Without such a directive, contract integration in plans follows the same optional pattern as in the spec.

## Examples

### Medium Complexity Plan

```
/festina-plan 001

Reading spec: .festinalente/tasks/001/spec.xml
- 4 functional requirements
- 3 files affected
- Complexity: medium

Creating implementation plan...

Plan created: .festinalente/tasks/001/plan.xml
- 4 implementation steps
- Testing strategy defined
- 3 edge cases identified

Task 001 moved to Planned
Next: /festina-implement 001
```

**Summary:** Plans include all context needed for implementation.

## Boundaries

What this skill does NOT do:

- **Does NOT:** Create the spec → See [scope](./scope.md)
- **Does NOT:** Execute implementation → See [implement](./implement.md)
- **Does NOT:** Modify code files

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Max tasks warning | Warn if plan exceeds | 7 tasks |

## Interactions

- **Product Docs**: Reads affected docs for implementation context
- **Engineering Docs**: Reads patterns to reference in plan tasks
- **Directives**: Uses verification commands from directives

## Limitations

- Task must have spec.xml (status: scoped)
- Branch requirements (e.g., must be on task branch) are enforced by the `git.xml` directive, not the skill
