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
{{> directory-reference}}

{{> helper-scripts show_find_task=true show_find_plan=true}}

{{> product-docs-scripts show_search_product=true}}

{{> engineering-docs-scripts show_search_engineering=true}}

{{> column-transition from="in-progress" to="in-progress (no change)"}}
</context>

<prohibited>
- Do not save WIP for tasks not in `in-progress` status
- Do not skip updating plan checkboxes to reflect actual progress
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
      <action>List tasks in `in-progress` status from `.festinalente/tasks/`</action>
      <branch condition="exactly 1 matching task found">
        <action>Auto-select the single task</action>
        <output>Auto-selected task: {taskId} "{title}" (only in-progress task).</output>
      </branch>
      <branch condition="multiple matching tasks found">
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
    {{> load-directives skill="save"}}
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

  {{> directive-compliance}}

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
    {{> skill-complete}}
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
