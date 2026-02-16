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
{{> directory-reference}}

{{> helper-scripts show_find_task=true show_find_spec=true show_find_plan=true show_get_date_time=true}}

{{> product-docs-scripts show_search_product=true}}

{{> engineering-docs-scripts show_search_engineering=true}}

{{> column-transition from="backlog" to="refined"}}
</context>

<prohibited>
- Do not skip the Q&A dialogue and jump to writing
- Do not make assumptions without validating with user
- Do not write acceptance criteria that aren't confirmed by user
- Do not skip the commit step
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="verify_branch">
    {{> branch-verify-main}}
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

  <step name="load_user_skills">
    {{> user-skills command="refine"}}
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
