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
<note>
- **`.claude/skills/kanban-*/`** — Installed kanban skills — READ ONLY
- **`.kanban/`** — Project data and config — READ/WRITE
- **`.kanban/tasks/{id}/`** — Task folder containing `task.xml`, `spec.xml`, `plan.xml`
- **`.kanban/scripts/`** — Helper scripts for kanban operations
- **`.kanban/templates/`** — Document templates
- **`.kanban/workflow.yaml`** — Workflow config (columns, labels, transitions)
- **`.kanban/directives/`** — User-defined directives (custom instructions for hooks)
</note>

<note>Use these scripts to reliably find files:</note>





<command description="Get next task ID (returns JSON with nextId, currentHighest, padding)">node .kanban/scripts/next-id.cjs</command>

<command description="Get current date/time (returns JSON with iso and date formats)">node .kanban/scripts/get-date-time.cjs</command>


<note>Use these scripts to work with product documentation:</note>


<command description="Search product docs by keywords (returns JSON sorted by relevance)">node .kanban/scripts/search-product.cjs keyword1 keyword2 ...</command>
<command description="With minimum score threshold">node .kanban/scripts/search-product.cjs password reset --min-score=0.3</command>
<note>Score interpretation: ≥0.5 = strong match | 0.3-0.5 = possible match | &lt;0.3 = weak match | No results = likely new feature</note>


<note>Path rule: ID `auth/login` → Path `.kanban/product/auth/login.md`</note>

<note>Use these scripts to work with engineering documentation:</note>


<command description="Search engineering docs by keywords (returns JSON sorted by relevance)">node .kanban/scripts/search-engineering.cjs keyword1 keyword2 ...</command>
<command description="With minimum score threshold">node .kanban/scripts/search-engineering.cjs middleware pattern --min-score=0.3</command>
<note>Score interpretation: ≥0.5 = strong match | 0.3-0.5 = possible match | &lt;0.3 = weak match | No results = likely new pattern/system</note>


<note>Path rules:
- `overview` → `.kanban/engineering/overview.md`
- `systems/auth` → `.kanban/engineering/systems/auth/index.md`
- `systems/auth/validator` → `.kanban/engineering/systems/auth/validator.md`
- `patterns/acyclic-arch` → `.kanban/engineering/patterns/acyclic-arch.md`
- `conventions/file-naming` → `.kanban/engineering/conventions/file-naming.md`
</note>

<note>Column transition: [New Task] → backlog</note>
<note>See `.kanban/workflow.yaml` for column definitions and valid transitions</note>
</context>

<prohibited>
- Do not use `Search()` or `Glob()` to find files manually
- Do not read `.kanban/config.yaml` directly
- Do not run `ls` commands to explore directories
- Do not create files in `.kanban/product/` (that's for product docs, not tasks)
- Do not skip the commit step
- Do not guess filenames or IDs — always use the helper scripts
</prohibited>

<process>
  <step name="load_workflow">
    <action>Read `.kanban/workflow.yaml` for column definitions, labels, priorities, and commit formats</action>
    <note>Use these values throughout this skill</note>
  </step>

  <step name="verify_branch">
    <command>git branch --show-current</command>
    <validate>Must be on `main` or `master` branch</validate>
    <branch condition="not on main/master">
      <output>Error: This command must be run on the main branch. Current branch: {branch}</output>
      <output>Suggest: Switch to main with `git checkout main`</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="verify_kanban_exists">
    <validate>Check that `.kanban/tasks/` directory exists</validate>
    <branch condition="directory doesn't exist">
      <output>Error: Kanban not initialized. Run `npx claude-kanban init` first.</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="load_hook_config">
    <step name="load_hook_config">
      <command>node .kanban/scripts/get-hook-config.cjs kanban-create</command>
      <action>Parse the JSON output</action>
    
      <branch condition="directives.length > 0">
        <warning>Directives are MANDATORY. You MUST follow them.</warning>
        <action>For EACH directive where `exists` is `true`:</action>
        <action>Read the directive file at `path`</action>
        <action>Follow ALL instructions as mandatory requirements</action>
      </branch>
    
      <branch condition="product.length > 0 OR engineering.length > 0">
        <note>Context docs are for guidance, not mandatory.</note>
        <action>Read any product/engineering docs where `exists` is `true`</action>
        <action>Use these for additional context as needed</action>
      </branch>
    </step>
    
    <example_code lang="json">
    {
      "hook": "kanban-create",
      "directives": [
        { "name": "my-directive", "path": ".kanban/directives/my-directive/DIRECTIVE.md", "exists": true }
      ],
      "product": [],
      "engineering": []
    }
    </example_code>
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

  <step name="search_product_docs" when="`.kanban/product/` directory exists and is not empty">
    <action>Extract keywords from the established title (nouns, verbs, domain terms)</action>
    <command>node .kanban/scripts/search-product.cjs {keyword1} {keyword2} ...</command>

    <branch condition="docs with score ≥ 0.5 found">
      <note>These docs describe existing features this task relates to</note>
      <action>Set `affects: [{matched-ids}]` in task XML</action>
      <output>Related product docs: {ids}</output>
    </branch>

    <branch condition="no docs with score ≥ 0.3 found">
      <note>This may be a NEW feature not yet documented</note>
      <action>If existing domains are known from `.kanban/product/` folder structure, use AskUserQuestion tool with:
        - header: "Domain"
        - question: "This looks like a new feature. What domain should it belong to?"
        - options: Build from existing domain folders (up to 4), each with:
          - label: "{domain}", description: "Group with other {domain} features"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a custom domain</note>
      <action>Set `affects: [{domain}/{slug-from-title}]` - doc will be created during /kanban-docs</action>
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
    ## Final Validation
    
    Before completing, validate all task XML:
    
    <command description="Validate XML in all task files">node .kanban/scripts/validate-xml.cjs</command>
    
    If validation fails, fix the reported errors before completing.
    
    <output>[KANBAN_COMPLETE]</output>
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
- Git log shows `docs({nextId}): create -`
- Next steps point to `/kanban-scope` (NOT /kanban-refine)
</success_criteria>

<example>
User: `/kanban-create Fix login redirect bug`

```
Creating task...

Title: Fix login redirect bug
Auto-detected label: bug

Is this correct? [Yes / No]
> Yes

What priority should this task have?
> Medium

Let me ask some questions to understand this task better.

What problem are you trying to solve?
> After successful login, users are redirected to /home instead of
> their original destination URL. If they were trying to access
> /settings, they end up at /home and have to navigate manually.

What value would solving this provide?
> Better UX - users go directly where they intended. Also important
> for shared links that require authentication.

What does "done" look like?
> After login, redirect to the URL they originally tried to access.
> If no saved URL, default to /home.

I think I have enough information to create this task. Here's what I understand:
- **Problem:** Users redirected to /home instead of original destination after login
- **Value:** Better UX, support for authenticated deep links
- **Acceptance criteria:** Redirect to saved URL after login, default to /home if none

Is there anything else you'd like to discuss before I create the task?
> That's good.

Creating task...

Task 002 created in Backlog
Title: Fix login redirect bug
Labels: [bug]
Priority: Medium

Acceptance Criteria:
  Given a user tries to access /settings without being logged in
  And they are redirected to the login page
  When they successfully log in
  Then they are redirected to /settings

  Given a user navigates directly to the login page
  When they successfully log in
  Then they are redirected to /home

File: .kanban/tasks/002/task.xml
Commit: a1b2c3d docs(002): create - Fix login redirect bug

Next:
/clear
/kanban-scope 002
```
</example>

<next_steps>
```
/clear
/kanban-scope {id}
```
</next_steps>
