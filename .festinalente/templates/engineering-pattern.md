---
id: "patterns/{name}"
title: "{Pattern Name}"
type: pattern
tldr: "{When to use this pattern - max 100 chars}"
summary: "{Problem it solves and solution approach}"
keywords: []
aliases: []
boundary: "{When NOT to use this pattern}"
references: []
uses: []
paths: []
intent: conceptual
prerequisites: []
---

# {Pattern Name}

> **TL;DR:** {tldr repeated}

## Problem

<!-- Each section must be self-contained: open with a context sentence, no back-references -->

{What problem does this pattern solve?}

## Solution

{How does the pattern solve it?}

**Summary:** {Brief recap of solution}

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

## Structure

```mermaid
classDiagram
    class {Interface} {
        <<interface>>
        +{method}()
    }
    class {Implementation} {
        +{method}()
    }
    {Interface} <|-- {Implementation}
    {Client} --> {Interface}
```

## When to Use

- {Scenario 1}
- {Scenario 2}

## When NOT to Use

- {Anti-scenario 1} → Use [{alternative}](../{path}) instead
- {Anti-scenario 2}

## Quick Reference

{Tables, rules summary - AI adapts based on complexity}

## Validation Checklist

- [ ] {Check 1}
- [ ] {Check 2}

**Summary:** {Brief recap of validation}

## Examples

### Correct Example

```{language}
// {file path where this is used}
{good code example}
```

### Incorrect Example

```{language}
// DON'T do this
{bad code example}
// Because: {reason}
```

**Summary:** {Brief recap of examples}

## Boundaries

What this pattern does NOT apply to:

- **Does NOT:** {thing} → Use [{alternative}](../{path}) instead
- **Does NOT:** {thing}

## Systems Using This Pattern

- [{system}](../systems/{system}/_index.md)

## Common Violations

{Patterns to avoid}
