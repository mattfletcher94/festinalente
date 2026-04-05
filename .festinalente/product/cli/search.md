---
id: cli/search
title: "Search Commands"
type: feature
tldr: "BM25+ scored search with field boosting and graph-aware retrieval across product and engineering docs"
summary: "Search commands find relevant documentation using BM25+ scoring via MiniSearch, with field boosting, prefix search, graph-expanded relatedDocs, boundary-aware scoring, reverse lookup for impact analysis, and glossary-based query expansion."
keywords: [search, bm25, minisearch, graph, prefix, scoring, relevance, reverse-lookup, expand-query]
aliases: [search-commands, doc-search]
boundary: "Does not search task files - only product and engineering documentation"
references: [docs/search]
uses: [systems/cli]
intent: procedural
prerequisites: []
---

# Search Commands

> **TL;DR:** BM25+ scored search with field boosting and graph-aware retrieval across product and engineering docs

## Overview

Search commands find relevant documentation for skills to load as context. The algorithm uses BM25+ scoring via MiniSearch with field boosting, prefix search for partial term matching, and graph-aware retrieval that expands results with related documents via GraphComputer.

**Summary:** Search surfaces the right docs for any query.

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

## Commands

| Command | Purpose |
|---------|---------|
| `search-product keyword1 keyword2...` | Search product docs |
| `search-engineering keyword1 keyword2...` | Search engineering docs |
| `search-hybrid keyword1 keyword2...` | Search both doc types |
| `reverse-lookup {doc-id}` | Find all docs that reference or use a given doc |
| `expand-query keyword1 keyword2...` | Expand search terms using glossary aliases |

### Options

| Option | Description |
|--------|-------------|
| `--min-score=0.3` | Minimum relevance threshold |
| `--type=product\|engineering` | Filter hybrid search by doc type |

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

## Graph Expansion

Search results are enriched with graph-expanded `relatedDocs` via GraphComputer, surfacing documents connected through `references` and `uses` relationships even when they don't directly match the query terms.

## Reverse Lookup

`reverse-lookup` finds all docs that reference or use a given document, useful for impact analysis before making changes:

```bash
# Find all docs that reference auth/login
node .festinalente/scripts/festinalente.cjs reverse-lookup auth/login
```

Returns docs with `references` (hard dependency) and `uses` (soft dependency) relationships.

## Query Expansion

`expand-query` expands search terms using glossary aliases, showing what additional terms would be searched:

```bash
# See expanded terms for "auth"
node .festinalente/scripts/festinalente.cjs expand-query auth
# If glossary maps auth → [authentication, login], returns all three terms
```

## Boundaries

- **Does NOT:** Search task/spec/plan XML files
- **Does NOT:** Search code files → Use Grep for that
