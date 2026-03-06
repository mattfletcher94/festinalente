---
id: skills/map-engineering
title: "Map Engineering"
type: feature
tldr: "Analyze codebase architecture with parallel agents and generate engineering docs"
summary: "The /festina-map-engineering skill launches parallel exploration agents to discover systems, patterns, and conventions in the codebase, then generates engineering documentation through Socratic Q&A."
keywords: [map, engineering, parallel, agents, architecture, patterns, conventions]
aliases: [festina-map-engineering, discover-engineering]
boundary: "Creates engineering docs (how things work) not product docs (what things do)"
references: [docs/engineering, skills/map-product]
uses: []
updated: 2026-03-06
---

# Map Engineering

> **TL;DR:** Analyze codebase architecture with parallel agents and generate engineering docs

## Overview

The `/festina-map-engineering` skill creates engineering documentation for an existing codebase. Similar to map-product, it uses parallel exploration agents to discover systems architecture, code patterns, and project conventions, then validates findings through Socratic Q&A.

**Why it exists:** Engineering docs capture how things work technically — architecture decisions, patterns, and conventions that product docs don't cover.

**Summary:** Automated architecture discovery + human validation = engineering documentation.

## How It Works

```mermaid
flowchart TB
    subgraph "Parallel Discovery"
        SA[Systems Analyzer]
        PP[Pattern Finder]
        CF[Convention Scanner]
        GD[Gap Detector]
    end

    SA --> Synthesize
    PP --> Synthesize
    CF --> Synthesize
    GD --> Synthesize

    Synthesize --> QA[Socratic Q&A]
    QA --> Docs[Generate Docs]
```

1. **Parallel discovery** — agents scan for systems, patterns, and conventions
2. **Synthesize** — combine findings into a unified architecture view
3. **Socratic Q&A** — validate findings, capture tribal knowledge
4. **Generate docs** — systems, patterns, and conventions documentation

**Summary:** Discover architecture, validate with team, document for posterity.

## Boundaries

What this skill does NOT do:

- **Does NOT:** Create product docs → See [map-product](./map-product.md)
- **Does NOT:** Work without a codebase
- **Does NOT:** Skip user validation of findings

## Interactions

- **Engineering Docs**: Creates/updates systems, patterns, and conventions docs
- **CLI**: Uses `list-engineering` to check existing docs

## Limitations

- Requires codebase to exist
- Architecture discovery depends on code organization and naming
