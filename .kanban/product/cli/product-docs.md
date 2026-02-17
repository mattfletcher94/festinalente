---
id: cli/product-docs
title: "Product Documentation"
type: feature
summary: "Domain-organized markdown docs that provide AI context when working on tasks"
keywords: [product, docs, documentation, affects, domain, context, overview, feature, concept]
related: [cli/task-workflow, cli/commands]
updated: 2026-02-17
---

# Product Documentation

## Overview

Product documentation lives in `.kanban/product/` and represents the current state of your application. It provides context for the AI when working on tasks, helping it understand existing features and behavior.

## How It Works

1. User creates docs via `/kanban-map-product` (existing codebase) or `/kanban-define-product` (new project)
2. Docs are organized by domain folders (e.g., `auth/`, `billing/`)
3. Tasks link to relevant docs via the `affects` field
4. AI reads affected docs during refinement, scoping, and planning
5. `/kanban-docs` updates or creates docs based on what was implemented

### Document Types

| Type | Purpose |
|------|---------|
| `overview` | Product overview (one per project) |
| `feature` | How a specific feature works |
| `concept` | Domain terms, business rules, mental models |

### Directory Structure

```
.kanban/product/
├── overview.md           # Product overview
├── auth/                 # Domain folder
│   ├── login.md         # Feature doc
│   └── permissions.md   # Concept doc
└── billing/
    └── subscriptions.md
```

## Key Concepts

- **Domain**: A logical grouping of related features (folder name)
- **Doc ID**: Path-based ID matching file location (e.g., `auth/login`)
- **affects field**: Task frontmatter linking to product docs

## The `affects` Field

Tasks link to product docs via frontmatter:

```yaml
affects: [auth/login, auth/password-reset]  # Existing docs to UPDATE
affects: [payments/stripe]                   # New doc to CREATE
affects: []                                  # AI analyzes at doc time
```

## Interactions

- **Task Creation**: AI searches product docs for related features
- **Task Refinement**: AI reads affected docs to understand current behavior
- **Documentation Phase**: AI updates or creates docs based on implementation

## Limitations

- Docs must follow the domain/slug naming convention
- Product docs are separate from engineering docs (different purpose)
