---
name: kanban-update-docs-complete-task
description: Update product documentation, commit, and move task to Done. Final step in the workflow.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status)
---

# Update Kanban Task Documentation

Update product documentation, commit the changes, and move task from **Update Docs** to **Done**.

## Column Transition

```
update-docs → done
```

See `.claudeban/workflow.yaml` for column definitions and valid transitions.

## Commit

Uses `commits.update-docs` format from `.claudeban/workflow.yaml`.
The description summarizes what documentation was updated (e.g., "add authentication guide", "update API reference").

## Steps

1. **Load workflow schema**: Read `.claudeban/workflow.yaml` for column definitions, labels, priorities, and commit formats. Use these values throughout this skill.

2. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `update-docs` status from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task needs documentation

2. **Read task file**:
   - Find file matching `.kanban/tasks/{id}-*.md`
   - Parse YAML frontmatter
   - Verify current status is `update-docs`:
     - If `review`: Suggest `/kanban:review-pass-task {id}` first
     - If earlier status: Suggest appropriate command
   - Note title, labels, description for documentation context
   - Error if task not found

3. **Check for command skills**:
   - Load `.kanban/config.yaml`
   - Find `commands."kanban:update-docs-complete-task".skills` array
   - If skills array is non-empty:
     - Read each skill file at the listed paths
     - Follow their instructions as mandatory guidance for this command

4. **Analyze documentation needs**:
   - Check task labels:
     - `feature` -> likely needs feature docs
     - `breaking` -> MUST update changelog/migration docs
     - `api` -> needs API docs update
     - `docs` -> already a docs task, may skip
     - `refactor` -> internal change, may skip
     - `bug` -> may need troubleshooting docs
   - Check task description for user-facing changes

5. **Prompt for documentation updates**:
   ```
   Task: {id} - {title}
   Labels: {labels}

   This task may require documentation updates.
   Detected: {feature/api/breaking indicators}

   Update documentation? [Y/n]
   ```

6. **If user confirms (Y)**:
   - Help identify which docs to update:
     - For `feature`: suggest feature documentation
     - For `api`: suggest API documentation
     - For `breaking`: suggest changelog
   - Ask what documentation changes are needed
   - Make documentation changes
   - Generate commit message based on changes made

7. **If user declines (n)**:
   - Log: "Documentation update skipped"
   - Ask for reason (optional)
   - Still proceed to move status
   - Use generic commit message: "docs({id}): product - no updates needed for {title}"

8. **Commit documentation changes** (if any):
   ```bash
   git add {doc files}
   git commit -m "docs({id}): product - {description of doc changes}"
   ```

9. **Move to Done**:
   - Change `status: update-docs` to `status: done`
   - Add `updated: {YYYY-MM-DD}`
   - Add `completed: {YYYY-MM-DD}`
   - Write updated task file

10. **Confirm completion**:
    - Print documentation status (updated/skipped)
    - Print commit hash (if docs were committed)
    - Print: "Task {id} completed!"
    - Congratulate user

## Validation

All must pass. If any fail, fix and retry.

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Task frontmatter contains `status: done`
- [ ] Task frontmatter contains `completed:` date

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

Staging documentation:
- docs/auth.md
- README.md

Commit: h8i9j0k docs(001): product - add authentication guide

Task 001 completed!
- Status: done
- Docs commit: h8i9j0k

Congratulations! Task complete.
```

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

Task 002 completed!
- Status: done
- No docs commit needed

Congratulations! Task complete.
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
docs(001): product - add authentication guide      # final step
```

## Next Steps

Task workflow complete! To start a new task:

```
/kanban:define-task {description}
```
