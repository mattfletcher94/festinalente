# Product Documentation System Plan

## Overview

This document captures the design decisions for implementing a product documentation system in Claude Kanban. Product docs serve two audiences:

1. **LLMs** - Context during scoping/implementation of features
2. **Non-engineers** - PMs, customer success, and others understanding how features work

The repository remains the source of truth. Product docs describe features in user-facing terms.

---

## Design Decisions

### Location

Product docs live in `.kanban/product/` alongside other kanban artifacts:

```
.kanban/
├── tasks/
├── specs/
├── plans/
├── product/     # product documentation
├── skills/
└── board.yaml
```

### Two-Tier Retrieval

To minimize token usage, discovery and reading are separated:

| Tier | Purpose | Token Cost |
|------|---------|------------|
| **Discovery** | Find relevant docs via grep on frontmatter | ~0 (tool call) |
| **Reading** | Read only the matched files | Targeted |

The LLM never reads all product docs. Grep filters first, then targeted reads.

---

## Frontmatter Schema

Every product doc has this frontmatter:

```yaml
---
id: {slug}                    # required - unique identifier for linking
title: {Feature Name}         # required - human-readable name
summary: {One sentence}       # required - LLM discovery (grep target)
keywords: [{terms}]           # required - searchable terms for grep
related: []                   # optional - soft "see also" references
uses: []                      # optional - features this depends on
extends: []                   # optional - features this builds upon
updated: {YYYY-MM-DD}         # required - last update date
---
```

### Required Fields

| Field | Purpose |
|-------|---------|
| `id` | Unique identifier for linking from tasks and other docs |
| `title` | Human-readable feature name |
| `summary` | 1-2 sentence description for LLM discovery |
| `keywords` | Array of searchable terms for grep-based discovery |
| `updated` | Date of last update |

### Relationship Fields (Optional)

| Field | Meaning | Example |
|-------|---------|---------|
| `related` | Soft reference, "see also" | `related: [user-management]` |
| `uses` | This feature depends on another | `uses: [authentication]` |
| `extends` | This feature builds upon another | `extends: [base-editor]` |

### Relationship Rules

- **Forward references only** - docs declare what they `use`, `extend`, or `relate` to
- **No reverse references** - no `used-by` field; grep handles reverse lookups
- **Grep for reverse lookup** - to find "what uses authentication?", grep for `uses:.*authentication`

---

## Content Template

Product docs reflect **current state** only. Git history captures evolution.

```markdown
---
id: {slug}
title: {Feature Name}
summary: {One sentence description}
keywords: [{searchable, terms}]
related: []
uses: []
extends: []
updated: {YYYY-MM-DD}
---

# {Feature Name}

## Overview
{What this feature is and why it exists. 2-3 sentences max.}

## How It Works
{User-facing behavior. What can users do? What happens when they do it?}

## Key Concepts
{Domain terms or mental models. Optional - omit if straightforward.}

## Configuration
{Settings, options, customization. Optional - omit if none.}

## Interactions
{How this relates to other features. Optional - omit if standalone.}

## Limitations
{Known constraints, edge cases. Helps set expectations.}
```

### Section Purposes

| Section | For LLM | For Non-Engineers |
|---------|---------|-------------------|
| Overview | Quick context | Quick understanding |
| How It Works | Behavior specification | User guide |
| Key Concepts | Domain knowledge | Terminology reference |
| Configuration | What's adjustable | Self-service setup |
| Interactions | Dependency awareness | Feature discovery |
| Limitations | Scope boundaries | Expectation setting |

---

## Task Linkage

Tasks reference product docs via frontmatter:

```yaml
---
id: "023"
title: "Add password reset flow"
product-docs: [authentication, notifications]
---
```

### When Product Docs Are Linked

The `product-docs` field is populated **organically** during early phases:

| Phase | What Happens |
|-------|--------------|
| Define | LLM recognizes obvious connections (e.g., "password reset" → `authentication`) |
| Refine | Additional connections emerge as requirements clarify |
| Scope | Research may reveal more related features |
| Plan | Final connections established |

No rigid rule - the LLM adds references as relevance becomes apparent.

---

## LLM Discovery Algorithm

When the LLM needs product context (during scoping, implementation, or update-docs):

```
1. Check task's `product-docs` field for explicit links
2. Grep `.kanban/product/**/*.md` for keywords from task
   - Search against: summary, keywords fields in frontmatter
3. For each match, optionally follow `uses` and `related` edges (1 level)
4. Read only the resulting set of files
```

### Grep Commands for Discovery

```bash
# Find product docs by keyword (searches frontmatter)
grep -l "keywords:.*authentication" .kanban/product/*.md

# Find product docs by summary content
grep -l "summary:.*login" .kanban/product/*.md

# Find what uses a specific feature (reverse lookup)
grep -l "uses:.*authentication" .kanban/product/*.md

# Find related features
grep -l "related:.*user-management" .kanban/product/*.md
```

This ensures:
- Zero tokens spent on irrelevant docs
- Explicit links always included
- Keyword search catches implicit connections

---

## Update-Docs Workflow

The `update-docs-complete-task` phase updates product documentation:

### Algorithm

```
1. Get task's `product-docs` field
2. Grep for additional relevant docs based on task content
3. For each relevant doc:
   - If exists: Update sections affected by the task
   - If missing: Create new doc with full template
4. Update `updated` date in frontmatter
5. Commit: docs({id}): product - {description}
6. Move task to Done
```

### Create vs Update

The LLM infers intent from file existence:
- File exists → Update relevant sections
- No relevant file exists → Create new doc

No explicit `action: create|update` declaration needed.

### Current State Only

Product docs reflect current state. No changelog section - git history provides that context when needed.

---

## Cross-Feature Documentation

Features often overlap (e.g., "charts" used in "presentations").

### Handling Composition

Use the `uses` relationship:

```yaml
# presentations.md
---
id: presentations
title: Presentations
uses: [charts, images, videos]
---

# Presentations

## Interactions

### Charts
Charts can be embedded in slides. When embedded:
- Charts remain live-linked to source data
- Double-click to edit in-place

For full chart documentation, see [Structured Charts](charts.md).
```

### Where Context-Specific Behavior Lives

- **Simple integration**: Brief mention in Interactions section with link
- **Complex integration**: Dedicated subsection in the consuming feature's doc
- **Very complex**: Consider a separate integration doc (project's judgment)

The rule: Document behavior where users would look for it.

---

## Configuration

Add to `board.yaml` settings:

```yaml
settings:
  version: "2.0"
  productDocsPath: ".kanban/product"  # default location
```

---

## Example

### Task

```yaml
---
id: "015"
title: "Add OAuth login"
status: update-docs
product-docs: [authentication]
---
```

### Product Doc (after update)

```markdown
---
id: authentication
title: User Authentication
summary: Email/password and OAuth login with JWT sessions
keywords: [auth, login, logout, oauth, jwt, session, google, github]
related: [user-management]
uses: []
extends: []
updated: 2026-02-13
---

# User Authentication

## Overview
Secure user authentication supporting email/password and OAuth providers.

## How It Works
Users can sign in via:
- Email and password (traditional)
- Google OAuth
- GitHub OAuth

On successful login, a JWT session token is issued and stored in an httpOnly cookie.

## Configuration
OAuth providers are configured in Settings > Integrations. Each provider requires:
- Client ID
- Client Secret
- Callback URL

## Limitations
- OAuth tokens refresh automatically; manual refresh not supported
- Maximum 3 active sessions per user
```

---

## Implementation Tasks

### 1. Create Product Doc Template

**File:** `.claudeban/templates/product-doc.md`

**Content:**
```markdown
---
id: {slug}
title: {Feature Name}
summary: {One sentence description}
keywords: []
related: []
uses: []
extends: []
updated: {YYYY-MM-DD}
---

# {Feature Name}

## Overview
{What this feature is and why it exists. 2-3 sentences max.}

## How It Works
{User-facing behavior. What can users do? What happens when they do it?}

## Key Concepts
{Domain terms or mental models. Optional - omit if straightforward.}

## Configuration
{Settings, options, customization. Optional - omit if none.}

## Interactions
{How this relates to other features. Optional - omit if standalone.}

## Limitations
{Known constraints, edge cases. Helps set expectations.}
```

---

### 2. Update Task Frontmatter Schema

**File:** `.kanban/config/schema.task.json` (or equivalent)

**Add field:**
```json
{
  "product-docs": {
    "type": "array",
    "items": { "type": "string" },
    "description": "IDs of related product documentation files"
  }
}
```

---

### 3. Update Task Template

**File:** `.claudeban/templates/task.md`

**Add to frontmatter:**
```yaml
product-docs: []              # IDs of related product docs
```

---

### 4. Update Commands

#### 4.1 `define-task.md`

**Add to workflow:**
- When creating a task, if the title/description clearly relates to an existing product doc, add its ID to `product-docs` field
- Check for existing product docs: `grep -l "keywords:.*{relevant-term}" .kanban/product/*.md`

#### 4.2 `backlog-refine-task.md`

**Add to workflow:**
- As requirements are clarified, identify additional product docs that may be relevant
- Update `product-docs` field if new connections are discovered

#### 4.3 `update-docs-complete-task.md`

**Replace current workflow with:**

```markdown
# Update Task Documentation

Update product documentation, commit, and move to Done.

## Workflow

1. **Read the task file** to get context and `product-docs` field

2. **Discover relevant product docs:**
   - Start with explicit `product-docs` from task frontmatter
   - Grep for additional matches: `grep -l "keywords:.*{task-keyword}" .kanban/product/*.md`
   - Do NOT read all product docs - only grep to find relevant files

3. **For each relevant product doc:**
   - If file exists: Read it, update affected sections to reflect current state
   - If no relevant doc exists and feature is new: Create new doc following template at `.claudeban/templates/product-doc.md`

4. **Update frontmatter:**
   - Set `updated: {today's date}` in each modified product doc

5. **Commit:**
   ```
   docs({id}): product - {brief description of doc changes}
   ```

6. **Update task status** to `done`

## Template Reference

New product docs follow: `.claudeban/templates/product-doc.md`

## Product Doc Location

Product docs are stored in: `.kanban/product/`

File naming: `{id}.md` where id matches the frontmatter `id` field (e.g., `authentication.md`)
```

---

### 5. Update board.yaml Settings Schema

**File:** `.claudeban/templates/board.yaml`

**Add to settings:**
```yaml
settings:
  version: "2.0"
  idPrefix: ""
  idPadding: 3
  archiveOnComplete: false
  productDocsPath: ".kanban/product"  # NEW: path to product documentation
```

---

### 6. Create Product Folder in Example Project

**Create:** `example-project/.kanban/product/.gitkeep`

---

### 7. Update README.md

**Add new section after "Functional Specification" section (~line 313):**

```markdown
## Product Documentation

Product docs describe features for non-technical stakeholders (PMs, customer success) and provide context for the LLM during task work.

**Location:** `.kanban/product/`

### Product Doc Format

```markdown
---
id: authentication
title: User Authentication
summary: Email/password and OAuth login with JWT sessions
keywords: [auth, login, logout, oauth, jwt, session]
related: [user-management]
uses: []
extends: []
updated: 2026-02-13
---

# User Authentication

## Overview
Secure user authentication supporting email/password and OAuth providers.

## How It Works
Users can sign in via email/password or OAuth providers (Google, GitHub).

## Key Concepts
- **Session**: A JWT token stored in an httpOnly cookie
- **OAuth**: Third-party authentication delegation

## Configuration
OAuth providers configured in Settings > Integrations.

## Interactions
Works with [User Management](user-management.md) for account creation.

## Limitations
- Maximum 3 active sessions per user
```

### Product Doc Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier (matches filename) |
| `title` | Yes | Human-readable feature name |
| `summary` | Yes | One sentence description |
| `keywords` | Yes | Searchable terms for discovery |
| `related` | No | Related feature IDs ("see also") |
| `uses` | No | Features this depends on |
| `extends` | No | Features this builds upon |
| `updated` | Yes | Last update date |

### Task Linkage

Tasks reference product docs via the `product-docs` frontmatter field:

```yaml
---
id: "015"
title: "Add OAuth login"
product-docs: [authentication]
---
```

The LLM populates this field during define/refine phases when connections are apparent.

### When Product Docs Are Updated

During the `update-docs-complete-task` phase:
1. LLM identifies relevant product docs from task's `product-docs` field
2. Updates existing docs or creates new ones as needed
3. Docs reflect current state (no changelog - git history provides that)
```

**Update Project Structure section (~line 546) to include product folder:**

```
project/
├── .kanban/
│   ├── board.yaml              # Board configuration
│   ├── config/
│   │   ├── schema.task.json    # Task frontmatter schema
│   │   └── schema.plan.json    # Plan frontmatter schema
│   ├── tasks/
│   │   ├── 001-add-feature.md  # Task file
│   │   └── 002-fix-bug.md      # Another task
│   ├── specs/
│   │   └── 001.spec.md         # Functional specification
│   ├── plans/
│   │   └── 001.plan.md         # Implementation plan
│   ├── product/                 # NEW: Product documentation
│   │   └── authentication.md   # Feature documentation
│   └── skills/
│       ├── check-typescript.md # Verification check
│       └── check-tests.md      # Another check
├── .claudeban/                  # (or .claude/)
│   ├── templates/
│   │   ├── board.yaml          # Board initialization template
│   │   ├── task.md             # Task file template
│   │   ├── spec.md             # Functional specification template
│   │   ├── plan.md             # Implementation plan template
│   │   └── product-doc.md      # NEW: Product documentation template
│   ├── commands/
│   │   └── kanban/             # Kanban commands
│   └── skills/
│       └── kanban-*/           # Built-in kanban skills
└── ... your code ...
```

**Update Templates table (~line 159) to include product-doc.md:**

| Template | Purpose |
|----------|---------|
| `task.md` | Master template for kanban task files |
| `spec.md` | Functional specification template |
| `plan.md` | Implementation plan template |
| `product-doc.md` | Product documentation template |

---

## Implementation Checklist

- [ ] Create `.claudeban/templates/product-doc.md` with template content (see section 1)
- [ ] Add `product-docs` field to task frontmatter schema (see section 2)
- [ ] Update `.claudeban/templates/task.md` to include `product-docs: []` field (see section 3)
- [ ] Update `define-task.md` command to link product docs when obvious (see section 4.1)
- [ ] Update `backlog-refine-task.md` command to discover product doc links (see section 4.2)
- [ ] Update `update-docs-complete-task.md` command with full workflow (see section 4.3)
- [ ] Add `productDocsPath` to board.yaml settings (see section 5)
- [ ] Create `example-project/.kanban/product/.gitkeep` (see section 6)
- [ ] Update README.md with Product Documentation section (see section 7)
- [ ] Update README.md Project Structure to show product folder (see section 7)
- [ ] Update README.md Templates table to include product-doc.md (see section 7)

---

## Summary

| Aspect | Decision |
|--------|----------|
| Location | `.kanban/product/` |
| Discovery | Grep frontmatter (0 tokens) |
| Source of truth | Frontmatter in each doc |
| Relationships | Forward only (`uses`, `related`, `extends`) |
| Reverse lookup | Grep |
| Required fields | `id`, `title`, `summary`, `keywords`, `updated` |
| Content | 6 sections, current state only |
| Task linkage | `product-docs` field, populated organically |
| Update workflow | Grep to find, create if missing |
