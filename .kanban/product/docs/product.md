---
id: "docs/product"
title: "Product Documentation"
type: feature
tldr: "User-facing feature documentation in .kanban/product/"
summary: "Markdown docs describing features from user perspective: what they do, how they work, boundaries. Organized by domain folders with _index.md files."
keywords: [product, features, user-facing, documentation, domain]
aliases: [product-docs, feature-docs]
boundary: "Does NOT describe implementation details; only user-facing behavior"
related: [docs/engineering, docs/search]
updated: 2026-02-25
---

# Product Documentation

> **TL;DR:** User-facing feature documentation in .kanban/product/

## Overview

Product Documentation describes features from the user's perspective. Each doc explains what a feature does, how users interact with it, and its boundaries (what it does NOT do). Docs are organized by domain folders matching business areas.

**Summary:** User-perspective feature documentation for Claude context.

## How It Works

1. Docs stored in `.kanban/product/{domain}/{feature}.md`
2. Each domain has an `_index.md` describing the domain
3. Frontmatter includes: id, title, type, tldr, summary, keywords, aliases, boundary
4. Tasks link to product docs via `affects` field
5. Claude reads docs during scoping and implementation

### Key Workflows

**Doc structure:**

```
.kanban/product/
├── overview.md              ← Product overview
├── auth/
│   ├── _index.md            ← Domain overview
│   ├── login.md             ← Feature doc
│   └── registration.md
├── tasks/
│   ├── _index.md
│   ├── create.md
│   └── workflow.md
└── docs/
    └── ...
```

- `overview.md`: Product-level overview
- `{domain}/_index.md`: Domain overview
- `{domain}/{feature}.md`: Individual feature

**Frontmatter fields:**
- `tldr`: Max 100 chars, shown in minimal context
- `summary`: One sentence for standard context
- `boundary`: What this feature does NOT cover
- `keywords` / `aliases`: For search matching

**Summary:** Hierarchical docs with rich frontmatter for search and context.

## Examples

### Typical Usage

```markdown
---
id: "auth/login"
title: "Login"
type: feature
tldr: "Email/password authentication with session creation"
summary: "Handles user login via email and password, creates session token, redirects to dashboard."
keywords: [login, authentication, session, email]
aliases: [sign-in, signin]
boundary: "Does NOT handle registration or password reset"
related: [auth/registration, auth/password-reset]
updated: 2026-02-20
---

# Login

> **TL;DR:** Email/password authentication with session creation

## Overview
...
```

**Summary:** Standard markdown with structured frontmatter.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Describe implementation details → See [docs/engineering](./engineering.md)
- **Does NOT:** Define task requirements → Those are in task.xml

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Path | Product doc location | .kanban/product/ |

## Interactions

- **Tasks**: Linked via `affects` field in task.xml
- **Search**: Searchable via search-product.cjs
- **Context**: Loaded during implementation

## Limitations

- Must have valid frontmatter (id, title, type, tldr, summary)
- Boundary field important for search accuracy
- Stub docs marked with `stub: true` need completion
