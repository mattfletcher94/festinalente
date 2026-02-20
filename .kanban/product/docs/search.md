---
id: "docs/search"
title: "Documentation Search"
type: feature
tldr: "Fuzzy search with exact matching, glossary expansion, and boundary penalties"
summary: "Hybrid search combining exact keyword/alias matching with Fuse.js fuzzy search. Glossary expands queries with synonyms. Boundary field reduces false matches."
keywords: [search, fuzzy, fuse, glossary, hybrid]
aliases: [search-docs, doc-search, hybrid-search]
boundary: "Does NOT search task files; only product and engineering docs"
related: [docs/product, docs/engineering, docs/context-selection]
updated: 2026-02-20
---

# Documentation Search

> **TL;DR:** Fuzzy search with exact matching, glossary expansion, and boundary penalties

## Overview

Documentation Search enables Claude to find relevant docs during task workflow. The hybrid algorithm combines exact keyword/alias matching with fuzzy search, uses the project glossary to expand queries with synonyms, and applies penalties when search terms appear in boundary fields (reducing false positives).

**Summary:** Smart search designed for AI context retrieval.

## How It Works

1. Query terms extracted from task title/description
2. Glossary expands terms with aliases (e.g., "sign in" → ["login", "auth"])
3. Search runs three passes:
   - Exact keyword match in `keywords` field (+0.3 score)
   - Exact alias match in `aliases` field (+0.25 score)
   - Fuzzy match in title, tldr, body (variable score)
4. Boundary penalty: -0.15 if term appears in `boundary` field
5. Results sorted by combined score

### Key Workflows

**Hybrid search (search-hybrid.cjs):**
- Searches both product and engineering docs
- Returns match source attribution
- Used during task creation and scoping

**Product search (search-product.cjs):**
- Searches only product docs
- Used for feature context

**Engineering search (search-engineering.cjs):**
- Searches only engineering docs
- Used for pattern discovery

**Summary:** Three search scripts for different context needs.

## Examples

### Typical Usage

```bash
# Search product docs
node .kanban/scripts/search-product.cjs login authentication

# Output:
# [
#   { "id": "auth/login", "score": 0.85, "matchedOn": ["keywords"] },
#   { "id": "auth/session", "score": 0.42, "matchedOn": ["fuzzy:body"] }
# ]
```

### Query Expansion

```bash
# Expand query using glossary
node .kanban/scripts/expand-query.cjs "sign in"

# Output (if glossary has alias):
# {
#   "original": "sign in",
#   "expanded": ["sign in", "login", "authentication"]
# }
```

**Summary:** Search with glossary expansion for better recall.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Search task files (task.xml, spec.xml, plan.xml)
- **Does NOT:** Search code files (use Grep for that)
- **Does NOT:** Modify search results (read-only)

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| --min-score | Minimum score threshold | 0.0 |
| Glossary | Term expansions | .kanban/glossary.yaml |

## Interactions

- **Glossary**: Expands search terms
- **Tasks**: Searches during create/scope
- **Context selection**: Uses search scores

## Limitations

- Fuzzy search may miss exact technical terms
- Boundary penalty is fixed at -0.15
- Glossary must be manually maintained
