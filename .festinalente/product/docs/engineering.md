---
id: docs/engineering
title: "Engineering Documentation"
type: feature
tldr: "Technical patterns, systems, and conventions documentation"
summary: "Engineering docs describe how things work technically, covering systems architecture, code patterns, and project conventions for developer reference."
keywords: [engineering, patterns, systems, conventions, technical]
aliases: [engineering-docs, technical-docs]
boundary: "Does not cover user-facing features - see product docs"
references: [docs/product]
uses: [systems/data-model]
updated: 2026-03-01
---

# Engineering Documentation

> **TL;DR:** Technical patterns, systems, and conventions documentation

## Overview

Engineering docs describe how things work technically. They're organized by type: systems, patterns, and conventions.

**Summary:** Engineering docs answer "how does this work?"

## Structure

```
.festinalente/engineering/
├── overview.md
├── systems/
│   └── auth/
│       └── _index.md
├── patterns/
│   └── responsive-design.md
└── conventions/
    └── file-naming.md
```

## Doc Types

| Type | Purpose |
|------|---------|
| system | Architecture and component docs |
| pattern | Reusable code patterns |
| convention | Project standards |

## Boundaries

- **Does NOT:** Describe user-facing behavior
- **Does NOT:** Duplicate product documentation
