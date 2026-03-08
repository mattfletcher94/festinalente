---
name: festina-create
description: Create and refine a new task through conversational Q&A, then add to Backlog. Captures problem, value, and acceptance criteria in a single workflow.
allowed-tools: Read, Write, Bash(node *, git add *, git commit *, git status, git branch *), Grep, Glob, WebSearch, WebFetch
argument-hint: "[task title]"
disable-model-invocation: false
---

# Create Festina Lente Task

<purpose>
Create and refine a new task through conversational Q&A, then add to Backlog. Captures problem, value, and acceptance criteria in a single workflow.
</purpose>

<context>
{{> directory-reference}}

{{> helper-scripts show_next_id=true show_get_date_time=true}}

{{> product-docs-scripts show_search_product=true}}

{{> engineering-docs-scripts show_search_engineering=true}}

{{> column-transition from="[New Task]" to="backlog"}}
</context>

<prohibited>
- Do not use `Search()` or `Glob()` to find files manually
- Do not read `.festinalente/config.yaml` directly
- Do not run `ls` commands to explore directories
- Do not guess filenames or IDs — always use the helper scripts
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="verify_festina_exists">
    <validate>Check that `.festinalente/tasks/` directory exists</validate>
    <branch condition="directory doesn't exist">
      <output>Error: Festina Lente not initialized. Run `npx festinalente init` first.</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="load_directives">
    {{> load-directives skill="create"}}
  </step>

  <step name="get_task_title" outputs="title, slug">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as title</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <action>Use AskUserQuestion tool with:
        - header: "Title"
        - question: "What is the task title?"
        - options:
          - label: "Skip", description: "I'll provide the title"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type the task title</note>
    </branch>
    <action>Ensure title follows best practices (suggest improvements if needed)</action>
  </step>

  <step name="get_next_id" outputs="nextId">
    <command>node .festinalente/scripts/festinalente.cjs next-id --title="{title}"</command>
    <action>Use `nextId` from JSON output (format: {number}-{slug}, e.g., "022-add-dark-mode-toggle")</action>
  </step>

  <step name="search_product_docs" when="`.festinalente/product/` directory exists and is not empty" outputs="newDocId, newDocPath">
    <action>Extract keywords from the established title (nouns, verbs, domain terms)</action>
    <command>node .festinalente/scripts/festinalente.cjs search-product {keyword1} {keyword2} ...</command>
    <note>Search results include `relatedDocs` with tldr previews of connected docs.
Only read full content of related docs if their tldr suggests relevance to this task.
Avoid loading more than 2-3 related docs to preserve context window.</note>

    <branch condition="docs with score ≥ 0.5 found">
      <note>These docs describe existing features this task relates to</note>
      <action>Set `affects: [{matched-ids}]` in task XML</action>
      <output>Related product docs: {ids}</output>
    </branch>

    <branch condition="no docs with score ≥ 0.3 found">
      <note>This may be a NEW feature not yet documented - we'll create a stub doc</note>
      <action>If existing domains are known from `.festinalente/product/` folder structure, use AskUserQuestion tool with:
        - header: "Domain"
        - question: "This looks like a new feature. What domain should it belong to?"
        - options: Build from existing domain folders (up to 4), each with:
          - label: "{domain}", description: "Group with other {domain} features"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a custom domain</note>
      <action>Set newDocId = `{domain}/{slug-from-title}`</action>
      <action>Set newDocPath = `.festinalente/product/{domain}/{slug-from-title}.md`</action>
      <action>Set `affects: [{newDocId}]` in task XML</action>
      <note>Stub doc will be created in step create_stub_doc</note>
    </branch>

    <branch condition="`.festinalente/product/` is empty or doesn't exist">
      <action>Skip this step</action>
      <output>No product docs yet</output>
    </branch>
  </step>

  <step name="search_engineering_docs" when="`.festinalente/engineering/` directory exists and is not empty" outputs="newEngDocId, newEngDocPath, engDocType">
    <action>Extract keywords from the established title (technical terms, patterns, system names)</action>
    <command>node .festinalente/scripts/festinalente.cjs search-engineering {keyword1} {keyword2} ...</command>

    <branch condition="docs with score ≥ 0.5 found">
      <note>These docs describe existing patterns/systems this task relates to</note>
      <action>Set `engineering: [{matched-ids}]` in task XML</action>
      <output>Related engineering docs: {ids}</output>
    </branch>

    <branch condition="no docs with score ≥ 0.3 found">
      <note>This may involve new patterns/systems not yet documented - we'll create a stub doc</note>
      <action>If existing type folders are known from `.festinalente/engineering/` folder structure, use AskUserQuestion tool with:
        - header: "Eng type"
        - question: "This task may introduce new technical patterns. What type of engineering doc should be created?"
        - options:
          - label: "System", description: "New subsystem or service (e.g., auth system, cache layer)"
          - label: "Pattern", description: "Recurring solution (e.g., error handling, state management)"
          - label: "Convention", description: "Team standard (e.g., naming, file structure)"
          - label: "None needed", description: "No new engineering documentation required"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a custom type</note>
      <branch condition="user selects type (not 'None needed')">
        <action>Set engDocType = selected type (lowercase: system, pattern, convention)</action>
        <action>Set newEngDocId = `{engDocType}s/{slug-from-title}`</action>
        <action>Set newEngDocPath = `.festinalente/engineering/{engDocType}s/{slug-from-title}.md`</action>
        <action>Set `engineering: [{newEngDocId}]` in task XML</action>
        <note>Stub doc will be created in step create_engineering_stub_doc</note>
      </branch>
      <branch condition="user selects 'None needed'">
        <action>Leave `engineering: []` empty</action>
      </branch>
    </branch>

    <branch condition="`.festinalente/engineering/` is empty or doesn't exist">
      <action>Skip this step</action>
      <output>No engineering docs yet</output>
    </branch>
  </step>

  <step name="create_stub_doc" when="newDocId was set (new feature detected)">
    <note>Create a minimal stub doc so the `affects` link is valid immediately</note>
    <command description="Get current date">node .festinalente/scripts/festinalente.cjs get-date-time</command>
    <action>Create domain folder if doesn't exist: `.festinalente/product/{domain}/`</action>
    <action>Create stub doc at {newDocPath} with minimal content:</action>
    <example_code lang="markdown">
---
id: "{newDocId}"
title: "{Feature title derived from task title}"
type: feature
tldr: ""
summary: "Stub - to be completed during /festina-docs"
keywords: [{keywords from task title}]
aliases: []
boundary: ""
references: []
uses: []
updated: {date from get-date-time}
stub: true
task: "{nextId}"
---

# {Feature title}

> **TL;DR:** (To be completed)

## Overview

This is a stub document created during task creation. It will be completed with full content during the `/festina-docs` phase after implementation.

**Related task:** {nextId} - {task title}

## Status

- [ ] Overview section
- [ ] How It Works section
- [ ] Examples section
- [ ] Boundaries section
    </example_code>
    <output>Created stub doc: {newDocPath}</output>
    <note>The `stub: true` frontmatter marks this for completion during /festina-docs</note>
  </step>

  <step name="create_engineering_stub_doc" when="newEngDocId was set (new engineering doc detected)">
    <note>Create a minimal stub doc so the `engineering` link is valid immediately</note>
    <command description="Get current date">node .festinalente/scripts/festinalente.cjs get-date-time</command>
    <action>Create type folder if doesn't exist: `.festinalente/engineering/{engDocType}s/`</action>
    <action>Create stub doc at {newEngDocPath} with minimal content:</action>
    <example_code lang="markdown">
---
id: "{newEngDocId}"
title: "{Title derived from task title}"
type: {engDocType}
tldr: ""
summary: "Stub - to be completed during /festina-docs"
keywords: [{keywords from task title}]
aliases: []
boundary: ""
references: []
uses: []
updated: {date from get-date-time}
stub: true
task: "{nextId}"
---

# {Title}

> **TL;DR:** (To be completed)

## Overview

This is a stub document created during task creation. It will be completed with full content during the `/festina-docs` phase after implementation.

**Related task:** {nextId} - {task title}

## Status

- [ ] Overview section
- [ ] Implementation details
- [ ] Examples section
- [ ] Boundaries section
    </example_code>
    <output>Created engineering stub doc: {newEngDocPath}</output>
    <note>The `stub: true` frontmatter marks this for completion during /festina-docs</note>
  </step>

  <step name="get_priority" outputs="priority">
    <action>Use AskUserQuestion tool with:
      - header: "Priority"
      - question: "What priority should this task have?"
      - options:
        - label: "High", description: "Urgent or blocking other work"
        - label: "Medium (Recommended)", description: "Normal priority, will be done in order"
        - label: "Low", description: "Nice to have, can wait"
      - multiSelect: false
    </action>
  </step>

  <step name="determine_label">
    <action>Use `labels[].detect-keywords` from festina-workflow.yaml to auto-detect label from title/context</action>
    <branch condition="label auto-detected">
      <action>Use AskUserQuestion tool with:
        - header: "Label"
        - question: "Auto-detected label: {detected-label}. Is this correct?"
        - options:
          - label: "Yes", description: "Use {detected-label} as the task label"
          - label: "No", description: "Choose a different label"
        - multiSelect: false
      </action>
      <branch condition="user selects No">
        <action>Use AskUserQuestion tool with:
          - header: "Label"
          - question: "Which label should this task have?"
          - options: Build from labels in workflow.yaml (bug, feature, docs, refactor), each with:
            - label: "{label-name}", description: "{label description from workflow}"
          - multiSelect: false
        </action>
      </branch>
    </branch>
    <branch condition="label unclear">
      <action>Use AskUserQuestion tool with:
        - header: "Label"
        - question: "Which label should this task have?"
        - options: Build from labels in workflow.yaml (bug, feature, docs, refactor), each with:
          - label: "{label-name}", description: "{label description from workflow}"
        - multiSelect: false
      </action>
    </branch>
  </step>

  <step name="conduct_qa_dialogue">
    <note>Use AskUserQuestion tool for **one question at a time**.</note>

    <note>This is a **conversational session** focused on **product/business concerns**:
- What problem are we solving?
- What value does it provide?
- What does "done" look like?
- User context, constraints, preferences</note>

    <note>How the dialogue works: **Propose first, then validate.**
- Analyze the user's initial input to form an understanding
- Propose your understanding and ask user to validate
- User confirms, corrects, or says "You decide" for LLM inference</note>

    <note>User can volunteer information at any time:
- User may provide context you didn't ask for
- User may request research (e.g., "research how other apps handle password reset")
- User may skip questions ("skip" or "you fill it in")</note>

    <note>**Product Validation Questions:** Propose understanding, user validates.</note>
    <questions name="product_validation">
      <action>Use AskUserQuestion tool with:
        - header: "Problem"
        - question: "I understand the problem as: {proposed problem based on user input}. Is this accurate?"
        - options:
          - label: "Yes", description: "Understanding is correct"
          - label: "Partly", description: "Needs some adjustment"
          - label: "No", description: "This is incorrect"
          - label: "You decide", description: "Use your judgment"
        - multiSelect: false
      </action>
      <note>User can select "Other" to provide corrections</note>

      <branch condition="user selects 'You decide'">
        <action>Use judgment to fill gaps - research if helpful, infer from context</action>
        <note>Document what was inferred vs confirmed</note>
      </branch>

      <action>Use AskUserQuestion tool with:
        - header: "Value"
        - question: "The value I see is: {proposed value}. Does this capture it?"
        - options:
          - label: "Yes", description: "Value is correct"
          - label: "Partly", description: "Needs adjustment"
          - label: "No", description: "This is incorrect"
          - label: "You decide", description: "Use your judgment"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe the value</note>

      <branch condition="user selects 'You decide'">
        <action>Use judgment to fill gaps - research if helpful, infer from context</action>
        <note>Document what was inferred vs confirmed</note>
      </branch>

      <action>Use AskUserQuestion tool with:
        - header: "Criteria"
        - question: "For acceptance criteria, I'd propose: {proposed criteria}. Does this define 'done'?"
        - options:
          - label: "Yes", description: "Criteria are correct"
          - label: "Partly", description: "Needs adjustment"
          - label: "No", description: "This is incorrect"
          - label: "You decide", description: "Use your judgment"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe acceptance criteria</note>

      <branch condition="user selects 'You decide'">
        <action>Use judgment to fill gaps - research if helpful, infer from context</action>
        <note>Document what was inferred vs confirmed</note>
      </branch>
    </questions>

    <branch condition="user requests research">
      <action>Use WebSearch/WebFetch to research domain topics, best practices, how other products solve similar problems</action>
      <action>Use AskUserQuestion tool with:
        - header: "Findings"
        - question: "I found: {findings summary}. Does this influence the requirements?"
        - options:
          - label: "Yes", description: "Adjust based on findings"
          - label: "No", description: "Keep original approach"
        - multiSelect: false
      </action>
      <note>User can select "Other" to explain how findings affect requirements</note>
    </branch>

    <action>Continue until you have enough information to write: problem statement, value statement, acceptance criteria</action>

    <action>Use AskUserQuestion tool with:
      - header: "Confirm"
      - question: "Ready to create the task. Does this look correct? Problem: {summary}, Value: {summary}, Acceptance criteria: {summary}"
      - options:
        - label: "Yes, create it", description: "Create the task file"
        - label: "Add more", description: "I have additional context"
        - label: "Corrections", description: "Some details need fixing"
      - multiSelect: false
    </action>
    <note>User can select "Other" to provide corrections or additions</note>

    <branch condition="user says 'Yes, create it'">
      <action>Proceed to creating task file</action>
    </branch>
    <branch condition="user says 'Add more'">
      <action>Incorporate additional context and confirm again</action>
    </branch>
    <branch condition="user says 'Corrections'">
      <action>Update understanding and confirm again</action>
    </branch>

    <note>Key principles:
- Focus on PRODUCT/BUSINESS concerns, not technical implementation
- Let the conversation flow naturally
- Research when it helps clarify requirements
- Don't rush - thoroughness now saves time later</note>
  </step>

  <step name="format_acceptance_criteria">
    <example_code lang="gherkin">
Given {precondition}
And {additional precondition if needed}
When {action}
Then {expected outcome}
And {additional outcome if needed}
    </example_code>

    <note>Example:</note>
    <example_code lang="gherkin">
Given a user is on the login page
And they have entered valid credentials
When they click the login button
Then they are redirected to the dashboard
And their session is established
    </example_code>
  </step>

  <step name="refine_doc_links">
    <note>After Q&amp;A, the combined problem, value, and acceptance criteria text contains richer context
(system names, domain terms, technical concepts) than the title alone. Re-search to catch docs
the initial title-based search may have missed.</note>

    <action>Extract 10-20 keywords from the combined problem, value, and acceptance criteria text.
Cover all categories: nouns, verbs, domain terms, technical terms, and system names — not just a selective handful.
Skip only stopwords and generic phrases. Aim for comprehensive coverage of the ticket's vocabulary.</action>

    <command description="Expand keywords with glossary synonyms">node .festinalente/scripts/festinalente.cjs expand-query {keyword1} {keyword2} ...</command>
    <action>Use the `expanded` array from the JSON output as the keyword set for subsequent searches.
This is a superset of the original keywords, ensuring no regression in doc discovery.</action>

    <command description="Search product docs with expanded keywords">node .festinalente/scripts/festinalente.cjs search-product {expanded-keyword1} {expanded-keyword2} ...</command>
    <action>Filter results to score &gt;= 0.5. Remove any doc IDs already present in the affects field (from the earlier title-based search).</action>

    <command description="Search engineering docs with expanded keywords">node .festinalente/scripts/festinalente.cjs search-engineering {expanded-keyword1} {expanded-keyword2} ...</command>
    <action>Filter results to score &gt;= 0.5. Remove any doc IDs already present in the engineering field (from the earlier title-based search).</action>

    <branch condition="no new matches found from either search">
      <action>Silently skip — do not prompt the user (FR7)</action>
    </branch>

    <branch condition="new product doc matches found">
      <action>Check if any match covers the same domain as a stub doc created earlier (in create_stub_doc).
If so, mark the stub link for replacement with the real doc link (FR8).</action>
      <action>Present remaining new matches via AskUserQuestion tool with:
        - header: "New docs"
        - question: "Full-context search found additional product docs. Which should be linked?"
        - options: Each match as label: "{id}" with description: "Score: {score} | {tldr}"
        - multiSelect: true
      </action>
      <action>Add confirmed matches to the affects field. If a stub link was marked for replacement, replace it with the real doc link (FR8).</action>
    </branch>

    <branch condition="new engineering doc matches found">
      <action>Check if any match covers the same domain as a stub doc created earlier (in create_engineering_stub_doc).
If so, mark the stub link for replacement with the real doc link (FR8).</action>
      <action>Present remaining new matches via AskUserQuestion tool with:
        - header: "New eng docs"
        - question: "Full-context search found additional engineering docs. Which should be linked?"
        - options: Each match as label: "{id}" with description: "Score: {score} | {tldr}"
        - multiSelect: true
      </action>
      <action>Add confirmed matches to the engineering field. If a stub link was marked for replacement, replace it with the real doc link (FR8).</action>
    </branch>

    <action>Ensure no duplicate doc IDs in affects or engineering after all updates (FR9).</action>
  </step>

  <step name="create_task_file">
    <warning>Write to `.festinalente/tasks/` — NOT `.festinalente/product/`</warning>
    <action>Read template from `.festinalente/templates/task.xml`</action>
    <action>Create folder `.festinalente/tasks/{nextId}/`</action>
    <action>Create file at `.festinalente/tasks/{nextId}/task.xml`</action>
    <note>`{nextId}` = the nextId from step get_next_id (e.g., "022-add-dark-mode-toggle")</note>
    <action>Fill XML attributes: `id`, `title`, `status: backlog`, `priority`, `labels`, `created`, `affects`, `engineering`</action>
    <action>Fill `<description>` with initial description</action>
    <action>Fill `<problem>` with problem statement from Q&A</action>
    <action>Fill `<value>` with value statement from Q&A</action>
    <action>Fill `<acceptance-criteria>` with Gherkin-format criteria from Q&A</action>
    <action>Leave `<notes>` empty (filled during implementation)</action>
  </step>

  {{> directive-compliance}}

  <step name="output_result">
    <output>Print the created file path and task ID</output>
    <output>Print acceptance criteria summary</output>
    <output>
**Next: Scope the implementation**
```
/clear
/festina-scope {nextId}
```
    </output>
    {{> skill-complete}}
  </step>
</process>

<success_criteria>
- Task folder exists at `.festinalente/tasks/{nextId}/`
- Task file exists at `.festinalente/tasks/{nextId}/task.xml`
- Task XML has `id="{nextId}"`
- Task XML has `status="backlog"`
- Task XML has `title` element with "{title}"
- Task XML has `<problem>` section filled
- Task XML has `<value>` section filled
- Task XML has `<acceptance-criteria>` section with Gherkin format
- If new feature: stub doc exists at `.festinalente/product/{domain}/{slug}.md` with `stub: true`
- If new engineering pattern: stub doc exists at `.festinalente/engineering/{type}s/{slug}.md` with `stub: true`
- If refined search found new docs: affects/engineering fields include user-confirmed matches
- Next steps point to `/festina-scope`
</success_criteria>

<example>
**Bug fix (existing feature):**

User: `/festina-create Fix login redirect bug`

```
Creating task...

Title: Fix login redirect bug
Auto-detected label: bug
Is this correct? [Yes / No] > Yes

Searching product docs...
Related product docs: auth/login (score: 0.72)

What priority should this task have? > Medium

What problem are you trying to solve?
> After login, users go to /home instead of their original destination.

What value would solving this provide?
> Better UX - users go directly where they intended.

What does "done" look like?
> After login, redirect to the URL they originally tried to access.

I think I have enough information to create this task.
- **Problem:** Users redirected to /home instead of original destination
- **Value:** Better UX, support for authenticated deep links
- **Acceptance criteria:** Redirect to saved URL after login, default to /home

Is there anything else? > That's good.

Task 002 created in Backlog
- Labels: [bug]
- Affects: auth/login
- File: .festinalente/tasks/002/task.xml

Next:
/clear
/festina-scope 002
```

**New feature (stub doc created):**

User: `/festina-create Add dark mode toggle`

```
Creating task...

Title: Add dark mode toggle
Auto-detected label: feature
Is this correct? [Yes / No] > Yes

Searching product docs...
No matching docs found (new feature detected).

This looks like a new feature. What domain should it belong to?
[gui] Group with other gui features
[settings] Group with other settings features
> gui

Creating stub doc: .festinalente/product/gui/dark-mode.md

What priority should this task have? > Medium

What problem are you trying to solve?
> Users can't switch between light and dark themes.

What value would solving this provide?
> Better accessibility and reduced eye strain for users who prefer dark mode.

I think I have enough information to create this task.
- **Problem:** No dark/light theme toggle
- **Value:** Better accessibility, user preference support
- **Acceptance criteria:** Toggle in settings, persists across sessions

Is there anything else? > That's good.

Task 003 created in Backlog
- Labels: [feature]
- Affects: gui/dark-mode (stub created)
- Files:
  - .festinalente/tasks/003/task.xml
  - .festinalente/product/gui/dark-mode.md (stub)

Next:
/clear
/festina-scope 003
```

**New feature with engineering pattern:**

User: `/festina-create Add caching layer for API responses`

```
Creating task...

Title: Add caching layer for API responses
Auto-detected label: feature
Is this correct? [Yes / No] > Yes

Searching product docs...
No matching docs found (new feature detected).
What domain should it belong to? > performance

Creating stub doc: .festinalente/product/performance/api-caching.md

Searching engineering docs...
No matching docs found (new pattern detected).
This task may introduce new technical patterns. What type?
[System] New subsystem or service
[Pattern] Recurring solution
[Convention] Team standard
[None needed] No new engineering documentation required
> System

Creating engineering stub doc: .festinalente/engineering/systems/api-cache.md

What priority should this task have? > High

What problem are you trying to solve?
> API calls are slow and we're hitting rate limits on external services.

What value would solving this provide?
> Faster response times and reduced API costs.

I think I have enough information to create this task.
- **Problem:** Slow API calls and rate limit issues
- **Value:** Faster responses, reduced costs
- **Acceptance criteria:** Cache responses with configurable TTL, invalidation support

Is there anything else? > That's good.

Refining doc links with full context...
Full-context search found additional product docs:
  - infra/rate-limiting (score: 0.61) | Rate limiting and throttling policies
Which should be linked? > infra/rate-limiting

Task 004 created in Backlog
- Labels: [feature]
- Affects: performance/api-caching (stub created), infra/rate-limiting
- Engineering: systems/api-cache (stub created)
- Files:
  - .festinalente/tasks/004/task.xml
  - .festinalente/product/performance/api-caching.md (stub)
  - .festinalente/engineering/systems/api-cache.md (stub)

Next:
/clear
/festina-scope 004
```
</example>

<next_steps>
```
/clear
/festina-scope {id}
```
</next_steps>
