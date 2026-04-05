---
name: festina-delete
description: Delete a task from the festina board. Only works for tasks in Backlog status.
allowed-tools: Read, Bash(node *, git add *, git commit *, git status, git branch *, git rm *)
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Delete Festina Lente Task

<purpose>
Permanently delete a task from the festina board. Only tasks in Backlog status can be deleted.
</purpose>

<context>
<note>
- **`.claude/skills/festina-*/`** — Installed festina skills — READ ONLY
- **`.festinalente/`** — Project data and config — READ/WRITE
- **`.festinalente/tasks/{id}/`** — Task folder containing `task.xml`, `spec.xml`, `plan.xml`
- **`.festinalente/quick/{id}/`** — Quick task folder containing `quick.xml` (for /festina-quick)
- **`.festinalente/scripts/`** — Helper scripts for festina operations
- **`.festinalente/templates/`** — Document templates
- **`.festinalente/workflow.yaml`** — Workflow config (columns, labels, transitions)
- **`.festinalente/directives/`** — User-defined directives (custom instructions for skills)
</note>

<note>Use these scripts to reliably find files:</note>

<command description="Find task by ID (returns JSON with path and metadata)">node .festinalente/scripts/festinalente.cjs find-task {id}</command>



<command description="List all tasks (returns JSON with count and tasks array)">node .festinalente/scripts/festinalente.cjs list-tasks</command>
<command description="List tasks filtered by status">node .festinalente/scripts/festinalente.cjs list-tasks --status=in-progress</command>
<command description="List tasks excluding a status">node .festinalente/scripts/festinalente.cjs list-tasks --exclude-status=done</command>












<note>Column transition: backlog → [Deleted]</note>
<note>See `.festinalente/workflow.yaml` for column definitions and valid transitions</note>
</context>

<prohibited>
- Do not delete tasks in scoped, planned, in-progress, or later statuses
- Do not delete without user confirmation
</prohibited>

<process>
  <step name="load_workflow">
    <action>Read `.festinalente/workflow.yaml` for column definitions, labels, priorities, and transitions</action>
    <note>Use these values throughout this skill</note>
  </step>

  <step name="load_directives">
    <command>node .festinalente/scripts/festinalente.cjs get-skill-config festina-delete</command>
    <action>Parse the JSON output</action>
    
    <branch condition="directives.length > 0">
      <warning>Directives are MANDATORY. You MUST follow them.</warning>
      <action>For EACH directive where `exists` is `true`:</action>
      <action>Read the directive XML file at `path`</action>
      <action>Parse and apply:</action>
      <action>- `<context>` principles: Maintain as ongoing mindset</action>
      <note>The `keywords` attribute on context principles is metadata for LLM relevance — use keywords to recognize when a principle applies to the current work.</note>
      <action>- `<process>` rules where the phase attribute, split on comma and trimmed, includes "delete" as an exact element (e.g. phase="plan,implement" matches "plan" and "implement" but NOT "plan-review"): Follow as requirements</action>
      <action>- `<override>` sections where the phase attribute, split on comma and trimmed, includes "delete" as an exact element: Apply step replacements</action>
      <action>- `<verification>` commands: Used by festina-plan to populate task &lt;verify&gt; elements and festina-implement to run step checks. Other skills can ignore this section.</action>
    
      <branch condition="directive has <override> section for phase=delete">
        <output>
    **DIRECTIVE OVERRIDE ACTIVE: {directive.name}**
    
    The following skill steps are REPLACED by this directive:
    
    {For each &lt;skip&gt; element:}
    **SKIP STEP: `{step}`** - Do NOT execute this step when you reach it in the skill process.
    
    **REPLACEMENT:** Execute directive rules {override.instead.rules} instead.
    
    **Reason:** {override.reason}
    
    **CRITICAL:** When you encounter any skipped step in the skill's &lt;process&gt;,
    you MUST skip it entirely and follow the directive's replacement rules instead.
        </output>
      </branch>
      <note>`<validation>` checks will run in directive_compliance step</note>
      <note>`<examples>` will be shown if violations are found</note>
      <note>Directives are loaded in config.yaml array order. All matching phase rules from all loaded directives apply additively. Avoid mapping two directives that both override the same phase.</note>
    </branch>
    
    <example_code lang="json">
    {
      "skill": "festina-delete",
      "directives": [
        { "name": "architecture", "path": ".festinalente/directives/architecture.xml", "exists": true }
      ]
    }
    </example_code>
  </step>

  <step name="get_task_id" outputs="taskId">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as taskId</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <command>node .festinalente/scripts/festinalente.cjs list-tasks --status=backlog</command>
      <branch condition="no eligible tasks">
        <output>No tasks in Backlog status to delete.</output>
        <action>Exit</action>
      </branch>
      <action>Use AskUserQuestion tool with:
        - header: "Task"
        - question: "Which task would you like to delete?"
        - options: Build from task list (up to 4 tasks in backlog status), each with:
          - label: "{taskId}: {short title}" (truncate title if needed)
          - description: "Status: {status}"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a task ID directly</note>
    </branch>
  </step>

  <step name="read_task_file" outputs="taskPath, title, status">
    <command>node .festinalente/scripts/festinalente.cjs find-task {taskId}</command>
    <branch condition="task found">
      <action>Read the file at the `path` from JSON output</action>
      <action>Parse XML</action>
    </branch>
    <branch condition="task not found">
      <output>Error: Task {taskId} not found</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="validate_status">
    <branch condition="status is backlog">
      <action>Continue to confirmation</action>
    </branch>
    <branch condition="status is any other value">
      <output>Error: Cannot delete task in {status} status.</output>
      <output>Only tasks in Backlog status can be deleted.</output>
      <output>Tasks in later stages contain work that should not be discarded.</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="display_task_details">
    <output>Display task details to user:</output>
    <output>- **ID:** {taskId}</output>
    <output>- **Title:** {title}</output>
    <output>- **Status:** {status}</output>
    <output>- **Description:** {first 100 chars of description}</output>
  </step>

  <step name="confirm_deletion">
    <warning>Deletion is permanent. The task folder and all files will be removed.</warning>
    <action>Use AskUserQuestion tool with:
      - header: "Confirm"
      - question: "Are you sure you want to permanently delete task {taskId}: {title}?"
      - options:
        - label: "Yes, delete", description: "Permanently remove this task and all its files"
        - label: "No, cancel", description: "Keep the task, make no changes"
      - multiSelect: false
    </action>
    <branch condition="user selects No">
      <output>Deletion cancelled. No changes made.</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="delete_task">
    <command>node .festinalente/scripts/festinalente.cjs delete-task {taskId}</command>
    <branch condition="error in output">
      <output>Error: {error message from script}</output>
      <action>Exit</action>
    </branch>
    <output>Task folder deleted: .festinalente/tasks/{taskId}/</output>
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
      <action>Check content against `<forbidden>` regex</action>
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
      <branch condition="user selects Fix now">
        <action>Attempt remediation for the violation</action>
        <action>Re-run the failed validation checks (only the ones that failed, not all checks)</action>
        <branch condition="checks now pass">
          <output>Violation resolved.</output>
        </branch>
        <branch condition="still failing after remediation">
          <output>Violation persists after fix attempt: {check id} - {reason}. Continuing.</output>
        </branch>
      </branch>
    </branch>
  </step>

  <step name="output_result">
    <validate>Confirm task folder .festinalente/tasks/{taskId}/ no longer exists</validate>
    <output>Task {taskId} deleted successfully.</output>
    <output>[FESTINA_COMPLETE]</output>
  </step>
</process>

<success_criteria>
- Task folder `.festinalente/tasks/{taskId}/` no longer exists
- User was shown task details before confirming
- User explicitly confirmed deletion
- Task was in `backlog` status before deletion
- Next steps shown to user
</success_criteria>

<example>
User: `/festina-delete 005`

```
Task details:
- ID: 005
- Title: Fix typo in README
- Status: backlog
- Description: There's a typo in the installation section...

⚠️  Deletion is permanent.

Are you sure you want to permanently delete task 005: Fix typo in README?
> Yes, delete

Task folder deleted: .festinalente/tasks/005/

Task 005 deleted successfully.

[FESTINA_COMPLETE]
```
</example>

<example>
User: `/festina-delete 003`

```
Error: Cannot delete task in in-progress status.
Only tasks in Backlog status can be deleted.
Tasks in later stages contain work that should not be discarded.
```
</example>

<example>
User: `/festina-delete`

```
No task ID provided. Eligible tasks:

Which task would you like to delete?
> 005: Fix typo in README (Status: backlog)

Task details:
- ID: 005
- Title: Fix typo in README
...
```
</example>

<next_steps>
```
/festina-overview
/festina-create
```
</next_steps>
