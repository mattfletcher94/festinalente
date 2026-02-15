---
name: kanban-map-product
description: Analyze existing codebase and create product documentation through Socratic Q&A
allowed-tools: Read, Write, Glob, Grep, Bash(git add *, git commit *, git status), AskUserQuestion
disable-model-invocation: true
---

# Skill: Map Product

<purpose>
Analyze existing codebase and create product documentation through Socratic Q&A.
</purpose>

<context>
{{> helper-scripts show_get_date_time=true}}

{{> product-docs-scripts show_list_product=true}}

<note>**Column Transition:** N/A - This is a product discovery command, not a task workflow command.</note>
</context>

<prohibited>
- Do not skip the codebase research phase
- Do not write docs without validating with user through Q&A
- Do not skip the commit step
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="preflight_check">
    <validate>Verify `.kanban/` directory exists</validate>
    <branch condition="directory not exists">
      <output>Error - "Please initialize kanban first with `kanban-init`"</output>
      <action>Exit</action>
    </branch>
    <action>Check if `.kanban/product/` has files OTHER than `overview.md`</action>
    <command>node .claude/scripts/list-product.cjs</command>
    <branch condition="count > 1, OR if count == 1 and the doc is not `overview`">
      <prompt>I found existing product docs. How should I proceed?</prompt>
      <note>Options: Preserve and extend / Merge with findings / Start fresh</note>
    </branch>
    <branch condition="only `overview.md` exists (or no docs)">
      <action>Proceed without prompting (this is expected from kanban-init)</action>
    </branch>
  </step>

  <step name="deep_codebase_research">
    <note>Research the codebase thoroughly:</note>

    <note>**Directory Structure:**</note>
    <action>Use Glob to find source directories (src/, lib/, app/, components/, pages/, api/)</action>
    <action>Identify the project structure</action>

    <note>**Package/Config Files:**</note>
    <action>Read package.json, requirements.txt, Cargo.toml, go.mod, etc.</action>
    <action>Note dependencies that hint at features (auth libraries, database drivers, etc.)</action>

    <note>**Entry Points:**</note>
    <action>Find main entry files</action>
    <action>Identify routing/API definitions</action>

    <note>**User-Facing Features:**</note>
    <action>API endpoints (look for routes, controllers, handlers)</action>
    <action>UI components (React, Vue, etc.)</action>
    <action>CLI commands (if any)</action>

    <note>**Architecture:**</note>
    <action>Database schemas (migrations, models)</action>
    <action>Service structure</action>
    <action>Key patterns (MVC, microservices, etc.)</action>

    <note>**Integrations:**</note>
    <action>External APIs</action>
    <action>Third-party services</action>
    <action>Authentication providers</action>
  </step>

  <step name="create_product_overview">
    <note>Based on codebase analysis, draft overview content:</note>
    <prompt>What is this product called?</prompt>
    <prompt>In one sentence, what does it do?</prompt>
    <action>Confirm target users based on what you found</action>
    <warning>IMMEDIATELY create overview.md:</warning>
    <action>Create `.kanban/product/overview.md`</action>
    <action>Use template from `.claude/kanban-templates/overview.md`</action>
    <action>Fill frontmatter: `id: overview`, `type: overview`, `title`, `summary`</action>
    <action>Fill body sections: What is this?, Key Capabilities (from analysis), Target Users</action>
  </step>

  <step name="present_summary">
    <output>I analyzed the codebase and found the following:</output>
    <output>**Features (grouped by domain):** - {domain}/ - {Feature 1}: {brief description}</output>
    <output>**Architecture:** - {Pattern/structure observation}</output>
    <output>**Integrations:** - {External service/API}</output>
    <output>Let me ask some questions to validate and expand on this understanding.</output>
  </step>

  <step name="socratic_qa_dialogue">
    <note>Use AskUserQuestion tool for **one question at a time**.</note>
    <warning>CRITICAL: Write docs incrementally to prevent context loss</warning>

    <note>**Suggest domain organization:**</note>
    <prompt>Based on the codebase, I suggest organizing features into these domains: {list}. Does this make sense, or would you prefer a different grouping?</prompt>

    <note>**For each feature (depth-first):**</note>
    <prompt>I found {feature} that appears to {description}. Is this accurate?</prompt>
    <branch condition="user corrects">
      <action>Update understanding</action>
    </branch>
    <prompt>Can you tell me more about how {aspect} works?</prompt>
    <prompt>Are there any edge cases or limitations I should know about?</prompt>
    <prompt>Who primarily uses this feature? What problem does it solve?</prompt>

    <warning>IMMEDIATELY write the product doc:</warning>
    <action>Determine domain folder (e.g., `auth`, `billing`, `users`)</action>
    <action>Create domain folder if needed: `.kanban/product/{domain}/`</action>
    <command description="Get current date">node .claude/scripts/get-date-time.cjs</command>
    <action>Use `date` field from output</action>
    <action>Create `.kanban/product/{domain}/{feature}.md`</action>

    <note>**For features** (use `.claude/kanban-templates/product-doc.md`):</note>
    <example_code lang="yaml">
---
id: {domain}/{feature}
title: {Feature Name}
type: feature
summary: {One sentence description}
keywords: [{relevant, terms}]
related: [{other/doc-ids}]
updated: {YYYY-MM-DD from get-date-time}
---

# {Feature Name}

## Overview
{What this feature is and why it exists}

## How It Works
{User-facing behavior from Q&A}

## Limitations
{Constraints mentioned during Q&A}
    </example_code>

    <note>**For concepts** (use `.claude/kanban-templates/concept-doc.md`):</note>
    <example_code lang="yaml">
---
id: {domain}/{concept}
title: {Concept Name}
type: concept
summary: {One sentence definition}
keywords: [{relevant, terms}]
related: [{other/doc-ids}]
updated: {YYYY-MM-DD from get-date-time}
---

# {Concept Name}

## Definition
{Clear definition}

## Examples
{Concrete examples}

## Rules & Constraints
{Business rules}
    </example_code>

    <note>This preserves context even if session is long</note>

    <note>**After all features:**</note>
    <prompt>What's the overall value proposition of this product?</prompt>
    <prompt>Are there any performance or security requirements I should document?</prompt>
    <prompt>Did I miss any important features or capabilities?</prompt>
    <branch condition="new features mentioned">
      <action>Create docs for them immediately</action>
    </branch>

    <note>**Exit:**</note>
    <prompt>Is there anything else you'd like to add about the product?</prompt>
    <branch condition="user says no/nothing/that's all">
      <action>Proceed to final review</action>
    </branch>
    <branch condition="user has more">
      <action>Continue Q&A</action>
    </branch>
  </step>

  <step name="final_review">
    <action>Read all generated product docs in `.kanban/product/` (including subdirectories)</action>
    <action>Check for completeness and consistency</action>
    <action>Update any docs that need adjustments based on later Q&A context</action>
    <action>Verify all `related` fields are accurate across docs</action>
    <action>Ensure all docs have proper `id` with domain prefix (e.g., `auth/login`)</action>
  </step>

  <step name="commit">
    <note>Format: `docs: map-product - {brief summary listing main features}`</note>
    <command>git add .kanban/product/</command>
    <command>git commit -m "docs: map-product - {brief summary listing main features}"</command>
    <note>Example: `docs: map-product - authentication, user management, notifications, search`</note>
  </step>

  <step name="output_result">
    <output>Output next steps to user</output>
  </step>
</process>

<success_criteria>
- `.kanban/product/` directory exists
- At least one product doc was created
- Each product doc has valid frontmatter (id with domain prefix, type, title, summary, keywords, updated)
- `overview.md` exists with `type: overview`
- Git log shows `docs: map-product -`
- Next steps shown to user
</success_criteria>

<example>
User: `/kanban-map-product`

```
I analyzed the codebase and found the following:

**Features (grouped by domain):**
- auth/
  - login: JWT-based login with email/password
  - registration: User signup with email verification
- tasks/
  - management: CRUD operations for tasks with status tracking
  - assignment: Assign tasks to team members
- notifications/
  - email: Email notifications for task updates

**Architecture:**
- Express.js backend with PostgreSQL
- React frontend with Redux state management

**Integrations:**
- SendGrid for email delivery
- Stripe for payments

Let me ask some questions to validate and expand on this understanding.

I found auth/login that appears to handle JWT-based login. Is this accurate?
```

**After Q&A completes, creates:**
```
.kanban/product/
├── overview.md
├── auth/
│   ├── login.md
│   └── registration.md
├── tasks/
│   ├── management.md
│   └── assignment.md
└── notifications/
    └── email.md
```
</example>

<note>
**Socratic Q&A Best Practices:**

**Key principles:**
1. Begin with open-ended questions that challenge assumptions
2. Use follow-up questions to clarify and probe deeper
3. Focus on past experiences (not "what do you want?" but "what have you experienced?")
4. Validate findings before assuming correctness
5. Promote critical thinking, not just fact-gathering

**For existing codebases:**
- Present findings as hypotheses: "I found X - is this accurate?"
- Ask about edge cases, limitations, and known issues
- Probe for undocumented features or tribal knowledge
</note>

<next_steps>
```
/clear
/kanban-create "Your task title"
```
</next_steps>
