---
name: kanban-define-product
description: Define a new product through Socratic Q&A and generate product documentation
allowed-tools: Read, Write, Bash(git add *, git commit *, git status), AskUserQuestion
---

# Skill: Define Product

Define a new product through Socratic Q&A and generate product documentation.

## Column Transition

N/A - This is a product discovery command, not a task workflow command.

## Commit

Uses `commits.define-product` format from `.claudeban/workflow.yaml`.

## Steps

### 0. Load Workflow Schema

Read `.claudeban/workflow.yaml` for commit formats.

### 1. Pre-flight Check

1. Verify `.kanban/` directory exists
   - If not: Error - "Please initialize kanban first with `kanban:init`"
2. Check if `.kanban/product/` has existing files
   - If yes: Ask user using AskUserQuestion:
     - "I found existing product docs. How should I proceed?"
     - Options: Preserve and extend / Start fresh

### 2. Socratic Q&A (with Incremental Writing)

Use AskUserQuestion tool for **one question at a time**.

**CRITICAL: Write docs incrementally to prevent context loss**

**Start with vision:**

Ask: "What problem are you trying to solve with this product?"

**Explore users:**

Ask: "Who will be the primary users of this product?"

**Identify features:**

Ask: "What are the main capabilities or features you want to build?"

**For each feature (depth-first):**

1. Ask "How should {feature} work from the user's perspective?"
2. Ask "What are the key interactions or workflows?"
3. Ask "Are there any constraints or limitations to consider?"
4. Ask "Does this relate to any other features?"
5. **IMMEDIATELY write the product doc:**
   - Create `.kanban/product/{feature-id}.md`
   - Use template structure from `.claudeban/templates/product-doc.md`
   - Fill with all information gathered so far
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

### 3. Final Review

1. Read all generated product docs in `.kanban/product/`
2. Check for completeness and consistency
3. Update any docs that need adjustments based on later Q&A context
4. Verify all relationships (uses/related/extends) are accurate across docs

### 4. Commit

```bash
git add .kanban/product/
git commit -m "docs: define-product - {brief product description}"
```

Example: `docs: define-product - task management app with projects, tasks, collaboration`

## Validation

All must pass. If any fail, fix and retry.

- [ ] `.kanban/product/` directory exists
- [ ] At least one product doc was created
- [ ] Each product doc has valid frontmatter (id, title, summary, keywords, updated)
- [ ] Git log shows `docs: define-product -`

## Arguments

- `$ARGUMENTS` - None expected

## Example

User: `/kanban:define-product`

```
What problem are you trying to solve with this product?
```

User: "Teams struggle to track their work and collaborate effectively"

```
Who will be the primary users of this product?
```

User: "Software development teams, specifically project managers and developers"

```
What are the main capabilities or features you want to build?
```

User: "Task tracking, project boards, team collaboration, notifications"

```
How should Task Tracking work from the user's perspective?
```

...continues depth-first exploration of each feature...

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
