---
name: kanban-define-product
description: Define a new product through Socratic Q&A and generate product documentation
allowed-tools: Read, Write, Bash(git add *, git commit *, git status), AskUserQuestion
disable-model-invocation: true
---

# Skill: Define Product

Define a new product through Socratic Q&A and generate product documentation.

## Reference

{{> helper-scripts show_get_date_time=true}}

{{> product-docs-scripts show_list_product=true}}

## Column Transition

N/A - This is a product discovery command, not a task workflow command.

## Steps

- [ ] 1. **Load Workflow Schema**
   {{> workflow-load}}

- [ ] 2. **Pre-flight Check**
   1. Verify `.kanban/` directory exists
      - If not: Error - "Please initialize kanban first with `kanban-init`"
   2. Check if `.kanban/product/` has existing files
      - If yes: Ask user using AskUserQuestion:
        - "I found existing product docs. How should I proceed?"
        - Options: Preserve and extend / Start fresh

- [ ] 3. **Create Product Overview**
   1. Ask: "What is this product called?"
   2. Ask: "In one sentence, what does it do?"
   3. Ask: "Who are the target users?"
   4. **IMMEDIATELY create overview.md:**
      - Create `.kanban/product/overview.md`
      - Use template from `.claude/kanban-templates/overview.md`
      - Fill frontmatter: `id: overview`, `type: overview`, `title`, `summary`
      - Fill body sections: What is this?, Key Capabilities, Target Users

- [ ] 4. **Socratic Q&A (with Incremental Writing)**

   Use AskUserQuestion tool for **one question at a time**.

   **CRITICAL: Write docs incrementally to prevent context loss**

   **Identify features and domains:**

   Ask: "What are the main capabilities or features you want to build?"
   Ask: "How would you group these features? (e.g., auth, billing, users)"

   **For each feature (depth-first):**

   1. Ask "How should {feature} work from the user's perspective?"
   2. Ask "What are the key interactions or workflows?"
   3. Ask "Are there any constraints or limitations to consider?"
   4. Ask "Does this relate to any other features?"
   5. **IMMEDIATELY write the product doc:**
      - Determine domain folder (e.g., `auth`, `billing`, `users`)
      - Create domain folder if needed: `.kanban/product/{domain}/`
      - Get current date: `node .claude/scripts/get-date-time.cjs` (use `date` field)
      - Create `.kanban/product/{domain}/{feature}.md`

      **For features** (use `.claude/kanban-templates/product-doc.md`):
      ```yaml
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
      ```

      **For concepts** (use `.claude/kanban-templates/concept-doc.md`):
      ```yaml
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
      ```

      - This preserves context even if session is long

   **Expand:**

   1. Ask "Does this product need to integrate with any external services?"
      - If new integrations mentioned: Create/update relevant docs immediately
   2. Ask "Are there specific technical requirements (performance, security, etc.)?"
      - Update existing docs with constraints
   3. Ask "What's the minimum viable version of this product?"
      - Note MVP scope in doc limitations sections

   **Exit:**

   1. Ask "Is there anything else you'd like to add about the product?"
   2. If user says no/nothing/that's all: Proceed to final review
   3. If user has more: Continue Q&A

- [ ] 5. **Final Review**
   1. Read all generated product docs in `.kanban/product/` (including subdirectories)
   2. Check for completeness and consistency
   3. Update any docs that need adjustments based on later Q&A context
   4. Verify all `related` fields are accurate across docs
   5. Ensure all docs have proper `id` with domain prefix (e.g., `auth/login`)

- [ ] 6. **Commit**
   Format: `docs: define-product - {brief product description}`

   ```bash
   git add .kanban/product/
   git commit -m "docs: define-product - {brief product description}"
   ```

   Example: `docs: define-product - task management app with projects, tasks, collaboration`

- [ ] 7. **Output next steps to user**

## Validation

- [ ] `.kanban/product/` directory exists
- [ ] At least one product doc was created
- [ ] Each product doc has valid frontmatter (id with domain prefix, type, title, summary, keywords, updated)
- [ ] `overview.md` exists with `type: overview`
- [ ] Git log shows `docs: define-product -`
- [ ] Next steps shown to user

## Example

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

## Socratic Q&A Best Practices

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

## Next Steps

```
/clear
/kanban-create "Your task title"
```
