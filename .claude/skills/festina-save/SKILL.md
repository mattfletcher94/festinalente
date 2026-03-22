---
name: festina-save
description: Save partial implementation progress. Use when implementation is interrupted and you need to save work.
allowed-tools: Read, Write, Edit, Bash(node *, git add *, git commit *, git status, git diff *, git branch *)
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Save Festina Lente Task

<purpose>
Save partial implementation progress when interrupted. Task stays in In Progress. Saves current progress and ensures plan checkboxes are up to date.
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













<note>Use these scripts to work with product documentation:</note>


<command description="Search product docs by keywords (returns JSON sorted by relevance)">node .festinalente/scripts/festinalente.cjs search-product keyword1 keyword2 ...</command>
<command description="With minimum score threshold">node .festinalente/scripts/festinalente.cjs search-product password reset --min-score=0.3</command>
<note>Score interpretation: ≥0.5 = strong match | 0.3-0.5 = possible match | &lt;0.3 = weak match | No results = likely new feature</note>


<note>Path rule: ID `auth/login` → Path `.festinalente/product/auth/login.md`</note>

<note>Use these scripts to work with engineering documentation:</note>


<command description="Search engineering docs by keywords (returns JSON sorted by relevance)">node .festinalente/scripts/festinalente.cjs search-engineering keyword1 keyword2 ...</command>
<command description="With minimum score threshold">node .festinalente/scripts/festinalente.cjs search-engineering middleware pattern --min-score=0.3</command>
<note>Score interpretation: ≥0.5 = strong match | 0.3-0.5 = possible match | &lt;0.3 = weak match | No results = likely new pattern/system</note>


<note>Path rules:
- `overview` → `.festinalente/engineering/overview.md`
- `systems/auth` → `.festinalente/engineering/systems/auth/_index.md`
- `systems/auth/validator` → `.festinalente/engineering/systems/auth/validator.md`
- `patterns/acyclic-arch` → `.festinalente/engineering/patterns/acyclic-arch.md`
- `conventions/file-naming` → `.festinalente/engineering/conventions/file-naming.md`
</note>

<note>Column transition: in-progress → in-progress (no change)</note>
<note>See `.festinalente/workflow.yaml` for column definitions and valid transitions</note>
</context>

<prohibited>
- Do not save WIP for tasks not in `in-progress` status
- Do not skip updating plan checkboxes to reflect actual progress
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
      <action>List tasks in `in-progress` status from `.festinalente/tasks/`</action>
      <action>Use AskUserQuestion tool with:
        - header: "Task"
        - question: "Which task would you like to save WIP for?"
        - options: Build from task list (up to 4 tasks in in-progress status), each with:
          - label: "{taskId}: {short title}" (truncate title if needed)
          - description: "Status: in-progress | Has unsaved work"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a task ID directly</note>
    </branch>
  </step>

  <step name="read_task_file" outputs="taskPath, title">
    <command>node .festinalente/scripts/festinalente.cjs find-task {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse XML</action>
    <validate>Verify current status is `in-progress`</validate>
    <branch condition="status is not in-progress">
      <output>Task is not in progress. WIP save only works for tasks being implemented.</output>
      <action>Exit</action>
    </branch>
    <branch condition="task not found">
      <output>Error: Task not found</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="read_plan_file" outputs="planPath, planContent">
    <action>Check for `.festinalente/tasks/{taskId}/plan.xml`</action>
    <branch condition="plan found">
      <action>Read plan content</action>
    </branch>
    <branch condition="plan NOT found">
      <output>Warning: No plan found for task {taskId}</output>
      <note>Still proceed with WIP save</note>
    </branch>
  </step>

  <step name="load_directives">
    <command>node .festinalente/scripts/festinalente.cjs get-skill-config festina-save</command>
    <action>Parse the JSON output</action>
    
    <branch condition="directives.length > 0">
      <warning>Directives are MANDATORY. You MUST follow them.</warning>
      <action>For EACH directive where `exists` is `true`:</action>
      <action>Read the directive XML file at `path`</action>
      <action>Parse and apply:</action>
      <action>- `<context>` principles: Maintain as ongoing mindset</action>
      <action>- `<process>` rules where phase contains "save" (phase may be comma-separated, e.g. phase="plan,implement" applies to both): Follow as requirements</action>
      <action>- `<override>` sections where phase="save": Apply step replacements</action>
      <action>- `<verification>` commands: Note for use in task `<verify>` elements</action>
    
      <branch condition="directive has <override> section for phase=save">
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
      "skill": "festina-save",
      "directives": [
        { "name": "architecture", "path": ".festinalente/directives/architecture.xml", "exists": true }
      ]
    }
    </example_code>
  </step>

  <step name="verify_plan_checkboxes">
    <branch condition="plan exists">
      <action>Parse all checkboxes in the plan</action>
      <action>For each implementation step, verify if the work was actually done</action>
      <action>Update any checkboxes that should be checked but aren't</action>
      <output>Report any discrepancies found</output>
    </branch>
  </step>

  <step name="generate_progress_summary" outputs="progressSummary">
    <action>Count completed vs total checkboxes</action>
    <action>Identify which steps were completed</action>
    <action>Create a brief summary (e.g., "completed auth routes and middleware")</action>
  </step>

  <step name="add_wip_notes_to_plan" when="plan exists">
    <action>Add or update `## WIP Notes` section</action>
    <note>Follow template at `.festinalente/templates/plan.xml`</note>
    <example_code lang="markdown">
## WIP Notes

**Last WIP:** {YYYY-MM-DD}
**Progress:** {completed}/{total} steps

**Continuation hints:**
- Next step: {description of next unchecked item}
- Context: {any relevant context for resuming}
    </example_code>
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

    <output>Print progress: "{completed}/{total} plan items complete"</output>
    <output>Print continuation hint from WIP Notes if present</output>
    <output>
**To resume implementation:**
```
/clear
/festina-implement {taskId}
```
    </output>
    <output>[FESTINA_COMPLETE]</output>
  </step>
</process>

<success_criteria>
- Task file exists at `.festinalente/tasks/{taskId}/task.xml`
- Task XML has `status="in-progress"`
- Plan file updated with completed task progress (if applicable)
- Directive compliance checks passed (if directives exist)
- Next steps shown to user
</success_criteria>

<example>
**WIP Save Mid-Implementation:**

User: `/festina-save 001`

```
Saving WIP for task 001 "Add user authentication"...

Reading plan: .festinalente/tasks/001/plan.xml
Progress: 2/5 items complete

Verifying checkboxes match actual progress...
- [x] Create auth routes file - verified
- [x] Add login endpoint - verified
- [ ] Add logout endpoint - not started
- [ ] Add password reset - not started
- [ ] Write tests - not started

Adding WIP notes to plan...

Staging files:
- src/routes/auth.ts
- src/middleware/jwt.ts
- .festinalente/tasks/001/plan.xml

WIP saved!
- Progress: 2/5 items
- Next step: Add logout endpoint

Resume with: /festina-implement 001
```

**No Changes to Save:**

User: `/festina-save 002`

```
Saving WIP for task 002 "Setup database"...

Reading plan: .festinalente/tasks/002/plan.md
Progress: 3/5 items complete

Checking for changes...
No changes found.

Plan checkboxes are up to date.
Nothing to save.

Resume with: /festina-implement 002
```
</example>

<next_steps>
To resume implementation:
```
/clear
/festina-implement {id}
```
</next_steps>
