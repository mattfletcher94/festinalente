---
name: festina-delete
description: Delete a task from the festina board. Only works for tasks in Backlog status.
allowed-tools: Read, Bash(node *, git add *, git commit *, git status, git branch *, git rm *), AskUserQuestion
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Delete Festina Lente Task

<purpose>
Permanently delete a task from the festina board. Only tasks in Backlog status can be deleted.
</purpose>

<context>
{{> directory-reference}}

{{> helper-scripts show_find_task=true show_list_tasks=true}}

{{> column-transition from="backlog" to="[Deleted]"}}
</context>

<prohibited>
- Do not delete tasks in scoped, planned, in-progress, or later statuses
- Do not delete without user confirmation
- Do not skip the commit step
- Do not run from a task branch (must be on main)
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="verify_branch">
    {{> branch-verify-main reason="to ensure task branches are not affected"}}
  </step>

  <step name="get_task_id" outputs="taskId">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as taskId</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <command>node .festinalente/scripts/list-tasks.cjs --status=backlog</command>
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
    <command>node .festinalente/scripts/find-task.cjs {taskId}</command>
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
    <command>node .festinalente/scripts/delete-task.cjs {taskId}</command>
    <branch condition="error in output">
      <output>Error: {error message from script}</output>
      <action>Exit</action>
    </branch>
    <output>Task folder deleted: .festinalente/tasks/{taskId}/</output>
  </step>

  <step name="commit">
    <note>Format from workflow.yaml: `docs({id}): delete - {title}`</note>
    <command>git add -A .festinalente/tasks/{taskId}/</command>
    <command>git commit -m "docs({taskId}): delete - {title}"</command>
    <action>Capture commit hash</action>
  </step>

  <step name="output_result">
    <output>Task {taskId} deleted successfully.</output>
    <output>Commit: {commit hash}</output>
    {{> skill-complete}}
  </step>
</process>

<success_criteria>
- Task folder `.festinalente/tasks/{taskId}/` no longer exists
- Git log shows `docs({taskId}): delete - {title}`
- User was shown task details before confirming
- User explicitly confirmed deletion
</success_criteria>

<example>
User: `/festina-delete 005`

```
Verifying branch... main ✓

Task details:
- ID: 005
- Title: Fix typo in README
- Status: backlog
- Description: There's a typo in the installation section...

⚠️  Deletion is permanent.

Are you sure you want to permanently delete task 005: Fix typo in README?
> Yes, delete

Task folder deleted: .festinalente/tasks/005/
Commit: a1b2c3d docs(005): delete - Fix typo in README

Task 005 deleted successfully.

[KANBAN_COMPLETE]
```
</example>

<example>
User: `/festina-delete 003`

```
Verifying branch... main ✓

Error: Cannot delete task in in-progress status.
Only tasks in Backlog status can be deleted.
Tasks in later stages contain work that should not be discarded.
```
</example>

<example>
User: `/festina-delete`

```
Verifying branch... main ✓

No task ID provided. Eligible tasks:

Which task would you like to delete?
> 005: Fix typo in README (Status: backlog)

Task details:
- ID: 005
- Title: Fix typo in README
...
```
</example>
