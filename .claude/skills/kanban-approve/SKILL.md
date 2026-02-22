---
name: kanban-approve
description: Approve implementation after human QA, commit code, and move to Update Docs. Use when QA testing passes.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git diff *, git branch *), AskUserQuestion
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Approve Kanban Task

<purpose>
Approve implementation after human QA testing, commit the code with appropriate conventional commit type, and move task from QA to Update Docs.
</purpose>

<context>
<note>
- **`.claude/skills/kanban-*/`** — Installed kanban skills — READ ONLY
- **`.kanban/`** — Project data and config — READ/WRITE
- **`.kanban/tasks/{id}/`** — Task folder containing `task.xml`, `spec.xml`, `plan.xml`
- **`.kanban/scripts/`** — Helper scripts for kanban operations
- **`.kanban/templates/`** — Document templates
- **`.kanban/workflow.yaml`** — Workflow config (columns, labels, transitions)
- **`.kanban/directives/`** — User-defined directives (custom instructions for skills)
</note>

<note>Use these scripts to reliably find files:</note>

<command description="Find task by ID (returns JSON with path and metadata)">node .kanban/scripts/find-task.cjs {id}</command>





<command description="Get current date/time (returns JSON with iso and date formats)">node .kanban/scripts/get-date-time.cjs</command>


<note>Column transition: qa → update-docs</note>
<note>See `.kanban/workflow.yaml` for column definitions and valid transitions</note>
</context>

<prohibited>
- Do not approve without QA confirmation from user
- Do not use invented commit types like `kanban(...)` — valid types are: `feat`, `fix`, `refactor`, `docs`
- Do not skip the commit step
- Do not commit sensitive files (.env, credentials)
</prohibited>

<process>
  <step name="load_workflow">
    <action>Read `.kanban/workflow.yaml` for column definitions, labels, priorities, and commit formats</action>
    <note>Use these values throughout this skill</note>
  </step>

  <step name="get_task_id" outputs="taskId">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as taskId</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <action>List tasks in `qa` status from `.kanban/tasks/`</action>
      <action>Use AskUserQuestion tool with:
        - header: "Task"
        - question: "Which task would you like to approve?"
        - options: Build from task list (up to 4 tasks in qa status), each with:
          - label: "{taskId}: {short title}" (truncate title if needed)
          - description: "Status: qa | Ready for approval"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a task ID directly</note>
    </branch>
  </step>

  <step name="read_task_file" outputs="taskPath, title, labels">
    <command>node .kanban/scripts/find-task.cjs {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse XML</action>
    <validate>Verify current status is `qa`</validate>
    <branch condition="status is in-progress">
      <output>Suggest completing verification first</output>
      <action>Exit</action>
    </branch>
    <branch condition="status is backlog or planned">
      <output>Suggest earlier commands</output>
      <action>Exit</action>
    </branch>
    <branch condition="status is update-docs or later">
      <output>Warning: Task already past QA</output>
    </branch>
    <action>Get title and labels for commit message</action>
    <branch condition="task not found">
      <output>Error: Task not found</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="verify_branch">
    <command>git branch --show-current</command>
    <validate>Must be on branch `task/{id}` where {id} is the task ID</validate>
    <branch condition="not on expected branch">
      <output>Error: This command must be run on branch task/{id}. Current branch: {branch}</output>
      <output>Suggest: Switch to task branch with `git checkout task/{id}`</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="load_directives">
    <step name="load_directives">
      <command>node .kanban/scripts/get-skill-config.cjs kanban-approve</command>
      <action>Parse the JSON output</action>
    
      <branch condition="directives.length > 0">
        <warning>Directives are MANDATORY. You MUST follow them.</warning>
        <action>For EACH directive where `exists` is `true`:</action>
        <action>Read the directive XML file at `path`</action>
        <action>Parse and apply:</action>
        <action>- `<context>` principles: Maintain as ongoing mindset</action>
        <action>- `<process>` rules where phase="approve": Follow as requirements</action>
        <note>`<validation>` checks will run in directive_compliance step</note>
        <note>`<examples>` will be shown if violations are found</note>
      </branch>
    </step>
    
    <example_code lang="json">
    {
      "skill": "kanban-approve",
      "directives": [
        { "name": "architecture", "path": ".kanban/directives/architecture.xml", "exists": true }
      ]
    }
    </example_code>
  </step>

  <step name="prompt_qa_confirmation">
    <output>Display task title and acceptance criteria</output>
    <action>Use AskUserQuestion tool with:
      - header: "QA Passed?"
      - question: "Have you tested the application and verified it meets acceptance criteria?"
      - options:
        - label: "Yes", description: "QA passed, ready to commit and move to Update Docs"
        - label: "No", description: "Issues found, need to document and rework"
      - multiSelect: false
    </action>
    <branch condition="user selects No">
      <output>Suggest: Use /kanban-rework {taskId} to document issues</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="check_uncommitted_changes" outputs="changedFiles">
    <command>git status</command>
    <command>git diff --name-only</command>
    <output>Display files that will be committed</output>
    <branch condition="no changes found">
      <output>Warning: No uncommitted changes to commit. Was the implementation already committed?</output>
      <action>Use AskUserQuestion tool with:
        - header: "Proceed?"
        - question: "No uncommitted changes found. Proceed anyway (just move status)?"
        - options:
          - label: "Yes", description: "Continue and move task to Update Docs"
          - label: "No", description: "Cancel and investigate missing changes"
        - multiSelect: false
      </action>
    </branch>
  </step>

  <step name="determine_commit_type" outputs="commitType">
    <action>Check task labels array</action>
    <branch condition="contains `bug`">
      <action>type = `fix`</action>
    </branch>
    <branch condition="contains `refactor`">
      <action>type = `refactor`</action>
    </branch>
    <branch condition="contains `docs`">
      <action>type = `docs`</action>
    </branch>
    <branch condition="contains `feature` or default">
      <action>type = `feat`</action>
    </branch>
  </step>

  <step name="move_to_update_docs">
    <note>Before commit so status is included</note>
    <action>Change `status: qa` to `status: update-docs`</action>
    <action>Add `updated: {YYYY-MM-DD}`</action>
    <action>Write updated task file</action>
  </step>

  <step name="stage_and_commit">
    <note>Format: `{commitType}({taskId}): {title}`</note>
    <note>Commit type mapping:
- `bug` label → `fix({taskId}): {title}`
- `feature` label → `feat({taskId}): {title}`
- `refactor` label → `refactor({taskId}): {title}`
- `docs` label → `docs({taskId}): {title}`
- Default → `feat({taskId}): {title}`</note>

    <warning>Use EXACTLY these formats. Do NOT invent commit types like `kanban(...)`. Valid types are: `feat`, `fix`, `refactor`, `docs`.</warning>

    <action>Stage implementation files AND .kanban files together</action>
    <command>git add {implementation files}</command>
    <command>git add .kanban/</command>
    <note>`.kanban` files MUST be included — they accumulate status and plan changes from implement/verify that are not committed earlier</note>
    <command>git commit -m "{commitType}({taskId}): {title}"</command>
  </step>

  <step name="directive_compliance">
    <note>Verify compliance with all loaded directives</note>
  
    <action>For each directive loaded in load_directives step:</action>
    <action>Re-read the directive XML file</action>
  
    <action>Run each `<validation>` check:</action>
  
    <branch condition="check type=command">
      <command>{content of <run> element}</command>
      <validate>{content of <expect> element}</validate>
    </branch>
  
    <branch condition="check type=pattern">
      <action>For each file matching `files` glob that was modified:</action>
      <action>Check content against `<forbidden>` or `<required>` regex</action>
    </branch>
  
    <branch condition="check type=checklist">
      <action>Self-assess each `<item>` as Y/N</action>
    </branch>
  
    <branch condition="any check fails">
      <output>Directive violation: {check id} - {reason}</output>
      <action>Find `<example>` elements where ref matches failed check</action>
      <action>Show violation examples to illustrate the problem</action>
      <action>Show correct examples to illustrate the fix</action>
      <action>Use AskUserQuestion tool with:
        - header: "Violation"
        - question: "Directive check failed. How would you like to proceed?"
        - options:
          - label: "Fix now", description: "Address the violation before continuing"
          - label: "Continue anyway", description: "Acknowledge and proceed despite violation"
        - multiSelect: false
      </action>
    </branch>
  </step>

  <step name="output_result">
    <output>Print commit hash and message</output>
    <output>Print: "Task {taskId} moved to Update Docs"</output>
    <output>Print: "QA passed! Code committed."</output>
    <output>
**Next: Update product documentation**
```
/clear
/kanban-docs {taskId}
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
- Task file exists at `.kanban/tasks/{taskId}/task.xml`
- Task XML has `status: update-docs`
- Git log shows appropriate commit type (`feat`, `fix`, `refactor`, or `docs`) with `({taskId}):`
- Next steps shown to user
</success_criteria>

<example>
**Feature QA Passed:**

User: `/kanban-approve 001`

```
Approving task 001 "Add user authentication"...

Task: 001 - Add user authentication
Labels: [feature]
Acceptance Criteria:
  Given a user enters valid credentials
  When they click login
  Then they are authenticated and redirected to dashboard

[User selects "Yes" - QA passed]

Task 001 moved to Update Docs

Staging files:
- src/routes/auth.ts
- src/middleware/jwt.ts
- src/types/auth.ts
- .kanban/tasks/001/task.md
- .kanban/tasks/001/plan.md

Commit type: feat (from feature label)

Commit: e5f6g7h feat(001): Add user authentication

QA passed!
- Column: update-docs
- Commit: e5f6g7h

Next:
/clear
/kanban-docs 001
```

**Bug Fix QA Passed:**

User: `/kanban-approve 002`

```
Approving task 002 "Fix login redirect loop"...

Task: 002 - Fix login redirect loop
Labels: [bug]
Acceptance Criteria:
  Given a user completes login
  When the server redirects
  Then the redirect goes to dashboard without loop

[User selects "Yes" - QA passed]

Task 002 moved to Update Docs

Staging files:
- src/routes/auth.ts
- .kanban/tasks/002/task.md
- .kanban/tasks/002/plan.md

Commit type: fix (from bug label)

Commit: f6g7h8i fix(002): Fix login redirect loop

QA passed!
- Column: update-docs
- Commit: f6g7h8i

Next:
/clear
/kanban-docs 002
```
</example>

<next_steps>
```
/clear
/kanban-docs {id}
```

Or if issues are found during QA:
```
/clear
/kanban-rework {id}
```
</next_steps>
