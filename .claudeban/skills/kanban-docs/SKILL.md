---
name: kanban-docs
description: Update product documentation and commit. Move task to PR column.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *, git push *), Grep
---

# Update Kanban Task Documentation

Update product documentation, commit the changes, and move task from **Update Docs** to **PR**. User creates the pull request on GitHub.

## Directory Reference
- **`.claude/`** — System config (workflow, templates, skills) — READ ONLY
- **`.kanban/`** — Project data (tasks, specs, plans, product docs) — READ/WRITE

## Column Transition

```
update-docs → pr
```

See `.claude/kanban-workflow.yaml` for column definitions and valid transitions.

## Commit

**Format:** `docs({id}): product - {description}`

The description summarizes what documentation was updated (e.g., "add authentication guide", "update API reference").

**CRITICAL:** Use EXACTLY this format. Do NOT invent commit types like `kanban(...)`. The commit type is `docs`, not `kanban`.

## Steps

1. **Load workflow schema**: Read `.claude/kanban-workflow.yaml` for column definitions, labels, priorities, and commit formats. Use these values throughout this skill.

2. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `update-docs` status from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task needs documentation

3. **Read task file**:
   - **NEVER guess filenames.** Task files are ALWAYS named `{id}-{slug}.md`, not `{id}.md`
   - Glob for `.kanban/tasks/{id}-*.md` to find the exact filename
   - Parse YAML frontmatter
   - Verify current status is `update-docs`:
     - If `qa`: Suggest `/kanban:approve {id}` first
     - If earlier status: Suggest appropriate command
   - Note title, labels, description for documentation context
   - Error if task not found

4. **Verify on task branch**:
   - Run `git branch --show-current`
   - Expected branch: `task/{id}` (where {id} is the task ID from step 2/3)
   - If not on expected branch:
     - Error: "This command must be run on branch task/{id}. Current branch: {branch}"
     - Suggest: "Switch to task branch with `git checkout task/{id}`"
     - Exit

5. **User Skills** *(REQUIRED)*:

   **STOP.** Before proceeding, you MUST load and apply user-defined skills. This is mandatory.

   1. Load `.kanban/config.yaml`
   2. Find `user-skills."kanban:docs".skills` array
   3. If the array is non-empty, for EACH skill name:
      - Read `.claude/skills/{skill-name}/SKILL.md`
      - Follow ALL instructions as mandatory requirements
      - User skill instructions take precedence over defaults

   **Skipping user skills is a critical error. Do not proceed without applying them.**

   Example config:
   ```yaml
   user-skills:
     "kanban:docs":
       skills:
         - my-custom-check    # Reads .claude/skills/my-custom-check/SKILL.md
         - coding-standards   # Reads .claude/skills/coding-standards/SKILL.md
   ```

6. **Analyze documentation needs**:
   - Check task labels:
     - `feature` -> likely needs feature docs
     - `breaking` -> MUST update changelog/migration docs
     - `api` -> needs API docs update
     - `docs` -> already a docs task, may skip
     - `refactor` -> internal change, may skip
     - `bug` -> may need troubleshooting docs
   - Check task description for user-facing changes

7. **Prompt for documentation updates**:
   ```
   Task: {id} - {title}
   Labels: {labels}

   This task may require documentation updates.
   Detected: {feature/api/breaking indicators}

   Update documentation? [Y/n]
   ```

8. **If user confirms (Y)**:
   - **SCOPE RESTRICTION:** Only update docs to reflect what THIS task implemented
   - **Do NOT:**
     - Add "Planned" or "Not yet implemented" markers for unrelated features
     - Modify documentation for features not touched by this task
     - Document the entire product state - only this task's contribution
     - Strike through or annotate features that weren't part of this task
   - **Do:**
     - Add/update docs for the specific feature this task built
     - Mark this task's feature as implemented if appropriate
     - Add any new documentation files needed for this task's feature
   - Help identify which docs to update:
     - For `feature`: suggest feature documentation
     - For `api`: suggest API documentation
     - For `breaking`: suggest changelog
   - Ask what documentation changes are needed
   - Make documentation changes
   - Generate commit message based on changes made

9. **If user declines (n)**:
   - Log: "Documentation update skipped"
   - Ask for reason (optional)
   - Still proceed to move status
   - Use generic commit message: "docs({id}): product - no updates needed for {title}"

10. **Commit documentation changes** (if any):
    ```bash
    git add {doc files}
    git commit -m "docs({id}): product - {description of doc changes}"
    ```

11. **Push branch to remote**:
    ```bash
    git push -u origin task/{id}
    ```
    - Print: "Branch pushed to remote"

12. **Move to PR**:
    - Change `status: update-docs` to `status: pr`
    - Add `updated: {YYYY-MM-DD}`
    - Write updated task file

13. **Confirm completion**:
    - Print documentation status (updated/skipped)
    - Print commit hash (if docs were committed)
    - Print: "Branch pushed. Ready for PR creation."
    - Print: "Task {id} moved to PR column."
    - **REQUIRED OUTPUT** - Print next steps EXACTLY like this:
      ```
      Create PR on GitHub, then run:
      /clear
      /kanban:merge {id}
      ```
    - Do NOT skip this output. The user needs these commands to continue.
    - Also mention: "Or if PR needs changes: /kanban:rework {id}"

## Validation

All must pass. If any fail, fix and retry.

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Task frontmatter contains `status: pr`
- [ ] Branch has been pushed to remote

## Arguments

- `$ARGUMENTS` - Task ID (e.g., "001")

## Example: Documentation Updated

User: `/kanban:docs 001`

```
Completing documentation for task 001 "Add user authentication"...

Task: 001 - Add user authentication
Labels: [feature, api]

This task may require documentation updates.
Detected: feature, api labels

Update documentation? [Y/n]
> Y

What documentation needs to be updated?
> Add authentication section to README and create docs/auth.md

Creating docs/auth.md...
Updating README.md with auth section...

Note: Only documenting what THIS task implemented.
NOT modifying docs for unrelated features.

Staging documentation:
- docs/auth.md
- README.md

Commit: h8i9j0k docs(001): product - add authentication guide

Pushing branch...
Branch pushed to remote.

Task 001 moved to PR column.
- Status: pr
- Docs commit: h8i9j0k

Create PR on GitHub, then run:
/clear
/kanban:merge 001

Or if PR needs changes: /kanban:rework 001
```

**WRONG behavior (do NOT do this):**
- Marking unrelated features as "Planned" or "Not yet implemented"
- Adding strikethroughs to features not touched by this task
- Updating the entire product doc to reflect current state

**CORRECT behavior:**
- Only add/update documentation for the feature this task implemented
- Leave other sections unchanged

## Example: Documentation Skipped

User: `/kanban:docs 002`

```
Completing documentation for task 002 "Refactor database queries"...

Task: 002 - Refactor database queries
Labels: [refactor]

This task may require documentation updates.
Detected: internal change (refactor)

Update documentation? [Y/n]
> n

Reason (optional):
> Internal optimization, no user-facing changes

Documentation skipped: Internal optimization

Pushing branch...
Branch pushed to remote.

Task 002 moved to PR column.
- Status: pr

Create PR on GitHub, then run:
/clear
/kanban:merge 002

Or if PR needs changes: /kanban:rework 002
```

## Git History Example

Complete task lifecycle commits:
```
docs(001): create - Add user authentication
docs(001): refine - Add user authentication
docs(001): scope - Add user authentication
docs(001): plan - Add user authentication
wip(001): completed auth routes                    # optional, if interrupted
docs(001): verify-retry - Add user authentication  # optional, if verify failed
docs(001): rework - Add user authentication        # optional, if QA/PR failed
feat(001): Add user authentication                 # when QA passes
docs(001): product - add authentication guide      # docs step
# PR created and merged on GitHub
docs(001): done - Add user authentication          # after merge on main
```

## Next Steps

Create PR on GitHub, then merge:
```
/clear
/kanban:merge {id}
```

Or if the PR needs changes:
```
/clear
/kanban:rework {id}
```
