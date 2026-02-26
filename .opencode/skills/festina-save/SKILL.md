---
name: festina-save
description: Save partial implementation progress with WIP commit. Use when implementation is interrupted and you need to save work.
tools:
  read: true
  write: true
  edit: true
  bash(ls *: true
  git add *: true
  git commit *: true
  git status: true
  git diff *: true
  git branch *): true
  question: true
argument-hint: "[task-id]"
disable-model-invocation: true
---

# WIP Commit Festina Lente Task

<purpose>
Save partial implementation progress when interrupted. Task stays in In Progress. Commits current code changes and ensures plan checkboxes are up to date.
</purpose>

<context>
<note>Use these scripts to reliably find files:</note>

<command description="Find task by ID (returns JSON with path and metadata)">node .festinalente/scripts/find-task.cjs {id}</command>


<command description="Find plan by ID (returns JSON with path)">node .festinalente/scripts/find-plan.cjs {id}</command>







<note>Column transition: in-progress → in-progress (no change)</note>
<note>See `.festinalente/workflow.yaml` for column definitions and valid transitions</note>
</context>

<prohibited>
- Do not save WIP for tasks not in `in-progress` status
- Do not skip updating plan checkboxes to reflect actual progress
</prohibited>

<process>
  <step name="load_workflow">
    <action>Read `.festinalente/workflow.yaml` for column definitions, labels, priorities, and commit formats</action>
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
          - description: "Status: in-progress | Has uncommitted work"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a task ID directly</note>
    </branch>
  </step>

  <step name="read_task_file" outputs="taskPath, title">
    <command>node .festinalente/scripts/find-task.cjs {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse XML</action>
    <validate>Verify current status is `in-progress`</validate>
    <branch condition="status is not in-progress">
      <output>Task is not in progress. WIP commit only works for tasks being implemented.</output>
      <action>Exit</action>
    </branch>
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

  <step name="read_plan_file" outputs="planPath, planContent">
    <action>Check for `.festinalente/tasks/{taskId}/plan.xml`</action>
    <branch condition="plan found">
      <action>Read plan content</action>
    </branch>
    <branch condition="plan NOT found">
      <output>Warning: No plan found for task {taskId}</output>
      <note>Still proceed with WIP commit (code can still be committed)</note>
    </branch>
  </step>

  <step name="load_directives">
    <command>node .festinalente/scripts/get-skill-config.cjs festina-save</command>
    <action>Parse the JSON output</action>
    
    <branch condition="directives.length > 0">
      <warning>Directives are MANDATORY. You MUST follow them.</warning>
      <action>For EACH directive where `exists` is `true`:</action>
      <action>Read the directive XML file at `path`</action>
      <action>Parse and apply:</action>
      <action>- `<context>` principles: Maintain as ongoing mindset</action>
      <action>- `<process>` rules where phase="save": Follow as requirements</action>
      <action>- `<verification>` commands: Note for use in task `<verify>` elements</action>
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

  <step name="check_uncommitted_changes" outputs="changedFiles">
    <command>git status</command>
    <command>git diff --name-only</command>
    <branch condition="no changes found">
      <output>Warning: No uncommitted changes to commit</output>
      <action>Still update plan if checkboxes changed</action>
      <branch condition="nothing to commit">
        <action>Exit early</action>
      </branch>
    </branch>
  </step>

  <step name="stage_and_commit">
    <note>Format: `wip({taskId}): {progress summary}`</note>
    <action>Stage all relevant files (code + plan)</action>
    <command>git add {changed files}</command>
    <command>git add .festinalente/tasks/{taskId}/plan.xml</command>
    <command>git commit -m "wip({taskId}): {progress summary}"</command>
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
    <output>Print commit hash</output>
    <output>Print progress: "{completed}/{total} plan items complete"</output>
    <output>Print continuation hint from WIP Notes if present</output>
    <output>
**To resume implementation:**
```
/clear
/festina-implement {taskId}
```
    </output>
    ## Final Validation
    
    Before completing, validate all task XML:
    
    <command description="Validate XML in task files">node .festinalente/scripts/validate-xml.cjs {taskId}</command>
    
    If validation fails, fix the reported errors before completing.
    
    <output>[KANBAN_COMPLETE]</output>
  </step>
</process>

<success_criteria>
- Task file exists at `.festinalente/tasks/{taskId}/task.xml`
- Task XML has `status="in-progress"`
- If changes existed: git log shows `wip({taskId}):`
- Next steps shown to user
</success_criteria>

<example>
**WIP Commit Mid-Implementation:**

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

Commit: d4e5f6g wip(001): completed auth routes and login endpoint

WIP saved!
- Progress: 2/5 items
- Next step: Add logout endpoint

Resume with: /festina-implement 001
```

**No Changes to Commit:**

User: `/festina-save 002`

```
Saving WIP for task 002 "Setup database"...

Reading plan: .festinalente/tasks/002/plan.md
Progress: 3/5 items complete

Checking for uncommitted changes...
No uncommitted changes found.

Plan checkboxes are up to date.
Nothing to commit.

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
