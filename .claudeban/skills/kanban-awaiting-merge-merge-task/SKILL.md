---
name: kanban-awaiting-merge-merge-task
description: Merge PR, delete task branch, switch to main, and complete the task.
allowed-tools: Read, Write, Bash(ls *, git *, gh pr *)
---

# Merge Task PR

Merge the pull request, clean up the task branch, and move task to **Done**.

## Column Transition

```
awaiting-merge → done
```

See `.claudeban/kanban-workflow.yaml` for column definitions and valid transitions.

## Steps

1. **Load workflow schema**: Read `.claudeban/kanban-workflow.yaml` for column definitions and commit formats.

2. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `awaiting-merge` status from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task to merge

3. **Read task file**:
   - Find file matching `.kanban/tasks/{id}-*.md`
   - Parse YAML frontmatter
   - Verify current status is `awaiting-merge`:
     - If `update-docs`: Suggest `/kanban:update-docs-complete-task {id}` first
     - If earlier status: Suggest appropriate command
   - Error if task not found

4. **Verify on task branch**:
   - Run `git branch --show-current`
   - Expected: `task/{id}`
   - If not on expected branch:
     - Error: "This command must be run on branch task/{id}. Current branch: {branch}"
     - Exit

5. **Check for command skills**:
   - Load `.kanban/config.yaml`
   - Find `commands."kanban:awaiting-merge-merge-task".skills` array
   - If skills array is non-empty:
     - Read each skill file at the listed paths
     - Follow their instructions as mandatory guidance

6. **Verify PR exists and is ready**:
   - Run `gh pr view --json state,mergeable`
   - If no PR exists: Error "No PR found for branch task/{id}"
   - If PR is not mergeable: Show status and blockers, exit

7. **Prompt for merge confirmation**:
   ```
   Task: {id} - {title}
   PR: {pr url}

   Ready to merge this PR? [Y/n]
   ```
   - If user declines, exit

8. **Merge the PR**:
   ```bash
   gh pr merge --merge
   ```
   - Use `--merge` (regular merge, preserves history)

9. **Switch to main and clean up**:
   ```bash
   git checkout main
   git pull
   git branch -d task/{id}
   ```

10. **Move to Done**:
    - Change `status: awaiting-merge` to `status: done`
    - Add `updated: {YYYY-MM-DD}`
    - Add `completed: {YYYY-MM-DD}`
    - Write updated task file
    - Commit task file update:
      ```bash
      git add .kanban/tasks/{id}-*.md
      git commit -m "docs({id}): done - {title}"
      ```

11. **Confirm completion**:
    - Print: "PR merged successfully!"
    - Print: "Branch task/{id} deleted"
    - Print: "Task {id} completed!"
    - Print current branch (should be main)
    - Print: "Congratulations! Task complete."
    - Print recommended next steps in this format:
      ```
      Next:
      /clear
      /kanban:define-task "Your next task"
      ```

## Validation

All must pass:

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Task frontmatter contains `status: done`
- [ ] Task frontmatter contains `completed:` date
- [ ] Current branch is `main`
- [ ] Branch `task/{id}` no longer exists locally

## Arguments

- `$ARGUMENTS` - Task ID (e.g., "001")

## Example

User: `/kanban:awaiting-merge-merge-task 001`

```
Merging task 001 "Add user authentication"...

Task: 001 - Add user authentication
PR: https://github.com/user/repo/pull/42

Ready to merge this PR? [Y/n]
> Y

Merging PR...
PR merged successfully!

Switching to main...
Deleting branch task/001...
Branch task/001 deleted.

Task 001 completed!
- Status: done
- Completed: 2025-01-15
- Current branch: main

Congratulations! Task complete.

Next:
/clear
/kanban:define-task "Your next task"
```

## Next Steps

Task complete! To start a new task:
```
/clear
/kanban:define-task "Task title"
```
