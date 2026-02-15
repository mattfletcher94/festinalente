---
name: kanban-create
description: Create a new task in the kanban board and commit. Use when the user wants to add a task, ticket, bug, or feature to track.
allowed-tools: Read, Write, Bash(node *, git add *, git commit *, git status, git branch *)
argument-hint: "[task title]"
disable-model-invocation: true
---

# Create Kanban Task

<purpose>
Create a new task file in `.kanban/tasks/` in the Backlog column and commit it.
</purpose>

<context>
{{> directory-reference}}

{{> helper-scripts show_next_id=true show_get_date_time=true}}

{{> product-docs-scripts show_search_product=true}}

{{> column-transition from="[New Task]" to="backlog"}}
</context>

<prohibited>
- Do not use `Search()` or `Glob()` to find files manually
- Do not read `.kanban/config.yaml` directly
- Do not run `ls` commands to explore directories
- Do not create files in `.kanban/product/` (that's for product docs, not tasks)
- Do not skip the commit step
- Do not guess filenames or IDs — always use the helper scripts
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="verify_branch">
    {{> branch-verify-main}}
  </step>

  <step name="verify_kanban_exists">
    Check that `.kanban/tasks/` directory exists. If not, inform user to run `npx claude-kanban init` first.
  </step>

  <step name="load_user_skills">
    {{> user-skills command="create"}}
  </step>

  <step name="get_next_id" outputs="nextId">
    Run `node .claude/scripts/next-id.cjs`
    Use `nextId` from JSON output.
  </step>

  <step name="search_product_docs" when="`.kanban/product/` directory exists and is not empty">
    Extract keywords from the task title (nouns, verbs, domain terms).

    ```bash
    node .claude/scripts/search-product.cjs {keyword1} {keyword2} ...
    ```

    **If docs with score ≥ 0.5 found:**
    - These docs describe existing features this task relates to
    - Set `affects: [{matched-ids}]` in task frontmatter
    - Briefly note: "Related product docs: {ids}"

    **If no docs with score ≥ 0.3 found:**
    - This may be a NEW feature not yet documented
    - Ask user: "This looks like a new feature. What domain should it belong to? (e.g., auth, billing, users)"
    - Set `affects: [{domain}/{slug-from-title}]` - doc will be created during /kanban-docs

    **If `.kanban/product/` is empty or doesn't exist:**
    - Skip this step, note: "No product docs yet"
  </step>

  <step name="get_task_details" outputs="title, slug, priority, labels">
    - Title: Use $ARGUMENTS if provided, otherwise ask user
    - Ensure title follows best practices (suggest improvements if needed)
    - Generate initial description based on title
    - Status: Use first column ID from kanban-workflow.yaml (`backlog`)
    - Priority: Ask user (use priority IDs from kanban-workflow.yaml), default to `medium` if not specified
  </step>

  <step name="detect_vague" when="task has vagueness indicators">
    - Check if task was created with ONLY a title (no $ARGUMENTS body/description provided)
    - Check if title is very short (<5 words) without clear action verb
    - Check if no description could be generated (title too ambiguous)
    - If ANY vagueness indicator detected:
      - Add `needs-refinement` to labels array (from kanban-workflow.yaml)
      - Note to user: "Task marked as needs-refinement. Run `/kanban-refine {id}` to clarify before planning."
  </step>

  <step name="determine_label">
    - Use `labels[].detect-keywords` from kanban-workflow.yaml to auto-detect label from title/context
    - If unclear, ask user to confirm or skip
  </step>

  <step name="create_task_file">
    **IMPORTANT:** Write to `.kanban/tasks/` — NOT `.kanban/product/`

    - Read template from `.claude/kanban-templates/task.md`
    - Create file at `.kanban/tasks/{nextId}-{slug}.md` where:
      - `{nextId}` = the nextId from step get_next_id (e.g., "001")
      - `{slug}` = lowercase title with hyphens (e.g., "add-priority-status")
    - Fill frontmatter: `id`, `title`, `status: backlog`, `priority`, `labels`, `created`, `affects`
    - Fill body: `## Description`, `## Notes`
    - Leave empty (filled in later phases): other sections
  </step>

  <step name="commit">
    Format: `docs({nextId}): create - {title}`

    ```bash
    git add .kanban/tasks/{nextId}-{slug}.md
    git commit -m "docs({nextId}): create - {title}"
    ```
  </step>

  <step name="output_result">
    - Print the created file path and task ID
    - Print commit hash
    - If `needs-refinement` label was added, note this
  </step>
</process>

<success_criteria>
- Task file exists at `.kanban/tasks/{nextId}-*.md`
- Frontmatter contains `id: "{nextId}"`
- Frontmatter contains `status: backlog`
- Frontmatter contains `title: "{title}"`
- Task file contains `## Description` section
- Git log shows `docs({nextId}): create -`
- Next steps shown to user
</success_criteria>

## Example

User: `/kanban-create Fix login redirect bug`

Creates: `.kanban/tasks/002-fix-login-redirect-bug.md`

```
Task 002 created in Backlog
Title: Fix login redirect bug
Labels: [bug]
File: .kanban/tasks/002-fix-login-redirect-bug.md
Commit: a1b2c3d docs(002): create - Fix login redirect bug

Next:
/clear
/kanban-refine 002
```

## Next Steps

```
/clear
/kanban-refine {id}
```
