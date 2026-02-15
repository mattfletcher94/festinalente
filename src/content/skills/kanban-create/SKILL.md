---
name: kanban-create
description: Create a new task in the kanban board and commit. Use when the user wants to add a task, ticket, bug, or feature to track.
allowed-tools: Read, Write, Bash(node *, git add *, git commit *, git status, git branch *)
argument-hint: "[task title]"
disable-model-invocation: true
---

# Create Kanban Task

Create a new task file in `.kanban/tasks/` in the **Backlog** column and commit.

## CRITICAL — Read Before Proceeding

**You are creating a TASK, not a product doc.**

- **Output location:** `.kanban/tasks/{id}-{slug}.md`
- **Template:** `.claude/kanban-templates/task.md`
- **NOT** `.kanban/product/` — that's for product documentation, not tasks

**You MUST use the helper scripts. Do NOT:**
- Use `Search()` or `Glob()` to find files manually
- Read `.kanban/config.yaml` directly
- Run `ls` commands to explore directories
- Create files in `.kanban/product/`

**Instead, use these scripts:**
- `node .claude/scripts/next-id.cjs` — get next task ID
- `node .claude/scripts/search-product.cjs {keywords}` — find related product docs
- `node .claude/scripts/get-user-skills.cjs kanban-create` — load user skills

## Reference

{{> directory-reference}}

{{> helper-scripts show_next_id=true show_get_date_time=true}}

{{> product-docs-scripts show_search_product=true}}

{{> column-transition from="[New Task]" to="backlog"}}

## Steps

- [ ] 1. **Load workflow schema**
   {{> workflow-load}}

- [ ] 2. **Verify on main branch**
   {{> branch-verify-main}}

- [ ] 3. **Verify .kanban/ exists**
   Check that `.kanban/tasks/` directory exists. If not, inform user to run `npx claude-kanban init` first.

- [ ] 4. **Load user skills**
   {{> user-skills command="create"}}

- [ ] 5. **Determine next ID**
   Run `node .claude/scripts/next-id.cjs`
   Use `nextId` from JSON output.

- [ ] 6. **Search for related product docs**
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

- [ ] 7. **Get task details**
   - Title: Use $ARGUMENTS if provided, otherwise ask user
   - Ensure title follows best practices (suggest improvements if needed)
   - Generate initial description based on title
   - Status: Use first column ID from kanban-workflow.yaml (`backlog`)
   - Priority: Ask user (use priority IDs from kanban-workflow.yaml), default to `medium` if not specified

- [ ] 8. **Detect vague tasks**
   - Check if task was created with ONLY a title (no $ARGUMENTS body/description provided)
   - Check if title is very short (<5 words) without clear action verb
   - Check if no description could be generated (title too ambiguous)
   - If ANY vagueness indicator detected:
     - Add `needs-refinement` to labels array (from kanban-workflow.yaml)
     - Note to user: "Task marked as needs-refinement. Run `/kanban-refine {id}` to clarify before planning."

- [ ] 9. **Determine label**
   - Use `labels[].detect-keywords` from kanban-workflow.yaml to auto-detect label from title/context
   - If unclear, ask user to confirm or skip

- [ ] 10. **Create task file** at `.kanban/tasks/{id}-{slug}.md`

   **IMPORTANT:** Write to `.kanban/tasks/` — NOT `.kanban/product/`

   - Read template from `.claude/kanban-templates/task.md`
   - Create file at `.kanban/tasks/{id}-{slug}.md` where:
     - `{id}` = the nextId from step 5 (e.g., "001")
     - `{slug}` = lowercase title with hyphens (e.g., "add-priority-status")
   - Fill frontmatter: `id`, `title`, `status: backlog`, `priority`, `labels`, `created`, `affects`
   - Fill body: `## Description`, `## Notes`
   - Leave empty (filled in later phases): other sections

- [ ] 11. **Commit the task file**
   Format: `docs({id}): create - {title}`

   ```bash
   git add .kanban/tasks/{id}-{slug}.md
   git commit -m "docs({id}): create - {title}"
   ```

- [ ] 12. **Output next steps to user**
   - Print the created file path and task ID
   - Print commit hash
   - If `needs-refinement` label was added, note this

## Validation

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Frontmatter contains `id: "{id}"`
- [ ] Frontmatter contains `status: backlog`
- [ ] Frontmatter contains `title: "{title}"`
- [ ] Task file contains `## Description` section
- [ ] Git log shows `docs({id}): create -`
- [ ] Next steps shown to user

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
