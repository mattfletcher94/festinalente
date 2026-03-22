---
name: festina-complete
description: Complete a task by moving it from Awaiting Completion to Done. Provides directive hook point for custom completion workflows.
allowed-tools: Read, Write, Bash(node *, git *)
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Complete Festina Lente Task

<purpose>
Move a task from awaiting-completion to done. Lightweight by default, extensible via directives. Without directives, this skill simply marks the task as done. Directives (like github.xml) can add merge logic or other completion workflows via their complete phase rules.
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


<command description="Find plan by ID (returns JSON with path)">node .festinalente/scripts/festinalente.cjs find-plan {id}</command>



<command description="Get current date/time (returns JSON with iso and date formats)">node .festinalente/scripts/festinalente.cjs get-date-time</command>

<command description="Get skill configuration (returns JSON with directives)">node .festinalente/scripts/festinalente.cjs get-skill-config {skill}</command>
<example_code lang="json">
{
  "skill": "festina-check",
  "directives": [
    { "name": "code-review", "path": ".festinalente/directives/code-review.xml", "exists": true }
  ]
}
</example_code>









<note>Column transition: awaiting-completion → done</note>
<note>See `.festinalente/workflow.yaml` for column definitions and valid transitions</note>
</context>

<prohibited>
- Do not use `Search()` or `Glob()` to find files manually
- Do not read `.festinalente/config.yaml` directly
- Do not run `ls` commands to explore directories
- Do not guess filenames or IDs — always use the helper scripts
</prohibited>

<process>
  <step name="load_workflow">
    <action>Read `.festinalente/workflow.yaml` for column definitions, labels, priorities, and transitions</action>
    <note>Use these values throughout this skill</note>
  </step>

  <step name="get_task_id" outputs="taskId">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as taskId</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <action>List tasks in `awaiting-completion` status from `.festinalente/tasks/`</action>
      <action>Use AskUserQuestion tool with:
        - header: "Task"
        - question: "Which task should be completed?"
        - options: Build from task list (up to 4 tasks in awaiting-completion status), each with:
          - label: "{taskId}: {short title}" (truncate title if needed)
          - description: "Status: awaiting-completion | Ready to complete"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a task ID directly</note>
    </branch>
  </step>

  <step name="read_task_file" outputs="taskPath, title, currentStatus">
    <command>node .festinalente/scripts/festinalente.cjs find-task {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse XML</action>
    <validate>Verify current status is `awaiting-completion`</validate>
    <branch condition="status is not awaiting-completion">
      <action>Use AskUserQuestion tool with:
        - header: "Continue?"
        - question: "Task is in {status} status. Expected: awaiting-completion. Continue with completion anyway?"
        - options:
          - label: "Yes", description: "Proceed with completion despite unexpected status"
          - label: "No", description: "Cancel and check task status first"
        - multiSelect: false
      </action>
    </branch>
    <action>Note title and status for context</action>
    <branch condition="task not found">
      <output>Error: Task not found</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="load_directives">
    <command>node .festinalente/scripts/festinalente.cjs get-skill-config festina-complete</command>
    <action>Parse the JSON output</action>
    
    <branch condition="directives.length > 0">
      <warning>Directives are MANDATORY. You MUST follow them.</warning>
      <action>For EACH directive where `exists` is `true`:</action>
      <action>Read the directive XML file at `path`</action>
      <action>Parse and apply:</action>
      <action>- `<context>` principles: Maintain as ongoing mindset</action>
      <action>- `<process>` rules where phase contains "complete" (phase may be comma-separated, e.g. phase="plan,implement" applies to both): Follow as requirements</action>
      <action>- `<override>` sections where phase="complete": Apply step replacements</action>
      <action>- `<verification>` commands: Note for use in task `<verify>` elements</action>
    
      <branch condition="directive has <override> section for phase=complete">
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
    </branch>
    
    <example_code lang="json">
    {
      "skill": "festina-complete",
      "directives": [
        { "name": "architecture", "path": ".festinalente/directives/architecture.xml", "exists": true }
      ]
    }
    </example_code>
  </step>

  <step name="complete_task">
    <command>node .festinalente/scripts/festinalente.cjs get-date-time</command>
    <action>Change `status` attribute from `awaiting-completion` to `done`</action>
    <action>Add `completed="{YYYY-MM-DD}"` attribute to the task element</action>
    <action>Update `updated="{YYYY-MM-DD}"` attribute with current date</action>
  </step>

  <step name="write_task_file">
    <action>Write updated task.xml to disk</action>
    <validate>Confirm file was written successfully</validate>
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

  <step name="validate_xml">
    <command description="Validate XML in task files">node .festinalente/scripts/festinalente.cjs validate-xml {taskId}</command>
    <branch condition="validation fails">
      <output>Warning: XML validation failed. Fix errors before completing.</output>
    </branch>
  </step>

  <step name="output_result">
    <output>
**Task {taskId} completed**

- Title: {title}
- Status: done
- Completed: {YYYY-MM-DD}

**Next:**
```
/clear
/festina-overview
```
    </output>
    <output>[FESTINA_COMPLETE]</output>
  </step>
</process>

<success_criteria>
- Task file exists at `.festinalente/tasks/{taskId}/task.xml`
- Task XML has `status="done"`
- Task XML has `completed="{YYYY-MM-DD}"` attribute with current date
- Task XML has `updated="{YYYY-MM-DD}"` attribute with current date
- Directive compliance checks passed (if directives exist)
- Completion message shown to user with next steps
</success_criteria>

<example label="Basic task completion">
User: `/festina-complete 007`

```
Task: 007 - Add user authentication
Status: awaiting-completion

[Directives loaded: none]

Updating task status...
- status: awaiting-completion -> done
- completed: 2026-03-07
- updated: 2026-03-07

**Task 007 completed**

- Title: Add user authentication
- Status: done
- Completed: 2026-03-07

Next:
/clear
/festina-overview
```
</example>

<example label="Completion with directive hooks">
User: `/festina-complete 008`

```
Task: 008 - Add password reset flow
Status: awaiting-completion

[Directives loaded: github.xml]
[Directive rules for "complete" phase applied]

... directive-specific actions run here ...

Updating task status...
- status: awaiting-completion -> done
- completed: 2026-03-07
- updated: 2026-03-07

Directive compliance: all checks passed

**Task 008 completed**

- Title: Add password reset flow
- Status: done
- Completed: 2026-03-07

Next:
/clear
/festina-overview
```
</example>

<next_steps>
View project overview:
```
/clear
/festina-overview
```
</next_steps>
