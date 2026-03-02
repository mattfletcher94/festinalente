# Documentation System Improvements

## Status

**Ready to create task.**

Run `/festina-create Improve documentation relationships and search expansion` to begin implementation.

## Problem

The Dependency Mapper agent (in map-product/map-engineering) discovers relationships between docs during codebase analysis, but:
1. These relationships are **not written** to doc frontmatter - they're shown in a summary and forgotten
2. The existing `related: []` field in frontmatter is rarely populated
3. Search returns only direct matches - the LLM can't see what docs are connected
4. festina-create finds docs but has no visibility into connections
5. festina-finalize updates listed docs but doesn't know what other docs reference them

## Solution

Better use of existing frontmatter - no database, no new dependencies.

## Changes Overview

1. Add `references`/`uses` fields to doc templates (alongside existing `related`)
2. Update mapping skills to write Dependency Mapper output to these fields
3. Update search handlers to return relationship info with results
4. Add reverse-lookup command for festina-finalize
5. Extend validate-docs to check for broken references
6. Update skills with guidance on using relationship data

---

## 1. Template Schema Changes

### Current Template (product-feature.md lines 1-12):
```yaml
---
id: "{domain}/{slug}"
title: "{Feature Name}"
type: feature
tldr: "{Single sentence - max 100 chars}"
summary: "{One sentence description - for LLM discovery}"
keywords: []
aliases: []
boundary: "{What this feature does NOT cover}"
related: []
updated: YYYY-MM-DD
---
```

### New Template:
```yaml
---
id: "{domain}/{slug}"
title: "{Feature Name}"
type: feature
tldr: "{Single sentence - max 100 chars}"
summary: "{One sentence description - for LLM discovery}"
keywords: []
aliases: []
boundary: "{What this feature does NOT cover}"
related: []
references: []   # NEW: Other docs this one mentions (e.g., auth/session)
uses: []         # NEW: Systems/patterns this feature depends on (e.g., systems/email)
updated: YYYY-MM-DD
---
```

### Relationship Types

| Field | Meaning | Example |
|-------|---------|---------|
| `references` | Doc mentions/links to another doc | auth/login references auth/session |
| `uses` | Feature depends on this system/pattern | auth/login uses systems/email |

Keep `related` for backwards compatibility. New relationships go in typed fields.

### Files to Update

- `apps/festinalente/src/content/templates/product-feature.md`
- `apps/festinalente/src/content/templates/product-concept.md`
- `apps/festinalente/src/content/templates/engineering-system.md`
- `apps/festinalente/src/content/templates/engineering-pattern.md`
- `apps/festinalente/src/content/templates/engineering-convention.md`

---

## 2. Search Handler Changes

### File: `apps/festinalente/src/cli/handlers/search.handler.ts`

### 2a. Extend InternalDoc Interface (around line 23)

Add to the existing interface:
```typescript
interface InternalDoc {
  // ... existing fields ...
  readonly related: readonly string[];      // NEW
  readonly references: readonly string[];   // NEW
  readonly uses: readonly string[];         // NEW
}
```

### 2b. Update loadDocs Function (around line 198)

Add parsing for new fields:
```typescript
docs.push({
  // ... existing fields ...
  related: Array.isArray(frontmatter.related) ? frontmatter.related : [],
  references: Array.isArray(frontmatter.references) ? frontmatter.references : [],
  uses: Array.isArray(frontmatter.uses) ? frontmatter.uses : [],
});
```

### 2c. Extend DocSearchResult Interface (around line 45)

Add relationship data to search results:
```typescript
export interface DocSearchResult {
  readonly id: string;
  readonly title: string;
  readonly score: number;
  readonly summary: string;
  readonly tldr: string;
  readonly path: string;
  readonly boundaryPenalty: boolean;
  readonly references: readonly string[];  // NEW
  readonly uses: readonly string[];        // NEW
}
```

### 2d. Update SearchOutput Interface (around line 58)

Add related docs section:
```typescript
export interface SearchOutput {
  readonly query: readonly string[];
  readonly count: number;
  readonly docs: readonly DocSearchResult[];
  readonly relatedDocs: readonly RelatedDocPreview[];  // NEW
}

// NEW interface
export interface RelatedDocPreview {
  readonly id: string;
  readonly tldr: string;
  readonly via: string;  // e.g., "auth/login.references"
}
```

### 2e. Update executeSearch Function (around line 263)

After getting search results, gather related docs:
```typescript
// After getting results, collect related docs (1-hop only)
const relatedIds = new Set<string>();
const relatedVia = new Map<string, string>();

for (const result of results) {
  for (const refId of result.references) {
    if (!results.some(r => r.id === refId)) {
      relatedIds.add(refId);
      relatedVia.set(refId, `${result.id}.references`);
    }
  }
  for (const useId of result.uses) {
    if (!results.some(r => r.id === useId)) {
      relatedIds.add(useId);
      relatedVia.set(useId, `${result.id}.uses`);
    }
  }
}

// Look up tldr for related docs
const relatedDocs: RelatedDocPreview[] = [];
for (const relId of relatedIds) {
  const doc = docs.find(d => d.id === relId);
  if (doc) {
    relatedDocs.push({
      id: relId,
      tldr: doc.tldr,
      via: relatedVia.get(relId) || '',
    });
  }
}
```

### 2f. Update Return Value

```typescript
return success({
  query: searchTerms,
  count: results.length,
  docs: results,
  relatedDocs,  // NEW
});
```

---

## 3. Reverse Lookup Command

### File: `apps/festinalente/src/cli/handlers/search.handler.ts`

Add new command to find docs that reference a given ID.

### 3a. Add Interface

```typescript
export interface ReverseLookupOutput {
  readonly id: string;
  readonly referencedBy: readonly RelatedDocPreview[];
  readonly usedBy: readonly RelatedDocPreview[];
}
```

### 3b. Add Function

```typescript
function reverseLookup(args: string[]): CliResult<ReverseLookupOutput> {
  const parsed = parseArgs(args);

  if (parsed.positional.length === 0) {
    return error('Usage: reverse-lookup <doc-id>');
  }

  const targetId = parsed.positional[0];

  // Load all docs
  const productDocs = fs.exists(PRODUCT_DIR) ? loadDocs(PRODUCT_DIR, 'product') : [];
  const engineeringDocs = fs.exists(ENGINEERING_DIR) ? loadDocs(ENGINEERING_DIR, 'engineering') : [];
  const allDocs = [...productDocs, ...engineeringDocs];

  const referencedBy: RelatedDocPreview[] = [];
  const usedBy: RelatedDocPreview[] = [];

  for (const doc of allDocs) {
    if (doc.references.includes(targetId)) {
      referencedBy.push({ id: doc.id, tldr: doc.tldr, via: 'references' });
    }
    if (doc.uses.includes(targetId)) {
      usedBy.push({ id: doc.id, tldr: doc.tldr, via: 'uses' });
    }
  }

  return success({ id: targetId, referencedBy, usedBy });
}
```

### 3c. Register Command

Add to `getCommands()` return array:
```typescript
defineCommand(
  'reverse-lookup',
  'Find docs that reference a given doc ID',
  'reverse-lookup <doc-id>',
  reverseLookup
),
```

---

## 4. Extend validate-docs Command

### File: `apps/festinalente/src/cli/handlers/validation.handler.ts`

The `validate-docs` command already exists (line 338). Extend it to check relationships.

### 4a. Add to DocValidationResult (or create new output)

After existing validation, add relationship checks:

```typescript
// After existing validation loop, add:

// Check for broken references
const allDocIds = new Set(results.map(r => r.id));

const brokenRefs: Array<{ doc: string; field: string; target: string }> = [];
const orphanDocs: string[] = [];

// Check each doc's references/uses point to existing docs
for (const docPath of allDocPaths) {
  const { data: fm } = yamlParser.parseFrontmatter(fs.readFile(docPath).value);
  const docId = deriveIdFromPath(docPath, baseDir);

  for (const ref of (fm.references || [])) {
    if (!allDocIds.has(ref)) {
      brokenRefs.push({ doc: docId, field: 'references', target: ref });
    }
  }
  for (const use of (fm.uses || [])) {
    if (!allDocIds.has(use)) {
      brokenRefs.push({ doc: docId, field: 'uses', target: use });
    }
  }
}

// Find orphan docs (no incoming references)
const referencedIds = new Set<string>();
for (const docPath of allDocPaths) {
  const { data: fm } = yamlParser.parseFrontmatter(fs.readFile(docPath).value);
  for (const ref of [...(fm.references || []), ...(fm.uses || [])]) {
    referencedIds.add(ref);
  }
}
for (const id of allDocIds) {
  if (!referencedIds.has(id) && id !== 'overview') {
    orphanDocs.push(id);
  }
}
```

### 4b. Extend Output

Add to `DocQualityOutput`:
```typescript
export interface DocQualityOutput {
  // ... existing fields ...
  readonly brokenRefs: readonly { doc: string; field: string; target: string }[];
  readonly orphanDocs: readonly string[];
}
```

---

## 5. Mapping Skill Changes

### Files:
- `apps/festinalente/src/content/skills/festina-map-product/SKILL.md`
- `apps/festinalente/src/content/skills/festina-map-engineering/SKILL.md`

### Change: After synthesize_findings step

Currently, Dependency Mapper outputs relationships like:
```
- from: auth/login
- to: auth/session
- type: imports
```

These are shown in a summary but not persisted.

**Add instruction after synthesize_findings:**

```xml
<step name="write_relationships_to_frontmatter">
  <note>Persist Dependency Mapper findings to doc frontmatter</note>
  <action>For each doc being created, populate relationship fields from Dependency Mapper output:</action>
  <action>- `imports`, `calls` relationships → add to `references: []`</action>
  <action>- `shares_data`, `events` relationships → add to `uses: []`</action>
  <action>Only include relationships where BOTH docs exist in the documentation set</action>
</step>
```

**Also update the doc creation step** to include the new fields:
```yaml
references: [{ids from Dependency Mapper}]
uses: [{ids from Dependency Mapper}]
```

---

## 6. Skill Guidance Updates

### File: `apps/festinalente/src/content/skills/festina-create/SKILL.md`

In `search_product_docs` step (around line 78), after the search command, add:

```xml
<note>Search results include `relatedDocs` with tldr previews of connected docs.
Only read full content of related docs if their tldr suggests relevance to this task.
Avoid loading more than 2-3 related docs to preserve context window.</note>
```

### File: `apps/festinalente/src/content/skills/festina-scope/SKILL.md`

Add similar guidance in the research/search steps.

### File: `apps/festinalente/src/content/skills/festina-finalize/SKILL.md`

In the documentation phase, after updating `affects` docs, add:

```xml
<step name="check_referencing_docs">
  <command>node .festinalente/scripts/festinalente.cjs reverse-lookup {docId}</command>
  <branch condition="referencedBy or usedBy has entries">
    <output>These docs reference the updated doc - consider if they need updates:</output>
    <output>- {id}: {tldr}</output>
    <action>Use AskUserQuestion tool with:
      - header: "Related"
      - question: "Review these referencing docs for updates?"
      - options:
        - label: "Skip", description: "No updates needed"
        - label: "Review", description: "Check these docs"
      - multiSelect: false
    </action>
  </branch>
</step>
```

---

## 7. Build and Test

After making changes:

```bash
# From repository root
pnpm install
pnpm build

# Test CLI commands
node apps/festinalente/dist/cli/dispatcher.cjs search-product auth
node apps/festinalente/dist/cli/dispatcher.cjs reverse-lookup auth/login
node apps/festinalente/dist/cli/dispatcher.cjs validate-docs

# Run tests
pnpm test
```

---

## Implementation Order

1. **Templates** - Add `references`/`uses` fields to all doc templates
2. **Search handler** - Extend interfaces, parse new fields, return relationships
3. **Reverse lookup** - Add new command to search handler
4. **Validation** - Extend validate-docs with relationship checks
5. **Mapping skills** - Write Dependency Mapper output to frontmatter
6. **Consumer skills** - Add guidance for create/scope/finalize
7. **Build and test**

---

## Example: How It Works After Implementation

### User runs `/festina-create Add password reset email customization`

1. LLM extracts keywords: "password", "reset", "email"

2. Runs: `node .festinalente/scripts/festinalente.cjs search-product password reset email`

3. Gets response:
```json
{
  "query": ["password", "reset", "email"],
  "count": 1,
  "docs": [
    {
      "id": "auth/password-reset",
      "title": "Password Reset",
      "score": 0.85,
      "tldr": "Forgot password flow with email verification",
      "path": ".festinalente/product/auth/password-reset.md",
      "references": ["auth/login", "auth/session"],
      "uses": ["systems/email"]
    }
  ],
  "relatedDocs": [
    { "id": "auth/login", "tldr": "Email/password authentication", "via": "auth/password-reset.references" },
    { "id": "systems/email", "tldr": "Transactional email delivery", "via": "auth/password-reset.uses" }
  ]
}
```

4. LLM sees related docs with tldr summaries:
   - `auth/login` - "Email/password authentication" → not directly relevant to email customization, skip
   - `systems/email` - "Transactional email delivery" → relevant! Read full doc

5. LLM reads 2 docs total (direct match + 1 relevant related) instead of blindly loading everything

6. Creates task with `affects: [auth/password-reset]` and good context about the email system

---

## Benefits

- **No new dependencies** - uses existing YAML frontmatter
- **No install changes** - still just file copies
- **Context-aware** - tldr previews prevent context explosion
- **LLM judgment** - decides what's relevant based on summaries
- **Relationships are first-class** - typed, validated, visible in search
- **Discoverability** - see connections without loading everything
