---
name: kanban-merge
description: Merge task branch to main, delete task branch, and complete the task.
allowed-tools: Read, Write, Bash(ls *, git *)
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Merge Task Branch

<purpose>
Merge the task branch into main, clean up the branch, and move task to Done.
</purpose>

<context>
{{> directory-reference}}

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
    Use $ARGUMENTS if provided (e.g., "001"), otherwise:
    - List tasks in `pr` status from `.kanban/tasks/`
    - Show task IDs and titles
    - Ask user which task to merge
  </step>

  <step name="read_task_file" outputs="taskPath, title">
    - **NEVER guess filenames.** Glob for `.kanban/tasks/{taskId}-*.md` to find the exact filename
    - Parse YAML frontmatter
    - Verify current status is `pr`:
      - If `update-docs`: Suggest `/kanban-docs {taskId}` first
      - If earlier status: Suggest appropriate command
    - Error if task not found
  </step>

  <step name="verify_branch">
    {{> branch-verify-task}}
  </step>

  <step name="load_user_skills">
    {{> user-skills command="merge"}}
  </step>

  <step name="verify_ready_to_merge" outputs="commitsToMerge">
    - Run `git status` to ensure working tree is clean
    - Run `git log main..HEAD --oneline` to show commits to be merged
    - If working tree is dirty: Error "Please commit or stash changes first"
  </step>

  <step name="prompt_merge_confirmation">
    ```
    Task: {taskId} - {title}
    Branch: task/{taskId}
    Commits to merge: {list from step verify_ready_to_merge}

    Ready to merge this branch into main? [Y/n]
    ```
    If user declines, exit
  </step>

  <step name="merge_branch">
    ```bash
    git checkout main
    git merge task/{taskId} --no-ff -m "Merge branch 'task/{taskId}'"
    ```
    Use `--no-ff` to preserve branch history
  </step>

  <step name="cleanup_branch">
    ```bash
    git branch -d task/{taskId}
    ```
  </step>

  <step name="move_to_done_and_commit">
    Format: `docs({taskId}): done - {title}`

    - Change `status: pr` to `status: done`
    - Add `updated: {YYYY-MM-DD}`
    - Add `completed: {YYYY-MM-DD}`
    - Write updated task file
    - Commit task file update:
      ```bash
      git add .kanban/tasks/{taskId}-*.md
      git commit -m "docs({taskId}): done - {title}"
      ```
  </step>

  <step name="output_result">
    - Print: "Branch merged successfully!"
    - Print: "Branch task/{taskId} deleted"
    - Print: "Task {taskId} completed!"
    - Print current branch (should be main)
    - Print: "Congratulations! Task complete."
  </step>
</process>

<success_criteria>
- Task file exists at `.kanban/tasks/{taskId}-*.md`
- Task frontmatter contains `status: done`
- Task frontmatter contains `completed:` date
- Current branch is `main`
- Branch `task/{taskId}` no longer exists locally
- Next steps shown to user
</success_criteria>

## Example

User: `/kanban-merge 001`

```
Merging task 001 "Add user authentication"...

Task: 001 - Add user authentication
Branch: task/001
Commits to merge:
  abc1234 Add login form
  def5678 Add authentication service

Ready to merge this branch into main? [Y/n]
> Y

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

## Next Steps

Task complete! To start a new task:
```
/clear
/kanban-create "Task title"
```
