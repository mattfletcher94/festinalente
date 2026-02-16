---
name: kanban-save
description: Save partial implementation progress with WIP commit. Use when implementation is interrupted and you need to save work.
allowed-tools: Read, Write, Edit, Bash(ls *, git add *, git commit *, git status, git diff *, git branch *)
argument-hint: "[task-id]"
disable-model-invocation: true
---

# WIP Commit Kanban Task

<purpose>
Save partial implementation progress when interrupted. Task stays in In Progress. Commits current code changes and ensures plan checkboxes are up to date.
</purpose>

<context>
{{> helper-scripts show_find_task=true show_find_plan=true}}

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
      <action>List tasks in `in-progress` status from `.kanban/tasks/`</action>
      <output>Show task IDs and titles</output>
      <prompt>Which task to commit WIP for?</prompt>
    </branch>
  </step>

  <step name="read_task_file" outputs="taskPath, title">
    <command>node .kanban/scripts/find-task.cjs {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse YAML frontmatter</action>
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
    {{> branch-verify-task}}
  </step>

  <step name="read_plan_file" outputs="planPath, planContent">
    <action>Check for `.kanban/tasks/{taskId}/plan.md`</action>
    <branch condition="plan found">
      <action>Read plan content</action>
    </branch>
    <branch condition="plan NOT found">
      <output>Warning: No plan found for task {taskId}</output>
      <note>Still proceed with WIP commit (code can still be committed)</note>
    </branch>
  </step>

  <step name="load_hook_config">
    {{> hook-config command="save"}}
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
    <note>Follow template at `.kanban/templates/plan.md`</note>
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
    <command>git add .kanban/tasks/{taskId}/plan.md</command>
    <command>git commit -m "wip({taskId}): {progress summary}"</command>
  </step>

  <step name="output_result">
    <output>Print commit hash</output>
    <output>Print progress: "{completed}/{total} plan items complete"</output>
    <output>Print continuation hint from WIP Notes if present</output>
    <output>
**To resume implementation:**
```
/clear
/kanban-implement {taskId}
```
    </output>
  </step>
</process>

<success_criteria>
- Task file exists at `.kanban/tasks/{taskId}/task.md`
- Task frontmatter contains `status: in-progress`
- If changes existed: git log shows `wip({taskId}):`
- Next steps shown to user
</success_criteria>

<example>
**WIP Commit Mid-Implementation:**

User: `/kanban-save 001`

```
Saving WIP for task 001 "Add user authentication"...

Reading plan: .kanban/tasks/001/plan.md
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
- .kanban/tasks/001/plan.md

Commit: d4e5f6g wip(001): completed auth routes and login endpoint

WIP saved!
- Progress: 2/5 items
- Next step: Add logout endpoint

Resume with: /kanban-implement 001
```

**No Changes to Commit:**

User: `/kanban-save 002`

```
Saving WIP for task 002 "Setup database"...

Reading plan: .kanban/tasks/002/plan.md
Progress: 3/5 items complete

Checking for uncommitted changes...
No uncommitted changes found.

Plan checkboxes are up to date.
Nothing to commit.

Resume with: /kanban-implement 002
```
</example>

<next_steps>
To resume implementation:
```
/clear
/kanban-implement {id}
```
</next_steps>
