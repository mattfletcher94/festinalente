---
id: docs/search
title: "BM25+ Search Algorithm"
type: feature
tldr: "BM25+ scored search with field boosting, prefix matching, and graph-aware retrieval"
summary: "The search algorithm uses BM25+ scoring via MiniSearch with field boosting, prefix search for partial terms, graph expansion for relatedDocs via GraphComputer, boundary penalties to reduce false matches, and glossary expansion for synonyms."
keywords: [search, bm25, minisearch, graph, prefix, idf, boundary, scoring, algorithm]
aliases: [search-algorithm, doc-search]
boundary: "Does not search code files - only markdown documentation"
references: [cli/search]
uses: [systems/cli]
intent: procedural
prerequisites: []
---

# BM25+ Search Algorithm

> **TL;DR:** BM25+ scored search with field boosting, prefix matching, and graph-aware retrieval

## Overview

The search algorithm finds relevant documentation using BM25+ scoring via MiniSearch. It applies field-level boosting to weight matches by importance, supports prefix search for partial term matching, and enriches results with graph-expanded relatedDocs via GraphComputer.

**Summary:** Search uses BM25+ for precise, recall-friendly documentation discovery.

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

**Usage contexts:** The search algorithm is invoked both during initial title-based doc discovery (when a task is first created) and during post-QA doc link refinement (where full task context is used to find additional relevant docs). The algorithm itself is the same in both cases; only the input keywords differ.

## Scoring Formula

BM25+ scoring is handled by MiniSearch with field-level boosting. Scores are normalized to a 0-1 range. Native OR mode combines terms so any matching term contributes to the score. Prefix search allows partial term matching for improved recall.

### Field Boosting

| Field | Boost |
|-------|-------|
| keywords | 7 |
| aliases | 7 |
| title | 5 |
| tldr | 5 |
| id | 4 |
| summary | 3 |
| domain | 2 |
| body | 1 |

Boundary penalties are applied post-scoring to reduce false positives.

## Graph Expansion

Search results are enriched with graph-expanded `relatedDocs` via GraphComputer. Documents connected through `references` and `uses` relationships are surfaced even when they don't directly match query terms, improving contextual retrieval.

## Boundary Field

The `boundary` frontmatter field documents what a doc does NOT cover:

```yaml
boundary: "Does not cover password reset or MFA"
```

Searches for "password reset" will penalize this doc, reducing false positives.

## Glossary Expansion

Searches expand via `.festinalente/glossary.yaml`:

```yaml
terms:
  - term: "auth"
    aliases: ["authentication", "login"]
```

Searching "auth" also matches "authentication" and "login". BM25 prefix search supplements glossary synonyms by matching partial terms (e.g., "auth" matches "authentication" directly via prefix).

## Boundaries

- **Does NOT:** Search code files
- **Does NOT:** Return full doc content → Use Read for that
