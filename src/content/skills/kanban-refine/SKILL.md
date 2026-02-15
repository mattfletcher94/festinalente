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
    Use $ARGUMENTS if provided (e.g., "001"), otherwise:
    - List tasks with `needs-refinement` label from `.kanban/tasks/`
    - Show task IDs, titles, and current vagueness indicators
    - Ask user which task to refine
  </step>

  <step name="read_task_file" outputs="taskPath, title, currentLabels">
    - Run `node .claude/scripts/find-task.cjs {taskId}` to get exact path
    - Read the file at the `path` from JSON output
    - Parse YAML frontmatter
    - Verify task has `needs-refinement` label (from kanban-workflow.yaml):
      - If present, proceed with refinement
      - If not present, warn: "Task does not have needs-refinement label. Refine anyway? (y/n)"
    - Note current title, description, acceptance criteria (if any)
    - Error if task not found
  </step>

  <step name="load_user_skills">
    {{> user-skills command="refine"}}
  </step>

  <step name="analyze_initial_context">
    - Check title for clarity issues:
      - Title too short (<5 words)?
      - Missing action verb?
      - Contains ambiguous terms ("fix stuff", "improve things")?
    - Check description for completeness
    - Check acceptance criteria for specificity

    **Load product context:**
    - If task has `affects` field with IDs:
      - For each ID: Read `.kanban/product/{id}.md`
      - Note current product behavior for context
    - If task has empty/no `affects` field:
      - Run: `node .claude/scripts/search-product.cjs {keywords from title}`
      - If matches found (score ≥ 0.3):
        - Read top matches for context
        - Consider suggesting `affects` field update
    - Reference product docs during Q&A to ensure alignment with existing product
  </step>

  <step name="conduct_qa_dialogue">
    This is a **conversational session** focused on **product/business concerns**:
    - What problem are we solving?
    - What value does it provide?
    - What does "done" look like?
    - User context, constraints, preferences

    **How the dialogue works:**

    a. **Ask questions as needed** using AskUserQuestion:
       - Start with the most important gaps (problem, value, acceptance criteria)
       - Ask follow-up questions based on answers
       - Don't follow a rigid script - adapt to the conversation

    b. **User can volunteer information at any time**:
       - User may provide context you didn't ask for
       - User may request research (e.g., "research how other apps handle password reset")
       - User may skip questions ("skip" or "you fill it in")

    c. **Perform web research when requested or beneficial**:
       - If user asks to research something, use WebSearch/WebFetch
       - Research domain topics, best practices, how other products solve similar problems
       - Share findings and ask if they influence requirements

    d. **Continue until you have enough information**:
       - You need enough to write: problem statement, value statement, acceptance criteria
       - When you feel ready, signal to the user:

         **"I think I have enough information to write the refinement. Here's what I understand:**
         - **Problem:** {summary}
         - **Value:** {summary}
         - **Acceptance criteria:** {summary}

         **Is there anything else you'd like to discuss before I finalize this?"**

    e. **User confirms or continues**:
       - If user says "that's good" / "go ahead" / similar → proceed to writing
       - If user adds more context → incorporate and ask if anything else
       - If user has corrections → update understanding and confirm again

    **Key principles:**
    - Focus on PRODUCT/BUSINESS concerns, not technical implementation
    - Let the conversation flow naturally
    - Research when it helps clarify requirements
    - Don't rush - thoroughness now saves time later
  </step>

  <step name="update_task_file">
    - Follow template at `.claude/kanban-templates/task.md`
    - Fill sections for this phase:
      - `## What problem are you trying to solve?`
      - `## What value would it provide if solved?`
      - `## Acceptance Criteria` (in Gherkin format)
    - Update frontmatter:
      - Change status per `transitions.backlog` in kanban-workflow.yaml (`backlog` → `refined`)
      - Add `updated: {YYYY-MM-DD}`
      - Remove `needs-refinement` from labels if present
  </step>

  <step name="format_acceptance_criteria">
    ```gherkin
    Given {precondition}
    And {additional precondition if needed}
    When {action}
    Then {expected outcome}
    And {additional outcome if needed}
    ```

    Example:
    ```gherkin
    Given a user is on the login page
    And they have entered valid credentials
    When they click the login button
    Then they are redirected to the dashboard
    And their session is established
    ```
  </step>

  <step name="write_task_file">
    Write the updated task file.
  </step>

  <step name="commit">
    Format: `docs({taskId}): refine - {title}`

    ```bash
    git add .kanban/tasks/{taskId}-*.md
    git commit -m "docs({taskId}): refine - {title}"
    ```
  </step>

  <step name="output_result">
    - Print summary of changes made
    - Show updated acceptance criteria
    - Print commit hash
  </step>
</process>

<success_criteria>
- Task file exists at `.kanban/tasks/{taskId}-*.md`
- Frontmatter contains `status: refined`
- Task file contains `## Acceptance Criteria` section with Gherkin format
- Git log shows `docs({taskId}): refine -`
- Next steps shown to user
</success_criteria>

## Example

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

## Next Steps

```
/clear
/kanban-scope {id}
```
