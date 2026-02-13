---
name: update-docs-complete-task
description: Update product documentation, create PR, and move to Awaiting Merge
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *, gh pr *), Grep
argument-hint: "[task id]"
---

# Update Task Documentation

Update product documentation, commit, create a pull request, and move to Awaiting Merge.

**Branch requirement:** Must be run on `task/{id}` branch. Creates PR to main.

## Usage

`/kanban:update-docs-complete-task [task-id]`

## Workflow

1. **Verify on task branch** (`task/{id}`)

2. **Read the task file** to get context and `product-docs` field

3. **Discover relevant product docs:**
   - Start with explicit `product-docs` from task frontmatter
   - Grep for additional matches: `grep -l "keywords:.*{task-keyword}" .kanban/product/*.md`
   - Do NOT read all product docs - only grep to find relevant files

4. **For each relevant product doc:**
   - If file exists: Read it, update affected sections to reflect current state
   - If no relevant doc exists and feature is new: Create new doc following template at `.claudeban/kanban-templates/product-doc.md`

5. **Update frontmatter:**
   - Set `updated: {today's date}` in each modified product doc

6. **Commit:** Uses `commits.update-docs` format from `.claudeban/kanban-workflow.yaml`.

7. **Create Pull Request** with task summary, changes, and acceptance criteria

8. **Update task status** to `awaiting-merge` (per `transitions.update-docs` in kanban-workflow.yaml)

## Template Reference

New product docs follow: `.claudeban/kanban-templates/product-doc.md`

## Product Doc Location

Product docs are stored in: `.kanban/product/`

File naming: `{id}.md` where id matches the frontmatter `id` field (e.g., `authentication.md`)

## Example

`/kanban:update-docs-complete-task 001`

Updates documentation, creates a PR, and moves task to Awaiting Merge.

## Next Steps

After the PR is created:
- Review the PR on GitHub
- `/kanban:awaiting-merge-merge-task 001` - to merge and complete the task
- `/kanban:awaiting-merge-fail-task 001` - if changes are needed
