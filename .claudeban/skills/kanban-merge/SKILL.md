---
name: kanban-merge
description: Merge PR, delete task branch, switch to main, and complete the task.
allowed-tools: Read, Write, Bash(ls *, git *, gh pr *)
---

# Merge Task PR

Merge the pull request, clean up the task branch, and move task to **Done**.

## Directory Reference
- **`.claude/`** — System config (workflow, templates, skills) — READ ONLY
- **`.kanban/`** — Project data (tasks, specs, plans, product docs) — READ/WRITE

## Column Transition

```
pr → done
```

See `.claude/kanban-workflow.yaml` for column definitions and valid transitions.

## Commit

**Format:** `docs({id}): done - {title}`

**CRITICAL:** Use EXACTLY this format. Do NOT invent commit types like `kanban(...)`. The commit type is `docs`, not `kanban`.

## Steps

1. **Load workflow schema**: Read `.claude/kanban-workflow.yaml` for column definitions and commit formats.

2. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `pr` status from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task to merge

3. **Read task file**:
   - **NEVER guess filenames.** Glob for `.kanban/tasks/{id}-*.md` to find the exact filename
   - Parse YAML frontmatter
   - Verify current status is `pr`:
     - If `update-docs`: Suggest `/kanban:docs {id}` first
     - If earlier status: Suggest appropriate command
   - Error if task not found

4. **Verify on task branch**:
   - Run `git branch --show-current`
   - Expected: `task/{id}`
   - If not on expected branch:
     - Error: "This command must be run on branch task/{id}. Current branch: {branch}"
     - Exit

5. **User Skills** *(REQUIRED)*:

   **STOP.** Before proceeding, you MUST load and apply user-defined skills. This is mandatory.

   1. Load `.kanban/config.yaml`
   2. Find `user-skills."kanban:merge".skills` array
   3. If the array is non-empty, for EACH skill name:
      - Read `.claude/skills/{skill-name}/SKILL.md`
      - Follow ALL instructions as mandatory requirements
      - User skill instructions take precedence over defaults

   **Skipping user skills is a critical error. Do not proceed without applying them.**

   Example config:
   ```yaml
   user-skills:
     "kanban:merge":
       skills:
         - my-custom-check    # Reads .claude/skills/my-custom-check/SKILL.md
         - coding-standards   # Reads .claude/skills/coding-standards/SKILL.md
   ```

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
    - Change `status: pr` to `status: done`
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
    - **REQUIRED OUTPUT** - Print next steps EXACTLY like this:
      ```
      Next:
      /clear
      /kanban:create "Your next task"
      ```
    - Do NOT skip this output. The user needs these commands to continue.

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

User: `/kanban:merge 001`

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
/kanban:create "Your next task"
```

## Next Steps

Task complete! To start a new task:
```
/clear
/kanban:create "Task title"
```
