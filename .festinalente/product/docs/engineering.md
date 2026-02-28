---
id: "docs/engineering"
title: "Engineering Documentation"
type: feature
tldr: "Technical patterns, systems, and conventions in .kanban/engineering/"
summary: "Markdown docs describing technical implementation details: patterns to follow, system architecture, coding conventions. Organized by type: systems, patterns, conventions."
keywords: [engineering, patterns, systems, conventions, technical]
aliases: [engineering-docs, technical-docs, architecture-docs]
boundary: "Does NOT describe user-facing behavior; only implementation details"
related: [docs/product, docs/search]
updated: 2026-02-28
---

# Engineering Documentation

> **TL;DR:** Technical patterns, systems, and conventions in .kanban/engineering/

## Overview

Engineering Documentation describes how to build things correctly. It covers patterns to follow, system architecture, and coding conventions. Claude reads these docs to implement tasks in a way that follows established practices.

**Summary:** Technical implementation guidance for consistent development.

## How It Works

1. Docs stored in `.kanban/engineering/{type}/{name}.md`
2. Three types: systems, patterns, conventions
3. Frontmatter includes: id, title, type, tldr, summary, keywords, aliases
4. Tasks link to engineering docs via `engineering` field
5. Claude reads docs during scoping and implementation

### Key Workflows

**Doc types:**

```
.kanban/engineering/
├── overview.md
├── systems/
│   ├── auth/
│   │   ├── _index.md        ← System overview
│   │   └── validator.md     ← Component
│   └── storage/
│       └── _index.md
├── patterns/
│   ├── factory-functions.md
│   └── error-handling.md
└── conventions/
    ├── file-naming.md
    └── imports.md
```

- `systems/{name}/`: System architecture (e.g., auth, state, routing)
- `patterns/{name}.md`: Reusable patterns (e.g., factory-functions, error-handling)
- `conventions/{name}.md`: Coding conventions (e.g., file-naming, imports)

**System doc sections:**
- Overview, Components, Architecture, Data Flow, Interactions, Boundaries, Configuration
- **Extension Points** - How to add new components (template file, checklist, pitfalls)

**Path resolution:**
- `overview` → `.kanban/engineering/overview.md`
- `systems/auth` → `.kanban/engineering/systems/auth/_index.md`
- `systems/auth/validator` → `.kanban/engineering/systems/auth/validator.md`
- `patterns/acyclic-arch` → `.kanban/engineering/patterns/acyclic-arch.md`

**Summary:** Type-based organization with consistent path resolution.

## Examples

### Typical Usage

```markdown
---
id: "patterns/factory-functions"
title: "Factory Functions"
type: pattern
tldr: "Create objects using factory functions instead of classes"
summary: "Factory functions provide better testability and composition than classes. Use createX naming convention."
keywords: [factory, functions, patterns, testability]
aliases: [factories, create-functions]
boundary: "Does NOT cover dependency injection setup"
related: [patterns/dependency-injection]
updated: 2026-02-20
---

# Factory Functions

> **TL;DR:** Create objects using factory functions instead of classes

## Definition
...

## Examples

```typescript
// src/services/createAuthService.ts
export function createAuthService(deps: AuthDeps): AuthService {
  return {
    login: (email, password) => { ... },
    logout: () => { ... }
  }
}
```
```

**Summary:** Pattern docs with concrete code examples.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Describe user-facing behavior → See [docs/product](./product.md)
- **Does NOT:** Define task requirements → Those are in task.xml

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Path | Engineering doc location | .kanban/engineering/ |

## Interactions

- **Tasks**: Linked via `engineering` field in task.xml
- **Search**: Searchable via search-engineering.cjs
- **Scoping**: Patterns found during structured research

## Limitations

- Must have valid frontmatter (id, title, type, tldr, summary)
- Code examples should include file paths
- Pattern references should include file:line
