---
name: kanban-merge
description: Merge task branch to main, delete task branch, and complete the task.
allowed-tools: Read, Write, Bash(ls *, git *), AskUserQuestion
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Merge Task Branch

<purpose>
Merge the task branch into main, clean up the branch, and move task to Done.
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


<note>Column transition: pr → done</note>
<note>See `.kanban/workflow.yaml` for column definitions and valid transitions</note>
</context>

<prohibited>
- Do not merge with a dirty working tree
- Do not force push
- Do not delete branch before merge is complete
- Do not skip the final commit marking task as done
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
      <action>List tasks in `pr` status from `.kanban/tasks/`</action>
      <action>Use AskUserQuestion tool with:
        - header: "Task"
        - question: "Which task would you like to merge?"
        - options: Build from task list (up to 4 tasks in pr status), each with:
          - label: "{taskId}: {short title}" (truncate title if needed)
          - description: "Status: pr | Ready to merge"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a task ID directly</note>
    </branch>
  </step>

  <step name="read_task_file" outputs="taskPath, title">
    <command>node .kanban/scripts/find-task.cjs {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse XML</action>
    <validate>Verify current status is `pr`</validate>
    <branch condition="status is update-docs">
      <output>Suggest `/kanban-docs {taskId}` first</output>
      <action>Exit</action>
    </branch>
    <branch condition="status is earlier">
      <output>Suggest appropriate command</output>
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

  <step name="load_directives">
    <step name="load_directives">
      <command>node .kanban/scripts/get-skill-config.cjs kanban-merge</command>
      <action>Parse the JSON output</action>
    
      <branch condition="directives.length > 0">
        <warning>Directives are MANDATORY. You MUST follow them.</warning>
        <action>For EACH directive where `exists` is `true`:</action>
        <action>Read the directive XML file at `path`</action>
        <action>Parse and apply:</action>
        <action>- `<context>` principles: Maintain as ongoing mindset</action>
        <action>- `<process>` rules where phase="merge": Follow as requirements</action>
        <note>`<validation>` checks will run in directive_compliance step</note>
        <note>`<examples>` will be shown if violations are found</note>
      </branch>
    </step>
    
    <example_code lang="json">
    {
      "skill": "kanban-merge",
      "directives": [
        { "name": "architecture", "path": ".kanban/directives/architecture.xml", "exists": true }
      ]
    }
    </example_code>
  </step>

  <step name="verify_ready_to_merge" outputs="commitsToMerge">
    <command>git status</command>
    <validate>Ensure working tree is clean</validate>
    <command>git log main..HEAD --oneline</command>
    <output>Show commits to be merged</output>
    <branch condition="working tree is dirty">
      <output>Error: "Please commit or stash changes first"</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="prompt_merge_confirmation">
    <output>Task: {taskId} - {title}</output>
    <output>Branch: task/{taskId}</output>
    <output>Commits to merge: {list from step verify_ready_to_merge}</output>
    <action>Use AskUserQuestion tool with:
      - header: "Merge?"
      - question: "Ready to merge this branch into main?"
      - options:
        - label: "Yes", description: "Merge branch task/{taskId} into main"
        - label: "No", description: "Cancel merge operation"
      - multiSelect: false
    </action>
    <branch condition="user selects No">
      <action>Exit</action>
    </branch>
  </step>

  <step name="move_to_done_and_commit">
    <note>Format: `docs({taskId}): done - {title}`</note>
    <action>Change `status: pr` to `status: done`</action>
    <action>Add `updated: {YYYY-MM-DD}`</action>
    <action>Add `completed: {YYYY-MM-DD}`</action>
    <action>Write updated task file</action>
    <command>git add .kanban/tasks/{taskId}/task.xml</command>
    <command>git commit -m "docs({taskId}): done - {title}"</command>
  </step>

  <step name="merge_branch">
    <command>git checkout main</command>
    <command>git merge task/{taskId} --no-ff -m "Merge branch 'task/{taskId}'"</command>
    <note>Use `--no-ff` to preserve branch history</note>
  </step>

  <step name="cleanup_branch">
    <command>git branch -d task/{taskId}</command>
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
    <output>Print: "Branch merged successfully!"</output>
    <output>Print: "Branch task/{taskId} deleted"</output>
    <output>Print: "Task {taskId} completed!"</output>
    <output>Print current branch (should be main)</output>
    <output>Print: "Congratulations! Task complete."</output>
    <output>
**Ready for next task:**
```
/clear
/kanban-status
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
- Task XML has `status="done"`
- Task XML has `completed` attribute with date
- Current branch is `main`
- Branch `task/{taskId}` no longer exists locally
- Next steps shown to user
</success_criteria>

<example>
User: `/kanban-merge 001`

```
Merging task 001 "Add user authentication"...

Task: 001 - Add user authentication
Branch: task/001
Commits to merge:
  abc1234 Add login form
  def5678 Add authentication service

[User selects "Yes" to proceed with merge]

Merging branch into main...
Branch merged successfully!

Deleting branch task/001...
Branch task/001 deleted.

Task 001 completed!
- Status: done
- Completed: 2025-01-15
- Current branch: main

Congratulations! Task complete.

Next:
/clear
/kanban-create "Your next task"
```
</example>

<next_steps>
Task complete! To start a new task:
```
/clear
/kanban-create "Task title"
```
</next_steps>
