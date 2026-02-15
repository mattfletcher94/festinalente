---
name: kanban-map-product
description: Analyze existing codebase and create product documentation through Socratic Q&A
allowed-tools: Read, Write, Glob, Grep, Bash(git add *, git commit *, git status), AskUserQuestion
disable-model-invocation: true
---

# Skill: Map Product

Analyze existing codebase and create product documentation through Socratic Q&A.

## Column Transition

N/A - This is a product discovery command, not a task workflow command.

## Commit

**Format:** `docs: map-product - {brief summary listing main features}`

**CRITICAL:** Use EXACTLY this format. Do NOT invent commit types like `kanban(...)`. The commit type is `docs`, not `kanban`.

## Steps

### 0. Load Workflow Schema

Read `.claude/kanban-workflow.yaml` for commit formats.

### 1. Pre-flight Check

1. Verify `.kanban/` directory exists
   - If not: Error - "Please initialize kanban first with `kanban-init`"
2. Check if `.kanban/product/` has existing files
   - If yes: Ask user using AskUserQuestion:
     - "I found existing product docs. How should I proceed?"
     - Options: Preserve and extend / Merge with findings / Start fresh

### 2. Deep Codebase Research

Research the codebase thoroughly:

**Directory Structure:**
- Use Glob to find source directories (src/, lib/, app/, components/, pages/, api/)
- Identify the project structure

**Package/Config Files:**
- Read package.json, requirements.txt, Cargo.toml, go.mod, etc.
- Note dependencies that hint at features (auth libraries, database drivers, etc.)

**Entry Points:**
- Find main entry files
- Identify routing/API definitions

**User-Facing Features:**
- API endpoints (look for routes, controllers, handlers)
- UI components (React, Vue, etc.)
- CLI commands (if any)

**Architecture:**
- Database schemas (migrations, models)
- Service structure
- Key patterns (MVC, microservices, etc.)

**Integrations:**
- External APIs
- Third-party services
- Authentication providers

### 3. Present Summary

Output a structured summary to the user:

```
I analyzed the codebase and found the following:

**Features:**
- {Feature 1}: {brief description}
- {Feature 2}: {brief description}
...

**Architecture:**
- {Pattern/structure observation}
...

**Integrations:**
- {External service/API}
...

Let me ask some questions to validate and expand on this understanding.
```

### 4. Socratic Q&A (with Incremental Writing)

Use AskUserQuestion tool for **one question at a time**.

**CRITICAL: Write docs incrementally to prevent context loss**

**For each feature (depth-first):**

1. Validate: Ask "I found {feature} that appears to {description}. Is this accurate?"
2. If user corrects: Update understanding
3. Clarify: Ask "Can you tell me more about how {aspect} works?"
4. Probe: Ask "Are there any edge cases or limitations I should know about?"
5. Context: Ask "Who primarily uses this feature? What problem does it solve?"
6. **IMMEDIATELY write the product doc:**
   - Create `.kanban/product/{feature-id}.md`
   - Use template structure from `.claude/kanban-templates/product-doc.md`
   - Fill with all information gathered so far
   - This preserves context even if session is long

**After all features:**

1. Ask "What's the overall value proposition of this product?"
2. Ask "Are there any performance or security requirements I should document?"
3. Ask "Did I miss any important features or capabilities?"
   - If new features mentioned: Create docs for them immediately

**Exit:**

1. Ask "Is there anything else you'd like to add about the product?"
2. If user says no/nothing/that's all: Proceed to final review
3. If user has more: Continue Q&A

### 5. Final Review

1. Read all generated product docs in `.kanban/product/`
2. Check for completeness and consistency
3. Update any docs that need adjustments based on later Q&A context
4. Verify all relationships (uses/related/extends) are accurate across docs

### 6. CRITICAL: Commit

**This step is MANDATORY. Do not proceed without committing.**

```bash
git add .kanban/product/
git commit -m "docs: map-product - {brief summary listing main features}"
```

Example: `docs: map-product - authentication, user management, notifications, search`

**DO NOT skip this step. If the commit fails, stop and report the error.**

## Validation

**STOP. You MUST verify ALL items pass before declaring success. Do not skip validation.**

All must pass. If any fail, fix and retry.

- [ ] `.kanban/product/` directory exists
- [ ] At least one product doc was created
- [ ] Each product doc has valid frontmatter (id, title, summary, keywords, updated)
- [ ] Git log shows `docs: map-product -`

## Arguments

- `$ARGUMENTS` - None expected

## Example

User: `/kanban-map-product`

```
I analyzed the codebase and found the following:

**Features:**
- User Authentication: JWT-based login with email/password
- Task Management: CRUD operations for tasks with status tracking
- Notifications: Email notifications for task updates

**Architecture:**
- Express.js backend with PostgreSQL
- React frontend with Redux state management

**Integrations:**
- SendGrid for email delivery
- Stripe for payments

Let me ask some questions to validate and expand on this understanding.

I found User Authentication that appears to handle JWT-based login. Is this accurate?
```

## Socratic Q&A Best Practices

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

## Next Steps

```
/clear
/kanban-create "Your task title"
```
