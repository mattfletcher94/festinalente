---
id: "systems/{name}"
title: "{System Name}"
type: system
tldr: "{Single sentence - max 100 chars}"
summary: "{One sentence}"
keywords: []
aliases: []
boundary: "{What this system does NOT handle}"
related: []
paths: []
updated: YYYY-MM-DD
verified: YYYY-MM-DD
code_refs: []
---

# {System Name}

> **TL;DR:** {tldr repeated}

## Overview

{What this system does and its responsibilities}

**Why it exists:** {Architectural reason}

**Summary:** {Brief recap of system purpose}

## Components

| Component | Purpose | File |
|-----------|---------|------|
| [{name}](./{name}.md) | {summary} | `{path}` |

**Summary:** {Brief recap of components}

## Key Patterns

This system follows these patterns from `patterns/`:

- [{pattern}](../patterns/{pattern}.md) - {how it's used here}

## Architecture

```mermaid
flowchart TB
    subgraph {System Name}
        {Component1}[{Component 1}]
        {Component2}[{Component 2}]
        {Component3}[{Component 3}]
    end
    Input --> {Component1}
    {Component1} --> {Component2}
    {Component2} --> {Component3}
    {Component3} --> Output
```

{Prose description of architecture}

## Data Flow

```mermaid
flowchart LR
    A[Input] --> B[{Processing Step 1}]
    B --> C[{Processing Step 2}]
    C --> D[Output]
```

{Prose description of data flow}

## Interactions

| System | Relationship | Notes |
|--------|--------------|-------|
| [{system}](../{system}/_index.md) | {how they interact} | {when/why} |

**Summary:** {Brief recap of key interactions}

## Boundaries

What this system does NOT handle:

- **Does NOT:** {thing} → See [{system}](../{system}/_index.md)
- **Does NOT:** {thing}

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| {setting} | {what it does} | {default} |
