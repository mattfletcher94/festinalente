# Plan: Product Documentation as Source of Truth

## Overview

This plan explores restructuring the Claude Kanban system so that **product documentation lives alongside code** and becomes the authoritative source of truth for the product. The goal is that PMs, designers, and stakeholders can work directly in markdown files (rather than tools like Linear), and these docs stay synchronized with implementation.

## Current State Analysis

### What Exists Today

The system already has foundational support for product documentation:

1. **Directory Structure**: `.kanban/product/` stores product docs
2. **Template**: `product-doc.md` defines structure (overview, how it works, key concepts, configuration, interactions, limitations)
3. **Creation Skills**:
   - `kanban-define-product` - Socratic Q&A for new products
   - `kanban-map-product` - Analyzes existing codebase and generates docs
4. **Update Workflow**: `kanban-docs` skill prompts for doc updates before PR

### Current Gaps (To Be Validated)

- Product docs are optional, not required
- No enforced structure for organizing many docs
- No explicit linking between tasks and product docs they affect
- No PM-specific workflows for editing requirements
- No versioning or approval workflow for doc changes
- Unclear how docs scale as product grows

---

## Socratic Exploration

### Questions to Resolve

The following questions need answers to design the right solution:

#### 1. Documentation Scope & Audience

- **Q1.1**: Who are the primary audiences for product documentation? (PMs, developers, end-users, stakeholders?)
  - **ANSWER**: PMs, Engineers, and LLMs. The docs are for *builders*, not end-users. The key use case is LLMs gathering context when working through task definition, planning, and scoping.
- **Q1.2**: What types of documents should live in the repo? (PRDs, specs, user guides, API docs, decision logs?)
  - **ANSWER**: Three essential types:
    1. **Product Overview** - What the product is, who it's for, core value prop
    2. **Feature Docs** - How each feature works, its purpose, constraints
    3. **Domain/Concepts** - Key terms, business rules, mental models
  - Decision records and roadmap are nice-to-have, not essential
  - **IMPORTANT**: Product docs are for PRODUCT (user-facing behavior), NOT technical implementation. Technical documentation will be a separate process later.
- **Q1.3**: Should there be different doc types with different purposes?
  - **ANSWER**: Yes - see above. Three distinct types serving different context needs.

#### 2. Organization & Structure

- **Q2.1**: How should docs be organized as the product grows? (By feature? By domain? By audience?)
  - **ANSWER**: Domain-based grouping with dynamic script discovery (NO static index files):
    ```
    .kanban/product/
    ├── overview.md              # Product overview (required)
    ├── auth/                    # Domain folder
    │   ├── login.md            # Feature doc
    │   └── permissions.md      # Concept doc
    └── billing/
        └── subscriptions.md
    ```
  - Scripts scan filesystem dynamically - no index.md files to maintain
  - LLM runs `list-product.ts` to discover all docs
- **Q2.2**: What naming conventions should apply?
  - **ANSWER**: kebab-case for doc files, domain folders as namespaces
  - Doc ID = `{domain}/{slug}` (e.g., `auth/login`)
  - File path = `.kanban/product/{domain}/{slug}.md`
- **Q2.3**: How do we prevent a flat folder of hundreds of files?
  - **ANSWER**: Domain-based grouping keeps related docs together, max 2 levels (domain/doc.md)

#### 3. Workflow Integration

- **Q3.1**: Should every task require a link to the product doc it relates to?
  - **ANSWER**: Strongly suggested, not mandatory. LLM discovers relevant docs via `search-product.ts` during task creation/refinement. Sets `affects: [doc-ids]` field. If no matches found, this signals a new feature - the doc ID is still added to `affects` but will be CREATED rather than updated during `/kanban-docs`.
- **Q3.2**: When should doc updates happen - before coding (requirements), after coding (updated specs), or both?
  - **ANSWER**: Product docs represent the application's **CURRENT STATE**, not future requirements.
    - **Before coding**: LLM reads product docs to understand what exists today (context)
    - **After coding**: LLM updates product docs to reflect what was just built (new current state)
    - PMs don't write future requirements in product docs - they create tasks for that
    - Product docs stay in sync with what's actually shipped
- **Q3.3**: Should doc changes require review/approval separate from code?
  - **ANSWER**: No special process - doc changes flow through normal PR review

#### 4. PM Workflow

- **Q4.1**: How would a PM create a new feature request? (Edit existing doc? Create new doc? Create task?)
  - **ANSWER**: Create a task. Product docs are current state only - not for future requirements.
- **Q4.2**: How do PMs update requirements mid-development?
  - **ANSWER**: Update the task, not the product doc. Product doc gets updated after implementation.
- **Q4.3**: What's the handoff between PM docs and developer specs?
  - **ANSWER**: Product docs = context about current state. Tasks = what to change. Specs = how to implement. Product docs are read-only during development, updated after.
- **Q4.4**: When do PMs edit product docs directly?
  - **ANSWER**: For editorial improvements - adding context, rewording for clarity, better examples. Not for defining new features or requirements.

#### 5. Keeping Docs in Sync

- **Q5.1**: How do we ensure docs don't drift from implementation?
  - **ANSWER**: LLM always analyzes during `/kanban-docs` - checks task context, `affects` field, and what was implemented. Determines which docs need updates (or confirms none needed). Not a blind "Update docs? Y/n" but intelligent analysis.
- **Q5.2**: Should there be automated checks that docs exist for features?
  - **ANSWER**: Strongly suggested via `affects` field during task creation. Scripts help LLM discover relevant docs. For new features, LLM identifies that a new doc needs to be created.
- **Q5.3**: How do we handle breaking changes that affect multiple docs?
  - **ANSWER**: `affects` field can list multiple docs. LLM updates all affected docs during `/kanban-docs`.

---

## Research Findings

### 1. Diátaxis Framework

The [Diátaxis framework](https://diataxis.fr/) is widely adopted (Python, Ubuntu/Canonical, Gatsby) and organizes docs into four types based on user needs:
- **Tutorials** - Learning-oriented, hands-on lessons
- **How-to Guides** - Task-oriented, solving specific problems
- **Reference** - Information-oriented, technical descriptions
- **Explanation** - Understanding-oriented, background context

**For our use case**: Product docs for LLMs/builders map best to **Reference** (feature descriptions) and **Explanation** (domain concepts, the "why"). We're not writing tutorials or how-to guides.

### 2. Docs-as-Code & Frontmatter

[YAML frontmatter](https://docs.github.com/en/contributing/writing-for-github-docs/using-yaml-frontmatter) is the standard for markdown metadata:
- Provides structured metadata without polluting content
- Enables tooling (search, navigation, validation)
- Common fields: `title`, `summary`, `keywords`, `tags`, `related`

**Key insight from [The Death of the PRD](https://www.zerotopete.com/p/the-death-of-the-prd-why-markdown)**: When docs live with code, "there is no documentation debt because documentation updates are atomic with code changes."

### 3. Product Taxonomy Best Practices

From [Product Focus](https://www.productfocus.com/product-management-resources/infographics/why-you-need-a-product-taxonomy/) and others:
- Keep hierarchies **broad and shallow** (2-3 levels max)
- The "three clicks" rule - users should find content in 3 navigations
- Group by domain/capability, not by artifact type
- Avoid both over-complexity (too nested) and over-simplification (too flat)

### 4. AI/LLM Discovery Patterns

From RAG (Retrieval-Augmented Generation) [best practices](https://aws.amazon.com/what-is/retrieval-augmented-generation/):
- **Chunking**: Docs should be focused, not monolithic (manageable context windows)
- **Rich metadata**: Keywords, summaries enable semantic search
- **Relationships**: Explicit links between related docs aid navigation
- **Consistent structure**: Predictable formats help LLMs parse content

**Key insight**: An LLM doesn't need to read all docs - it needs a **manifest/index** that summarizes what exists, then reads specific docs as needed.

---

## Proposed Solution

### High-Level Approach

Product documentation lives in `.kanban/product/` and represents the **current state** of the application. It serves as context for LLMs and humans when working on tasks. The system uses helper scripts for discovery and the `affects` field on tasks to link work to documentation.

**Key principles:**
1. Product docs = current state, not future requirements
2. Tasks drive changes; docs are updated after implementation
3. LLMs discover relevant docs via scripts, not static indexes
4. PMs can edit docs directly for editorial improvements
5. Domain-based organization scales as product grows

### Directory Structure

```
.kanban/product/
├── overview.md                  # Product overview (required, created at init)
│
├── {domain}/                    # Domain folders (e.g., auth/, billing/, users/)
│   ├── {feature}.md            # Feature docs
│   └── {concept}.md            # Concept docs
│
└── concepts/                    # Cross-cutting concepts (optional)
    └── {concept}.md
```

**Example:**
```
.kanban/product/
├── overview.md
├── auth/
│   ├── login.md
│   ├── password-reset.md
│   └── permissions.md
├── billing/
│   ├── subscriptions.md
│   └── invoices.md
└── concepts/
    ├── user.md
    └── workspace.md
```

### Document Structure

**Product Doc Template** (updated from current):

```yaml
---
id: {domain}/{slug}              # Unique identifier (e.g., auth/login)
title: {Feature Name}
type: feature | concept | overview
summary: {One sentence description - for LLM discovery}
keywords: [keyword1, keyword2]   # For search matching
related: [other/doc-id]          # Related docs
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

### Task Linkage

Tasks gain an `affects` field in frontmatter:

```yaml
---
id: "005"
title: Add password expiration
status: refined
affects: [auth/password-reset, auth/login]  # Product docs this task relates to
# ...
---
```

- **Existing docs**: Listed IDs will be UPDATED during `/kanban-docs`
- **New docs**: If ID doesn't exist, doc will be CREATED during `/kanban-docs`
- **Empty/omitted**: LLM analyzes at doc-update time to determine if any docs affected

### New Helper Scripts

Scripts follow existing patterns from `find-task.ts` and `list-tasks.ts`:
- Output JSON to stdout
- Return `{ error: true, message: "..." }` on failure
- Parse YAML frontmatter using existing `parseFrontmatter()` pattern
- Use recursive directory scanning for domain subfolders

#### Script 1: `list-product.ts`

**Purpose:** List all product docs with metadata (recursive scan)

**Usage:**
```bash
node .claude/scripts/list-product.cjs
node .claude/scripts/list-product.cjs --type=feature
node .claude/scripts/list-product.cjs --domain=auth
```

**Output:**
```json
{
  "count": 5,
  "docs": [
    {
      "id": "auth/login",
      "title": "User Login",
      "type": "feature",
      "summary": "Email/password and OAuth login flows",
      "keywords": ["authentication", "sign-in", "oauth"],
      "domain": "auth",
      "path": ".kanban/product/auth/login.md"
    }
  ]
}
```

**Implementation notes:**
- Scan `.kanban/product/` recursively (unlike flat task scanning)
- Skip `overview.md` at root (or include with `domain: null`)
- Derive `domain` from parent folder name
- Derive `id` as `{domain}/{filename-without-extension}`

---

#### Script 2: `search-product.ts`

**Purpose:** Find docs matching keywords, ranked by relevance

**Usage:**
```bash
node .claude/scripts/search-product.cjs password reset auth
node .claude/scripts/search-product.cjs "user authentication" --min-score=0.3
```

**Output:**
```json
{
  "query": ["password", "reset", "auth"],
  "count": 2,
  "docs": [
    {
      "id": "auth/password-reset",
      "title": "Password Reset",
      "score": 0.85,
      "summary": "Email-based password reset flow",
      "path": ".kanban/product/auth/password-reset.md"
    },
    {
      "id": "auth/login",
      "title": "User Login",
      "score": 0.4,
      "summary": "Email/password and OAuth login flows",
      "path": ".kanban/product/auth/login.md"
    }
  ]
}
```

**Scoring logic (0.0 to 1.0):**
| Match Type | Points |
|------------|--------|
| Exact match in `keywords` array | +0.4 per keyword |
| Match in `title` (case-insensitive) | +0.3 per keyword |
| Match in `summary` (case-insensitive) | +0.2 per keyword |
| Match in `domain` name | +0.2 |
| Cap total score at 1.0 | |

**Thresholds for LLM interpretation:**
- Score ≥ 0.5 → Strong match, likely relevant
- Score 0.3-0.5 → Possible match, worth reading
- Score < 0.3 → Weak match, probably not relevant
- No results or all < 0.3 → Likely a new feature (no existing docs)

---

#### Script 3: `check-product.ts`

**Purpose:** Check if specific product docs exist by ID

**Usage:**
```bash
node .claude/scripts/check-product.cjs auth/login auth/mfa billing/invoices
```

**Output:**
```json
{
  "results": [
    { "id": "auth/login", "exists": true, "path": ".kanban/product/auth/login.md" },
    { "id": "auth/mfa", "exists": false, "path": ".kanban/product/auth/mfa.md" },
    { "id": "billing/invoices", "exists": false, "path": ".kanban/product/billing/invoices.md" }
  ],
  "summary": {
    "existing": ["auth/login"],
    "missing": ["auth/mfa", "billing/invoices"]
  }
}
```

**Path construction rule:**
- Input ID: `auth/login`
- Output path: `.kanban/product/auth/login.md`
- Rule: `.kanban/product/{id}.md`

---

#### ID ↔ Path Mapping

This is the canonical rule used everywhere:

| ID | File Path |
|----|-----------|
| `auth/login` | `.kanban/product/auth/login.md` |
| `billing/subscriptions` | `.kanban/product/billing/subscriptions.md` |
| `overview` | `.kanban/product/overview.md` |

**Rule:** `path = .kanban/product/{id}.md`

LLMs can construct paths directly from IDs without running scripts.

### Workflow Integration

Detailed step-by-step for each skill modification:

---

#### `/kanban-create` - Product Doc Discovery

**When:** After user provides task title, before writing task file

**Steps to add (after step 4 "Get date/time", before writing task):**

```
- [ ] 5. **Search for related product docs**
   Extract keywords from the task title (nouns, verbs, domain terms).

   Run: `node .claude/scripts/search-product.cjs {keywords}`

   Example: Task "Add password expiration to login"
   Run: `node .claude/scripts/search-product.cjs password expiration login auth`

   **Interpret results:**
   - If docs with score ≥ 0.5 found:
     - Read top 2-3 docs for context
     - Suggest: "This task appears related to: auth/login, auth/password-reset"
     - Set `affects: [auth/login, auth/password-reset]` in task frontmatter

   - If no docs with score ≥ 0.3 found:
     - This is likely a NEW feature
     - Ask user: "This looks like a new feature. What domain should it belong to?"
     - Suggest domain based on keywords (e.g., "auth" if keywords include auth-related terms)
     - Set `affects: [suggested-domain/feature-slug]` (doc will be CREATED later)

   - If `.kanban/product/` doesn't exist or is empty:
     - Note: "No product docs exist yet. Consider running /kanban-define-product first."
     - Continue without affects field
```

---

#### `/kanban-refine` - Context from Product Docs

**When:** During initial context analysis (step 6)

**Modify step 6 "Analyze initial context":**

```
- [ ] 6. **Analyze initial context**
   - Check title for clarity issues (existing checks)
   - Check description for completeness (existing checks)

   **NEW: Load product context**
   - If task has `affects` field with IDs:
     - For each ID, read `.kanban/product/{id}.md`
     - Use content to understand current product behavior

   - If task has NO `affects` field:
     - Run: `node .claude/scripts/search-product.cjs {keywords from title}`
     - If matches found, suggest adding `affects` field
     - Read matched docs for context

   - Reference product docs during Q&A to ensure refinement aligns with existing product behavior
```

---

#### `/kanban-scope` - Technical Context

**When:** During initial codebase research (step 6)

**Modify step 6 "Initial codebase research":**

```
- [ ] 6. **Initial codebase research**

   **NEW: Read product docs first**
   - If task has `affects` field:
     - Read each doc at `.kanban/product/{id}.md`
     - Note current behavior, constraints, interactions
     - This informs WHERE to look in codebase

   - Then proceed with existing codebase research (Glob, Grep, Read)
```

---

#### `/kanban-implement` - Implementation Context

**When:** Before starting implementation

**Add new step after loading task/spec/plan:**

```
- [ ] X. **Load product context**
   - If task has `affects` field:
     - For each ID in affects:
       - Read `.kanban/product/{id}.md`
       - Note: "Current behavior: {summary from doc}"
     - Use this to understand what behavior exists today
     - Implementation should maintain or extend this behavior
```

---

#### `/kanban-docs` - Create or Update Product Docs

**When:** After QA passes, during documentation phase

**Replace current step 6-9 with more intelligent flow:**

```
- [ ] 6. **Analyze product doc impact**

   a. **Check affects field:**
      - Read task's `affects` array
      - Run: `node .claude/scripts/check-product.cjs {affects IDs}`
      - Categorize: existing docs vs missing docs

   b. **Determine action for each:**
      - Existing docs → Will UPDATE
      - Missing docs → Will CREATE (new feature)

   c. **Analyze task for unlisted impacts:**
      - Read task description, spec, and implementation
      - Run: `node .claude/scripts/search-product.cjs {keywords}`
      - If high-scoring docs NOT in affects → suggest adding

   d. **Present analysis to user:**
      ```
      Product Doc Analysis for Task {id}:

      Will UPDATE (doc exists):
      - auth/login - {summary}
      - auth/password-reset - {summary}

      Will CREATE (new feature):
      - auth/mfa - (new doc needed)

      Unaffected (internal change):
      - No other docs impacted

      Proceed with documentation? [Y/n]
      ```

- [ ] 7. **For each doc to UPDATE:**
   - Read current doc at `.kanban/product/{id}.md`
   - Identify sections that need changes based on implementation
   - Make minimal, focused updates (don't rewrite entire doc)
   - Preserve existing content that's still accurate

- [ ] 8. **For each doc to CREATE:**
   - Create domain folder if doesn't exist: `.kanban/product/{domain}/`
   - Use template from `.claude/kanban-templates/product-doc.md`
   - Fill frontmatter: id, title, type, summary, keywords
   - Write content based on what was implemented
   - Keep scope focused on THIS feature only

- [ ] 9. **For bug fixes / refactors with no user-facing changes:**
   - If affects is empty AND task labels include [bug, refactor, chore]:
     - Analyze if any product behavior actually changed
     - If no user-facing changes: "No product doc updates needed - internal change"
     - Log reason and proceed without doc changes
```

---

#### New Domain Creation Flow

When `affects` contains an ID in a non-existent domain (e.g., `payments/stripe`):

1. **check-product.ts** returns `exists: false` for `payments/stripe`
2. **During /kanban-docs:**
   - LLM creates folder: `.kanban/product/payments/`
   - LLM creates doc: `.kanban/product/payments/stripe.md`
   - Uses product-doc.md template
3. **No special validation** - trust LLM to suggest reasonable domains
4. **User can reorganize later** if domain naming is wrong

### Skill Modifications Required

| Skill | Current Steps | Changes |
|-------|---------------|---------|
| `kanban-init` | Creates `.kanban/` dirs | Add: Create `.kanban/product/overview.md` with basic template |
| `kanban-create` | Steps 1-8 | Add step 5: Search product docs, suggest `affects` field |
| `kanban-refine` | Step 6: Analyze context | Modify step 6: Run search-product.ts, read affected docs |
| `kanban-scope` | Step 6: Codebase research | Modify step 6: Read product docs BEFORE codebase research |
| `kanban-implement` | Steps 1-N | Add step after loading task: Read docs from `affects` field |
| `kanban-docs` | Steps 6-9: Doc update | Replace with intelligent flow: check-product.ts, analyze, create/update |
| `kanban-define-product` | Creates flat docs | Update: Use domain folders, new frontmatter, create overview.md |
| `kanban-map-product` | Creates flat docs | Update: Organize by domain, new frontmatter, create overview.md |

See **Workflow Integration** section above for detailed step-by-step instructions.

### Template Updates

| Template | Changes |
|----------|---------|
| `product-doc.md` | Add `id` with domain, `type` field; remove `uses`/`extends` |
| `task.md` | Add `affects` field to frontmatter |
| `overview.md` | NEW - template for product overview doc |
| `config.yaml` | No changes needed |

### New Partial

**File:** `src/content/partials/product-docs-scripts.md`

Create a reusable partial for referencing product doc scripts (like existing `helper-scripts.md`):

```markdown
**Product Documentation Scripts:**

{{#if show_list_product}}
- **`node .claude/scripts/list-product.cjs`** — List all product docs with metadata
  - Returns: `{ count, docs: [{id, title, type, summary, keywords, domain, path}] }`
  - Filters: `--type=feature`, `--domain=auth`
{{/if}}

{{#if show_search_product}}
- **`node .claude/scripts/search-product.cjs {keywords}`** — Search product docs by keywords
  - Returns: `{ query, count, docs: [{id, title, score, summary, path}] }` sorted by relevance
  - Score ≥ 0.5 = strong match, 0.3-0.5 = possible match, < 0.3 = weak match
{{/if}}

{{#if show_check_product}}
- **`node .claude/scripts/check-product.cjs {ids}`** — Check if product docs exist
  - Returns: `{ results: [{id, exists, path}], summary: {existing, missing} }`
{{/if}}

**Path rule:** ID `auth/login` → Path `.kanban/product/auth/login.md`
```

**Usage in skills:**
```handlebars
{{> product-docs-scripts show_search_product=true show_check_product=true}}
```

---

## Implementation Tasks

### Phase 1: Foundation (Scripts & Templates)

#### 1.1 Create `list-product.ts`

**File:** `src/scripts/list-product.ts`

**Reference:** Follow patterns from `src/scripts/list-tasks.ts`

**Requirements:**
- Recursively scan `.kanban/product/` (unlike flat task scanning)
- Parse YAML frontmatter from each `.md` file
- Extract: id, title, type, summary, keywords, domain, path
- Support filters: `--type=feature`, `--domain=auth`
- Output JSON: `{ count, docs: [...] }`
- Handle missing directory gracefully

**Key difference from list-tasks.ts:**
```typescript
// list-tasks.ts scans flat:
const files = fs.readdirSync(TASKS_DIR).filter(f => f.endsWith('.md'));

// list-product.ts must scan recursively:
function scanRecursive(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(scanRecursive(fullPath));
    } else if (entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}
```

---

#### 1.2 Create `search-product.ts`

**File:** `src/scripts/search-product.ts`

**Requirements:**
- Accept keywords as positional arguments
- Use list-product logic to get all docs
- Score each doc (see scoring table in Script 2 section above)
- Sort by score descending
- Filter to score ≥ 0.1 (exclude zero matches)
- Optional `--min-score=0.3` flag
- Output JSON: `{ query, count, docs: [...] }`

---

#### 1.3 Create `check-product.ts`

**File:** `src/scripts/check-product.ts`

**Requirements:**
- Accept doc IDs as positional arguments (e.g., `auth/login auth/mfa`)
- For each ID, check if `.kanban/product/{id}.md` exists
- Output JSON: `{ results: [...], summary: { existing, missing } }`
- Simple file existence check, no frontmatter parsing needed

---

#### 1.4 Update `product-doc.md` template

**File:** `src/content/kanban-templates/product-doc.md`

**Current frontmatter:**
```yaml
id: {slug}
title: {Feature Name}
summary: {One sentence description}
keywords: []
related: []
uses: []
extends: []
updated: {YYYY-MM-DD}
```

**New frontmatter:**
```yaml
id: {domain}/{slug}
title: {Feature Name}
type: feature | concept | overview
summary: {One sentence description - for LLM discovery}
keywords: []
related: []
updated: {YYYY-MM-DD}
```

**Changes:**
- `id` format changed to include domain
- Add `type` field (required)
- Remove `uses` and `extends` (unused, add complexity)
- Keep `related` for explicit cross-references

---

#### 1.5 Update `task.md` template

**File:** `src/content/kanban-templates/task.md`

**Add to frontmatter:**
```yaml
affects: []
```

**Location:** After `labels` field, before `created`

---

#### 1.6 Create `overview.md` template

**File:** `src/content/kanban-templates/overview.md` (NEW)

```yaml
---
id: overview
title: {Product Name}
type: overview
summary: {One sentence product description}
keywords: []
updated: {YYYY-MM-DD}
---

# {Product Name}

## What is this?
{What the product does and who it's for. 2-3 sentences.}

## Key Capabilities
{Bullet list of main features/capabilities}

## Target Users
{Who uses this product}
```

---

#### 1.7 Create `product-docs-scripts.md` partial

**File:** `src/content/partials/product-docs-scripts.md`

See "New Partial" section above for content. This partial documents the product doc scripts for inclusion in skills, similar to `helper-scripts.md`.

---

### Phase 2: Skill Updates

#### 2.1 Update `kanban-init`

**File:** `src/content/skills/kanban-init/SKILL.md`

**Add after creating `.kanban/product/` directory:**

```markdown
- [ ] X. **Create product overview**
   - Create `.kanban/product/overview.md` using template
   - Ask user: "What is this product called?"
   - Ask user: "In one sentence, what does it do?"
   - Fill template with responses
   - This becomes the root product doc that LLMs read first
```

---

#### 2.2 Update `kanban-create`

**File:** `src/content/skills/kanban-create/SKILL.md`

**Add new step after step 4 (Get date/time), before writing task:**

```markdown
- [ ] 5. **Search for related product docs**

   Extract keywords from the task title (nouns, verbs, domain terms).

   ```bash
   node .claude/scripts/search-product.cjs {keyword1} {keyword2} ...
   ```

   **If docs with score ≥ 0.5 found:**
   - These docs describe existing features this task relates to
   - Set `affects: [{matched-ids}]` in task frontmatter
   - Briefly note: "Related product docs: {ids}"

   **If no docs with score ≥ 0.3 found:**
   - This may be a NEW feature not yet documented
   - Ask user: "This looks like a new feature. What domain should it belong to? (e.g., auth, billing, users)"
   - Set `affects: [{domain}/{slug-from-title}]` - doc will be created during /kanban-docs

   **If `.kanban/product/` is empty or doesn't exist:**
   - Skip this step, note: "No product docs yet"
```

**Renumber subsequent steps (6, 7, 8 → 7, 8, 9)**

---

#### 2.3 Update `kanban-refine`

**File:** `src/content/skills/kanban-refine/SKILL.md`

**Modify step 6 "Analyze initial context":**

Add after existing checks:

```markdown
   **Load product context:**
   - If task has `affects` field with IDs:
     - For each ID: Read `.kanban/product/{id}.md`
     - Note current product behavior for context

   - If task has empty/no `affects` field:
     - Run: `node .claude/scripts/search-product.cjs {keywords from title}`
     - If matches found (score ≥ 0.3):
       - Read top matches for context
       - Consider suggesting `affects` field update

   - Reference product docs during Q&A to ensure alignment with existing product
```

---

#### 2.4 Update `kanban-scope`

**File:** `src/content/skills/kanban-scope/SKILL.md`

**Modify step 6 "Initial codebase research":**

Add at the START of step 6 (before Glob/Grep):

```markdown
   **Read product context first:**
   - If task has `affects` field:
     - For each ID: Read `.kanban/product/{id}.md`
     - Note: current behavior, constraints, interactions
     - This informs WHERE to look in codebase

   **Then proceed with codebase research:**
   (existing Glob, Grep, Read steps)
```

---

#### 2.5 Update `kanban-implement`

**File:** `src/content/skills/kanban-implement/SKILL.md`

**Add new step after reading task/spec/plan:**

```markdown
- [ ] X. **Load product context**
   - If task has `affects` field:
     - For each ID in affects:
       - Read `.kanban/product/{id}.md`
     - Understand current product behavior
     - Implementation should maintain or extend documented behavior
```

---

#### 2.6 Update `kanban-docs`

**File:** `src/content/skills/kanban-docs/SKILL.md`

**Major rewrite of steps 6-9.** See "Workflow Integration > /kanban-docs" section above for full details.

Key changes:
- Run `check-product.ts` to categorize existing vs missing docs
- Present analysis to user before proceeding
- CREATE docs for missing IDs (new features)
- UPDATE docs for existing IDs
- Handle internal changes (bug/refactor) with "no changes needed"

---

### Phase 3: Product Definition Skills

#### 3.1 Update `kanban-define-product`

**File:** `src/content/skills/kanban-define-product/SKILL.md`

**Changes:**
- Create `overview.md` first with product summary
- Organize features into domain folders during Q&A
- Use new frontmatter structure (id with domain, type field)
- Create domain folders as needed

---

#### 3.2 Update `kanban-map-product`

**File:** `src/content/skills/kanban-map-product/SKILL.md`

**Changes:**
- Create `overview.md` with discovered product summary
- Suggest domain organization based on codebase analysis
- Use new frontmatter structure
- Create domain folders as needed

---

### Phase 4: Build & Documentation

#### 4.1 Update build process

**File:** `tsdown.config.ts` or build configuration

- Add new scripts to build: `list-product.ts`, `search-product.ts`, `check-product.ts`
- Ensure they compile to `.cjs` like existing scripts

---

#### 4.2 Update README

**File:** `README.md`

Add section on product documentation:
- Purpose of `.kanban/product/`
- How `affects` field works
- How LLMs discover relevant docs
- Example workflow

---

#### 4.3 Update GUIDE

**File:** `GUIDE.md`

Add examples:
- Creating a task that affects existing product docs
- Creating a task for a new feature (creates new doc)
- How product docs evolve through task lifecycle

---

## Open Questions

All major questions resolved. Minor tuning during implementation:

- [ ] Scoring weights for `search-product.ts` (start with documented weights, tune based on usage)

---

## Quick Reference

### ID ↔ Path Rule
```
ID: auth/login → Path: .kanban/product/auth/login.md
ID: overview   → Path: .kanban/product/overview.md
```

### Script Commands
```bash
# List all product docs
node .claude/scripts/list-product.cjs

# Search by keywords
node .claude/scripts/search-product.cjs password reset auth

# Check if docs exist
node .claude/scripts/check-product.cjs auth/login auth/mfa
```

### Score Interpretation
| Score | Meaning |
|-------|---------|
| ≥ 0.5 | Strong match - likely relevant |
| 0.3-0.5 | Possible match - worth reading |
| < 0.3 | Weak match - probably not relevant |
| No results | Likely a new feature |

### Task Frontmatter
```yaml
affects: [auth/login, auth/password-reset]  # Existing docs to UPDATE
affects: [payments/stripe]                   # New doc to CREATE
affects: []                                  # LLM analyzes at doc time
```

---

## Session Log

### Session 1: Socratic Exploration & Plan Development

**Date**: 2026-02-15

**Completed:**
- Analyzed existing system (product docs, kanban-docs skill, define/map-product skills)
- Identified primary audience: PMs, Engineers, LLMs (not end-users)
- Defined doc types: Overview, Features, Concepts (not technical docs)
- Established product docs = current state, not future requirements
- Chose domain-based organization with dynamic script discovery
- Designed helper scripts with exact specifications
- Defined `affects` field for task→doc linkage
- Established LLM-driven intelligent doc analysis
- Researched industry best practices (Diátaxis, docs-as-code, frontmatter)
- Wrote detailed implementation tasks with file paths and code examples

**Key Decisions:**
1. No static index files - scripts scan filesystem dynamically
2. `affects` field strongly suggested but not mandatory
3. New features: LLM sets `affects` to non-existent ID, creates doc during `/kanban-docs`
4. LLM always analyzes doc impact, determines "no changes needed" for internal work
5. PMs can edit docs directly for editorial improvements
6. Path rule: `.kanban/product/{id}.md` where ID is `domain/slug` or `overview`

**Files to Create:**
- `src/scripts/list-product.ts`
- `src/scripts/search-product.ts`
- `src/scripts/check-product.ts`
- `src/content/kanban-templates/overview.md`
- `src/content/partials/product-docs-scripts.md`

**Files to Modify:**
- `src/content/kanban-templates/product-doc.md`
- `src/content/kanban-templates/task.md`
- `src/content/skills/kanban-init/SKILL.md`
- `src/content/skills/kanban-create/SKILL.md`
- `src/content/skills/kanban-refine/SKILL.md`
- `src/content/skills/kanban-scope/SKILL.md`
- `src/content/skills/kanban-implement/SKILL.md`
- `src/content/skills/kanban-docs/SKILL.md`
- `src/content/skills/kanban-define-product/SKILL.md`
- `src/content/skills/kanban-map-product/SKILL.md`
- `README.md`
- `GUIDE.md`

---

*Plan is self-contained and ready for implementation by a fresh LLM.*
