---
id: skills/_index
title: "Skills"
type: domain
tldr: "AI-assisted workflows that guide developers through structured task lifecycles"
summary: "The skills domain provides slash commands (/festina-*) that orchestrate the full task lifecycle from creation through completion, using conversational Q&A, parallel research agents, and subagent orchestration."
keywords: [skills, slash-commands, workflow, ai-assisted, orchestration, conversational]
aliases: [commands, slash-commands, festina-commands]
boundary: "Does not include CLI utilities (see cli domain) or VSCode extension features (see vscode domain)"
contains: [skills/create, skills/scope, skills/plan, skills/implement, skills/finalize, skills/quick, skills/explore, skills/overview]
references: [cli/_index, docs/_index]
uses: [systems/cli, systems/content-build]
updated: 2026-03-01
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
    end

    subgraph "Fast Path"
        quick[/festina-quick]
    end

    subgraph "Discovery"
        explore[/festina-explore]
        overview[/festina-overview]
    end
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
| [finalize](./finalize.md) | Validate, document, and complete | stable |
| [quick](./quick.md) | Fast path for simple fixes | stable |
| [explore](./explore.md) | Explore questions through Socratic dialogue | stable |
| [overview](./overview.md) | View board status and task details | stable |

**Summary:** This domain contains 8 core skills covering the full task lifecycle.

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
