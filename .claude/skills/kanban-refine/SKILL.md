---
name: kanban-refine
description: Refine vague tasks through conversational Q&A to add clarity and acceptance criteria, then commit
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *), Grep, Glob, AskUserQuestion, WebSearch, WebFetch
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Refine Kanban Task

<purpose>
Refine vague tasks through iterative conversational Q&A focused on product/business concerns, then move from Backlog to Refined and commit.
</purpose>

<context>
<note>
- **`.claude/skills/kanban-*/`** — Installed kanban skills — READ ONLY
- **`.kanban/`** — Project data and config — READ/WRITE
- **`.kanban/tasks/{id}/`** — Task folder containing `task.md`, `spec.md`, `plan.md`
- **`.kanban/scripts/`** — Helper scripts for kanban operations
- **`.kanban/templates/`** — Document templates
- **`.kanban/workflow.yaml`** — Workflow config (columns, labels, transitions)
- **`.kanban/directives/`** — User-defined directives (custom instructions for hooks)
</note>

<note>Use these scripts to reliably find files:</note>

<command description="Find task by ID (returns JSON with path and metadata)">node .kanban/scripts/find-task.cjs {id}</command>

<command description="Find spec by ID (returns JSON with path)">node .kanban/scripts/find-spec.cjs {id}</command>

<command description="Find plan by ID (returns JSON with path)">node .kanban/scripts/find-plan.cjs {id}</command>



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

<note>Column transition: backlog → refined</note>
<note>See `.kanban/workflow.yaml` for column definitions and valid transitions</note>
</context>

<prohibited>
- Do not skip the Q&A dialogue and jump to writing
- Do not make assumptions without validating with user
- Do not write acceptance criteria that aren't confirmed by user
- Do not skip the commit step
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

  <step name="get_task_id" outputs="taskId">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as taskId</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <action>List tasks in `backlog` status from `.kanban/tasks/`</action>
      <output>Show task IDs and titles</output>
      <prompt>Which task to refine?</prompt>
    </branch>
  </step>

  <step name="read_task_file" outputs="taskPath, title, currentLabels">
    <command>node .kanban/scripts/find-task.cjs {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse YAML frontmatter</action>
    <validate>Verify task status is `backlog` (refinement moves to `refined`)</validate>
    <branch condition="status is not backlog">
      <output>Task is already in {status} status. Refinement is for tasks in backlog.</output>
      <prompt>Refine anyway? (y/n)</prompt>
    </branch>
    <action>Note current title, description, acceptance criteria (if any)</action>
    <branch condition="task not found">
      <output>Error: Task not found</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="load_hook_config">
    <step name="load_hook_config">
      <command>node .kanban/scripts/get-hook-config.cjs kanban-refine</command>
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
      "hook": "kanban-refine",
      "directives": [
        { "name": "my-directive", "path": ".kanban/directives/my-directive/DIRECTIVE.md", "exists": true }
      ],
      "product": [],
      "engineering": []
    }
    </example_code>
  </step>

  <step name="analyze_initial_context">
    <action>Check title for clarity issues</action>
    <validate>Title too short (&lt;5 words)?</validate>
    <validate>Missing action verb?</validate>
    <validate>Contains ambiguous terms ("fix stuff", "improve things")?</validate>
    <action>Check description for completeness</action>
    <action>Check acceptance criteria for specificity</action>

    <note>Load product context:</note>
    <branch condition="task has `affects` field with IDs">
      <action>For each ID: Read `.kanban/product/{id}.md`</action>
      <action>Note current product behavior for context</action>
    </branch>
    <branch condition="task has empty/no `affects` field">
      <command>node .kanban/scripts/search-product.cjs {keywords from title}</command>
      <branch condition="matches found (score ≥ 0.3)">
        <action>Read top matches for context</action>
        <action>Consider suggesting `affects` field update</action>
      </branch>
    </branch>
    <note>Reference product docs during Q&A to ensure alignment with existing product</note>

    <note>Load engineering context:</note>
    <branch condition="task has `engineering` field with IDs">
      <action>For each ID: Read `.kanban/engineering/{path}` (use ID→path rules)</action>
      <action>Note: patterns to follow, conventions, constraints</action>
    </branch>
    <branch condition="task has empty/no `engineering` field">
      <command>node .kanban/scripts/search-engineering.cjs {keywords from title}</command>
      <branch condition="matches found (score ≥ 0.3)">
        <action>Read top matches for context</action>
        <action>Consider suggesting `engineering` field update</action>
      </branch>
    </branch>
    <note>Reference engineering docs during Q&A for technical context</note>
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
**"I think I have enough information to write the refinement. Here's what I understand:**
- **Problem:** {summary}
- **Value:** {summary}
- **Acceptance criteria:** {summary}

**Is there anything else you'd like to discuss before I finalize this?"**
    </output>

    <branch condition="user says 'that's good' / 'go ahead' / similar">
      <action>Proceed to writing</action>
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

  <step name="update_task_file">
    <action>Follow template at `.kanban/templates/task.md`</action>
    <action>Fill sections for this phase:</action>
    <note>`## What problem are you trying to solve?`</note>
    <note>`## What value would it provide if solved?`</note>
    <note>`## Acceptance Criteria` (in Gherkin format)</note>
    <action>Update frontmatter:</action>
    <action>Change status per `transitions.backlog` in kanban-workflow.yaml (`backlog` → `refined`)</action>
    <action>Add `updated: {YYYY-MM-DD}`</action>
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

  <step name="write_task_file">
    <action>Write the updated task file</action>
  </step>

  <step name="commit">
    <note>Format: `docs({taskId}): refine - {title}`</note>
    <command>git add .kanban/tasks/{taskId}/task.md</command>
    <command>git commit -m "docs({taskId}): refine - {title}"</command>
  </step>

  <step name="output_result">
    <output>Print summary of changes made</output>
    <output>Show updated acceptance criteria</output>
    <output>Print commit hash</output>
    <output>
**Next: Scope the implementation**
```
/clear
/kanban-scope {taskId}
```
    </output>
    <output>[KANBAN_COMPLETE]</output>
  </step>
</process>

<success_criteria>
- Task file exists at `.kanban/tasks/{taskId}/task.md`
- Frontmatter contains `status: refined`
- Task file contains `## Acceptance Criteria` section with Gherkin format
- Git log shows `docs({taskId}): refine -`
- Next steps shown to user
</success_criteria>

<example>
User: `/kanban-refine 003`

```
Analyzing task 003 "Fix the thing"...

Reading task context...
- Title: "Fix the thing"
- Description: (empty)
- No acceptance criteria

I see this task needs clarification. Let me ask some questions.

Q: What problem are you trying to solve with this task?
> The login form doesn't validate email format before submission, so users
> can submit invalid emails and only find out after server response.

Got it - client-side email validation is missing.

Q: What value would this provide if solved?
> Better user experience, faster feedback. Also research how other login
> forms handle this - like inline validation patterns.

Let me research that...

[Researches inline validation patterns]

Found some useful patterns:
- Real-time validation as user types (after blur)
- Inline error messages below the field
- Visual indicators (red border, checkmark)

Would you like to incorporate any of these patterns into the requirements?
> Yes, inline error message below the field, validate on blur.

Q: What does "done" look like for this task?
> Email validated on blur, inline error shown if invalid, form submission
> blocked until valid.

I think I have enough information to write the refinement. Here's what I understand:

- **Problem:** Login form lacks client-side email validation, causing poor UX
- **Value:** Faster feedback, better user experience, reduced invalid submissions
- **Acceptance criteria:** Email validated on blur, inline error message, blocked submission

Is there anything else you'd like to discuss before I finalize this?
> No, that's good.

Writing refinement...

Task 003 updated:
- Title: "Add client-side email validation to login form"
- Status: refined
- Acceptance Criteria:
  Given a user is on the login form
  When they enter an invalid email format
  And they blur the email field
  Then an inline error message is displayed below the field
  And the submit button is disabled

  Given a user is on the login form
  When they enter a valid email format
  And they blur the email field
  Then no error message is displayed
  And the submit button is enabled

Commit: b2c3d4e docs(003): refine - Add client-side email validation to login form

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
