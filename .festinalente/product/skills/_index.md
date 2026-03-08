---
id: skills/_index
title: "Skills"
type: domain
tldr: "AI-assisted workflows that guide developers through structured task lifecycles"
summary: "The skills domain provides slash commands (/festina-*) that orchestrate the full task lifecycle from creation through completion, using conversational Q&A, parallel research agents, and subagent orchestration."
keywords: [skills, slash-commands, workflow, ai-assisted, orchestration, conversational]
aliases: [commands, slash-commands, festina-commands]
boundary: "Does not include CLI utilities (see cli domain) or VSCode extension features (see vscode domain)"
contains: [skills/create, skills/scope, skills/plan, skills/implement, skills/finalize, skills/complete, skills/quick, skills/explore, skills/overview, skills/save, skills/rework, skills/delete, skills/define-product, skills/map-product, skills/map-engineering, skills/directive]
references: [cli/_index, docs/_index, directives/_index]
uses: [systems/cli, systems/content-build]
updated: 2026-03-08
---

# Skills

> **TL;DR:** AI-assisted workflows that guide developers through structured task lifecycles

## Overview

The Skills domain provides the core AI-assisted workflows for Festina Lente. Each skill is a slash command (`/festina-*`) that guides developers through a specific phase of the task lifecycle using conversational Q&A, structured research, and subagent orchestration.

**Why it exists:** To bring deliberate structure to LLM-assisted development - making haste slowly.

**Summary:** Skills transform AI speed into quality output through structured workflows.

## Domain Structure

```mermaid
flowchart LR
    subgraph "Full Workflow"
        create[/festina-create] --> scope[/festina-scope]
        scope --> plan[/festina-plan]
        plan --> implement[/festina-implement]
        implement --> finalize[/festina-finalize]
        finalize --> complete[/festina-complete]
    end

    subgraph "Support"
        save[/festina-save]
        rework[/festina-rework]
        delete[/festina-delete]
        quick[/festina-quick]
    end

    subgraph "Discovery & Documentation"
        explore[/festina-explore]
        overview[/festina-overview]
        defineProduct[/festina-define-product]
        mapProduct[/festina-map-product]
        mapEngineering[/festina-map-engineering]
        directive[/festina-directive]
    end

    implement -.-> save
    finalize -.-> rework
    rework -.-> implement
```

## Boundaries

This domain does NOT cover CLI helper commands (use `node .festinalente/scripts/festinalente.cjs`). For that, see [cli](../cli/_index.md).

- **Does NOT:** Execute shell commands directly (uses CLI scripts)
- **Does NOT:** Provide VSCode UI features (see vscode domain)
- **See instead:** [cli/_index](../cli/_index.md) for helper scripts

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| [create](./create.md) | Create tasks through conversational Q&A | stable |
| [scope](./scope.md) | Research codebase and create functional specs | stable |
| [plan](./plan.md) | Transform specs into implementation plans | stable |
| [implement](./implement.md) | Execute plans with subagent orchestration | stable |
| [finalize](./finalize.md) | Validate, document, and transition to awaiting-completion | stable |
| [complete](./complete.md) | Move task from awaiting-completion to done | stable |
| [quick](./quick.md) | Fast path for simple fixes | stable |
| [explore](./explore.md) | Explore questions through Socratic dialogue | stable |
| [overview](./overview.md) | View board status and task details | stable |
| [save](./save.md) | Persist partial progress when interrupted | stable |
| [rework](./rework.md) | Return task to in-progress with issue report | stable |
| [delete](./delete.md) | Remove backlog tasks permanently | stable |
| [define-product](./define-product.md) | Define new product via Socratic Q&A | stable |
| [map-product](./map-product.md) | Discover and document product features from code | stable |
| [map-engineering](./map-engineering.md) | Discover and document engineering patterns from code | stable |
| [directive](./directive.md) | Create directives via Q&A (see [directives domain](../directives/_index.md)) | stable |

**Summary:** This domain contains 16 skills: 6 core workflow, 3 support, and 7 discovery/documentation.

## Key Concepts

- **Conversational Q&A**: Skills ask questions one at a time, proposing understanding for user validation
- **Parallel Research**: Skills spawn multiple exploration agents simultaneously for faster discovery
- **Subagent Orchestration**: Implementation executes plan tasks via fresh subagents with explicit file context
- **Directives**: User-defined rules that modify skill behavior per phase

## Relationships

| Related Domain | Relationship |
|----------------|--------------|
| [cli](../cli/_index.md) | Skills invoke CLI scripts for task/doc operations |
| [docs](../docs/_index.md) | Skills use doc search for context selection |

**Summary:** Skills primarily depend on CLI for persistence and docs for context.
