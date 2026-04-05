---
id: "conventions/{name}"
title: "{Convention Name}"
type: convention
tldr: "{The rule in one sentence}"
summary: "{Why this convention exists}"
keywords: []
aliases: []
boundary: "{When this convention does NOT apply}"
references: []
uses: []
paths: []
intent: reference
prerequisites: []
---

# {Convention Name}

> **TL;DR:** {tldr repeated}

## Rule

<!-- Each section must be self-contained: open with a context sentence, no back-references -->

{Clear statement of the convention}

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

## Rationale

{Why we follow this convention}

**Summary:** {Brief recap of reasoning}

## Examples

### Correct

```
{ASCII representation of correct structure/naming}
```

```{language}
{good code example}
```

### Incorrect

```
{ASCII representation of incorrect structure/naming}
```

```{language}
{bad example}
// Violates: {which aspect of rule}
```

**Summary:** {Brief recap of examples}

## Boundaries

When this convention does NOT apply:

- {Exception 1}
- {Exception 2}

## Enforcement

{How this is enforced: linter, code review, etc.}
