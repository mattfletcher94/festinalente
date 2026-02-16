---
name: kanban-define-product
description: Define a new product through Socratic Q&A and generate product documentation
allowed-tools: Read, Write, Bash(git add *, git commit *, git status), AskUserQuestion
disable-model-invocation: true
---

# Skill: Define Product

<purpose>
Define a new product through Socratic Q&A and generate product documentation.
</purpose>

<context>
{{> helper-scripts show_get_date_time=true}}

{{> product-docs-scripts show_list_product=true}}

<note>**Column Transition:** N/A - This is a product discovery command, not a task workflow command.</note>
</context>

<prohibited>
- Do not write docs without validating with user through Q&A
- Do not skip the commit step
- Do not invent features the user hasn't described
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="preflight_check">
    <action>Check if `.kanban/product/` has files OTHER than `overview.md`</action>
    <command>node .claude/kanban-scripts/list-product.cjs</command>
    <branch condition="count > 1, OR if count == 1 and the doc is not `overview`">
      <prompt>I found existing product docs. How should I proceed?</prompt>
      <note>Options: Preserve and extend / Start fresh</note>
    </branch>
    <branch condition="only `overview.md` exists (or no docs)">
      <action>Proceed without prompting (this is expected for new installs)</action>
    </branch>
  </step>

  <step name="create_product_overview">
    <prompt>What is this product called?</prompt>
    <prompt>In one sentence, what does it do?</prompt>
    <prompt>Who are the target users?</prompt>
    <warning>IMMEDIATELY create overview.md:</warning>
    <action>Create `.kanban/product/overview.md`</action>
    <action>Use template from `.claude/kanban-templates/overview.md`</action>
    <action>Fill frontmatter: `id: overview`, `type: overview`, `title`, `summary`</action>
    <action>Fill body sections: What is this?, Key Capabilities, Target Users</action>
  </step>

  <step name="socratic_qa_dialogue">
    <note>Use AskUserQuestion tool for **one question at a time**.</note>
    <warning>CRITICAL: Write docs incrementally to prevent context loss</warning>

    <note>**Identify features and domains:**</note>
    <prompt>What are the main capabilities or features you want to build?</prompt>
    <prompt>How would you group these features? (e.g., auth, billing, users)</prompt>

    <note>**For each feature (depth-first):**</note>
    <prompt>How should {feature} work from the user's perspective?</prompt>
    <prompt>What are the key interactions or workflows?</prompt>
    <prompt>Are there any constraints or limitations to consider?</prompt>
    <prompt>Does this relate to any other features?</prompt>

    <warning>IMMEDIATELY write the product doc:</warning>
    <action>Determine domain folder (e.g., `auth`, `billing`, `users`)</action>
    <action>Create domain folder if needed: `.kanban/product/{domain}/`</action>
    <command description="Get current date">node .claude/kanban-scripts/get-date-time.cjs</command>
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

    <note>**Expand:**</note>
    <prompt>Does this product need to integrate with any external services?</prompt>
    <branch condition="new integrations mentioned">
      <action>Create/update relevant docs immediately</action>
    </branch>
    <prompt>Are there specific technical requirements (performance, security, etc.)?</prompt>
    <action>Update existing docs with constraints</action>
    <prompt>What's the minimum viable version of this product?</prompt>
    <action>Note MVP scope in doc limitations sections</action>

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
    <note>Format: `docs: define-product - {brief product description}`</note>
    <command>git add .kanban/product/</command>
    <command>git commit -m "docs: define-product - {brief product description}"</command>
    <note>Example: `docs: define-product - task management app with projects, tasks, collaboration`</note>
  </step>

  <step name="output_result">
    <output>Product documentation created!</output>
    <output>
Ready to start creating tasks:
```
/clear
/kanban-create "Your task title"
```
    </output>
  </step>
</process>

<success_criteria>
- `.kanban/product/` directory exists
- At least one product doc was created
- Each product doc has valid frontmatter (id with domain prefix, type, title, summary, keywords, updated)
- `overview.md` exists with `type: overview`
- Git log shows `docs: define-product -`
- Next steps shown to user
</success_criteria>

<example>
User: `/kanban-define-product`

```
What is this product called?
```

User: "TaskFlow"

```
In one sentence, what does it do?
```

User: "A task management system for development teams"

Creating overview.md...

```
What are the main capabilities or features you want to build?
```

User: "Task tracking, project boards, team collaboration, notifications"

```
How would you group these features? (e.g., auth, billing, users)
```

User: "tasks, projects, collaboration, notifications"

```
How should Task Tracking work from the user's perspective?
```

...continues depth-first exploration of each feature...

**After Q&A completes, creates:**
```
.kanban/product/
├── overview.md
├── tasks/
│   └── tracking.md
├── projects/
│   └── boards.md
├── collaboration/
│   └── team.md
└── notifications/
    └── alerts.md
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
</note>

<next_steps>
```
/clear
/kanban-create "Your task title"
```
</next_steps>
