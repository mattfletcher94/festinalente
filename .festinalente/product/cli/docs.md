---
id: cli/docs
title: "Documentation Commands"
type: feature
tldr: "List and check product/engineering docs via festinalente.cjs script"
summary: "Documentation commands provide list-product, list-engineering, check-product, and check-engineering operations with JSON output for skills to discover and verify documentation."
keywords: [docs, documentation, list, check, product, engineering, commands, filtering]
aliases: [doc-commands, docs-crud]
boundary: "Does not search docs (see search commands) or validate quality (see validation commands)"
references: [cli/search, cli/validation]
uses: [systems/cli]
intent: procedural
prerequisites: []
---

# Documentation Commands

> **TL;DR:** List and check product/engineering docs via festinalente.cjs script

## Overview

Documentation commands provide listing and existence-checking for product and engineering docs. Skills use these to discover available docs and verify that referenced docs exist before linking.

**Summary:** Doc commands are the discovery layer that skills use to find and verify documentation references.

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

## Commands

| Command | Purpose | Output |
|---------|---------|--------|
| `list-product` | List all product docs | JSON with count and docs array |
| `list-product --type={t}` | Filter by type (feature, concept, domain, overview) | Filtered docs |
| `list-product --domain={d}` | Filter by domain (e.g., auth, cli) | Filtered docs |
| `list-engineering` | List all engineering docs | JSON with count and docs array |
| `list-engineering --type={t}` | Filter by type (pattern, system, convention) | Filtered docs |
| `list-engineering --system={s}` | Filter by system (e.g., cli, data-model) | Filtered docs |
| `check-product id1 id2 ...` | Check if product docs exist by ID | JSON with results and summary |
| `check-engineering id1 id2 ...` | Check if engineering docs exist by ID | JSON with results and summary |

## Examples

```bash
# List all product docs
node .festinalente/scripts/festinalente.cjs list-product
# → { "count": 39, "docs": [{ "id": "cli/_index", "title": "CLI", "type": "domain", ... }, ...] }

# List only feature docs in the skills domain
node .festinalente/scripts/festinalente.cjs list-product --type=feature --domain=skills

# List engineering docs filtered by system
node .festinalente/scripts/festinalente.cjs list-engineering --system=cli

# Check if specific product docs exist
node .festinalente/scripts/festinalente.cjs check-product auth/login auth/mfa
# → { "results": [{ "id": "auth/login", "exists": true, "path": "..." }, { "id": "auth/mfa", "exists": false, "path": "..." }],
#     "summary": { "existing": ["auth/login"], "missing": ["auth/mfa"] } }

# Check engineering docs
node .festinalente/scripts/festinalente.cjs check-engineering systems/auth patterns/middleware
```

## ID-to-Path Mapping

- **Product docs:** ID `auth/login` → `.festinalente/product/auth/login.md`
- **Engineering docs:** ID `systems/cli` → `.festinalente/engineering/systems/cli/_index.md`
- **Top-level docs:** ID `overview` → `.festinalente/product/overview.md`

Domain/system is derived from the folder structure, not from frontmatter.

## Boundaries

- **Does NOT:** Search doc content → See [search commands](./search.md)
- **Does NOT:** Validate doc quality → See [validation commands](./validation.md)
- **Does NOT:** Create or modify docs → Skills handle documentation creation
