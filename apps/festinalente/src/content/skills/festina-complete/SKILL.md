---
name: festina-complete
description: Complete a task by moving it from Awaiting Completion to Done. Provides directive hook point for custom completion workflows.
allowed-tools: Read, Write, Bash(ls *, node *, git *)
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Complete Festina Lente Task

<purpose>
Move a task from awaiting-completion to done. Lightweight by default, extensible via directives. Without directives, this skill simply marks the task as done. Directives (like github.xml) can add merge logic or other completion workflows via their complete phase rules.
</purpose>

<context>
{{> directory-reference}}

{{> helper-scripts show_find_task=true show_find_plan=true show_get_date_time=true show_get_skill_config=true}}

{{> column-transition from="awaiting-completion" to="done"}}
</context>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
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
    {{> load-directives skill="complete"}}
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

  {{> directive-compliance}}

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
    {{> skill-complete}}
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
