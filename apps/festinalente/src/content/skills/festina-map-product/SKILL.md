---
name: festina-map-product
description: Analyze existing codebase and create product documentation through parallel exploration and Socratic Q&A
allowed-tools: Read, Write, Glob, Grep, Bash(git add *, git commit *, git status), Task
disable-model-invocation: true
---

# Skill: Map Product

<purpose>
Analyze existing codebase and create product documentation through parallel exploration and Socratic Q&A.
</purpose>

<context>
{{> helper-scripts show_get_date_time=true}}

{{> product-docs-scripts show_list_product=true}}

{{> diagram-guidelines}}

<note>**Column Transition:** N/A - This is a product discovery command, not a task workflow command.</note>

<note>**Glossary:** This skill generates `.festinalente/glossary.yaml` with project-specific terms and aliases for improved search.</note>
</context>

<arguments>
  <hint>Arguments provide focus or constraints for the discovery process — they do NOT replace it. Even if arguments describe a narrow update, run the full skill process. The parallel agents and Q&A will be scoped by the arguments, not skipped because of them.</hint>
</arguments>

<prohibited>
- Do not skip the parallel discovery phase
- Do not write docs without validating with user through Q&A
- Do not skip the validation phase
- Do not bypass this skill to make direct edits — always run the full process
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="load_directives">
    {{> load-directives skill="map-product"}}
  </step>

  <step name="preflight_check">
    <action>Check if `.festinalente/product/` has files OTHER than `overview.md`</action>
    <command>node .festinalente/scripts/festinalente.cjs list-product</command>
    <branch condition="count > 1, OR if count == 1 and the doc is not `overview`">
      <action>Use AskUserQuestion tool with:
        - header: "Existing Docs"
        - question: "I found existing product docs. How should I proceed?"
        - options:
          - label: "Preserve and extend", description: "Keep existing docs, add new findings"
          - label: "Merge with findings", description: "Combine existing docs with new discoveries"
          - label: "Start fresh", description: "Replace existing docs entirely"
        - multiSelect: false
      </action>
    </branch>
    <branch condition="only `overview.md` exists (or no docs)">
      <action>Proceed without prompting (this is expected for new installs)</action>
    </branch>
  </step>

  <step name="parallel_discovery">
    <note>**CRITICAL: Spawn 4 agents in parallel using Task tool**</note>
    <action>Use the Task tool 4 times in a SINGLE message to achieve parallelism</action>

    <parallel>
      <agent name="Feature Scanner" subagent_type="Explore">
        <description>Scan for user-facing features</description>
        <prompt>
Find all user-facing features in this codebase:
1. Scan routes/endpoints (look for route definitions, controllers, handlers)
2. Identify UI components (React, Vue, etc.) - focus on pages/views, not atomic components
3. Find CLI commands
4. Note API endpoints

For each feature found, provide:
- name: Feature name (e.g., "Login", "User Profile")
- type: route | ui | cli | api
- entry_point: Main file path
- files: List of related files
- description: Brief description of what it does (1-2 sentences)

Output as a structured list.
        </prompt>
      </agent>

      <agent name="Domain Organizer" subagent_type="Explore">
        <description>Suggest domain groupings</description>
        <prompt>
Analyze the codebase structure to suggest domain groupings (bounded contexts):
1. Look at folder structure for natural groupings
2. Analyze import patterns to see what code clusters together
3. Identify naming conventions that suggest domains (auth/, user/, billing/, etc.)
4. Consider DDD bounded contexts - what are the logical business domains?

For each suggested domain, provide:
- domain: Domain name (e.g., "auth", "billing", "users")
- suggested_features: List of features that belong here
- rationale: Why these features belong together (1-2 sentences)
- boundary: What this domain does NOT cover (helps prevent overlap)

Note: Each domain should have 3-7 features. Too few = too granular, too many = too monolithic.
        </prompt>
      </agent>

      <agent name="Dependency Mapper" subagent_type="Explore">
        <description>Map feature relationships</description>
        <prompt>
Map relationships between features in this codebase:
1. Trace import chains between feature modules
2. Identify shared state/data (what features share data?)
3. Find API call patterns between features
4. Note event/message passing

For each relationship, provide:
- from: Source feature
- to: Target feature
- type: imports | calls | shares_data | events
- evidence: Code location showing relationship (file:line)

Focus on cross-domain relationships, not internal module imports.
        </prompt>
      </agent>

      <agent name="Gap Detector" subagent_type="Explore">
        <description>Find undocumented capabilities</description>
        <prompt>
Find undocumented or hidden capabilities in this codebase:
1. Look for routes that don't match obvious feature names
2. Find exported functions without clear purpose
3. Identify database tables/models not clearly mapped to features
4. Check for configuration options that suggest features
5. Look for feature flags or experimental features

For each gap, provide:
- gap_type: undocumented_route | orphan_export | hidden_config | feature_flag
- location: File and line
- evidence: What suggests this is a capability
- suggested_doc: What doc might cover this (e.g., "auth/password-reset")
        </prompt>
      </agent>
    </parallel>

    <action>Wait for all 4 agents to complete</action>
    <note>Agents run concurrently - this is faster than sequential exploration</note>
  </step>

  <step name="synthesize_findings">
    <action>Combine outputs from all 4 agents</action>
    <action>Resolve conflicts (e.g., different domain suggestions for same feature)</action>
    <action>Create unified feature list grouped by domain</action>

    <note>**Conflict Resolution Rules:**</note>
    <rule>If Feature Scanner and Domain Organizer disagree on grouping, prefer Domain Organizer's rationale</rule>
    <rule>If Gap Detector finds features not in Feature Scanner output, add them</rule>
    <rule>If Dependency Mapper shows strong coupling, features should be in same domain</rule>

    <action>Present summary to user for validation</action>
  </step>

  <step name="write_relationships_to_frontmatter">
    <note>Persist Dependency Mapper findings to doc frontmatter</note>
    <action>For each doc being created, populate relationship fields from Dependency Mapper output:</action>
    <action>- `imports`, `calls` relationships → add to `references: []`</action>
    <action>- `shares_data`, `events` relationships → add to `uses: []`</action>
    <action>Only include relationships where BOTH docs exist in the documentation set</action>
  </step>

  <step name="create_product_overview">
    <note>Based on synthesis, draft overview content:</note>
    <action>Use AskUserQuestion tool with:
      - header: "Product"
      - question: "What is this product called?"
      - options:
        - label: "Use detected name", description: "Use name found in codebase analysis"
        - label: "Skip for now", description: "I'll provide the name later"
      - multiSelect: false
    </action>
    <note>User can select "Other" to type a custom product name</note>

    <action>Use AskUserQuestion tool with:
      - header: "Purpose"
      - question: "In one sentence, what does this product do?"
      - options:
        - label: "Generate", description: "Auto-generate based on codebase analysis"
        - label: "Skip for now", description: "I'll provide this later"
      - multiSelect: false
    </action>
    <note>User can select "Other" to type a custom description</note>

    <action>Confirm target users based on what you found</action>
    <warning>IMMEDIATELY create overview.md:</warning>
    <action>Create `.festinalente/product/overview.md`</action>
    <action>Use template from `.festinalente/templates/product-overview.md`</action>
    <action>Fill frontmatter: `id: overview`, `type: overview`, `title`, `tldr`, `summary`, `keywords`, `aliases`, `boundary`</action>
    <action>Fill body sections: What is this?, Key Capabilities (from synthesis), Target Users</action>
  </step>

  <step name="present_summary">
    <output>I analyzed the codebase using 4 parallel agents and found the following:</output>
    <output>**Features (grouped by domain):** - {domain}/ - {Feature 1}: {brief description}</output>
    <output>**Relationships:** - {feature} depends on {feature}</output>
    <output>**Gaps Found:** - {undocumented capability}</output>
    <output>Let me ask some questions to validate and expand on this understanding.</output>
  </step>

  <step name="socratic_qa_dialogue">
    <note>Use AskUserQuestion tool for **one question at a time**.</note>
    <warning>CRITICAL: Write docs incrementally to prevent context loss</warning>

    <note>**Suggest domain organization:**</note>
    <action>Use AskUserQuestion tool with:
      - header: "Domains"
      - question: "Based on the codebase, I suggest organizing features into these domains: {list}. Does this make sense?"
      - options:
        - label: "Looks good", description: "Proceed with this domain grouping"
        - label: "Change it", description: "I want to reorganize the domains"
      - multiSelect: false
    </action>
    <note>User can select "Other" to suggest different domains</note>

    <note>**For each feature (depth-first), ask Discovery Questions:**</note>
    <questions name="discovery">
      <action>Use AskUserQuestion tool with:
        - header: "Purpose"
        - question: "What does {feature} do? (basic understanding)"
        - options:
          - label: "Skip", description: "Move to next question"
          - label: "Unsure", description: "Need to investigate the code"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe the feature</note>

      <action>Use AskUserQuestion tool with:
        - header: "Why"
        - question: "Why does {feature} exist? What business problem does it solve?"
        - options:
          - label: "Skip", description: "Move to next question"
          - label: "Unsure", description: "Need to investigate the code"
        - multiSelect: false
      </action>
      <note>User can select "Other" to explain the purpose</note>

      <action>Use AskUserQuestion tool with:
        - header: "Users"
        - question: "Who uses {feature}? (user persona)"
        - options:
          - label: "All users", description: "General feature for everyone"
          - label: "Admins", description: "Administrative feature"
          - label: "Developers", description: "Developer-facing feature"
          - label: "Skip", description: "Move to next question"
        - multiSelect: false
      </action>

      <action>Use AskUserQuestion tool with:
        - header: "Workflow"
        - question: "How is {feature} typically used? (happy path workflow)"
        - options:
          - label: "Skip", description: "Move to next question"
          - label: "Unsure", description: "Need to investigate the code"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe the workflow</note>

      <action>Use AskUserQuestion tool with:
        - header: "Errors"
        - question: "What happens when {feature} fails? (error cases)"
        - options:
          - label: "Standard errors", description: "Uses generic error handling"
          - label: "Skip", description: "Move to next question"
          - label: "Unsure", description: "Need to investigate the code"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe error handling</note>

      <action>Use AskUserQuestion tool with:
        - header: "Boundaries"
        - question: "What does {feature} NOT do? (boundaries)"
        - options:
          - label: "Skip", description: "Move to next question"
          - label: "None", description: "No specific limitations"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe boundaries</note>

      <action>Use AskUserQuestion tool with:
        - header: "Relations"
        - question: "What other features does {feature} interact with? (relationships)"
        - options:
          - label: "Skip", description: "Move to next question"
          - label: "Standalone", description: "This feature is independent"
        - multiSelect: false
      </action>
      <note>User can select "Other" to list related features</note>

      <action>Use AskUserQuestion tool with:
        - header: "Constraints"
        - question: "Are there any performance or security concerns? (constraints)"
        - options:
          - label: "Skip", description: "Move to next question"
          - label: "None", description: "No special concerns"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe constraints</note>
    </questions>

    <note>**Follow up with Depth Questions:**</note>
    <questions name="depth">
      <action>Use AskUserQuestion tool with:
        - header: "Example"
        - question: "You mentioned {X} - can you give a specific example?"
        - options:
          - label: "Skip", description: "Move to next question"
          - label: "Unsure", description: "Need to think about this"
        - multiSelect: false
      </action>
      <note>User can select "Other" to provide an example</note>

      <action>Use AskUserQuestion tool with:
        - header: "Trigger"
        - question: "When you say {Y}, what specifically triggers that?"
        - options:
          - label: "Skip", description: "Move to next question"
          - label: "Unsure", description: "Need to investigate"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe the trigger</note>

      <action>Use AskUserQuestion tool with:
        - header: "Guidance"
        - question: "How would a new developer know to do {Z}?"
        - options:
          - label: "Code comments", description: "It's documented in the code"
          - label: "Convention", description: "It follows project conventions"
          - label: "Skip", description: "Move to next question"
        - multiSelect: false
      </action>
      <note>User can select "Other" to explain the guidance</note>
    </questions>

    <note>**Ask Boundary Questions:**</note>
    <questions name="boundary">
      <action>Use AskUserQuestion tool with:
        - header: "Adjacent"
        - question: "What features are adjacent but separate from {feature}?"
        - options:
          - label: "Skip", description: "Move to next question"
          - label: "None", description: "No adjacent features"
        - multiSelect: false
      </action>
      <note>User can select "Other" to list adjacent features</note>

      <action>Use AskUserQuestion tool with:
        - header: "Prereqs"
        - question: "What does {feature} assume is already done?"
        - options:
          - label: "Auth required", description: "User must be authenticated"
          - label: "No prereqs", description: "No prerequisites"
          - label: "Skip", description: "Move to next question"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe prerequisites</note>

      <action>Use AskUserQuestion tool with:
        - header: "After"
        - question: "What happens after {feature} completes?"
        - options:
          - label: "Skip", description: "Move to next question"
          - label: "Nothing", description: "No follow-up actions"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe next steps</note>

      <action>Use AskUserQuestion tool with:
        - header: "Gotchas"
        - question: "What are common mistakes or misunderstandings?"
        - options:
          - label: "Skip", description: "Move to next question"
          - label: "None", description: "No common mistakes"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe gotchas</note>
    </questions>

    <warning>IMMEDIATELY write the product doc after Q&A for each feature:</warning>
    <action>Determine domain folder (e.g., `auth`, `billing`, `users`)</action>
    <action>Create domain folder if needed: `.festinalente/product/{domain}/`</action>
    <action>Create domain index if first feature in domain: `.festinalente/product/{domain}/_index.md`</action>
    <action>Use template `.festinalente/templates/product-domain.md` for domain index</action>
    <command description="Get current date">node .festinalente/scripts/festinalente.cjs get-date-time</command>
    <action>Use `date` field from output</action>
    <action>Create `.festinalente/product/{domain}/{feature}.md`</action>

    <note>**For features** (use `.festinalente/templates/product-feature.md`):</note>
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
references: [{doc-ids from Dependency Mapper imports/calls}]
uses: [{doc-ids from Dependency Mapper shares_data/events}]
updated: {YYYY-MM-DD from get-date-time}
---

# {Feature Name}

> **TL;DR:** {tldr repeated}

## Overview
{What this feature is and WHY it exists - from Discovery Questions}

**Summary:** {Brief recap}

## How It Works
{User-facing behavior from Q&A - from happy path question}

**Summary:** {Brief recap}

## Examples
{Code snippets and usage patterns}

## Boundaries
{What this feature does NOT do - from Boundary Questions}
- **Does NOT:** {thing} → See [{related}]({path})

## Limitations
{Constraints mentioned during Q&A}
    </example_code>

    <note>**Diagram Generation:**</note>
    <action>Analyze feature content to determine appropriate diagrams:</action>
    <action>- If workflow has 3+ steps or branching → Add Mermaid flowchart</action>
    <action>- If user/system interaction → Add Mermaid sequence diagram</action>
    <action>- If UI element → Add ASCII mockup</action>
    <action>- If data model → Add Mermaid erDiagram</action>
    <action>Generate diagrams based on Q&A responses and code analysis</action>

    <note>**For concepts** (use `.festinalente/templates/product-concept.md`):</note>
    <example_code lang="yaml">
---
id: {domain}/{concept}
title: {Concept Name}
type: concept
tldr: {Single sentence - max 100 chars}
summary: {One sentence definition}
keywords: [{relevant, terms}]
aliases: [{synonyms, variations}]
boundary: {What this concept does NOT cover}
references: [{doc-ids from Dependency Mapper imports/calls}]
uses: [{doc-ids from Dependency Mapper shares_data/events}]
updated: {YYYY-MM-DD from get-date-time}
---

# {Concept Name}

> **TL;DR:** {tldr repeated}

## Definition
{Clear definition - from Q&A}

## Examples
{Concrete examples with code}

## Rules & Constraints
{Business rules}
    </example_code>

    <note>**Documentation Review (per feature):**</note>
    <action>Read the draft back to user</action>
    <action>Use AskUserQuestion tool with:
      - header: "Accuracy"
      - question: "Is this documentation accurate? What's missing?"
      - options:
        - label: "Looks good", description: "Documentation is accurate"
        - label: "Needs changes", description: "Some parts need correction"
      - multiSelect: false
    </action>
    <note>User can select "Other" to specify what's missing</note>

    <action>Use AskUserQuestion tool with:
      - header: "Clarity"
      - question: "Would this help a new developer understand?"
      - options:
        - label: "Yes", description: "Clear enough for newcomers"
        - label: "Needs more detail", description: "Add more explanation"
      - multiSelect: false
    </action>

    <action>Use AskUserQuestion tool with:
      - header: "Additions"
      - question: "What would YOU add to this documentation?"
      - options:
        - label: "Nothing", description: "It's complete as-is"
        - label: "Skip", description: "Move on for now"
      - multiSelect: false
    </action>
    <note>User can select "Other" to suggest additions</note>

    <note>**After all features:**</note>
    <action>Use AskUserQuestion tool with:
      - header: "Value"
      - question: "What's the overall value proposition of this product?"
      - options:
        - label: "Generate", description: "Auto-generate based on features"
        - label: "Skip", description: "I'll add this later"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe the value proposition</note>

    <action>Use AskUserQuestion tool with:
      - header: "Requirements"
      - question: "Are there any performance or security requirements I should document?"
      - options:
        - label: "None", description: "No special requirements"
        - label: "Skip", description: "I'll add this later"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe requirements</note>

    <action>Use AskUserQuestion tool with:
      - header: "Coverage"
      - question: "Did I miss any important features or capabilities?"
      - options:
        - label: "No", description: "All features covered"
        - label: "Yes", description: "There are missing features"
      - multiSelect: false
    </action>
    <note>User can select "Other" to list missing features</note>

    <branch condition="new features mentioned">
      <action>Create docs for them immediately</action>
    </branch>

    <note>**Exit:**</note>
    <action>Use AskUserQuestion tool with:
      - header: "Wrap Up"
      - question: "Is there anything else you'd like to add about the product?"
      - options:
        - label: "No, done", description: "Proceed to validation"
        - label: "Yes, more", description: "I have more to add"
      - multiSelect: false
    </action>
    <note>User can select "Other" to add more details</note>
    <branch condition="user says no/nothing/that's all">
      <action>Proceed to validation</action>
    </branch>
    <branch condition="user has more">
      <action>Continue Q&A</action>
    </branch>
  </step>

  <step name="generate_glossary">
    <note>Create project-specific glossary for improved search</note>
    <action>Extract unique terms from Q&A responses</action>
    <action>Group by domain</action>
    <action>Identify common aliases from code and user language</action>

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
    <note>Validate documentation quality and completeness</note>

    <action>Check all `references` and `uses` fields resolve to existing docs</action>
    <action>Check for orphan docs (not referenced anywhere)</action>
    <action>Check for keyword overlap (docs competing for same terms)</action>
    <action>Verify each doc has required fields: tldr, summary, keywords, boundary</action>

    <output>
Validation Report:
────────────────────────────────────────
Total docs created: {count}
Domains: {list}

ISSUES FOUND:
- Related field issues: {list or "None"}
- Orphan docs: {list or "None"}
- Keyword overlaps: {list or "None"}
- Missing fields: {list or "None"}

Coverage: {percentage} of discovered features documented
    </output>

    <branch condition="issues found">
      <action>Use AskUserQuestion tool with:
        - header: "Fix Issues"
        - question: "Would you like to fix these issues now?"
        - options:
          - label: "Yes", description: "Fix issues before completing"
          - label: "No", description: "Skip, I'll fix them later"
        - multiSelect: false
      </action>
      <branch condition="user selects Yes">
        <action>Fix each issue interactively</action>
      </branch>
    </branch>
  </step>

  <step name="final_review">
    <action>Read all generated product docs in `.festinalente/product/` (including subdirectories)</action>
    <action>Check for completeness and consistency</action>
    <action>Update any docs that need adjustments based on later Q&A context</action>
    <action>Verify all `references` and `uses` fields are accurate across docs</action>
    <action>Ensure all docs have proper `id` with domain prefix (e.g., `auth/login`)</action>
  </step>


  {{> directive-compliance}}

  <step name="output_result">
    <output>Product documentation mapped!</output>
    <output>
**Created:**
- {count} feature docs across {domain_count} domains
- Project glossary with {term_count} terms

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
- `.festinalente/product/` directory exists
- At least one product doc was created
- Each product doc has valid frontmatter (id with domain prefix, type, title, tldr, summary, keywords, boundary, updated)
- `overview.md` exists with `type: overview`
- `.festinalente/glossary.yaml` exists with at least one term
- Validation phase completed without errors
- Next steps shown to user
</success_criteria>

<example>
User: `/festina-map-product`

```
Launching 4 parallel agents to explore the codebase...

[Feature Scanner] Scanning routes, UI components, CLI commands...
[Domain Organizer] Analyzing folder structure and imports...
[Dependency Mapper] Tracing feature relationships...
[Gap Detector] Looking for undocumented capabilities...

All agents complete. Synthesizing findings...

I analyzed the codebase and found the following:

**Features (grouped by domain):**
- auth/
  - login: JWT-based login with email/password
  - registration: User signup with email verification
  - password-reset: Forgot password flow
- tasks/
  - management: CRUD operations for tasks with status tracking
  - assignment: Assign tasks to team members
- notifications/
  - email: Email notifications for task updates

**Relationships:**
- tasks/management depends on auth/login
- notifications/email triggered by tasks/management

**Gaps Found:**
- /api/admin/* routes not mapped to features (suggested: admin/dashboard)

Let me ask some questions to validate and expand on this understanding.

Based on the codebase, I suggest organizing features into these domains:
- auth (authentication & authorization)
- tasks (task management)
- notifications (notification delivery)
- admin (administrative features)

Does this make sense, or would you prefer a different grouping?
```

**After Q&A completes, creates:**
```
.festinalente/product/
├── overview.md
├── auth/
│   ├── _index.md
│   ├── login.md
│   ├── registration.md
│   └── password-reset.md
├── tasks/
│   ├── _index.md
│   ├── management.md
│   └── assignment.md
└── notifications/
    ├── _index.md
    └── email.md

.festinalente/glossary.yaml
```

**Validation Report:**
```
Total docs created: 8
Domains: auth, tasks, notifications

ISSUES FOUND:
- Related field issues: None
- Orphan docs: None
- Keyword overlaps: None
- Missing fields: None

Coverage: 100% of discovered features documented
```
</example>

<note>
**Parallel Agent Benefits:**

1. **Faster exploration** - 4 agents work simultaneously
2. **Better coverage** - Each agent has a specific focus
3. **Cross-validation** - Overlapping findings increase confidence
4. **Gap detection** - Dedicated agent finds what others miss

**Socratic Q&A Best Practices:**

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
/festina-create "Your task title"
```
</next_steps>
