---
name: festina-define
description: Define a new product through Socratic Q&A and generate product and engineering documentation
allowed-tools: Read, Write, Bash(node *, git add *, git commit *, git status), WebSearch
disable-model-invocation: true
---

# Skill: Define Product & Engineering

<purpose>
Define a new greenfield product through deep Socratic Q&A and generate both product and engineering documentation with glossary and validation.
</purpose>

<context>
{{> directory-reference}}

{{> helper-scripts show_get_date_time=true}}

{{> product-docs-scripts show_search_product=true show_list_product=true}}

{{> engineering-docs-scripts show_search_engineering=true show_list_engineering=true}}

<note>**Column Transition:** N/A - This is a discovery command, not a task workflow command.</note>

<note>**Glossary:** This skill generates `.festinalente/glossary.yaml` with project-specific terms and aliases for improved search.</note>
</context>

<prohibited>
- Do not write docs without validating with user through Q&A
- Do not invent features the user hasn't described
- Do not batch multiple questions — ask one AskUserQuestion at a time
- Do not skip incremental doc writing — write each doc immediately after its Q&A section
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="load_directives">
    {{> load-directives skill="define"}}
  </step>

  <step name="preflight_check">
    <action>Check if `.festinalente/product/` has files OTHER than `overview.md`</action>
    <command>node .festinalente/scripts/festinalente.cjs list-product</command>
    <branch condition="count > 1, OR if count == 1 and the doc is not `overview`">
      <action>Use AskUserQuestion tool with:
        - header: "Existing Product Docs"
        - question: "I found existing product docs. How should I proceed?"
        - options:
          - label: "Preserve and extend", description: "Keep existing docs, add new features"
          - label: "Start fresh", description: "Replace existing docs entirely"
        - multiSelect: false
      </action>
    </branch>
    <branch condition="only `overview.md` exists (or no docs)">
      <action>Proceed without prompting (this is expected for new installs)</action>
    </branch>

    <action>Check if `.festinalente/engineering/` has files OTHER than `overview.md`</action>
    <command>node .festinalente/scripts/festinalente.cjs list-engineering</command>
    <branch condition="count > 1, OR if count == 1 and the doc is not `overview`">
      <action>Use AskUserQuestion tool with:
        - header: "Existing Engineering Docs"
        - question: "I found existing engineering docs. How should I proceed?"
        - options:
          - label: "Preserve and extend", description: "Keep existing docs, add new findings"
          - label: "Start fresh", description: "Replace existing docs entirely"
        - multiSelect: false
      </action>
    </branch>
    <branch condition="only `overview.md` exists (or no docs)">
      <action>Proceed without prompting (this is expected for new installs)</action>
    </branch>
  </step>

  <step name="create_product_overview">
    <action>Use AskUserQuestion tool with:
      - header: "Product"
      - question: "What is this product called?"
      - options:
        - label: "Skip for now", description: "I'll provide the name later"
      - multiSelect: false
    </action>
    <note>User can select "Other" to type the product name</note>

    <action>Use AskUserQuestion tool with:
      - header: "Purpose"
      - question: "In one sentence, what does this product do?"
      - options:
        - label: "Skip for now", description: "I'll provide this later"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe the product purpose</note>

    <action>Use AskUserQuestion tool with:
      - header: "Users"
      - question: "Who are the target users?"
      - options:
        - label: "Developers", description: "Software developers and engineers"
        - label: "Businesses", description: "Business users and teams"
        - label: "Consumers", description: "General consumer users"
        - label: "Skip for now", description: "I'll provide this later"
      - multiSelect: false
    </action>
    <note>User can select "Other" to specify target users</note>

    <warning>IMMEDIATELY create overview.md:</warning>
    <command description="Get current date">node .festinalente/scripts/festinalente.cjs get-date-time</command>
    <action>Use `date` field from output</action>
    <action>Create `.festinalente/product/overview.md`</action>
    <action>Fill ALL frontmatter fields:</action>
    <example_code lang="yaml">
---
id: overview
title: {Product Name}
type: overview
tldr: {Single sentence - max 100 chars}
summary: {One sentence description of the product}
keywords: [{relevant, terms}]
aliases: [{synonyms, variations}]
boundary: {What this product does NOT cover}
references: []
uses: []
updated: {YYYY-MM-DD from get-date-time}
---

# {Product Name}

## Intent
{Why this product exists and what it aims to achieve}

## Requirements
- Target users: {target users}
- Key capabilities: {list of capabilities from Q&A}

## Boundaries
{What this product explicitly does NOT do}
    </example_code>
  </step>

  <step name="product_qa">
    <note>Use AskUserQuestion tool for **one question at a time**.</note>
    <warning>CRITICAL: Write docs incrementally to prevent context loss</warning>

    <note>**Identify features and domains:**</note>
    <action>Use AskUserQuestion tool with:
      - header: "Features"
      - question: "What are the main capabilities or features you want to build?"
      - options:
        - label: "Skip", description: "I'll describe features later"
      - multiSelect: false
    </action>
    <note>User can select "Other" to list the main features</note>

    <action>Use AskUserQuestion tool with:
      - header: "Domains"
      - question: "How would you group these features? (e.g., auth, billing, users)"
      - options:
        - label: "Auth + Users", description: "Authentication and user management"
        - label: "Core + Admin", description: "Core features and admin panel"
        - label: "Skip", description: "I'll figure this out later"
      - multiSelect: false
    </action>
    <note>User can select "Other" to specify custom domain groupings</note>

    <note>**For each feature (depth-first), ask these Socratic questions:**</note>

    <action>Use AskUserQuestion tool with:
      - header: "Motivation"
      - question: "What problem does {feature} solve?"
      - options:
        - label: "Skip", description: "Move to next question"
        - label: "Unsure", description: "Need to think about this"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe the motivation</note>

    <action>Use AskUserQuestion tool with:
      - header: "Walkthrough"
      - question: "Walk me through a concrete scenario of using {feature}"
      - options:
        - label: "Skip", description: "Move to next question"
        - label: "Unsure", description: "Need to think about this"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe the scenario</note>

    <action>Use AskUserQuestion tool with:
      - header: "Success Criteria"
      - question: "How do you know {feature} is working correctly?"
      - options:
        - label: "Skip", description: "Move to next question"
        - label: "Unsure", description: "Need to think about this"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe success criteria</note>

    <action>Use AskUserQuestion tool with:
      - header: "Edge Cases"
      - question: "What should happen when things go wrong?"
      - options:
        - label: "Standard errors", description: "Use generic error handling"
        - label: "Skip", description: "Move to next question"
        - label: "Unsure", description: "Need to think about this"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe edge cases</note>

    <action>Use AskUserQuestion tool with:
      - header: "Boundaries"
      - question: "What should {feature} explicitly NOT do?"
      - options:
        - label: "Skip", description: "Move to next question"
        - label: "None", description: "No specific boundaries"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe boundaries</note>

    <warning>IMMEDIATELY write the product doc after Q&A for each feature:</warning>
    <action>Determine domain folder (e.g., `auth`, `billing`, `users`)</action>
    <action>Create domain folder if needed: `.festinalente/product/{domain}/`</action>
    <action>Create domain `_index.md` if first feature in domain</action>
    <command description="Get current date">node .festinalente/scripts/festinalente.cjs get-date-time</command>
    <action>Use `date` field from output</action>

    <note>**For domain `_index.md` files:**</note>
    <example_code lang="yaml">
---
id: {domain}
title: {Domain Name}
type: domain
tldr: {Single sentence - max 100 chars}
summary: {One sentence description of this domain}
keywords: [{relevant, terms}]
aliases: [{synonyms, variations}]
boundary: {What this domain does NOT cover}
references: []
uses: []
updated: {YYYY-MM-DD from get-date-time}
---

# {Domain Name}

## Intent
{Why this domain exists and what it groups together}

## Requirements
{What features/capabilities this domain encompasses}

## Boundaries
{What this domain explicitly does NOT cover}
    </example_code>

    <note>**For feature docs** (`.festinalente/product/{domain}/{feature}.md`):</note>
    <example_code lang="yaml">
---
id: {domain}/{feature}
title: {Feature Name}
type: feature
tldr: {Single sentence - max 100 chars}
summary: {One sentence description}
keywords: [{relevant, terms}]
aliases: [{synonyms, variations}]
boundary: {What this feature does NOT do}
references: [{other/doc-ids}]
uses: [{system/doc-ids}]
updated: {YYYY-MM-DD from get-date-time}
---

# {Feature Name}

## Intent
{Why this feature exists and what it aims to achieve}

## Requirements
{Concrete requirements derived from Q&A}

## Boundaries
{What this feature does NOT do}
    </example_code>

    <note>This preserves context even if session is long</note>

    <note>**Repeat for all features, then expand:**</note>
    <action>Use AskUserQuestion tool with:
      - header: "Integrations"
      - question: "Does this product need to integrate with any external services?"
      - options:
        - label: "None", description: "No external integrations needed"
        - label: "Skip", description: "I'll add integrations later"
      - multiSelect: false
    </action>
    <note>User can select "Other" to list integrations</note>

    <branch condition="new integrations mentioned">
      <action>Create/update relevant docs immediately</action>
    </branch>

    <action>Use AskUserQuestion tool with:
      - header: "MVP"
      - question: "What's the minimum viable version of this product?"
      - options:
        - label: "All features", description: "MVP includes all described features"
        - label: "Skip", description: "I'll define MVP scope later"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe MVP scope</note>

    <action>Note MVP scope in doc boundary sections</action>

    <note>**Exit product Q&A:**</note>
    <action>Use AskUserQuestion tool with:
      - header: "Product Complete"
      - question: "Is there anything else you'd like to add about the product?"
      - options:
        - label: "No, move to engineering", description: "Proceed to engineering decisions"
        - label: "Yes, more", description: "I have more product details to add"
      - multiSelect: false
    </action>
    <note>User can select "Other" to add more details</note>
    <branch condition="user says no/done">
      <action>Proceed to engineering overview</action>
    </branch>
    <branch condition="user has more">
      <action>Continue product Q&A</action>
    </branch>
  </step>

  <step name="engineering_overview">
    <note>Q&A for tech stack decisions. Propose defaults when user is unsure.</note>

    <action>Use AskUserQuestion tool with:
      - header: "Language"
      - question: "What language/runtime will this project use?"
      - options:
        - label: "TypeScript/Node.js", description: "JavaScript/TypeScript with Node.js runtime"
        - label: "Python", description: "Python 3.x"
        - label: "Go", description: "Go (Golang)"
        - label: "Rust", description: "Rust"
        - label: "Unsure", description: "Not sure yet - help me decide"
      - multiSelect: false
    </action>
    <note>User can select "Other" to specify a different language</note>
    <branch condition="user selects Unsure">
      <action>Use WebSearch to research language options relevant to the product requirements</action>
      <action>Present pros/cons for top 2-3 options based on product needs</action>
      <action>Propose a recommendation with rationale</action>
      <note>If WebSearch is unavailable, propose a default based on product type and explain reasoning</note>
    </branch>

    <action>Use AskUserQuestion tool with:
      - header: "Framework"
      - question: "What framework will you use?"
      - options:
        - label: "Unsure", description: "Not sure yet - help me decide"
        - label: "Skip", description: "I'll decide later"
      - multiSelect: false
    </action>
    <note>Propose framework defaults based on chosen language and product requirements</note>
    <note>User can select "Other" to specify a framework</note>
    <branch condition="user selects Unsure">
      <action>Use WebSearch to research framework options for the chosen language</action>
      <action>Present pros/cons for top 2-3 options</action>
      <action>Propose a recommendation with rationale</action>
      <note>If WebSearch is unavailable, propose the most common framework for the chosen stack</note>
    </branch>

    <action>Use AskUserQuestion tool with:
      - header: "Project Structure"
      - question: "Monorepo or single package?"
      - options:
        - label: "Monorepo", description: "Multiple packages in a single repository"
        - label: "Single package", description: "One package, one repo"
        - label: "Unsure", description: "Not sure yet - help me decide"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe a different structure</note>

    <action>Use AskUserQuestion tool with:
      - header: "Database"
      - question: "What database will you use? (if applicable)"
      - options:
        - label: "PostgreSQL", description: "Relational database"
        - label: "SQLite", description: "Lightweight embedded database"
        - label: "MongoDB", description: "Document database"
        - label: "None", description: "No database needed"
        - label: "Unsure", description: "Not sure yet - help me decide"
      - multiSelect: false
    </action>
    <note>User can select "Other" to specify a different database</note>
    <branch condition="user selects Unsure">
      <action>Use WebSearch to research database options for the product's data patterns</action>
      <action>Present pros/cons based on product requirements</action>
      <action>Propose a recommendation with rationale</action>
      <note>If WebSearch is unavailable, propose based on product data patterns</note>
    </branch>

    <action>Use AskUserQuestion tool with:
      - header: "External Services"
      - question: "Any external services or APIs this project will depend on?"
      - options:
        - label: "None", description: "No external service dependencies"
        - label: "Skip", description: "I'll add these later"
      - multiSelect: false
    </action>
    <note>User can select "Other" to list external services</note>

    <warning>IMMEDIATELY create engineering overview.md:</warning>
    <command description="Get current date">node .festinalente/scripts/festinalente.cjs get-date-time</command>
    <action>Use `date` field from output</action>
    <action>Create `.festinalente/engineering/overview.md`</action>
    <example_code lang="yaml">
---
id: overview
title: Engineering Overview
type: overview
tldr: {Single sentence - max 100 chars}
summary: {One sentence description of the tech stack and architecture}
keywords: [{relevant, terms}]
aliases: [{synonyms, variations}]
boundary: {What this engineering scope does NOT cover}
references: []
uses: []
paths: []
updated: {YYYY-MM-DD from get-date-time}
---

# Engineering Overview

## Intent
{Why these technology choices were made and what they enable}

## Requirements
- Language/Runtime: {language}
- Framework: {framework}
- Structure: {monorepo/single}
- Database: {database or "N/A"}
- External Services: {list or "None"}

## Boundaries
{What this engineering scope does NOT cover}
    </example_code>
  </step>

  <step name="engineering_qa">
    <note>Use AskUserQuestion tool for **one question at a time**.</note>
    <warning>CRITICAL: Write docs incrementally to prevent context loss</warning>

    <note>**For systems — ask about architecture:**</note>
    <action>Use AskUserQuestion tool with:
      - header: "Systems"
      - question: "What are the major systems or components? (e.g., API, auth, database layer, queue)"
      - options:
        - label: "Skip", description: "Move to patterns"
        - label: "Unsure", description: "Help me identify the systems"
      - multiSelect: false
    </action>
    <note>User can select "Other" to list systems</note>
    <branch condition="user selects Unsure">
      <action>Propose system breakdown based on product features and chosen stack</action>
    </branch>

    <note>**For each system (depth-first):**</note>
    <action>Use AskUserQuestion tool with:
      - header: "Architecture"
      - question: "How will {system} work architecturally?"
      - options:
        - label: "Skip", description: "Move to next system"
        - label: "Unsure", description: "Help me decide"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe the architecture</note>
    <branch condition="user selects Unsure">
      <action>Use WebSearch to research architecture patterns for {system} with the chosen stack</action>
      <action>Propose architecture with rationale</action>
      <note>If WebSearch is unavailable, propose common architecture pattern for the system type</note>
    </branch>

    <action>Use AskUserQuestion tool with:
      - header: "Boundaries"
      - question: "What does {system} NOT handle?"
      - options:
        - label: "Skip", description: "Move to next question"
        - label: "None", description: "No specific boundaries"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe boundaries</note>

    <warning>IMMEDIATELY write the system doc:</warning>
    <action>Create folder if needed: `.festinalente/engineering/systems/{system}/`</action>
    <command description="Get current date">node .festinalente/scripts/festinalente.cjs get-date-time</command>
    <action>Create `.festinalente/engineering/systems/{system}/_index.md`</action>
    <example_code lang="yaml">
---
id: systems/{system}
title: {System Name}
type: system
tldr: {Single sentence - max 100 chars}
summary: {One sentence description}
keywords: [{relevant, terms}]
aliases: [{synonyms, variations}]
boundary: {What this system does NOT handle}
references: [{other/system-ids}]
uses: [{dependency/ids}]
paths: [{relevant/file/paths}]
updated: {YYYY-MM-DD from get-date-time}
---

# {System Name}

## Intent
{Why this system exists and what it aims to achieve}

## Requirements
{Concrete architectural requirements from Q&A}

## Boundaries
{What this system does NOT handle}
    </example_code>

    <note>**For patterns — ask about design decisions:**</note>
    <action>Use AskUserQuestion tool with:
      - header: "Patterns"
      - question: "What patterns should {concern} follow? (e.g., error handling, data access, state management)"
      - options:
        - label: "Skip", description: "Move to conventions"
        - label: "Unsure", description: "Help me decide"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe patterns</note>
    <branch condition="user selects Unsure">
      <action>Use WebSearch to research best practice patterns for the chosen stack</action>
      <action>Propose patterns with rationale</action>
      <note>If WebSearch is unavailable, propose common patterns for the stack</note>
    </branch>

    <warning>IMMEDIATELY write the pattern doc:</warning>
    <command description="Get current date">node .festinalente/scripts/festinalente.cjs get-date-time</command>
    <action>Create `.festinalente/engineering/patterns/{pattern}.md`</action>
    <example_code lang="yaml">
---
id: patterns/{pattern}
title: {Pattern Name}
type: pattern
tldr: {Single sentence - max 100 chars}
summary: {One sentence description}
keywords: [{relevant, terms}]
aliases: [{synonyms, variations}]
boundary: {When NOT to use this pattern}
references: [{related/doc-ids}]
uses: [{dependency/ids}]
paths: []
updated: {YYYY-MM-DD from get-date-time}
---

# {Pattern Name}

## Intent
{Why this pattern is used and what problem it solves}

## Requirements
{When and how to apply this pattern}

## Boundaries
{When NOT to use this pattern}
    </example_code>

    <note>**For conventions — ask about coding standards:**</note>
    <action>Use AskUserQuestion tool with:
      - header: "Conventions"
      - question: "What coding conventions should the project use? (e.g., file naming, folder structure, import style)"
      - options:
        - label: "Standard for stack", description: "Use standard conventions for the chosen stack"
        - label: "Skip", description: "I'll define conventions later"
        - label: "Unsure", description: "Help me decide"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe conventions</note>
    <branch condition="user selects Unsure or Standard for stack">
      <action>Use WebSearch to research standard conventions for the chosen stack</action>
      <action>Propose conventions with rationale</action>
      <note>If WebSearch is unavailable, propose common conventions for the stack</note>
    </branch>

    <warning>IMMEDIATELY write the convention doc:</warning>
    <command description="Get current date">node .festinalente/scripts/festinalente.cjs get-date-time</command>
    <action>Create `.festinalente/engineering/conventions/{convention}.md`</action>
    <example_code lang="yaml">
---
id: conventions/{convention}
title: {Convention Name}
type: convention
tldr: {Single sentence - max 100 chars}
summary: {One sentence description}
keywords: [{relevant, terms}]
aliases: [{synonyms, variations}]
boundary: {Exceptions to this convention}
references: [{related/doc-ids}]
uses: []
paths: []
updated: {YYYY-MM-DD from get-date-time}
---

# {Convention Name}

## Intent
{Why this convention exists and what consistency it provides}

## Requirements
{Specific rules to follow}

## Boundaries
{Exceptions or cases where this convention does NOT apply}
    </example_code>

    <note>**Exit engineering Q&A:**</note>
    <action>Use AskUserQuestion tool with:
      - header: "Engineering Complete"
      - question: "Is there anything else about the engineering/architecture you'd like to define?"
      - options:
        - label: "No, done", description: "Proceed to glossary generation"
        - label: "Yes, more", description: "I have more engineering details"
      - multiSelect: false
    </action>
    <note>User can select "Other" to add more details</note>
    <branch condition="user says no/done">
      <action>Proceed to glossary generation</action>
    </branch>
    <branch condition="user has more">
      <action>Continue engineering Q&A</action>
    </branch>
  </step>

  <step name="glossary_generation">
    <note>Extract terms from all generated product and engineering docs</note>

    <action>Read all written product docs in `.festinalente/product/` (including subdirectories)</action>
    <action>Read all written engineering docs in `.festinalente/engineering/` (including subdirectories)</action>
    <action>Identify domain-specific terms, abbreviations, and concepts</action>
    <action>Extract terms from keywords, titles, and doc content</action>

    <action>Create `.festinalente/glossary.yaml`</action>
    <example_code lang="yaml">
# Project Glossary - Auto-generated, user can edit
version: 1
terms:
  - term: "{term}"
    aliases: ["{synonym1}", "{synonym2}"]
    domain: {domain}
    definition: "{brief definition}"
    auto_generated: true
    </example_code>

    <action>Use AskUserQuestion tool with:
      - header: "Glossary"
      - question: "Review glossary - any terms to add, remove, or rename?"
      - options:
        - label: "Looks good", description: "Glossary is complete"
        - label: "Add terms", description: "I want to add more terms"
        - label: "Remove terms", description: "Some terms should be removed"
        - label: "Rename terms", description: "Some terms need renaming"
      - multiSelect: true
    </action>
    <note>User can select "Other" to specify changes</note>

    <action>Update glossary based on feedback</action>
  </step>

  <step name="validation_phase">
    <note>Cross-reference and consistency check all generated docs</note>

    <action>Verify all `references` fields resolve to existing doc IDs</action>
    <action>Verify all `uses` fields resolve to existing doc IDs</action>
    <action>Check frontmatter completeness — all 11 fields present: id, title, type, tldr, summary, keywords, aliases, boundary, references, uses, updated</action>
    <action>Check for orphan docs (created but not referenced by any other doc)</action>
    <action>Check glossary covers key terms from all docs</action>

    <command description="Validate all docs">node .festinalente/scripts/festinalente.cjs validate-docs</command>

    <output>
Validation Report:
--------------------------------------------
Product docs: {count} ({domain_count} domains)
Engineering docs: {count} (systems: {s}, patterns: {p}, conventions: {c})
Glossary terms: {term_count}

ISSUES FOUND:
- Broken references: {list or "None"}
- Broken uses: {list or "None"}
- Missing frontmatter fields: {list or "None"}
- Orphan docs: {list or "None"}
- Missing glossary terms: {list or "None"}
    </output>

    <branch condition="issues found">
      <action>Fix each issue:
        - Broken references/uses: Remove or add missing doc
        - Missing frontmatter: Add missing fields
        - Orphan docs: Add references from related docs
        - Missing glossary terms: Add to glossary.yaml
      </action>
      <action>Re-run validation until clean</action>
    </branch>
  </step>

  {{> directive-compliance}}

  <step name="validate_xml">
    <command description="Validate created docs">node .festinalente/scripts/festinalente.cjs validate-docs</command>
    <branch condition="validation fails">
      <output>Warning: Validation failed. Fix errors before completing.</output>
    </branch>
  </step>

  <step name="output_result">
    <output>Product and engineering documentation defined!</output>
    <output>
**Created:**
- {product_count} product docs across {domain_count} domains
- {engineering_count} engineering docs (systems, patterns, conventions)
- Project glossary with {term_count} terms

**All docs use Intent/Requirements/Boundaries structure.**
When code is built, run `/festina-finalize` to rewrite Intent sections as Overview/How It Works.

Ready to start creating tasks:
```
/clear
/festina-create "Your task title"
```
    </output>
    {{> skill-complete}}
  </step>
</process>

<success_criteria>
- `.festinalente/product/` directory exists with at least `overview.md`
- `.festinalente/engineering/` directory exists with at least `overview.md`
- Each product doc has valid frontmatter (id, title, type, tldr, summary, keywords, aliases, boundary, references, uses, updated)
- Each engineering doc has valid frontmatter (id, title, type, tldr, summary, keywords, aliases, boundary, references, uses, paths, updated)
- All docs use Intent/Requirements/Boundaries body structure
- `.festinalente/glossary.yaml` exists with at least one term
- Validation phase completed — all references resolve, no missing fields
- Next steps shown to user
</success_criteria>

<example>
User: `/festina-define`

```
What is this product called?
```

User: "TaskFlow"

```
In one sentence, what does it do?
```

User: "A task management system for development teams"

```
Who are the target users?
```

User: "Developers"

Creating product overview.md...

```
What are the main capabilities or features you want to build?
```

User: "Task tracking, project boards, team collaboration, notifications"

```
How would you group these features?
```

User: "tasks, projects, collaboration, notifications"

**Depth-first Q&A for each feature:**

```
What problem does Task Tracking solve?
```

User: "Developers lose track of what they're working on across multiple projects"

```
Walk me through a concrete scenario of using Task Tracking
```

User: "A developer opens the board, sees their assigned tasks sorted by priority..."

```
How do you know Task Tracking is working correctly?
```

User: "Tasks appear immediately after creation, status updates are real-time..."

```
What should happen when things go wrong?
```

User: "Show clear error messages, never lose task data..."

```
What should Task Tracking explicitly NOT do?
```

User: "No time tracking, no invoicing - that's a separate tool"

Writing tasks/tracking.md with Intent/Requirements/Boundaries...

...continues for each feature, then moves to engineering...

```
What language/runtime will this project use?
```

User: "TypeScript/Node.js"

```
What framework will you use?
```

User: "Unsure"

*Uses WebSearch to research frameworks, presents options...*

Recommend: Next.js for full-stack TypeScript with React. Rationale: ...

...continues engineering Q&A...

**After all Q&A completes, creates:**
```
.festinalente/product/
+-- overview.md
+-- tasks/
|   +-- _index.md
|   +-- tracking.md
+-- projects/
|   +-- _index.md
|   +-- boards.md
+-- collaboration/
|   +-- _index.md
|   +-- team.md
+-- notifications/
    +-- _index.md
    +-- alerts.md

.festinalente/engineering/
+-- overview.md
+-- systems/
|   +-- api/
|   |   +-- _index.md
|   +-- database/
|       +-- _index.md
+-- patterns/
|   +-- error-handling.md
+-- conventions/
    +-- file-naming.md

.festinalente/glossary.yaml
```

**Validation Report:**
```
Product docs: 9 (4 domains)
Engineering docs: 5 (systems: 2, patterns: 1, conventions: 1)
Glossary terms: 12

ISSUES FOUND: None
```
</example>

<note>
**Socratic Q&A Best Practices:**

**Key principles:**
1. Begin with open-ended questions that challenge assumptions
2. Use follow-up questions to clarify and probe deeper
3. Focus on user journeys and workflows
4. Ask about constraints, priorities, and trade-offs
5. Promote critical thinking, not just fact-gathering

**For new projects:**
- Use "Jobs-To-Be-Done" framing: "What job does this solve for users?"
- Explore user journeys and workflows
- Ask about constraints, priorities, and trade-offs

**GSD pattern — propose defaults when user is unsure:**
- Research options via WebSearch when available
- Present pros/cons for top 2-3 options
- Propose a recommendation with clear rationale
- User can accept or override
- If WebSearch is unavailable, propose based on product type and common patterns
</note>

<next_steps>
```
/clear
/festina-create "Your task title"
```
</next_steps>
</output>
