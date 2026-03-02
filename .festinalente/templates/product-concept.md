---
id: "{domain}/{slug}"
title: "{Concept Name}"
type: concept
tldr: "{Single sentence - max 100 chars}"
summary: "{One sentence definition - for LLM discovery}"
keywords: []
aliases: []
boundary: "{What this concept does NOT cover}"
references: []
uses: []
updated: YYYY-MM-DD
---

# {Concept Name}

> **TL;DR:** {tldr repeated}

## Definition

A {Concept Name} is {definition}. It represents {what it models/represents}.

**Summary:** {Brief recap of the definition}

## Examples

### Example 1: {Name}

```{language}
// {file path showing this concept}
{code example}
```

- {Description of this example}
- {Key attributes}

### Example 2: {Name}

- {Description of this example}
- {Key attributes}

**Summary:** {Brief recap of key examples}

## Rules & Constraints

- **{Rule Name}**: {Description of the rule}
- **{Rule Name}**: {Description of the rule}

### Validation

| Field | Rule | Example |
|-------|------|---------|
| {field} | {validation rule} | {valid/invalid example} |

**Summary:** {Brief recap of key rules}

## Boundaries

What this concept does NOT cover:

- **Does NOT:** {thing 1} → See [{related-concept}]({path})
- **Does NOT:** {thing 2}

## Relationships

```mermaid
flowchart TB
    {Concept}[{Concept Name}]
    {Related1}[{Related Concept 1}]
    {Related2}[{Related Concept 2}]
    {Concept} --> {Related1}
    {Concept} --> {Related2}
```

- **{Related Concept}**: {Nature of relationship}
- **{Related Concept}**: {Nature of relationship}

## Edge Cases

- **{Scenario}**: {How this concept behaves in this edge case}
- **{Scenario}**: {How this concept behaves in this edge case}
