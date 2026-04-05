---
id: overview
title: "{Project Name} Engineering Overview"
type: overview
tldr: "{Single sentence - max 100 chars}"
summary: "High-level technical overview of {project}"
keywords: [architecture, tech-stack, overview]
aliases: []
boundary: "{What this overview does NOT cover}"
paths: []
intent: reference
prerequisites: []
---

# {Project Name} Engineering Overview

> **TL;DR:** {tldr repeated}

## Tech Stack

<!-- Each section must be self-contained: open with a context sentence, no back-references -->

| Category | Technology |
|----------|------------|
| Language | |
| Framework | |
| Database | |
| Build Tool | |
| Testing | |

**Summary:** {Brief recap of stack choices}

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

## Architecture Summary

{2-3 sentences on overall architecture approach}

**Why it exists:** {Architectural reason for these choices}

**Summary:** {Brief recap of architecture}

## System Architecture

```mermaid
flowchart TB
    subgraph Systems
        {System1}[{System 1}]
        {System2}[{System 2}]
        {System3}[{System 3}]
    end
    External --> {System1}
    {System1} --> {System2}
    {System2} --> {System3}
```

## Directory Structure

```
{key directories and their purpose}
```

**Summary:** {Brief recap of key directories}

## Boundaries

What this overview does NOT cover:

- **Does NOT:** {detailed implementation} → See [systems/](systems/)
- **Does NOT:** {specific patterns} → See [patterns/](patterns/)

## Key Patterns

- [{pattern-name}](patterns/{pattern}.md) - {summary}

## Systems

- [{system-name}](systems/{system}/_index.md) - {summary}

## Conventions

- [{convention-name}](conventions/{convention}.md) - {summary}
