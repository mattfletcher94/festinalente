---
id: "systems/{system}/{name}"
title: "{Component Name}"
type: component
tldr: "{Single sentence - max 100 chars}"
summary: "{One sentence}"
keywords: []
aliases: []
boundary: "{What this component does NOT handle}"
paths: []
intent: reference
prerequisites: []
---

# {Component Name}

> **TL;DR:** {tldr repeated}

## Overview

<!-- Each section must be self-contained: open with a context sentence, no back-references -->

{What this component does}

**Why it exists:** {Reason for this component}

**Summary:** {Brief recap of purpose}

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

## Data Flow

```mermaid
flowchart LR
    Input --> {Component}
    {Component} --> Output
```

## Interface

```{language}
// {file path}
{Key exports, functions, classes}
```

**Summary:** {Brief recap of public interface}

## Examples

### Typical Usage

```{language}
// {file path where this is used}
{code example}
```

### Edge Case: {scenario}

```{language}
// {what happens when}
{code example}
```

**Summary:** {Brief recap of usage patterns}

## Boundaries

What this component does NOT handle:

- **Does NOT:** {thing} → See [{component}](./{component}.md)
- **Does NOT:** {thing}

## Implementation Notes

{Important implementation details}

**Summary:** {Brief recap of key implementation details}
