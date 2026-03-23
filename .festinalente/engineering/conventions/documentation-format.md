---
id: "conventions/documentation-format"
title: "Documentation Format Convention"
type: convention
tldr: "Required frontmatter fields, quality thresholds, and relationship semantics for all docs"
summary: "Standardizes YAML frontmatter schemas, quality check thresholds, and relationship field semantics across product and engineering documentation"
keywords: [frontmatter, yaml, quality, references, uses, documentation, schema, convention]
aliases: [doc-format, frontmatter-schema, doc-quality]
boundary: "Does not apply to skill definitions, directive XML, or task artifacts"
references: [systems/validation, conventions/file-naming]
uses: []
paths: [.festinalente/product, .festinalente/engineering, .festinalente/templates]
updated: 2026-03-23
---

# Documentation Format Convention

> **TL;DR:** Required frontmatter fields, quality thresholds, and relationship semantics for all docs

## Overview

Standardized YAML frontmatter schemas and quality validation for all product and engineering documentation.

## Rule

Every product and engineering documentation file must include valid YAML frontmatter with required fields for its type. Documentation is validated at runtime by the [validation system](../systems/validation/_index.md) against 8 quality checks.

## Frontmatter Schemas by Doc Type

### Engineering Docs

All engineering docs share a base schema with type-specific values:

| Field | Required | Type | Description |
|-------|:--------:|------|-------------|
| `id` | Yes | string | Unique identifier: `systems/{name}`, `patterns/{name}`, `conventions/{name}`, or `overview` |
| `title` | Yes | string | Human-readable title |
| `type` | Yes | enum | `system`, `pattern`, `convention`, or `overview` |
| `tldr` | Yes | string | One-sentence summary (>10 chars, max ~100) |
| `summary` | Yes | string | Extended description (>50 chars) |
| `keywords` | Recommended | string[] | Search terms (≥2 for discoverability) |
| `aliases` | Optional | string[] | Alternative names for search |
| `boundary` | Recommended | string | What this doc's subject does NOT handle |
| `references` | Recommended | string[] | Other docs this builds upon or relates to |
| `uses` | Recommended | string[] | Systems/implementations that employ this |
| `paths` | Recommended | string[] | Code directory paths relevant to this doc |
| `updated` | Yes | date | `YYYY-MM-DD` format |

### Product Docs

Product docs share most fields with engineering but have type-specific differences:

**Feature docs** (`type: feature`):

| Field | Required | Type | Description |
|-------|:--------:|------|-------------|
| `id` | Yes | string | Unique identifier: `{domain}/{slug}` |
| `title` | Yes | string | Human-readable title |
| `type` | Yes | enum | `feature` |
| `tldr` | Yes | string | One-sentence summary (>10 chars, max ~100) |
| `summary` | Yes | string | One sentence for LLM discovery (>50 chars) |
| `keywords` | Recommended | string[] | Search terms (≥2) |
| `aliases` | Optional | string[] | Alternative names |
| `boundary` | Recommended | string | What this feature does NOT cover |
| `references` | Recommended | string[] | Other docs this relates to |
| `uses` | Recommended | string[] | Systems/features that use this |
| `updated` | Yes | date | `YYYY-MM-DD` format |

**Domain docs** (`type: domain`):

| Field | Required | Type | Description |
|-------|:--------:|------|-------------|
| `id` | Yes | string | `{domain}/_index` |
| `type` | Yes | enum | `domain` |
| `contains` | Recommended | string[] | Feature docs within this domain |
| *(plus shared fields above)* | | | |

### Schema Differences

| Field | Engineering | Product | Notes |
|-------|:-----------:|:-------:|-------|
| `paths` | Yes | No | Engineering maps to code directories |
| `contains` | No | Domain only | Domain docs list child features |
| `type` values | system, pattern, convention, overview | feature, domain, concept, overview | Different taxonomies |

## Quality Check Thresholds

These thresholds are enforced by `festinalente validate-docs`:

### Error-Level (must pass)

| Check | Threshold | What It Validates |
|-------|-----------|-------------------|
| `has-tldr` | `tldr.length > 10` | Frontmatter `tldr` field exists and is meaningful |
| `has-summary` | `summary.length > 50` | Frontmatter `summary` field exists and is detailed |
| `has-overview` | Body contains `## Overview` or `## What is this` | Every doc explains what it is |

### Warning-Level (should pass)

| Check | Threshold | What It Validates |
|-------|-----------|-------------------|
| `has-keywords` | `keywords.length >= 2` | Minimum search discoverability |
| `has-examples` | Body contains `` ``` `` or `## Examples` | Code examples included |
| `has-boundaries` | `boundary` field OR body has `## Boundaries` or `Does NOT` | Scope defined to prevent false search matches |
| `not-too-short` | `body.length > 300` | Minimum substantive content |
| `not-too-long` | `body.length < 5000` | Encourage splitting long docs |

## Relationship Field Semantics

### `references` — "builds upon / relates to"

- **Direction:** This doc → dependency docs
- **Meaning:** This doc's subject depends on, builds upon, or is architecturally related to the referenced docs
- **Example:** `dag-architecture` references `factory-di` because the DAG pattern uses factory functions
- **Used by:** patterns, conventions, systems
- **Validated:** Broken references flagged by `validate-docs`

### `uses` — "implemented by / employed in"

- **Direction:** This doc → implementation docs
- **Meaning:** These systems or components employ this pattern/convention in practice
- **Example:** `factory-di` pattern `uses: [systems/cli, systems/vscode-extension]` because both systems use factory DI
- **Used by:** patterns, conventions
- **Validated:** Broken uses flagged by `validate-docs`

### `related` — "sibling features" (product only)

- **Direction:** Peer-to-peer
- **Meaning:** These features are related at the product level
- **Used by:** product docs only

### When to Use Which

```
Does doc A depend on or build upon doc B?
  → A.references includes B

Does system B implement pattern/convention A?
  → A.uses includes B

Are product features A and B related?
  → A.related includes B, B.related includes A
```

## Rationale

Consistent frontmatter enables:
- **Search** — `keywords` and `aliases` power CLI search commands
- **Validation** — automated quality checks catch incomplete docs
- **Cross-referencing** — `references`/`uses` create a navigable doc graph
- **Orphan detection** — docs not referenced by anything are flagged

**Summary:** Schema consistency makes documentation discoverable, validatable, and navigable.

## Examples

### Correct

```yaml
---
id: "systems/auth"
title: "Authentication System"
type: system
tldr: "JWT-based authentication with refresh token rotation"
summary: "Handles user authentication via JWT access tokens and rotating refresh tokens, integrating with the session store"
keywords: [auth, jwt, tokens, session, login]
aliases: [authentication, login-system]
boundary: "Does not handle authorization (role checks) — see permissions system"
references: [patterns/factory-di, systems/database]
uses: []
paths: [apps/api/src/auth]
updated: 2026-03-23
---
```

### Incorrect

```yaml
---
id: "auth"
title: "Auth"
type: system
tldr: "Auth"
summary: "Auth system"
keywords: []
---
# Violates: id missing systems/ prefix, tldr too short (≤10),
#   summary too short (≤50), no keywords, missing updated,
#   missing boundary
```

**Summary:** Full frontmatter enables search, validation, and cross-referencing; sparse frontmatter breaks all three.

## Boundaries

When this convention does NOT apply:

- **Skill definitions** — skills use a different format (Handlebars-compiled Markdown)
- **Directive XML** — directives have their own XML schema
- **Task artifacts** — task.xml, spec.xml, plan.xml follow data-model schemas
- **Config files** — workflow.yaml, config.yaml have their own structures

## Enforcement

- **Runtime validation:** `festinalente validate-docs` runs all 8 quality checks
- **Broken reference detection:** `references` and `uses` fields checked against existing doc IDs
- **Orphan detection:** Docs with no incoming references flagged (overview docs excluded)
- **No build-time enforcement:** Quality checks do not run during `pnpm build:content`
