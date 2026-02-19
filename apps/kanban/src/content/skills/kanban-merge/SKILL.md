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
{{> directory-reference}}

{{> helper-scripts show_find_task=true show_get_date_time=true}}

{{> column-transition from="pr" to="done"}}
</context>

<prohibited>
- Do not merge with a dirty working tree
- Do not force push
- Do not delete branch before merge is complete
- Do not skip the final commit marking task as done
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
    {{> branch-verify-task}}
  </step>

  <step name="load_hook_config">
    {{> hook-config command="merge"}}
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

  <step name="merge_branch">
    <command>git checkout main</command>
    <command>git merge task/{taskId} --no-ff -m "Merge branch 'task/{taskId}'"</command>
    <note>Use `--no-ff` to preserve branch history</note>
  </step>

  <step name="cleanup_branch">
    <command>git branch -d task/{taskId}</command>
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
    {{> skill-complete}}
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
