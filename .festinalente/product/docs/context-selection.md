---
id: docs/context-selection
title: "Context Selection"
type: feature
tldr: "Tiered doc loading to fit LLM token budgets"
summary: "Context selection loads documentation at configurable detail levels (minimal, standard, full) to balance comprehensiveness with token efficiency during skill execution."
keywords: [context, tiers, tokens, budget, minimal, standard, full]
aliases: [smart-context, context-tiers]
boundary: "Does not handle code context - only documentation"
references: [docs/search, conventions/documentation-format]
uses: [systems/cli]
intent: conceptual
prerequisites: []
---

# Context Selection

> **TL;DR:** Tiered doc loading to fit LLM token budgets

## Overview

Context selection determines how much documentation to load for a given task. Three tiers balance comprehensiveness with token efficiency.

**Summary:** Load the right amount of context for each situation.

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

## Tiers

Tier definitions are formalized in the [documentation-format convention](../../engineering/conventions/documentation-format.md).

| Tier | Tokens | Content Included |
|------|--------|------------------|
| minimal | ~50 | Frontmatter only (id, title, tldr, keywords, boundary) |
| standard | ~200 | Frontmatter + TL;DR + Overview section |
| full | ~500-1000 | Complete document |

## Selection Logic

1. **Search** relevant docs by task keywords
2. **Rank** by relevance score
3. **Truncate** to fit token budget
4. **Format** according to tier

## Usage

```bash
node .festinalente/scripts/festinalente.cjs select-context 001 --tier=standard --max=3
```

Returns the top 3 most relevant docs at standard detail level.

## Boundaries

- **Does NOT:** Load code file context
- **Does NOT:** Modify token budgets dynamically
