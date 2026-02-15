---
name: kanban-map-product
description: Analyze existing codebase and create product documentation through Socratic Q&A
allowed-tools: Read, Write, Glob, Grep, Bash(git add *, git commit *, git status), AskUserQuestion
disable-model-invocation: true
---

# Skill: Map Product

Analyze existing codebase and create product documentation through Socratic Q&A.

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
   2. Check if `.kanban/product/` has files OTHER than `overview.md`
      - Run `node .claude/scripts/list-product.cjs` to get all product docs
      - If count > 1, OR if count == 1 and the doc is not `overview`: Ask user using AskUserQuestion:
        - "I found existing product docs. How should I proceed?"
        - Options: Preserve and extend / Merge with findings / Start fresh
      - If only `overview.md` exists (or no docs): Proceed without prompting (this is expected from kanban-init)

- [ ] 3. **Deep Codebase Research**

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

- [ ] 4. **Create Product Overview**
   Based on codebase analysis, draft overview content:
   1. Ask: "What is this product called?"
   2. Ask: "In one sentence, what does it do?"
   3. Confirm target users based on what you found
   4. **IMMEDIATELY create overview.md:**
      - Create `.kanban/product/overview.md`
      - Use template from `.claude/kanban-templates/overview.md`
      - Fill frontmatter: `id: overview`, `type: overview`, `title`, `summary`
      - Fill body sections: What is this?, Key Capabilities (from analysis), Target Users

- [ ] 5. **Present Summary**

   Output a structured summary to the user:

   ```
   I analyzed the codebase and found the following:

   **Features (grouped by domain):**
   - {domain}/
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

- [ ] 6. **Socratic Q&A (with Incremental Writing)**

   Use AskUserQuestion tool for **one question at a time**.

   **CRITICAL: Write docs incrementally to prevent context loss**

   **Suggest domain organization:**

   Ask: "Based on the codebase, I suggest organizing features into these domains: {list}. Does this make sense, or would you prefer a different grouping?"

   **For each feature (depth-first):**

   1. Validate: Ask "I found {feature} that appears to {description}. Is this accurate?"
   2. If user corrects: Update understanding
   3. Clarify: Ask "Can you tell me more about how {aspect} works?"
   4. Probe: Ask "Are there any edge cases or limitations I should know about?"
   5. Context: Ask "Who primarily uses this feature? What problem does it solve?"
   6. **IMMEDIATELY write the product doc:**
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

   **After all features:**

   1. Ask "What's the overall value proposition of this product?"
   2. Ask "Are there any performance or security requirements I should document?"
   3. Ask "Did I miss any important features or capabilities?"
      - If new features mentioned: Create docs for them immediately

   **Exit:**

   1. Ask "Is there anything else you'd like to add about the product?"
   2. If user says no/nothing/that's all: Proceed to final review
   3. If user has more: Continue Q&A

- [ ] 7. **Final Review**
   1. Read all generated product docs in `.kanban/product/` (including subdirectories)
   2. Check for completeness and consistency
   3. Update any docs that need adjustments based on later Q&A context
   4. Verify all `related` fields are accurate across docs
   5. Ensure all docs have proper `id` with domain prefix (e.g., `auth/login`)

- [ ] 8. **Commit**
   Format: `docs: map-product - {brief summary listing main features}`

   ```bash
   git add .kanban/product/
   git commit -m "docs: map-product - {brief summary listing main features}"
   ```

   Example: `docs: map-product - authentication, user management, notifications, search`

- [ ] 9. **Output next steps to user**

## Validation

- [ ] `.kanban/product/` directory exists
- [ ] At least one product doc was created
- [ ] Each product doc has valid frontmatter (id with domain prefix, type, title, summary, keywords, updated)
- [ ] `overview.md` exists with `type: overview`
- [ ] Git log shows `docs: map-product -`
- [ ] Next steps shown to user

## Example

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
