---
name: festina-define-product
description: Define a new product through Socratic Q&A and generate product documentation
allowed-tools: Read, Write, Bash(git add *, git commit *, git status), AskUserQuestion
disable-model-invocation: true
---

# Skill: Define Product

<purpose>
Define a new product through Socratic Q&A and generate product documentation.
</purpose>

<context>
<note>Use these scripts to reliably find files:</note>






<command description="Get current date/time (returns JSON with iso and date formats)">node .festinalente/scripts/get-date-time.cjs</command>




<note>Use these scripts to work with product documentation:</note>

<command description="List all product docs (returns JSON with count and docs array)">node .festinalente/scripts/list-product.cjs</command>
<command description="Filter by type">node .festinalente/scripts/list-product.cjs --type=feature</command>
<command description="Filter by domain">node .festinalente/scripts/list-product.cjs --domain=auth</command>



<note>Path rule: ID `auth/login` → Path `.festinalente/product/auth/login.md`</note>

<note>**Column Transition:** N/A - This is a product discovery command, not a task workflow command.</note>
</context>

<prohibited>
- Do not write docs without validating with user through Q&A
- Do not skip the commit step
- Do not invent features the user hasn't described
</prohibited>

<process>
  <step name="load_workflow">
    <action>Read `.festinalente/workflow.yaml` for column definitions, labels, priorities, and commit formats</action>
    <note>Use these values throughout this skill</note>
  </step>

  <step name="preflight_check">
    <action>Check if `.festinalente/product/` has files OTHER than `overview.md`</action>
    <command>node .festinalente/scripts/list-product.cjs</command>
    <branch condition="count > 1, OR if count == 1 and the doc is not `overview`">
      <action>Use AskUserQuestion tool with:
        - header: "Existing Docs"
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
    <action>Create `.festinalente/product/overview.md`</action>
    <action>Use template from `.festinalente/templates/overview.md`</action>
    <action>Fill frontmatter: `id: overview`, `type: overview`, `title`, `summary`</action>
    <action>Fill body sections: What is this?, Key Capabilities, Target Users</action>
  </step>

  <step name="socratic_qa_dialogue">
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

    <note>**For each feature (depth-first):**</note>
    <action>Use AskUserQuestion tool with:
      - header: "Workflow"
      - question: "How should {feature} work from the user's perspective?"
      - options:
        - label: "Skip", description: "Move to next question"
        - label: "Unsure", description: "Need to think about this"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe the workflow</note>

    <action>Use AskUserQuestion tool with:
      - header: "Interactions"
      - question: "What are the key interactions or workflows?"
      - options:
        - label: "Skip", description: "Move to next question"
        - label: "Unsure", description: "Need to think about this"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe interactions</note>

    <action>Use AskUserQuestion tool with:
      - header: "Constraints"
      - question: "Are there any constraints or limitations to consider?"
      - options:
        - label: "None", description: "No special constraints"
        - label: "Skip", description: "Move to next question"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe constraints</note>

    <action>Use AskUserQuestion tool with:
      - header: "Relations"
      - question: "Does this relate to any other features?"
      - options:
        - label: "Standalone", description: "This feature is independent"
        - label: "Skip", description: "Move to next question"
      - multiSelect: false
    </action>
    <note>User can select "Other" to list related features</note>

    <warning>IMMEDIATELY write the product doc:</warning>
    <action>Determine domain folder (e.g., `auth`, `billing`, `users`)</action>
    <action>Create domain folder if needed: `.festinalente/product/{domain}/`</action>
    <command description="Get current date">node .festinalente/scripts/get-date-time.cjs</command>
    <action>Use `date` field from output</action>
    <action>Create `.festinalente/product/{domain}/{feature}.md`</action>

    <note>**For features** (use `.festinalente/templates/product-doc.md`):</note>
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

    <note>**For concepts** (use `.festinalente/templates/concept-doc.md`):</note>
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
      - header: "Requirements"
      - question: "Are there specific technical requirements (performance, security, etc.)?"
      - options:
        - label: "None", description: "No special requirements"
        - label: "Skip", description: "I'll add requirements later"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe requirements</note>

    <action>Update existing docs with constraints</action>

    <action>Use AskUserQuestion tool with:
      - header: "MVP"
      - question: "What's the minimum viable version of this product?"
      - options:
        - label: "All features", description: "MVP includes all described features"
        - label: "Skip", description: "I'll define MVP scope later"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe MVP scope</note>

    <action>Note MVP scope in doc limitations sections</action>

    <note>**Exit:**</note>
    <action>Use AskUserQuestion tool with:
      - header: "Wrap Up"
      - question: "Is there anything else you'd like to add about the product?"
      - options:
        - label: "No, done", description: "Proceed to final review"
        - label: "Yes, more", description: "I have more to add"
      - multiSelect: false
    </action>
    <note>User can select "Other" to add more details</note>
    <branch condition="user says no/nothing/that's all">
      <action>Proceed to final review</action>
    </branch>
    <branch condition="user has more">
      <action>Continue Q&A</action>
    </branch>
  </step>

  <step name="final_review">
    <action>Read all generated product docs in `.festinalente/product/` (including subdirectories)</action>
    <action>Check for completeness and consistency</action>
    <action>Update any docs that need adjustments based on later Q&A context</action>
    <action>Verify all `related` fields are accurate across docs</action>
    <action>Ensure all docs have proper `id` with domain prefix (e.g., `auth/login`)</action>
  </step>

  <step name="commit">
    <note>Format: `docs: define-product - {brief product description}`</note>
    <command>git add .festinalente/product/</command>
    <command>git commit -m "docs: define-product - {brief product description}"</command>
    <note>Example: `docs: define-product - task management app with projects, tasks, collaboration`</note>
  </step>

  <step name="output_result">
    <output>Product documentation created!</output>
    <output>
Ready to start creating tasks:
```
/clear
/festina-create "Your task title"
```
    </output>
    ## Final Validation
    
    Before completing, validate all task XML:
    
    <command description="Validate XML in task files">node .festinalente/scripts/validate-xml.cjs {taskId}</command>
    
    If validation fails, fix the reported errors before completing.
    
    <output>[KANBAN_COMPLETE]</output>
  </step>
</process>

<success_criteria>
- `.festinalente/product/` directory exists
- At least one product doc was created
- Each product doc has valid frontmatter (id with domain prefix, type, title, summary, keywords, updated)
- `overview.md` exists with `type: overview`
- Git log shows `docs: define-product -`
- Next steps shown to user
</success_criteria>

<example>
User: `/festina-define-product`

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
.festinalente/product/
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
/festina-create "Your task title"
```
</next_steps>
