---
id: "cli/docs"
title: "Documentation Skills"
type: feature
tldr: "Skills for creating and updating product/engineering documentation"
summary: "Interactive skill for maintaining product and engineering documentation, including context selection and update verification"
keywords: [docs, documentation, product-docs, engineering-docs, context]
aliases: [documentation, doc-management]
boundary: "Does not validate or audit documentation - see Quality Skills"
related: [cli/discovery, cli/quality]
updated: 2026-02-19
---

# Documentation Skills

> **TL;DR:** Skills for creating and updating product/engineering documentation

## Overview

Documentation Skills allow users to create and update documentation linked to tasks. This is important because tasks reference product and engineering docs for context during implementation.

**Summary:** Maintain documentation that provides context for task implementation.

## How It Works

1. User invokes /kanban-docs for a task
2. Skill identifies affected documentation from task metadata
3. Skill guides user through updates
4. Result: Documentation updated with fresh timestamps

### Key Workflows

**Documentation Update Flow:**
- Read task affects/engineering fields
- Check existing documentation
- Guide user through updates
- Update `verified` timestamps

**Summary:** Update docs based on task metadata and implementation changes.

## Skills

### /kanban-docs

Creates or updates documentation for a task.

- **Reads**: Task `affects` (product docs) and `engineering` (engineering docs) fields
- **Checks**: Documentation freshness (verified date vs code changes)
- **Updates**: Documentation content and verified timestamps

```
/kanban-docs TASK-003
```

## Documentation Structure

### Product Documentation

Located in `.kanban/product/`:

```
.kanban/product/
├── overview.md           # Product overview
├── {domain}/
│   ├── _index.md        # Domain overview
│   ├── {feature}.md     # Feature documentation
│   └── {concept}.md     # Concept documentation
```

**Frontmatter fields:**
- `id`: Document identifier (e.g., "auth/login")
- `type`: overview | domain | feature | concept
- `tldr`: Single sentence summary (max 100 chars)
- `summary`: One sentence for LLM discovery
- `keywords`: Search terms
- `aliases`: Alternate names
- `boundary`: What this doc does NOT cover
- `verified`: Last verification date

### Engineering Documentation

Located in `.kanban/engineering/`:

```
.kanban/engineering/
├── overview.md           # Engineering overview
├── systems/
│   └── {system}.md      # System documentation
├── patterns/
│   └── {pattern}.md     # Pattern documentation
└── conventions/
    └── {convention}.md  # Convention documentation
```

## Examples

### Typical Usage

```
User: /kanban-docs TASK-003

Claude: Task TASK-003 affects these docs:
- product: auth/login, auth/session
- engineering: patterns/error-handling

Checking freshness...
- auth/login: STALE (last verified 45 days ago, code changed)
- auth/session: FRESH
- patterns/error-handling: FRESH

Let me update auth/login...

Is this overview still accurate?
[Current overview text]

[Q&A continues...]

Updated: auth/login (verified: 2026-02-19)
```

### Edge Case: Stale Documentation

```
Claude: Documentation freshness check:

STALE (3 docs):
- auth/login: Code changed in src/auth/login.ts since last verification
- auth/session: 60+ days since verification
- patterns/error-handling: Referenced file deleted

Would you like to update these now?
```

**Summary:** Docs skill identifies, checks, and updates affected documentation.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Validate documentation quality → See [Quality Skills](./quality.md)
- **Does NOT:** Create new documentation structure → See [Discovery Skills](./discovery.md)
- **Does NOT:** Search documentation (use scripts for that)

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| stale-days | Days before doc is considered stale | 30 |
| tier | Context detail level (minimal/standard/full) | standard |

## Interactions

- **Lifecycle Skills**: Called during update-docs phase after QA
- **Quality Skills**: Quality validation can trigger doc updates

## Limitations

- Documentation must exist before updating (use discovery skills to create)
- Freshness tracking requires `verified` and `code_refs` fields in frontmatter
- Manual Q&A required for updates (not fully automated)
