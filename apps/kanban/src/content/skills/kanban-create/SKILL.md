---
name: kanban-create
description: Create and refine a new task through conversational Q&A, then commit to Backlog. Captures problem, value, and acceptance criteria in a single workflow.
allowed-tools: Read, Write, Bash(node *, git add *, git commit *, git status, git branch *), Grep, Glob, AskUserQuestion, WebSearch, WebFetch
argument-hint: "[task title]"
disable-model-invocation: true
---

# Create Kanban Task

<purpose>
Create and refine a new task through conversational Q&A, then commit to Backlog. Captures problem, value, and acceptance criteria in a single workflow.
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
- Do not read `.kanban/config.yaml` directly
- Do not run `ls` commands to explore directories
- Do not skip the commit step
- Do not guess filenames or IDs — always use the helper scripts
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="verify_branch">
    {{> branch-verify-main}}
  </step>

  <step name="verify_kanban_exists">
    <validate>Check that `.kanban/tasks/` directory exists</validate>
    <branch condition="directory doesn't exist">
      <output>Error: Kanban not initialized. Run `npx claude-kanban init` first.</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="load_hook_config">
    {{> hook-config command="create"}}
  </step>

  <step name="get_next_id" outputs="nextId">
    <command>node .kanban/scripts/next-id.cjs</command>
    <action>Use `nextId` from JSON output</action>
  </step>

  <step name="get_task_title" outputs="title, slug">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as title</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <prompt>What is the task title?</prompt>
    </branch>
    <action>Ensure title follows best practices (suggest improvements if needed)</action>
    <action>Generate slug from title for file naming</action>
  </step>

  <step name="search_product_docs" when="`.kanban/product/` directory exists and is not empty" outputs="newDocId, newDocPath">
    <action>Extract keywords from the established title (nouns, verbs, domain terms)</action>
    <command>node .kanban/scripts/search-product.cjs {keyword1} {keyword2} ...</command>

    <branch condition="docs with score ≥ 0.5 found">
      <note>These docs describe existing features this task relates to</note>
      <action>Set `affects: [{matched-ids}]` in task XML</action>
      <output>Related product docs: {ids}</output>
    </branch>

    <branch condition="no docs with score ≥ 0.3 found">
      <note>This may be a NEW feature not yet documented - we'll create a stub doc</note>
      <action>If existing domains are known from `.kanban/product/` folder structure, use AskUserQuestion tool with:
        - header: "Domain"
        - question: "This looks like a new feature. What domain should it belong to?"
        - options: Build from existing domain folders (up to 4), each with:
          - label: "{domain}", description: "Group with other {domain} features"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a custom domain</note>
      <action>Set newDocId = `{domain}/{slug-from-title}`</action>
      <action>Set newDocPath = `.kanban/product/{domain}/{slug-from-title}.md`</action>
      <action>Set `affects: [{newDocId}]` in task XML</action>
      <note>Stub doc will be created in step create_stub_doc</note>
    </branch>

    <branch condition="`.kanban/product/` is empty or doesn't exist">
      <action>Skip this step</action>
      <output>No product docs yet</output>
    </branch>
  </step>

  <step name="search_engineering_docs" when="`.kanban/engineering/` directory exists and is not empty">
    <action>Extract keywords from the established title (technical terms, patterns, system names)</action>
    <command>node .kanban/scripts/search-engineering.cjs {keyword1} {keyword2} ...</command>

    <branch condition="docs with score ≥ 0.5 found">
      <note>These docs describe existing patterns/systems this task relates to</note>
      <action>Set `engineering: [{matched-ids}]` in task XML</action>
      <output>Related engineering docs: {ids}</output>
    </branch>

    <branch condition="no docs with score ≥ 0.3 found">
      <note>This may involve new patterns/systems not yet documented</note>
      <action>Leave `engineering: []` empty - docs will be created during /kanban-docs if needed</action>
    </branch>

    <branch condition="`.kanban/engineering/` is empty or doesn't exist">
      <action>Skip this step</action>
      <output>No engineering docs yet</output>
    </branch>
  </step>

  <step name="create_stub_doc" when="newDocId was set (new feature detected)">
    <note>Create a minimal stub doc so the `affects` link is valid immediately</note>
    <command description="Get current date">node .kanban/scripts/get-date-time.cjs</command>
    <action>Create domain folder if doesn't exist: `.kanban/product/{domain}/`</action>
    <action>Create stub doc at {newDocPath} with minimal content:</action>
    <example_code lang="markdown">
---
id: "{newDocId}"
title: "{Feature title derived from task title}"
type: feature
tldr: ""
summary: "Stub - to be completed during /kanban-docs"
keywords: [{keywords from task title}]
aliases: []
boundary: ""
related: []
updated: {date from get-date-time}
stub: true
task: "{nextId}"
---

# {Feature title}

> **TL;DR:** (To be completed)

## Overview

This is a stub document created during task creation. It will be completed with full content during the `/kanban-docs` phase after implementation.

**Related task:** {nextId} - {task title}

## Status

- [ ] Overview section
- [ ] How It Works section
- [ ] Examples section
- [ ] Boundaries section
    </example_code>
    <output>Created stub doc: {newDocPath}</output>
    <note>The `stub: true` frontmatter marks this for completion during /kanban-docs</note>
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
    <action>Use `labels[].detect-keywords` from kanban-workflow.yaml to auto-detect label from title/context</action>
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
    <note>This is a **conversational session** focused on **product/business concerns**:
- What problem are we solving?
- What value does it provide?
- What does "done" look like?
- User context, constraints, preferences</note>

    <note>How the dialogue works:</note>

    <action>Ask questions as needed using AskUserQuestion</action>
    <note>Start with the most important gaps (problem, value, acceptance criteria)</note>
    <note>Ask follow-up questions based on answers</note>
    <note>Don't follow a rigid script - adapt to the conversation</note>

    <note>User can volunteer information at any time:
- User may provide context you didn't ask for
- User may request research (e.g., "research how other apps handle password reset")
- User may skip questions ("skip" or "you fill it in")</note>

    <branch condition="user requests research">
      <action>Use WebSearch/WebFetch to research domain topics, best practices, how other products solve similar problems</action>
      <output>Share findings and ask if they influence requirements</output>
    </branch>

    <action>Continue until you have enough information to write: problem statement, value statement, acceptance criteria</action>

    <output>
**"I think I have enough information to create this task. Here's what I understand:**
- **Problem:** {summary}
- **Value:** {summary}
- **Acceptance criteria:** {summary}

**Is there anything else you'd like to discuss before I create the task?"**
    </output>

    <branch condition="user says 'that's good' / 'go ahead' / similar">
      <action>Proceed to creating task file</action>
    </branch>
    <branch condition="user adds more context">
      <action>Incorporate and ask if anything else</action>
    </branch>
    <branch condition="user has corrections">
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

  <step name="create_task_file">
    <warning>Write to `.kanban/tasks/` — NOT `.kanban/product/`</warning>
    <action>Read template from `.kanban/templates/task.xml`</action>
    <action>Create folder `.kanban/tasks/{nextId}/`</action>
    <action>Create file at `.kanban/tasks/{nextId}/task.xml`</action>
    <note>`{nextId}` = the nextId from step get_next_id (e.g., "001")</note>
    <action>Fill XML attributes: `id`, `title`, `status: backlog`, `priority`, `labels`, `created`, `affects`, `engineering`</action>
    <action>Fill `<description>` with initial description</action>
    <action>Fill `<problem>` with problem statement from Q&A</action>
    <action>Fill `<value>` with value statement from Q&A</action>
    <action>Fill `<acceptance-criteria>` with Gherkin-format criteria from Q&A</action>
    <action>Leave `<notes>` empty (filled during implementation)</action>
  </step>

  <step name="commit">
    <note>Format: `docs({nextId}): create - {title}`</note>
    <command>git add .kanban/tasks/{nextId}/task.xml</command>
    <branch condition="stub doc was created">
      <command>git add {newDocPath}</command>
    </branch>
    <command>git commit -m "docs({nextId}): create - {title}"</command>
  </step>

  <step name="output_result">
    <output>Print the created file path and task ID</output>
    <output>Print commit hash</output>
    <output>Print acceptance criteria summary</output>
    <output>
**Next: Scope the implementation**
```
/clear
/kanban-scope {nextId}
```
    </output>
    {{> skill-complete}}
  </step>
</process>

<success_criteria>
- Task folder exists at `.kanban/tasks/{nextId}/`
- Task file exists at `.kanban/tasks/{nextId}/task.xml`
- Task XML has `id="{nextId}"`
- Task XML has `status="backlog"`
- Task XML has `title` element with "{title}"
- Task XML has `<problem>` section filled
- Task XML has `<value>` section filled
- Task XML has `<acceptance-criteria>` section with Gherkin format
- If new feature: stub doc exists at `.kanban/product/{domain}/{slug}.md` with `stub: true`
- Git log shows `docs({nextId}): create -`
- Next steps point to `/kanban-scope` (NOT /kanban-refine)
</success_criteria>

<example>
**Bug fix (existing feature):**

User: `/kanban-create Fix login redirect bug`

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
- File: .kanban/tasks/002/task.xml
- Commit: a1b2c3d docs(002): create - Fix login redirect bug

Next:
/clear
/kanban-scope 002
```

**New feature (stub doc created):**

User: `/kanban-create Add dark mode toggle`

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

Creating stub doc: .kanban/product/gui/dark-mode.md

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
  - .kanban/tasks/003/task.xml
  - .kanban/product/gui/dark-mode.md (stub)
- Commit: b2c3d4e docs(003): create - Add dark mode toggle

Next:
/clear
/kanban-scope 003
```
</example>

<next_steps>
```
/clear
/kanban-scope {id}
```
</next_steps>
