---
name: kanban-docs
description: Update product documentation and commit. Move task to PR column.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *, git push *), Grep
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Update Kanban Task Documentation

<purpose>
Update product documentation, commit the changes, push to remote, and move task from Update Docs to PR.
</purpose>

<context>
{{> directory-reference}}

{{> helper-scripts show_get_date_time=true}}

{{> product-docs-scripts show_search_product=true show_check_product=true}}

- **`.kanban/product/`** — Product documentation files organized by domain (e.g., `auth/login.md`, `overview.md`) — This is where user-facing docs live

{{> column-transition from="update-docs" to="pr"}}
</context>

<prohibited>
- Do not use invented commit types like `kanban(...)` — valid types are: `docs`
- Do not update docs for features NOT touched by this task
- Do not mark unrelated features as "Planned" or "Not yet implemented"
- Do not add strikethroughs to features not touched by this task
- Do not skip pushing to remote
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="get_task_id" outputs="taskId">
    Use $ARGUMENTS if provided (e.g., "001"), otherwise:
    - List tasks in `update-docs` status from `.kanban/tasks/`
    - Show task IDs and titles
    - Ask user which task needs documentation
  </step>

  <step name="read_task_file" outputs="taskPath, title, labels, affects">
    - **NEVER guess filenames.** Task files are ALWAYS named `{id}-{slug}.md`, not `{id}.md`
    - Glob for `.kanban/tasks/{taskId}-*.md` to find the exact filename
    - Parse YAML frontmatter
    - Verify current status is `update-docs`:
      - If `qa`: Suggest `/kanban-approve {taskId}` first
      - If earlier status: Suggest appropriate command
    - Note title, labels, description for documentation context
    - Error if task not found
  </step>

  <step name="verify_branch">
    {{> branch-verify-task}}
  </step>

  <step name="load_user_skills">
    {{> user-skills command="docs"}}
  </step>

  <step name="analyze_product_doc_impact">
    a. **Check affects field:**
       - Read task's `affects` array from frontmatter
       - If `affects` has IDs, run: `node .claude/scripts/check-product.cjs {affects IDs}`
       - Categorize: existing docs vs missing docs

    b. **Analyze task for unlisted impacts:**
       - Read task description, spec, and implementation context
       - Run: `node .claude/scripts/search-product.cjs {keywords from title/description}`
       - If high-scoring docs NOT in affects → suggest adding

    c. **Determine action for each:**
       - Existing docs → Will UPDATE
       - Missing docs → Will CREATE (new feature)

    d. **Present analysis to user:**
       ```
       Product Doc Analysis for Task {taskId}:

       Will UPDATE (doc exists):
       - {id} - {summary}

       Will CREATE (new feature):
       - {id} - (new doc needed)

       Unaffected (internal change):
       - {reason if applicable}

       Proceed with documentation? [Y/n]
       ```
  </step>

  <step name="update_existing_docs" when="docs need updating">
    - Read current doc at `.kanban/product/{id}.md`
    - Identify sections that need changes based on implementation
    - Make minimal, focused updates (don't rewrite entire doc)
    - Preserve existing content that's still accurate
    - **SCOPE RESTRICTION:** Only update docs to reflect what THIS task implemented
  </step>

  <step name="create_new_docs" when="new docs needed">
    - Create domain folder if doesn't exist: `.kanban/product/{domain}/`
    - Get current date: `node .claude/scripts/get-date-time.cjs` (use `date` field)

    **For features** (use `.claude/kanban-templates/product-doc.md`):
    - Fill frontmatter: `id: {domain}/{feature}`, `type: feature`, title, summary, keywords, updated
    - Fill sections: Overview, How It Works, Limitations

    **For concepts** (use `.claude/kanban-templates/concept-doc.md`):
    - Fill frontmatter: `id: {domain}/{concept}`, `type: concept`, title, summary, keywords, updated
    - Fill sections: Definition, Examples, Rules & Constraints

    - Write content based on what was implemented
    - Keep scope focused on THIS feature/concept only
  </step>

  <step name="handle_internal_changes" when="no user-facing changes">
    - If affects is empty AND task labels include [bug, refactor, chore]:
      - Analyze if any product behavior actually changed
      - If no user-facing changes: "No product doc updates needed - internal change"
      - Log reason and proceed without doc changes
    - Use generic commit message: "docs({taskId}): product - no updates needed for {title}"
  </step>

  <step name="commit_docs" when="docs were changed">
    Format: `docs({taskId}): product - {description}`

    The description summarizes what documentation was updated (e.g., "add authentication guide", "update API reference").

    **CRITICAL:** Use EXACTLY this format. Do NOT invent commit types like `kanban(...)`. The commit type is `docs`, not `kanban`.

    ```bash
    git add {doc files}
    git commit -m "docs({taskId}): product - {description of doc changes}"
    ```
  </step>

  <step name="push_branch">
    ```bash
    git push -u origin task/{taskId}
    ```
    Print: "Branch pushed to remote"
  </step>

  <step name="move_to_pr">
    - Change `status: update-docs` to `status: pr`
    - Add `updated: {YYYY-MM-DD}`
    - Write updated task file
  </step>

  <step name="output_result">
    - Print documentation status (updated/skipped)
    - Print commit hash (if docs were committed)
    - Print: "Branch pushed. Ready for PR creation."
    - Print: "Task {taskId} moved to PR column."
    - **REQUIRED OUTPUT** - Print next steps EXACTLY like this:
      ```
      Create PR on GitHub, then run:
      /clear
      /kanban-merge {taskId}
      ```
    - Do NOT skip this output. The user needs these commands to continue.
    - Also mention: "Or if PR needs changes: /kanban-rework {taskId}"
  </step>
</process>

<success_criteria>
- Task file exists at `.kanban/tasks/{taskId}-*.md`
- Task frontmatter contains `status: pr`
- Branch has been pushed to remote
- Next steps shown to user
</success_criteria>

## Example

**Documentation Updated:**

User: `/kanban-docs 001`

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
/kanban-merge 001

Or if PR needs changes: /kanban-rework 001
```

**Documentation Skipped:**

User: `/kanban-docs 002`

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
/kanban-merge 002

Or if PR needs changes: /kanban-rework 002
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
/kanban-merge {id}
```

Or if the PR needs changes:
```
/clear
/kanban-rework {id}
```
