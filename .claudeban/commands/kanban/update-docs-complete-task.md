---
name: update-docs-complete-task
description: Update product documentation and commit
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status), Grep
argument-hint: "[task id]"
---

# Update Task Documentation

Update product documentation, commit, and move to Done.

## Usage

`/kanban:update-docs-complete-task [task-id]`

## Workflow

1. **Read the task file** to get context and `product-docs` field

2. **Discover relevant product docs:**
   - Start with explicit `product-docs` from task frontmatter
   - Grep for additional matches: `grep -l "keywords:.*{task-keyword}" .kanban/product/*.md`
   - Do NOT read all product docs - only grep to find relevant files

3. **For each relevant product doc:**
   - If file exists: Read it, update affected sections to reflect current state
   - If no relevant doc exists and feature is new: Create new doc following template at `.claudeban/templates/product-doc.md`

4. **Update frontmatter:**
   - Set `updated: {today's date}` in each modified product doc

5. **Commit:**
   ```
   docs({id}): product - {brief description of doc changes}
   ```

6. **Update task status** to `done`

## Template Reference

New product docs follow: `.claudeban/templates/product-doc.md`

## Product Doc Location

Product docs are stored in: `.kanban/product/`

File naming: `{id}.md` where id matches the frontmatter `id` field (e.g., `authentication.md`)

## Example

`/kanban:update-docs-complete-task 001`

Updates documentation and completes the task.
