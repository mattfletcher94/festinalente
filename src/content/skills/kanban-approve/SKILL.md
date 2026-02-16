---
name: kanban-approve
description: Approve implementation after human QA, commit code, and move to Update Docs. Use when QA testing passes.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git diff *, git branch *)
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Approve Kanban Task

<purpose>
Approve implementation after human QA testing, commit the code with appropriate conventional commit type, and move task from QA to Update Docs.
</purpose>

<context>
{{> directory-reference}}

{{> helper-scripts show_find_task=true show_get_date_time=true}}

{{> column-transition from="qa" to="update-docs"}}
</context>

<prohibited>
- Do not approve without QA confirmation from user
- Do not use invented commit types like `kanban(...)` — valid types are: `feat`, `fix`, `refactor`, `docs`
- Do not skip the commit step
- Do not commit sensitive files (.env, credentials)
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="get_task_id" outputs="taskId">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as taskId</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <action>List tasks in `qa` status from `.kanban/tasks/`</action>
      <output>Show task IDs and titles</output>
      <prompt>Which task to approve?</prompt>
    </branch>
  </step>

  <step name="read_task_file" outputs="taskPath, title, labels">
    <command>node .kanban/scripts/find-task.cjs {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse YAML frontmatter</action>
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
    {{> branch-verify-task}}
  </step>

  <step name="load_user_skills">
    {{> user-skills command="approve"}}
  </step>

  <step name="prompt_qa_confirmation">
    <output>Display task title and acceptance criteria</output>
    <prompt>Have you tested the application and verified it meets acceptance criteria? [Y/n]</prompt>
    <branch condition="user declines">
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
      <prompt>Proceed anyway (just move status)?</prompt>
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
  </step>
</process>

<success_criteria>
- Task file exists at `.kanban/tasks/{taskId}/task.md`
- Task frontmatter contains `status: update-docs`
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

Have you tested the application and verified it meets acceptance criteria? [Y/n]
> Y

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

Have you tested the application and verified it meets acceptance criteria? [Y/n]
> Y

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
