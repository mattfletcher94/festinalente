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

## Data Flow

```
Input → {Component} → {Component} → Output
```

## Interactions

| System | Relationship | Notes |
|--------|--------------|-------|
| [{system}](../{system}/index.md) | {how they interact} | {when/why} |

**Summary:** {Brief recap of key interactions}

## Boundaries

What this system does NOT handle:

- **Does NOT:** {thing} → See [{system}](../{system}/index.md)
- **Does NOT:** {thing}

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| {setting} | {what it does} | {default} |
