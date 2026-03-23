---
id: projects/_index
title: "Projects"
type: domain
tldr: "Lightweight grouping layer that aligns related tasks under a shared goal"
summary: "The projects domain provides a mini-PRD structure for grouping 2-5 related tasks with numbered requirements, requirement traceability, and progress tracking while preserving the standard task-level workflow."
keywords: [projects, grouping, requirements, traceability, decomposition, PRD, multi-task]
aliases: [project-management, task-grouping]
boundary: "Does not replace full project management tools - only groups related tasks with requirement traceability"
contains: [projects/lifecycle, projects/requirements]
references: [skills/create-project, cli/projects]
uses: [systems/data-model]
updated: 2026-03-23
---

# Projects

> **TL;DR:** Lightweight grouping layer that aligns related tasks under a shared goal

## Overview

The projects domain handles work that is too large for a single task but doesn't need a full project management tool. A project is a mini-PRD that captures the problem, value, scope, numbered requirements (R1-Rn), and project-level acceptance criteria, then decomposes into 2-5 individually scoped, plannable, and implementable tasks.

**Why it exists:** Without projects, related tasks drift apart — each gets scoped independently, requirements fall through cracks, and there's no way to verify that the original goal was met. Projects maintain alignment.

**Summary:** Projects provide requirement traceability and progress visibility across related tasks.

## Domain Structure

```mermaid
flowchart TB
    subgraph Projects
        lifecycle[Project Lifecycle]
        requirements[Requirement Traceability]
    end

    create-project[/festina-create-project] --> lifecycle
    complete-project[/festina-complete-project] --> lifecycle
    cli[CLI Project Commands] --> Projects
    lifecycle --> requirements
```

## Boundaries

This domain does NOT cover individual task workflows. For that, see [skills](../skills/_index.md).

- **Does NOT:** Scope, plan, or implement tasks — each task follows the standard workflow independently
- **Does NOT:** Replace GitHub issues or project boards — projects are local-first, synced via directives
- **See instead:** [skills/_index](../skills/_index.md) for the per-task lifecycle

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| [Lifecycle](./lifecycle.md) | Project creation, status transitions, and completion | Stable |
| [Requirements](./requirements.md) | R1-Rn traceability from project to tasks | Stable |

**Summary:** This domain contains 2 features covering project structure and requirement traceability.

## Key Concepts

- **Project ID**: Format `P{3-digit}-{slug}` (e.g., `P001-user-authentication-system`)
- **Requirement**: A numbered statement (R1-Rn) that is independently testable, user-facing, and specific
- **Vertical slice**: A decomposed task that delivers end-to-end value, not a horizontal layer
- **Requirement coverage**: Every R1-Rn must map to at least one task; verified at creation and completion

## Data Model

```xml
<project id="P001-slug" status="open" created="2026-03-23" updated="2026-03-23">
  <title>Project title</title>
  <description>Brief description</description>
  <problem>What problem this solves</problem>
  <value>Why this matters</value>
  <scope>
    <in-scope><item>What's included</item></in-scope>
    <out-of-scope><item>What's excluded</item></out-of-scope>
  </scope>
  <requirements>
    <requirement id="R1">Independently testable requirement</requirement>
  </requirements>
  <acceptance-criteria>
    <criterion>Given ... When ... Then ...</criterion>
  </acceptance-criteria>
  <tasks>
    <task-ref id="001-task-slug" requirements="R1,R3"/>
  </tasks>
  <notes>Free-form context</notes>
  <affects><doc id="skills/create"/></affects>
  <engineering><doc id="systems/auth"/></engineering>
</project>
```

## Relationships

| Related Domain | Relationship |
|----------------|--------------|
| [skills](../skills/_index.md) | `/festina-create-project` and `/festina-complete-project` manage lifecycle |
| [cli](../cli/_index.md) | Project commands provide CRUD and progress queries |
| [directives](../directives/_index.md) | GitHub directive syncs projects to issues and commits |

**Summary:** Projects primarily interact with skills (lifecycle), CLI (data access), and directives (git/GitHub sync).
