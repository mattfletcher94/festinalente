---
id: "tasks/plan"
title: "Plan Task"
type: feature
tldr: "Transform spec into executable implementation steps with verification"
summary: "Creates a plan.xml from the functional specification with atomic tasks, verification commands, and dependency ordering. Moves task from scoped to planned column."
keywords: [plan, implementation, steps, verification, dependencies]
aliases: [kanban-plan, implementation-plan, planning]
boundary: "Does NOT execute implementation; only defines HOW to build it step-by-step"
related: [tasks/scope, tasks/implement, tasks/workflow]
updated: 2026-02-20
---

# Plan Task

> **TL;DR:** Transform spec into executable implementation steps with verification

## Overview

Plan Task transforms a functional specification into an executable implementation plan. Claude analyzes the spec and creates atomic tasks with file changes, verification commands, and dependency ordering. The plan is self-contained—Claude can implement it without re-reading the conversation context.

**Summary:** Creates actionable implementation steps from technical specification.

## How It Works

1. User runs `/kanban-plan {id}` on a scoped task
2. Claude reads spec.xml for requirements and affected files
3. Assesses complexity (simple/medium/complex) based on:
   - Number of affected files
   - Number of functional requirements
   - New files to create
   - External dependencies
4. Researches product and engineering docs for implementation context
5. Creates plan.xml with:
   - Overview and technical approach
   - Ordered tasks with dependencies
   - Verification commands per task
   - Testing strategy
   - Edge cases and pitfalls
6. Update task status to planned
7. Git commit: `docs({id}): plan - {title}`

### Key Workflows

**Complexity-scaled planning:**
- Simple (1-2 files): Minimal plan, quick tasks
- Medium (3-5 files): Structured plan with patterns
- Complex (6+ files): Detailed plan with inventory tracking

**Summary:** Plan detail scales with implementation complexity.

## Examples

### Typical Usage

```xml
<plan task="001" spec="tasks/001/spec.xml" complexity="medium" iteration="1">
  <title>Add localStorage persistence for app state</title>
  <overview>
    Implement persistence using use-local-storage-state for reactive localStorage
    with cross-tab sync. State hydrates into Zustand on mount.
  </overview>

  <tasks>
    <task id="1" type="auto">
      <name>Add persistence hook</name>
      <files>src/hooks/usePersistedState.ts (create)</files>
      <requirements>FR1, FR2</requirements>
      <pattern>src/hooks/useSettings.ts:12</pattern>
      <action>
        - Create hook wrapping use-local-storage-state
        - Add TypeScript types for persisted state shape
        - Use app_state as localStorage key
      </action>
      <verify>npx tsc --noEmit</verify>
      <done>Hook exports correctly, TypeScript compiles</done>
    </task>

    <task id="2" type="auto" depends="1">
      <name>Integrate with Zustand store</name>
      <!-- ... -->
    </task>
  </tasks>

  <testing>
    <manual>Modify state, refresh page, verify state restored</manual>
  </testing>

  <edge-cases>
    <case scenario="localStorage unavailable">Fall back to in-memory</case>
  </edge-cases>
</plan>
```

**Summary:** XML plan with atomic tasks, each having files, actions, and verification.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Execute implementation → See [tasks/implement](./implement.md)
- **Does NOT:** Define requirements → Those come from [tasks/scope](./scope.md)
- **Does NOT:** Run verification commands → Those run during implementation

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| directives | Planning rules to follow | From config.yaml |

## Interactions

- **tasks/scope**: Reads spec.xml for requirements
- **Product docs**: Context for implementation decisions
- **Engineering docs**: Patterns to follow
- **tasks/implement**: Executes the plan

## Limitations

- Must be on task/{id} branch
- Task must be in scoped status
- Plan must be self-contained (no context dependencies)
