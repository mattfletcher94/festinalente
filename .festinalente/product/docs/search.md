---
id: docs/search
title: "Hybrid Search Algorithm"
type: feature
tldr: "Keyword + fuzzy search with boundary-aware scoring"
summary: "The hybrid search algorithm combines exact keyword matching with fuzzy title/body search, applies boundary penalties to reduce false matches, and uses glossary expansion for synonyms."
keywords: [search, hybrid, fuzzy, keywords, boundary, scoring, algorithm]
aliases: [search-algorithm, doc-search]
boundary: "Does not search code files - only markdown documentation"
references: [cli/search]
uses: [systems/cli]
updated: 2026-03-01
---

# Hybrid Search Algorithm

> **TL;DR:** Keyword + fuzzy search with boundary-aware scoring

## Overview

The hybrid search algorithm finds relevant documentation by combining multiple signals: exact keyword matches, fuzzy title/body matching, and boundary violation penalties.

**Summary:** Search balances precision and recall for documentation discovery.

## Scoring Formula

```
score = (keyword_weight × keyword_score)
      + (fuzzy_weight × fuzzy_score)
      - (boundary_penalty × boundary_violations)
```

### Weights

| Component | Weight |
|-----------|--------|
| Keywords | 0.3 |
| Fuzzy | configurable |
| Boundary penalty | 0.15 |

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

Searching "auth" also matches "authentication" and "login".

## Boundaries

- **Does NOT:** Search code files
- **Does NOT:** Return full doc content → Use Read for that
