---
name: kanban-update-docs-complete-task
description: Update product documentation, commit, create PR, and move task to Awaiting Merge.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *, gh pr *), Grep
---

# Update Kanban Task Documentation

Update product documentation, commit the changes, create a pull request, and move task from **Update Docs** to **Awaiting Merge**.

## Directory Reference
- **`.claude/`** — System config (workflow, templates, skills) — READ ONLY
- **`.kanban/`** — Project data (tasks, specs, plans, product docs) — READ/WRITE

## Column Transition

```
update-docs → awaiting-merge
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
     - If `review`: Suggest `/kanban:review-pass-task {id}` first
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

5. **Check for command skills**:
   - Load `.kanban/config.yaml`
   - Find `commands."kanban:update-docs-complete-task".skills` array
   - If skills array is non-empty, for each skill path:
     - **Skill file location:** `{path}/SKILL.md`
     - Example: config lists `.kanban/skills/docs` → read `.kanban/skills/docs/SKILL.md`
     - **IMPORTANT:** The filename is always `SKILL.md`, NOT `instructions.md`
     - Read the skill file and follow its instructions as mandatory guidance

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

11. **Create Pull Request**:
    - Determine commit type from task labels (same logic as review-pass-task):
      - `bug` → `fix`, `refactor` → `refactor`, `docs` → `docs`, default → `feat`
    - Create PR:
      ```bash
      gh pr create --title "{type}({id}): {title}" --body "$(cat <<'EOF'
      ## Summary
      {Task description}

      ## Changes
      - Functional spec: `.kanban/specs/{id}-{slug}.spec.md`
      - Implementation plan: `.kanban/plans/{id}-{slug}.plan.md`
      - Code changes: {list implementation files from review-pass commit}
      - Product docs: {list doc files if updated}

      ## Acceptance Criteria
      {From task file}

      ## Task Reference
      Task: `.kanban/tasks/{id}-{slug}.md`
      EOF
      )"
      ```
    - Print PR URL

12. **Move to Awaiting Merge**:
    - Change `status: update-docs` to `status: awaiting-merge`
    - Add `updated: {YYYY-MM-DD}`
    - Write updated task file

13. **Confirm completion**:
    - Print documentation status (updated/skipped)
    - Print commit hash (if docs were committed)
    - Print PR URL
    - Print: "Task {id} ready for merge!"
    - **REQUIRED OUTPUT** - Print next steps EXACTLY like this:
      ```
      Next:
      /clear
      /kanban:awaiting-merge-merge-task {id}
      ```
    - Do NOT skip this output. The user needs these commands to continue.
    - Also mention: "Or if PR needs changes: /kanban:awaiting-merge-fail-task {id}"

## Validation

All must pass. If any fail, fix and retry.

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Task frontmatter contains `status: awaiting-merge`
- [ ] PR exists for current branch (verify with `gh pr view`)

## Arguments

- `$ARGUMENTS` - Task ID (e.g., "001")

## Example: Documentation Updated

User: `/kanban:update-docs-complete-task 001`

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

Creating Pull Request...
PR: https://github.com/user/repo/pull/42

Task 001 ready for merge!
- Status: awaiting-merge
- Docs commit: h8i9j0k
- PR: https://github.com/user/repo/pull/42

Next:
/clear
/kanban:awaiting-merge-merge-task 001

Or if PR needs changes: /kanban:awaiting-merge-fail-task 001
```

**WRONG behavior (do NOT do this):**
- Marking unrelated features as "Planned" or "Not yet implemented"
- Adding strikethroughs to features not touched by this task
- Updating the entire product doc to reflect current state

**CORRECT behavior:**
- Only add/update documentation for the feature this task implemented
- Leave other sections unchanged

## Example: Documentation Skipped

User: `/kanban:update-docs-complete-task 002`

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

Creating Pull Request...
PR: https://github.com/user/repo/pull/43

Task 002 ready for merge!
- Status: awaiting-merge
- PR: https://github.com/user/repo/pull/43

Next:
/clear
/kanban:awaiting-merge-merge-task 002

Or if PR needs changes: /kanban:awaiting-merge-fail-task 002
```

## Git History Example

Complete task lifecycle commits:
```
docs(001): define - Add user authentication
docs(001): refine - Add user authentication
docs(001): scope - Add user authentication
docs(001): plan - Add user authentication
wip(001): completed auth routes                    # optional, if interrupted
docs(001): verify-fail - Add user authentication   # optional, if verify failed
docs(001): review-fail - Add user authentication   # optional, if review failed
feat(001): Add user authentication                 # when review passes
docs(001): product - add authentication guide      # docs step
# PR created and merged
docs(001): done - Add user authentication          # after merge on main
```

## Next Steps

Merge the PR:
```
/clear
/kanban:awaiting-merge-merge-task {id}
```

Or if the PR needs changes:
```
/clear
/kanban:awaiting-merge-fail-task {id}
```
