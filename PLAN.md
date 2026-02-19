# Improvement Plan: Kanban Documentation Mapping System

## System Overview

### What Is This System?

This is a **living documentation system** for Claude Code that:
1. Stores product and engineering docs in `.kanban/product/` and `.kanban/engineering/`
2. Links tasks to relevant docs via `<affects>` and `<engineering>` XML tags
3. Uses Fuse.js fuzzy search to auto-discover related docs during task creation
4. Injects doc context to the LLM during implementation
5. Updates docs when tasks are completed, keeping them in sync with code

### Project Structure

```
claudeban/
├── apps/kanban/src/                    # SOURCE (TypeScript)
│   ├── content/
│   │   ├── kanban-templates/           # Doc templates (source)
│   │   ├── skills/                     # Skill definitions (source)
│   │   └── partials/                   # Reusable skill fragments
│   └── scripts/                        # Helper scripts (TypeScript)
│
├── .kanban/                            # COMPILED/RUNTIME (auto-generated)
│   ├── templates/                      # Compiled templates
│   ├── scripts/                        # Compiled scripts (.cjs)
│   ├── product/                        # User's product docs
│   ├── engineering/                    # User's engineering docs
│   └── tasks/                          # User's tasks
│
└── .claude/skills/                     # INSTALLED SKILLS (auto-generated)
    └── kanban-*/SKILL.md               # Compiled skill files
```

### Build Process

```bash
# From apps/kanban/
pnpm build                              # Compiles TypeScript to .cjs
                                        # Copies templates and skills to output
```

Build tool: `tsdown` (configured in `apps/kanban/tsdown.config.ts`)

### How Skills Work

Skills are markdown files with XML-like process definitions. They:
1. Are invoked via `/skill-name` command
2. Have access to specified tools (Read, Write, Bash, etc.)
3. Execute steps sequentially
4. Can spawn sub-agents using the Task tool

```markdown
---
name: skill-name
allowed-tools: Read, Write, Bash(git *)
---

# Skill Name

<process>
  <step name="do_something">
    <action>Description of what to do</action>
    <command>bash command here</command>
  </step>
</process>
```

### How Parallel Agents Work

Skills spawn parallel agents using the `Task` tool with `subagent_type`:

```xml
<step name="parallel_discovery">
  <action>Spawn 4 agents in parallel using Task tool</action>
  <parallel>
    <agent name="Feature Scanner" type="Explore">
      <prompt>Find all user-facing features: routes, UI components, CLI commands</prompt>
    </agent>
    <agent name="Domain Organizer" type="Explore">
      <prompt>Analyze codebase structure and suggest domain groupings</prompt>
    </agent>
  </parallel>
  <action>Wait for all agents to complete</action>
  <action>Combine outputs into unified feature list</action>
</step>
```

The skill instructs Claude to use the Task tool multiple times in a single response to achieve parallelism.

---

## Executive Summary

This plan addresses systemic issues across all four phases of the documentation lifecycle: mapping, task creation, implementation, and doc updates. The root causes are:
1. **Shallow documentation** - Docs lack depth, context, and clear boundaries
2. **Poor keyword strategy** - Manual keywords, no synonyms, no taxonomy
3. **Suboptimal search** - Single-pass fuzzy match misses semantic relationships
4. **Sequential mapping** - Single-agent approach misses coverage opportunities

**Solution approach:** Significant overhaul while keeping local-only (no external APIs/databases).

---

## Current System Analysis

### Architecture

```
.kanban/
├── product/           # User-facing feature docs
│   ├── overview.md
│   └── {domain}/
│       └── {feature}.md
├── engineering/       # Technical architecture docs
│   ├── overview.md
│   ├── systems/{sys}/index.md
│   ├── patterns/{pattern}.md
│   └── conventions/{convention}.md
├── tasks/{id}/        # Task files with doc references
│   └── task.xml       # Contains <affects> and <engineering> tags
├── scripts/           # Fuse.js search scripts
│   ├── search-product.cjs
│   └── search-engineering.cjs
└── templates/         # Doc templates
```

### Current Search Configuration

```typescript
keys: [
  { name: 'keywords', weight: 0.4 },
  { name: 'title', weight: 0.3 },
  { name: 'id', weight: 0.25 },
  { name: 'summary', weight: 0.2 },
  { name: 'domain', weight: 0.15 },
  { name: 'body', weight: 0.1 }
]
threshold: 0.4
```

---

## Identified Problems

### From User Feedback

| Phase | Problems |
|-------|----------|
| **Mapping** | Docs too shallow, wrong structure, weak keywords, features missed |
| **Task Creation** | False positives, false negatives, keyword mismatch |
| **Implementation** | Context not helpful, docs outdated |
| **Doc Updates** | Updates not accurate, drift over time |

### Desired Outcomes
- More context (WHY, not just WHAT)
- Better examples (code snippets, patterns)
- Clear boundaries between features
- Living accuracy (stays in sync with code)
- Avoid context rot (selective, not overwhelming)

---

## Research Findings

### RAG/LLM Documentation Best Practices

Source: [AWS Prescriptive Guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/writing-best-practices-rag/best-practices.html)

1. **Summary after each section** - Increases semantic coverage for retrieval
2. **Clear headings/subheadings** - Helps LLMs understand structure
3. **Concise, focused docs** - Disambiguation improves accuracy
4. **Flat-level syntax** - Not deeply nested; easier for LLMs to digest
5. **Structured metadata blocks** - Not plain text dumps
6. **Define abbreviations and context** - LLMs lack project-specific knowledge
7. **Hybrid search** - Combine keyword + semantic approaches

Source: [IBM AI Documentation](https://www.ibm.com/think/insights/ai-code-documentation-benefits-top-tips)

8. **Key sections**: Overview, Prerequisites, Step-by-step, Summary, What's Next
9. **Human does 20%** - AI handles mechanical, humans add context/nuance

### GSD Comparison

GSD's `/map-codebase` uses parallel agents for:
- Stack analysis
- Feature assessment
- Architectural understanding
- Risk identification

This provides better coverage than sequential single-agent mapping.

---

## Proposed Improvements

### NEW: Documentation Organization Overhaul

This section addresses the fundamental organization and content quality issues.

#### Organization Principles

Based on research from [GitBook Documentation Structure](https://gitbook.com/docs/guides/docs-best-practices/documentation-structure-tips), [Document360 Information Architecture](https://document360.com/blog/knowledge-base-information-architecture/), and DDD bounded context concepts:

**1. Maximum 2 levels of hierarchy**
```
.kanban/product/
├── overview.md                    # Level 0: Entry point
├── {domain}/                      # Level 1: Business domain (bounded context)
│   ├── _index.md                  # Domain overview (NEW)
│   └── {feature}.md               # Level 2: Individual feature
```

**Why:** More than 2 levels becomes confusing. Each domain is a "bounded context" with clear boundaries.

**2. Domain Index Files (NEW)**

Each domain folder gets a `_index.md` that:
- Summarizes what this domain covers
- Lists all features in the domain with 1-sentence descriptions
- Defines the domain's boundaries (what it does NOT cover)
- Maps relationships to other domains

```markdown
---
id: auth/_index
title: Authentication Domain
type: domain-index
tldr: "User identity, login, sessions, and access control"
boundary: "Does NOT cover user profiles, preferences, or account settings"
contains:
  - auth/login
  - auth/registration
  - auth/password-reset
  - auth/mfa
relates_to:
  - users/profiles      # "User after authentication"
  - security/permissions # "What authenticated users can do"
---
```

**3. Bounded Context Rules**

Each domain should:
- Have a single, clear responsibility
- Own its terminology (ubiquitous language within the domain)
- Define explicit boundaries with other domains
- Be documentable in 3-7 feature docs (not too granular, not too monolithic)

**Bad granularity examples:**
- Too granular: `auth/login-button`, `auth/login-form`, `auth/login-api` → Combine into `auth/login`
- Too monolithic: `auth/everything` → Split into `auth/login`, `auth/registration`, `auth/sessions`

**4. Cross-Reference Strategy**

Docs should reference each other through:
- `related: []` in frontmatter (bidirectional links)
- Inline links in content: `See [Password Reset](../auth/password-reset.md)`
- Domain index files as navigation hubs

**Rule:** If feature A frequently mentions feature B, they should be `related`.

#### Content Quality Standards

**1. The "3 Whys" Test**

Every feature doc must answer:
- **Why does this feature exist?** (business value)
- **Why does it work this way?** (design decisions)
- **Why would someone read this doc?** (user intent)

**2. Content Sections (Required)**

| Section | Purpose | Quality Check |
|---------|---------|---------------|
| **TL;DR** | Quick context injection | Can you understand the feature in 10 seconds? |
| **Overview** | WHY it exists, context | Does it explain business value? |
| **How It Works** | User-facing behavior | Can a new developer understand the flow? |
| **Examples** | Concrete usage | Are there real code snippets? |
| **Boundaries** | What it does NOT do | Would this prevent confusion? |
| **Limitations** | Known constraints | Are edge cases documented? |

**3. Depth Guidelines**

| Doc Type | Expected Length | Depth |
|----------|-----------------|-------|
| Domain Index | 50-100 lines | Navigation + context |
| Feature | 100-200 lines | Full explanation + examples |
| Concept | 50-100 lines | Definition + rules |
| Pattern | 100-150 lines | Problem + solution + examples |
| Convention | 30-50 lines | Rule + rationale |

**4. Example Quality**

Every feature doc should have:
- At least one code snippet showing typical usage
- At least one edge case or "what happens when"
- Links to actual code files where applicable

**Bad example:**
```markdown
## How It Works
Users can log in using their credentials.
```

**Good example:**
```markdown
## How It Works

1. User enters email and password on `/login`
2. System validates credentials against `users` table
3. On success: Creates session, redirects to `returnUrl` or `/dashboard`
4. On failure: Shows error, increments `failed_attempts`

### Code Example

```typescript
// src/auth/login.ts:45
const result = await authService.login(email, password);
if (result.success) {
  session.set('userId', result.user.id);
  redirect(returnUrl || '/dashboard');
}
```

### Edge Cases

- **Account locked:** After 5 failed attempts, account locks for 15 minutes
- **Unverified email:** User prompted to verify before login completes
```

**5. Writing Style Guidelines**

- **Active voice:** "The system validates credentials" not "Credentials are validated"
- **Present tense:** "Returns a session token" not "Will return a session token"
- **Specific over vague:** "5 failed attempts" not "multiple failed attempts"
- **User-centric:** Describe from user's perspective, not just system internals
- **Avoid jargon:** Define technical terms when first used

#### Engineering Documentation Organization

**1. Three-tier Structure**

```
.kanban/engineering/
├── overview.md                    # System summary
├── systems/                       # Major subsystems
│   ├── {system}/
│   │   ├── index.md              # System overview
│   │   └── {component}.md        # Key components (optional)
├── patterns/                      # Reusable patterns
│   └── {pattern}.md
└── conventions/                   # Coding standards
    └── {convention}.md
```

**2. System vs Pattern vs Convention**

| Type | What it documents | Example |
|------|-------------------|---------|
| **System** | A major subsystem with multiple components | Auth system, API gateway, Database layer |
| **Pattern** | A reusable solution to a common problem | Middleware pattern, Repository pattern |
| **Convention** | A rule about how code should be written | File naming, Error handling style |

**Rule of thumb:**
- If it's a "thing that exists" → System
- If it's "how we solve X" → Pattern
- If it's "how we write code" → Convention

**3. Relationship Mapping**

Engineering docs should explicitly state:
- Which systems use which patterns
- Which conventions apply to which systems
- How systems interact with each other

### A. Documentation Structure Overhaul

#### A1. New Template Structure (LLM-Optimized)

**Product Doc Template:**
```yaml
---
id: "{domain}/{slug}"
title: "{Feature Name}"
type: feature
tldr: "{Single sentence for quick context injection}"
summary: "{2-3 sentences expanding on tldr}"
keywords: []
aliases: []           # NEW: Synonyms for search
related: []
boundary: "{What this feature does NOT cover}"  # NEW
updated: YYYY-MM-DD
---

# {Feature Name}

> **TL;DR:** {tldr repeated for in-doc scanning}

## Overview
{What this feature is and WHY it exists - context, not just facts}

**Summary:** {Brief recap of this section}

## How It Works
{User-facing behavior with clear steps}

1. {Step 1}
2. {Step 2}

**Summary:** {Brief recap}

## Examples
{Concrete code snippets or usage patterns}

**Summary:** {Brief recap}

## Boundaries
{What this feature does NOT do - prevents confusion}

- Does NOT: {thing}
- See instead: [{related-feature}]({path})

## Limitations
{Known constraints}
```

**Key changes:**
- Added `tldr` field for minimal context injection
- Added `aliases` for synonym search
- Added `boundary` to clarify scope
- Section summaries after each heading
- Examples section with code snippets
- Explicit "does NOT" boundaries

#### A2. Engineering Doc Template Updates

**Engineering System Template:**
```yaml
---
id: "systems/{name}"
title: "{System Name}"
type: system
tldr: "{Single sentence - max 100 chars}"
summary: "{2-3 sentences expanding on tldr}"
keywords: []
aliases: []
related: []
boundary: "{What this system does NOT handle}"
paths: []
updated: YYYY-MM-DD
verified: YYYY-MM-DD
---

# {System Name}

> **TL;DR:** {tldr repeated}

## Overview

{What this system does and its responsibilities}

**Why it exists:** {Architectural reason}

**Summary:** {Brief recap}

## Components

| Component | Purpose | File |
|-----------|---------|------|
| [{name}](./{name}.md) | {summary} | `{path}` |

**Summary:** {Brief recap}

## Key Patterns

This system follows these patterns from `patterns/`:
- [{pattern}](../patterns/{pattern}.md) - {how it's used here}

## Data Flow

```
Input → {Component} → {Component} → Output
```

## Interactions

| System | Relationship | Notes |
|--------|--------------|-------|
| [{system}](../{system}/index.md) | {how they interact} | {when/why} |

## Boundaries

What this system does NOT handle:
- **Does NOT:** {thing} → See [{system}](../{system}/index.md)

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| {setting} | {what it does} | {default} |
```

**Engineering Pattern Template:**
```yaml
---
id: "patterns/{name}"
title: "{Pattern Name}"
type: pattern
tldr: "{When to use this pattern - max 100 chars}"
summary: "{Problem it solves and solution approach}"
keywords: []
aliases: []
related: []
boundary: "{When NOT to use this pattern}"
paths: []
updated: YYYY-MM-DD
verified: YYYY-MM-DD
---

# {Pattern Name}

> **TL;DR:** {tldr repeated}

## Problem

{What problem does this pattern solve?}

## Solution

{How does the pattern solve it?}

**Summary:** {Brief recap}

## When to Use

- {Scenario 1}
- {Scenario 2}

## When NOT to Use

- {Anti-scenario 1} → Use [{alternative}](../{path}) instead

## Implementation

### Correct Example

```{language}
// {file path where this is used}
{good code example}
```

### Incorrect Example

```{language}
// DON'T do this
{bad code example}
// Because: {reason}
```

**Summary:** {Brief recap}

## Systems Using This Pattern

- [{system}](../systems/{system}/index.md)

## Validation Checklist

- [ ] {Check 1}
- [ ] {Check 2}
```

**Engineering Convention Template:**
```yaml
---
id: "conventions/{name}"
title: "{Convention Name}"
type: convention
tldr: "{The rule in one sentence}"
summary: "{Why this convention exists}"
keywords: []
aliases: []
related: []
paths: []
updated: YYYY-MM-DD
---

# {Convention Name}

> **TL;DR:** {tldr repeated}

## Rule

{Clear statement of the convention}

## Rationale

{Why we follow this convention}

## Examples

### Correct

```{language}
{good example}
```

### Incorrect

```{language}
{bad example}
// Violates: {which aspect of rule}
```

## Exceptions

- {When the convention doesn't apply}

## Enforcement

{How this is enforced: linter, code review, etc.}
```

### B. Search/Tagging Improvements

#### B1. Enhanced Fuse.js Configuration

**New weights:**
```typescript
keys: [
  { name: 'keywords', weight: 0.35 },    // Slightly reduced
  { name: 'aliases', weight: 0.35 },     // NEW: Equal to keywords
  { name: 'title', weight: 0.25 },
  { name: 'tldr', weight: 0.25 },        // NEW: High weight for concise summary
  { name: 'id', weight: 0.2 },
  { name: 'summary', weight: 0.15 },
  { name: 'boundary', weight: 0.1 },     // NEW: Helps exclude false positives
  { name: 'domain', weight: 0.1 },
  { name: 'body', weight: 0.05 }         // Reduced - too noisy
]
threshold: 0.35  // Slightly tighter
```

#### B2. Synonym/Alias System

Add `aliases` field to docs that maps common variations:
```yaml
aliases:
  - "sign in"      # for "login"
  - "log in"
  - "authenticate"
  - "auth"
```

#### B3. Hybrid Search Script

New `search-hybrid.ts` that combines:
1. **Exact keyword match** (high confidence) - If query term exactly matches a keyword or alias
2. **Fuzzy title/tldr match** (medium confidence) - Fuse.js on title and tldr
3. **Fuzzy body match** (lower confidence) - Fuse.js on body content

```typescript
// Usage: node search-hybrid.cjs <keyword1> <keyword2> ... [--type=product|engineering]
// Returns: JSON with combined results

interface HybridSearchOutput {
  query: string[];
  results: Array<{
    id: string;
    title: string;
    score: number;           // Combined score 0-1
    matchSources: {
      exactKeyword: boolean;
      exactAlias: boolean;
      fuzzyTitle: number;    // Fuse score
      fuzzyTldr: number;
      fuzzyBody: number;
    };
    boundaryPenalty: number; // Negative if query matches boundary
    path: string;
  }>;
}
```

Returns combined score with source attribution.

#### B4. Negative Matching

Use `boundary` field to reduce false positives:
- If search term appears in `boundary`, reduce score
- "User management" shouldn't match "auth/login" if login.md says "Does NOT cover user management"

### C. Mapping Process Improvements

#### C1. Parallel Agent Architecture

Modify `kanban-map-product` and `kanban-map-engineering` to spawn parallel sub-agents:

**Product Mapping Agents:**
1. **Feature Scanner** - Finds user-facing features from routes, UI, CLI
2. **Domain Organizer** - Groups features into logical domains
3. **Dependency Mapper** - Identifies feature relationships
4. **Gap Detector** - Finds undocumented capabilities

**Engineering Mapping Agents:**
1. **Stack Analyzer** - Tech stack, dependencies, frameworks
2. **Architecture Mapper** - Systems, patterns, data flow
3. **Convention Extractor** - Naming, structure, code style
4. **Risk Identifier** - Technical debt, security concerns

#### C2. Deeper Exploration Prompts

Current prompts are too shallow. The mapping skills need structured exploration:

**Phase 1: Discovery Questions (per feature)**
```
1. What does this feature do? (basic understanding)
2. Why does this feature exist? (business value)
3. Who uses this feature? (user persona)
4. How is this feature typically used? (happy path)
5. What happens when this fails? (error cases)
6. What does this NOT do? (boundaries)
7. What other features does this interact with? (relationships)
8. Are there any performance/security concerns? (constraints)
```

**Phase 2: Depth Questions (per answer)**
```
For each answer, probe deeper:
- "You mentioned X - can you give an example?"
- "When you say Y, what specifically triggers that?"
- "How would a new developer know to do Z?"
```

**Phase 3: Boundary Questions**
```
1. What features are adjacent but separate from this one?
2. What does this feature assume is already done?
3. What happens after this feature completes?
4. What are common mistakes or misunderstandings?
```

**Phase 4: Documentation Review**
```
Before finalizing each doc:
1. Read the draft back to user
2. Ask: "Is this accurate? What's missing?"
3. Ask: "Would this help a new developer understand?"
4. Ask: "What would YOU add to this?"
```

#### C3. Validation Phase

After mapping, run a validation pass:
1. Check all `related` fields resolve to existing docs
2. Check for orphan docs (not referenced anywhere)
3. Check for keyword overlap (docs competing for same terms)
4. Generate coverage report

### D. Context Injection Improvements

#### D1. Tiered Context Strategy

Instead of injecting all tagged docs, use tiers:

| Tier | What | When |
|------|------|------|
| **Minimal** | `tldr` fields only | Quick context check |
| **Standard** | `tldr` + `summary` + `boundaries` | Normal implementation |
| **Full** | Entire doc content | Deep dive needed |

Skills can request specific tier via `--tier` flag.

**How to use in skills:**
```xml
<step name="load_context">
  <command>node .kanban/scripts/select-context.cjs {taskId} --tier=standard --max=5</command>
  <action>Parse JSON output</action>
  <action>For each doc in output, read the content field</action>
  <action>Present relevant context to inform implementation</action>
</step>
```

**Tier content:**
- `minimal`: Only `tldr` field (1 line per doc, ~50 tokens)
- `standard`: `tldr` + `summary` + `boundary` (~200 tokens per doc)
- `full`: Entire doc content (~500-1000 tokens per doc)

#### D2. Smart Context Selection

New `select-context.ts` script that:
1. Analyzes task description for key terms
2. Ranks docs by relevance to THIS specific task
3. Returns top N docs with tier recommendation
4. Excludes docs whose `boundary` conflicts with task

### E. Living Documentation Improvements

#### E1. Freshness Tracking

Add to frontmatter:
```yaml
updated: 2025-02-19
verified: 2025-02-19    # Last time content was verified accurate
code_refs:              # Code paths this doc describes
  - src/auth/login.ts
  - src/routes/auth.ts
```

New `check-freshness.ts` script:
- Compares `verified` date to file modification times of `code_refs`
- Flags docs that may be stale

#### E2. Update Enforcement

During `kanban-docs` phase:
- Require explicit confirmation that doc reflects implementation
- Update `verified` date on confirmation
- Track what was changed in commit message

### F. Project-Specific Vocabulary (Instead of Controlled Vocabulary)

Since this tool is used on diverse products, a fixed vocabulary doesn't make sense. Instead, build a **project-specific glossary** during mapping.

#### F1. Glossary Generation

During `kanban-map-product` Phase 2 (Synthesis), create `.kanban/glossary.yaml`:

```yaml
# Auto-generated during mapping, editable by user
terms:
  - term: "login"
    aliases: ["sign in", "log in", "authenticate"]
    domain: auth
    definition: "Process of verifying user identity"

  - term: "checkout"
    aliases: ["purchase", "buy", "complete order"]
    domain: billing
    definition: "Process of finalizing a purchase"
```

#### F2. Glossary Usage

1. **During mapping**: Populate glossary from user Q&A and code analysis
2. **During task creation**: Use glossary terms in search (auto-expand aliases)
3. **During implementation**: Inject relevant glossary terms as context
4. **Ongoing**: User can edit glossary to add/remove aliases

#### F3. Glossary-Aware Search

Modify search to:
```typescript
function expandQuery(query: string, glossary: Glossary): string[] {
  const terms = query.split(' ');
  const expanded = terms.flatMap(term => {
    const entry = glossary.find(g => g.term === term || g.aliases.includes(term));
    return entry ? [entry.term, ...entry.aliases] : [term];
  });
  return [...new Set(expanded)];
}
```

### G. Quality Enforcement

Ensuring docs are actually good, not just present.

#### G1. Quality Checklist (Automated)

New `validate-docs.ts` script that checks:

```typescript
interface QualityCheck {
  name: string;
  check: (doc: Doc) => boolean;
  severity: 'error' | 'warning';
}

const checks: QualityCheck[] = [
  { name: 'has-tldr', check: d => d.tldr?.length > 10, severity: 'error' },
  { name: 'has-summary', check: d => d.summary?.length > 50, severity: 'error' },
  { name: 'has-keywords', check: d => d.keywords?.length >= 2, severity: 'warning' },
  { name: 'has-overview', check: d => d.body.includes('## Overview'), severity: 'error' },
  { name: 'has-examples', check: d => d.body.includes('## Examples') || d.body.includes('```'), severity: 'warning' },
  { name: 'has-boundaries', check: d => d.boundary || d.body.includes('## Boundaries'), severity: 'warning' },
  { name: 'not-too-short', check: d => d.body.length > 300, severity: 'warning' },
  { name: 'not-too-long', check: d => d.body.length < 5000, severity: 'warning' },
];
```

#### G2. Quality Gates

**During mapping:**
- After each doc is written, run quality checks
- If errors: force fixes before continuing
- If warnings: present to user, ask if acceptable

**During `kanban-docs`:**
- Run quality checks on updated docs
- Block commit if errors

**Periodic:**
- New command `/kanban-quality-check` to audit all docs
- Reports low-quality docs for improvement

#### G3. Quality Prompts in Skills

Add explicit quality requirements to mapping skills:

```xml
<quality_requirements>
  <requirement>tldr must be exactly one sentence, max 100 characters</requirement>
  <requirement>summary must be 2-3 sentences explaining the feature</requirement>
  <requirement>Overview section must explain WHY the feature exists, not just what it does</requirement>
  <requirement>Examples section must include at least one code snippet</requirement>
  <requirement>Every claim must be verifiable from the codebase</requirement>
</quality_requirements>
```

### H. Migration Strategy

For projects with existing docs in the old format.

**Note:** For fresh installs with no existing docs, migration is not needed. The mapping skills will create docs in the new format from the start.

#### H1. Migration Script

New `migrate-docs.ts` script:

```typescript
// 1. Scan existing docs
// 2. Extract existing frontmatter
// 3. Add new required fields with sensible defaults
// 4. Restructure content to match new template
// 5. Generate migration report

interface MigrationAction {
  file: string;
  action: 'add-tldr' | 'add-aliases' | 'add-boundary' | 'restructure';
  before: string;
  after: string;
}
```

#### H2. Migration Workflow

```
1. Run migration script in dry-run mode
   → Outputs proposed changes without modifying files

2. Review proposed changes
   → User approves/rejects each change

3. Run migration script in apply mode
   → Applies approved changes

4. Run quality checks
   → Identifies remaining issues

5. Manual fixes
   → User addresses quality warnings

6. Commit migration
   → docs: migrate to v2 documentation structure
```

#### H3. Field Defaults

When migrating, use these defaults:

| Field | Default Value |
|-------|---------------|
| `tldr` | First sentence of existing summary, or `"[TODO: Add TL;DR]"` |
| `aliases` | `[]` (empty, user adds later) |
| `boundary` | `""` (empty, user adds later) |
| `verified` | Same as `updated` date |
| `code_refs` | `[]` (empty, user adds later) |

### I. Failure Recovery

What happens when mapping produces low-quality docs.

#### I1. Quality Assessment After Mapping

At end of mapping, run comprehensive quality check:

```
Quality Report for Product Documentation
────────────────────────────────────────
Total docs: 15
Passing: 10
Warnings: 3
Errors: 2

ERRORS (must fix):
- auth/login.md: missing tldr
- billing/checkout.md: overview too short

WARNINGS (should fix):
- auth/register.md: no examples section
- users/profile.md: no boundaries defined
- search/index.md: only 1 keyword

Recommendation: Fix errors before committing.
```

#### I2. Improvement Workflow

New command `/kanban-improve-docs` that:

1. Reads quality report
2. For each issue, asks user targeted questions
3. Updates docs with improved content
4. Re-runs quality check
5. Commits improvements

#### I3. Partial Commit Option

If some docs pass and some fail:

```
Would you like to:
1. Fix all issues now (recommended)
2. Commit passing docs, leave failures as TODO
3. Abort and start over
```

Option 2 creates placeholder docs with `[TODO]` markers:

```yaml
---
id: auth/login
title: Login
tldr: "[TODO: Add TL;DR]"
status: draft  # NEW: marks doc as incomplete
---

# Login

[TODO: This doc needs improvement. Run /kanban-improve-docs to complete.]
```

---

## Implementation Roadmap

### Phase 1: Foundation (Templates & Search)

**Deliverables:**

#### 1a. Rename Product Templates (prefix with `product-`)

| Old Name | New Name |
|----------|----------|
| `overview.md` | `product-overview.md` |
| `product-doc.md` | `product-feature.md` |
| `concept-doc.md` | `product-concept.md` |
| (new) | `product-domain.md` |

#### 1b. Create product-domain.md Template (NEW)

```yaml
---
id: "{domain}/_index"
title: "{Domain Name}"
type: domain
tldr: "{Single sentence - what this domain covers}"
summary: "{2-3 sentences expanding on the tldr}"
keywords: []
aliases: []
boundary: "{What this domain does NOT cover}"
contains: []
related: []
updated: YYYY-MM-DD
---

# {Domain Name}

> **TL;DR:** {tldr repeated}

## Overview

The {Domain Name} domain handles {core responsibility}.

**Why it exists:** {Business reason}

**Boundaries:** This domain does NOT cover {boundary}. For that, see [{related domain}](../{related-domain}/_index.md).

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| [{feature}](./{feature}.md) | {one-line summary} | {stable/beta/planned} |

## Key Concepts

- **{Term}**: {Definition}

## Relationships

| Related Domain | Relationship |
|----------------|--------------|
| [{domain}](../{domain}/_index.md) | {how they interact} |
```

#### 1c. Update Template Structure

All templates get new fields:
- `tldr` - Single sentence (max 100 chars) for minimal context injection
- `aliases` - Array of synonyms for search
- `boundary` - What this doc does NOT cover (reduces false positives)
- `verified` - Last accuracy verification date
- `code_refs` - Related code file paths

All templates get new content structure:
- TL;DR blockquote at top
- Section summaries after each heading
- Examples section with code snippets
- Boundaries section with "Does NOT" list
- Tables for structured info (settings, relationships)

#### 1c. Update Search Scripts

- Add `aliases` field to search with weight 0.35
- Add `tldr` field to search with weight 0.25
- Add `boundary` field for negative matching (penalty -0.15)
- Reduce `body` weight from 0.1 to 0.05
- Tighten threshold from 0.4 to 0.35

**Source files to modify:**
```
apps/kanban/src/content/kanban-templates/
├── overview.md           → rename to product-overview.md + restructure
├── product-doc.md        → rename to product-feature.md + restructure
├── concept-doc.md        → rename to product-concept.md + restructure
├── (create)              → product-domain.md (new template)
├── engineering-overview.md    → restructure
├── engineering-system.md      → restructure
├── engineering-component.md   → restructure
├── engineering-pattern.md     → restructure
└── engineering-convention.md  → restructure

apps/kanban/src/scripts/
├── search-product.ts     → add aliases, tldr, boundary, adjust weights
├── search-engineering.ts → add aliases, tldr, boundary, adjust weights
└── search-hybrid.ts      → NEW: combined search with score attribution
```

**Skills to update (template references):**
```
apps/kanban/src/content/skills/
├── kanban-map-product/SKILL.md     → update template references:
│   - Change "product-doc.md" to "product-feature.md"
│   - Change "concept-doc.md" to "product-concept.md"
│   - Change "overview.md" to "product-overview.md"
│   - Add references to "product-domain.md" for domain index files
│
├── kanban-map-engineering/SKILL.md → update template references (already prefixed)
│
├── kanban-docs/SKILL.md            → update template references:
│   - Same changes as kanban-map-product
│   - Update example paths in documentation
│
└── kanban-create/SKILL.md          → update search usage:
    - Use search-hybrid.ts instead of search-product.ts
    - Add glossary expansion before search
```

**Testing:**
- Create sample docs with new structure
- Test search with various queries
- Validate alias matching works
- Validate boundary negative matching works

### Phase 2: Mapping Overhaul

**Deliverables:**
1. Rewrite `kanban-map-product` skill with parallel agents
2. Rewrite `kanban-map-engineering` skill with parallel agents
3. Add deeper exploration prompts
4. Add validation phase
5. Add coverage reporting

**Source files to modify:**
- `apps/kanban/src/content/skills/kanban-map-product/SKILL.md`
- `apps/kanban/src/content/skills/kanban-map-engineering/SKILL.md`

**New Mapping Workflow (kanban-map-product):**

```
PHASE 1: PARALLEL DISCOVERY (4 agents, run concurrently)
─────────────────────────────────────────────────────────
Agent 1: Feature Scanner
├── Scan routes, UI components, CLI commands
├── Output: List of user-facing features with basic descriptions
└── Example output: [{name: "Login", type: "auth", entry: "/login", files: [...]}]

Agent 2: Domain Organizer
├── Analyze codebase structure for logical groupings
├── Suggest domain boundaries based on folder structure, imports
└── Example output: [{domain: "auth", features: ["login", "register"], rationale: "..."}]

Agent 3: Dependency Mapper
├── Trace feature relationships via imports, API calls
├── Identify which features depend on or affect others
└── Example output: [{from: "checkout", to: "auth", type: "requires"}]

Agent 4: Gap Detector
├── Compare code capabilities to discovered features
├── Find undocumented routes, handlers, components
└── Example output: [{gap: "password-reset", evidence: "route exists but not documented"}]

PHASE 2: SYNTHESIS (main agent)
────────────────────────────────
├── Combine agent outputs
├── Resolve conflicts (e.g., different domain suggestions)
├── Create proposed domain structure
└── Present summary to user

PHASE 3: SOCRATIC Q&A (depth-first per domain)
──────────────────────────────────────────────
For each domain:
├── Present domain overview, ask for validation
├── For each feature in domain:
│   ├── Discovery Questions (8 questions)
│   ├── Depth Questions (follow-ups)
│   └── IMMEDIATELY write doc after Q&A complete
├── Boundary Questions (domain-level)
└── Documentation Review

PHASE 4: VALIDATION
───────────────────
├── Check all related fields resolve
├── Check for orphan docs
├── Check for keyword overlap
├── Generate coverage report
└── Final user review

PHASE 5: COMMIT
───────────────
├── git add .kanban/product/
├── git commit with feature list
└── Output next steps
```

**New Engineering Mapping Workflow:**

Similar structure with specialized agents:
- Stack Analyzer (dependencies, frameworks, versions)
- Architecture Mapper (systems, data flow, integration points)
- Convention Extractor (naming, patterns, code style)
- Risk Identifier (technical debt, security concerns, TODOs)

**Testing:**
- Run on sample codebase
- Compare coverage to current approach
- Validate doc quality

### Phase 3: Context Intelligence

**Deliverables:**
1. Create `select-context.ts` script
2. Implement tiered context injection
3. Update `kanban-implement` to use smart context
4. Update `get-hook-config.ts` to support tiers

**Source files to modify:**
- `apps/kanban/src/scripts/select-context.ts` (new)
- `apps/kanban/src/scripts/get-hook-config.ts`
- `apps/kanban/src/content/skills/kanban-implement/SKILL.md`

**Testing:**
- Measure context size before/after
- Validate relevance of selected docs

### Phase 4: Living Documentation

**Deliverables:**
1. Add `verified` and `code_refs` fields to templates
2. Create `check-freshness.ts` script
3. Update `kanban-docs` skill with verification prompts
4. Add freshness warnings to `kanban-implement`

**Source files to modify:**
- `apps/kanban/src/content/kanban-templates/*.md` (all templates)
- `apps/kanban/src/scripts/check-freshness.ts` (new)
- `apps/kanban/src/content/skills/kanban-docs/SKILL.md`
- `apps/kanban/src/content/skills/kanban-implement/SKILL.md`

**Testing:**
- Create intentionally stale docs
- Verify detection works
- Validate update flow

### Phase 5: Quality & Migration Tools

**Deliverables:**
1. Create `validate-docs.ts` quality checker script
2. Create `migrate-docs.ts` migration script
3. Create glossary system (`glossary.yaml` + search integration)
4. Create `/kanban-improve-docs` skill
5. Create `/kanban-quality-check` skill

**Source files to create:**
- `apps/kanban/src/scripts/validate-docs.ts`
- `apps/kanban/src/scripts/migrate-docs.ts`
- `apps/kanban/src/scripts/expand-query.ts` (glossary-aware search)
- `apps/kanban/src/content/skills/kanban-improve-docs/SKILL.md`
- `apps/kanban/src/content/skills/kanban-quality-check/SKILL.md`

**Source files to modify:**
- `apps/kanban/src/scripts/search-product.ts` (glossary integration)
- `apps/kanban/src/scripts/search-engineering.ts` (glossary integration)
- `apps/kanban/src/content/skills/kanban-map-product/SKILL.md` (glossary generation)
- `apps/kanban/src/content/skills/kanban-map-engineering/SKILL.md` (glossary generation)

**Testing:**
- Run migration on mock old-format docs
- Verify quality checks catch known issues
- Verify glossary expands search correctly

---

## Technical Specifications

### New Frontmatter Schema

**Product Docs:**
```yaml
id: string           # Required: domain/slug or "overview" or "{domain}/_index"
title: string        # Required: Human-readable name
type: string         # Required: "feature" | "concept" | "overview" | "domain"
tldr: string         # Required: Single sentence (max 100 chars)
summary: string      # Required: 2-3 sentences (max 300 chars)
keywords: string[]   # Required: Explicit search terms
aliases: string[]    # Optional: Synonyms for keywords
related: string[]    # Optional: Related doc IDs
boundary: string     # Optional: What this does NOT cover
contains: string[]   # Optional: For domain type - list of feature IDs in domain
updated: date        # Required: Last content update
verified: date       # Optional: Last accuracy verification
code_refs: string[]  # Optional: Related code paths
```

**Engineering Docs:**
```yaml
id: string           # Required: type/slug (systems/auth, patterns/middleware)
title: string        # Required
type: string         # Required: "system" | "pattern" | "convention" | "component" | "overview"
tldr: string         # Required
summary: string      # Required
keywords: string[]   # Required
aliases: string[]    # Optional
related: string[]    # Optional
boundary: string     # Optional
paths: string[]      # Required for systems: Code paths covered
updated: date        # Required
verified: date       # Optional
```

### Search Algorithm Changes

**Current:**
```
score = weighted_fuzzy_match(query, doc_fields)
```

**Proposed:**
```
base_score = weighted_fuzzy_match(query, doc_fields)
alias_boost = exact_match(query, doc.aliases) ? 0.2 : 0
boundary_penalty = fuzzy_match(query, doc.boundary) ? -0.15 : 0
final_score = base_score + alias_boost + boundary_penalty
```

### New Script Interfaces

**select-context.ts:**
```typescript
// Usage: node select-context.cjs <task-id> [--tier=minimal|standard|full] [--max=5]
// Returns: JSON with selected docs and their content at appropriate tier

interface SelectContextInput {
  taskId: string;
  tier: 'minimal' | 'standard' | 'full';
  maxDocs: number;
}

interface SelectContextOutput {
  taskId: string;
  tier: string;
  docs: Array<{
    id: string;
    type: 'product' | 'engineering';
    relevanceScore: number;
    content: string;  // tldr only, tldr+summary+boundary, or full content
  }>;
  totalTokensEstimate: number;
}
```

**check-freshness.ts:**
```typescript
// Usage: node check-freshness.cjs [--stale-days=30]
// Returns: JSON with freshness report

interface FreshnessOutput {
  totalDocs: number;
  fresh: number;
  stale: number;
  staleDocs: Array<{
    id: string;
    path: string;
    verifiedDate: string;
    codeRefs: string[];
    modifiedCodeRefs: string[];  // Which code files changed since verified
  }>;
}
```

**validate-docs.ts:**
```typescript
// Usage: node validate-docs.cjs [--type=product|engineering]
// Returns: JSON with quality report

interface QualityOutput {
  totalDocs: number;
  passing: number;
  warnings: number;
  errors: number;
  results: Array<{
    id: string;
    path: string;
    status: 'pass' | 'warning' | 'error';
    checks: Array<{
      name: string;
      passed: boolean;
      severity: 'error' | 'warning';
      message?: string;
    }>;
  }>;
}
```

**expand-query.ts:**
```typescript
// Usage: node expand-query.cjs <keyword1> <keyword2> ...
// Returns: JSON with expanded query using glossary

interface ExpandQueryOutput {
  original: string[];
  expanded: string[];  // Includes original + all matching aliases
  glossaryMatches: Array<{
    term: string;
    matchedOn: string;  // Which input term matched
    aliases: string[];
  }>;
}
```

### Parallel Agent Structure

**For kanban-map-product:**
```
Main Agent
├── Feature Scanner Agent (parallel)
│   └── Finds routes, UI components, CLI commands
├── Domain Organizer Agent (parallel)
│   └── Groups by business domain
├── Dependency Mapper Agent (parallel)
│   └── Maps feature relationships
└── Gap Detector Agent (parallel)
    └── Identifies undocumented capabilities

After all complete:
└── Synthesis Phase
    └── Combine findings, resolve conflicts, Q&A with user
```

---

## Success Metrics

| Metric | Current State | Target |
|--------|---------------|--------|
| Tagging accuracy | Unknown (feels wrong) | >85% correct on first pass |
| Doc coverage | Unknown | All features documented |
| False positives | High | <10% of tagged docs irrelevant |
| False negatives | High | <10% of relevant docs missed |
| Context size | All tagged docs | Tiered, appropriate to task |
| Doc freshness | Not tracked | <30 days since verification |

---

## Dependencies

- **No external APIs** - All local processing
- **No databases** - File-based storage
- **Existing stack** - Node.js, TypeScript, Fuse.js
- **Build system** - tsdown for script compilation

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Parallel agents add complexity | Start with 2 agents, expand if working |
| New template breaks existing docs | Migration script to add new fields |
| Tighter search misses valid matches | Adjustable threshold per skill |
| Boundary matching too aggressive | Make penalty configurable |

---

## Sources

### RAG & LLM Documentation
- [AWS RAG Best Practices](https://docs.aws.amazon.com/prescriptive-guidance/latest/writing-best-practices-rag/best-practices.html)
- [IBM AI Code Documentation](https://www.ibm.com/think/insights/ai-code-documentation-benefits-top-tips)
- [Prompt Engineering Guide - RAG](https://www.promptingguide.ai/research/rag)
- [Neo4j Advanced RAG Techniques](https://neo4j.com/blog/genai/advanced-rag-techniques/)

### Documentation Organization
- [GitBook Documentation Structure Tips](https://gitbook.com/docs/guides/docs-best-practices/documentation-structure-tips)
- [Document360 Knowledge Base Information Architecture](https://document360.com/blog/knowledge-base-information-architecture/)
- [Technical Documentation Best Practices 2025](https://www.wondermentapps.com/blog/technical-documentation-best-practices/)
- [Fern Information Architecture Best Practices](https://beta.buildwithfern.com/post/information-architecture-best-practices-documentation)

### Domain-Driven Design
- [DDD Review 2025 - Medium](https://medium.com/@soradaibu141221/lets-review-what-ddd-is-in-2025-a18cc8e6dabe)
- [ABP Framework DDD Documentation](https://abp.io/docs/latest/framework/architecture/domain-driven-design)
- [InfoQ Sociotechnical Design with DDD](https://www.infoq.com/news/2025/11/sociotechnical-design-DDD/)
