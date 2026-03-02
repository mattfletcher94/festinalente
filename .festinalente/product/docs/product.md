---
id: docs/product
title: "Product Documentation"
type: feature
tldr: "User-facing feature documentation with YAML frontmatter"
summary: "Product docs describe features from the user perspective, organized by domain with consistent frontmatter for search discovery and context selection."
keywords: [product, features, domains, frontmatter, user-facing]
aliases: [product-docs, feature-docs]
boundary: "Does not cover technical implementation - see engineering docs"
references: [docs/engineering]
uses: [systems/data-model]
updated: 2026-03-01
---

# Product Documentation

> **TL;DR:** User-facing feature documentation with YAML frontmatter

## Overview

Product docs describe what features do from a user perspective. They're organized by domain and use consistent frontmatter for discoverability.

**Summary:** Product docs answer "what does this feature do?"

## Structure

```
.festinalente/product/
├── overview.md
├── auth/
│   ├── _index.md
│   ├── login.md
│   └── registration.md
└── tasks/
    ├── _index.md
    └── management.md
```

## Frontmatter Fields

| Field | Purpose |
|-------|---------|
| id | Unique identifier (domain/slug) |
| title | Display name |
| tldr | One-line summary (100 chars) |
| summary | One sentence for LLM discovery |
| keywords | Search terms |
| boundary | What this does NOT cover |
| related | Links to related docs |

## Boundaries

- **Does NOT:** Explain implementation details
- **Does NOT:** Document code patterns → See engineering docs
