---
id: docs/product
title: "Product Documentation"
type: feature
tldr: "User-facing feature documentation with YAML frontmatter and quality validation"
summary: "Product docs describe features from the user perspective, organized by domain with consistent frontmatter for search discovery, relationship tracking, and context selection. Quality is enforced by 9 automated checks."
keywords: [product, features, domains, frontmatter, user-facing, quality, validation, references, uses]
aliases: [product-docs, feature-docs]
boundary: "Does not cover technical implementation - see engineering docs"
references: [docs/engineering, cli/validation, cli/docs]
uses: [systems/data-model]
intent: reference
prerequisites: []
---

# Product Documentation

> **TL;DR:** User-facing feature documentation with YAML frontmatter and quality validation

## Overview

Product docs describe what features do from a user perspective. They're organized by domain and use consistent YAML frontmatter for search discoverability, relationship tracking, and quality validation.

**Summary:** Product docs answer "what does this feature do?" with enough structure for automated search and validation.

## Structure

```
.festinalente/product/
├── overview.md              (type: overview)
├── auth/
│   ├── _index.md            (type: domain)
│   ├── login.md             (type: feature)
│   └── registration.md      (type: feature)
└── tasks/
    ├── _index.md            (type: domain)
    └── management.md        (type: feature)
```

## Frontmatter Fields

### Required Fields

All doc types share the same validation — there are no type-specific required fields. However, quality checks enforce minimum standards:

| Field | Type | Quality Check | Threshold |
|-------|------|--------------|-----------|
| `id` | string | — | Derived from path if missing (e.g., `auth/login`) |
| `title` | string | — | Defaults to empty string if missing |
| `type` | string | — | Defaults to `feature`. Values: `feature`, `concept`, `domain`, `overview` |
| `tldr` | string | **has-tldr** (ERROR) | Must be >10 characters |
| `summary` | string | **has-summary** (ERROR) | Must be >50 characters |
| `keywords` | string[] | **has-keywords** (WARN) | Must have ≥2 items |

### Optional Fields

| Field | Type | Purpose |
|-------|------|---------|
| `aliases` | string[] | Synonym terms for search expansion |
| `boundary` | string | What this doc does NOT cover (reduces false search matches) |
| `references` | string[] | Doc IDs this doc references or links to |
| `uses` | string[] | Doc IDs this doc depends on or consumes data from |
| `contains` | string[] | Doc IDs contained within this domain (domain type only) |
| `domain` | string | Auto-derived from folder path, not set manually |
| `intent` | enum | Doc purpose: `reference` (schemas, APIs, lookups), `procedural` (workflows, how-tos), `conceptual` (explanations, rationale) |
| `prerequisites` | string[] | Doc IDs that must be read first for this doc to make sense (subset of references) |

### Relationship Fields: `references` vs `uses`

Both fields are arrays of doc IDs that establish one-directional relationships. The distinction is semantic:

| Field | Meaning | When to Use | Example |
|-------|---------|-------------|---------|
| `references` | This doc links to or mentions another doc | Cross-references, "see also" links, related features | A login doc references a registration doc |
| `uses` | This doc depends on or consumes data from another doc | Dependencies, data flow, system consumption | A search doc uses the data-model system |

Both are validated by `validate-docs` — broken references (pointing to non-existent docs) are reported as errors.

**Note:** There is no `contains` relationship field for feature docs. The `contains` field exists only on domain `_index.md` docs to list their child features.

## Quality Checks

The `validate-docs` command runs 9 quality checks on every product doc. Checks with ERROR severity block validation; WARN severity is advisory.

| Check ID | Severity | What It Checks | Threshold |
|----------|----------|----------------|-----------|
| **has-tldr** | ERROR | `tldr` frontmatter field exists and is meaningful | >10 characters |
| **has-summary** | ERROR | `summary` frontmatter field exists and is detailed | >50 characters |
| **has-keywords** | WARN | `keywords` array has enough terms for search | ≥2 items |
| **has-overview** | ERROR | Body contains an `## Overview` or `## What is this` heading | Heading present |
| **has-examples** | WARN | Body contains code blocks (```) or an `## Examples` section | At least one |
| **has-boundaries** | WARN | `boundary` frontmatter exists, OR body has `## Boundaries`, OR body contains "Does NOT" | Any one of three |
| **not-too-short** | WARN | Body has sufficient detail | >300 characters |
| **not-too-long** | WARN | Body is focused enough to be useful | <5000 characters |
| **has-intent** | WARN | `intent` frontmatter is a valid enum value | `reference`, `procedural`, or `conceptual` |

### Running Validation

```bash
# Validate all product docs
node .festinalente/scripts/festinalente.cjs validate-docs --type=product

# Validate all docs (product + engineering)
node .festinalente/scripts/festinalente.cjs validate-docs
```

Validation also checks:
- **Broken references** — `references` and `uses` arrays are checked for doc IDs that don't exist
- **Orphan detection** — Docs with no incoming references (excluding overview docs) are flagged

## Examples

### Minimal Valid Frontmatter

```yaml
---
id: auth/login
title: "User Login"
type: feature
tldr: "JWT-based authentication with email/password"
summary: "Login flow validates credentials against the user store and returns JWT access and refresh tokens with configurable expiry."
keywords: [auth, login, jwt, authentication]
boundary: "Does not cover registration or password reset"
references: [auth/registration]
uses: [systems/auth]
intent: procedural
prerequisites: []
---
```

### Domain Index Frontmatter

```yaml
---
id: auth/_index
title: "Authentication"
type: domain
tldr: "User identity and access management"
summary: "The auth domain handles user registration, login, session management, and access control."
keywords: [auth, login, sessions, access-control]
boundary: "Does not cover authorization roles (see permissions domain)"
contains: [auth/login, auth/registration, auth/sessions]
intent: reference
prerequisites: []
---
```

## Boundaries

- **Does NOT:** Explain implementation details → See [engineering docs](./engineering.md)
- **Does NOT:** Document code patterns → See engineering docs
- **Does NOT:** Search docs → See [search](./search.md)
- **Does NOT:** Validate doc quality → See [validation commands](../cli/validation.md)
