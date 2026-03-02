---
id: cli/search
title: "Search Commands"
type: feature
tldr: "Hybrid keyword and fuzzy search across product and engineering docs"
summary: "Search commands find relevant documentation using exact keyword matching, fuzzy title/body search, and boundary-aware scoring with configurable thresholds."
keywords: [search, hybrid, fuzzy, keywords, scoring, relevance]
aliases: [search-commands, doc-search]
boundary: "Does not search task files - only product and engineering documentation"
references: [docs/search]
uses: [systems/cli]
updated: 2026-03-01
---

# Search Commands

> **TL;DR:** Hybrid keyword and fuzzy search across product and engineering docs

## Overview

Search commands find relevant documentation for skills to load as context. The hybrid algorithm combines exact keywords with fuzzy matching and penalizes boundary violations.

**Summary:** Search surfaces the right docs for any query.

## Commands

| Command | Purpose |
|---------|---------|
| `search-product keyword1 keyword2...` | Search product docs |
| `search-engineering keyword1 keyword2...` | Search engineering docs |
| `search-hybrid keyword1 keyword2...` | Search both doc types |

### Options

| Option | Description |
|--------|-------------|
| `--min-score=0.3` | Minimum relevance threshold |

## Scoring

| Score | Interpretation |
|-------|----------------|
| ≥0.5 | Strong match |
| 0.3-0.5 | Possible match |
| <0.3 | Weak match |

## Examples

```bash
# Search product docs
node .festinalente/scripts/festinalente.cjs search-product auth login

# With threshold
node .festinalente/scripts/festinalente.cjs search-product password --min-score=0.3
```

## Boundaries

- **Does NOT:** Search task/spec/plan XML files
- **Does NOT:** Search code files → Use Grep for that
