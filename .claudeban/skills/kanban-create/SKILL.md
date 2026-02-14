---
name: kanban-create
description: Create a new task in the kanban board and commit. Use when the user wants to add a task, ticket, bug, or feature to track.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *), Grep
---

# Create Kanban Task

Create a new task file in `.kanban/tasks/` in the **Backlog** column and commit.

## Directory Reference
- **`.claude/`** — System config (workflow, templates, skills) — READ ONLY
- **`.kanban/`** — Project data (tasks, specs, plans, product docs) — READ/WRITE

## Helper Scripts

Use these scripts to reliably find files and get formatted values:

```bash
# Get next task ID (returns JSON with nextId, currentHighest, padding)
node .claude/scripts/next-id.js

# Get current date/time (returns JSON with iso and date formats)
node .claude/scripts/get-date-time.js
```

## Column Transition

```
[New Task] → backlog
```

See `.claude/kanban-workflow.yaml` for column definitions.

## Commit

**Format:** `docs({id}): create - {title}`

**CRITICAL:** Use EXACTLY this format. Do NOT invent commit types like `kanban(...)`. The commit type is `docs`, not `kanban`.

## Steps

1. **Load workflow schema**: Read `.claude/kanban-workflow.yaml` for column definitions, labels, priorities, and commit formats. Use these values throughout this skill.

2. **Verify on main branch**:
   - Run `git branch --show-current`
   - If not on `main` (or `master`):
     - Error: "This command must be run on the main branch. Current branch: {branch}"
     - Suggest: "Switch to main with `git checkout main`"
     - Exit

3. **Verify .kanban/ exists**: Check that `.kanban/tasks/` directory exists. If not, inform user to run `npx claude-kanban init` first.

4. **User Skills** *(REQUIRED)*:

   **STOP.** Before proceeding, you MUST load and apply user-defined skills. This is mandatory.

   1. Load `.kanban/config.yaml`
   2. Find `user-skills."kanban:create".skills` array
   3. If the array is non-empty, for EACH skill name:
      - Read `.claude/skills/{skill-name}/SKILL.md`
      - Follow ALL instructions as mandatory requirements
      - User skill instructions take precedence over defaults

   **Skipping user skills is a critical error. Do not proceed without applying them.**

   Example config:
   ```yaml
   user-skills:
     "kanban:create":
       skills:
         - my-custom-check    # Reads .claude/skills/my-custom-check/SKILL.md
         - coding-standards   # Reads .claude/skills/coding-standards/SKILL.md
   ```

5. **Determine next ID**:
   - Run `node .claude/scripts/next-id.js`
   - Use `nextId` from JSON output

6. **Get task details**:
   - Title: Use $ARGUMENTS if provided, otherwise ask user
   - Ensure title follows best practices (suggest improvements if needed)
   - Generate initial description based on title
   - Status: Use first column ID from kanban-workflow.yaml (`backlog`)
   - Priority: Ask user (use priority IDs from kanban-workflow.yaml), default to `medium` if not specified

7. **Detect vague tasks**:
   - Check if task was created with ONLY a title (no $ARGUMENTS body/description provided)
   - Check if title is very short (<5 words) without clear action verb
   - Check if no description could be generated (title too ambiguous)
   - If ANY vagueness indicator detected:
     - Add `needs-refinement` to labels array (from kanban-workflow.yaml)
     - Note to user: "Task marked as needs-refinement. Run `/kanban:refine {id}` to clarify before planning."

8. **Determine label**:
   - Use `labels[].detect-keywords` from kanban-workflow.yaml to auto-detect label from title/context
   - If unclear, ask user to confirm or skip

9. **Create task file** at `.kanban/tasks/{id}-{slug}.md`:
   - Follow template at `.claude/kanban-templates/task.md`
   - Fill sections for this phase:
     - Frontmatter: `id`, `title`, `status: backlog`, `priority`, `labels`, `created`
     - Body: `## Description`, `## Notes`
   - Leave empty (filled in later phases):
     - `## What problem are you trying to solve?`
     - `## What value would it provide if solved?`
     - `## Acceptance Criteria`
     - Frontmatter: `spec`, `plan`, `updated`, `completed`

10. **Commit the task file**:
    - Use `commits.create` format from kanban-workflow.yaml
    ```bash
    git add .kanban/tasks/{id}-{slug}.md
    git commit -m "docs({id}): create - {title}"
    ```

11. **Confirm creation**:
   - Print the created file path and task ID
   - Print commit hash
   - If `needs-refinement` label was added, note this
   - **REQUIRED OUTPUT** - Print next steps EXACTLY like this:
     ```
     Next:
     /clear
     /kanban:refine {id}
     ```
   - Do NOT skip this output. The user needs these commands to continue.

## Arguments

- `$ARGUMENTS` - Task title and optional description

## Validation

All must pass. If any fail, fix and retry.

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Frontmatter contains `id: "{id}"`
- [ ] Frontmatter contains `status: backlog`
- [ ] Frontmatter contains `title: "{title}"`
- [ ] Task file contains `## Description` section
- [ ] Git log shows `docs({id}): create -`

## Example

User: `/kanban:create Fix login redirect bug`

Creates: `.kanban/tasks/002-fix-login-redirect-bug.md`

```
Task 002 created in Backlog
Title: Fix login redirect bug
Labels: [bug]
File: .kanban/tasks/002-fix-login-redirect-bug.md
Commit: a1b2c3d docs(002): create - Fix login redirect bug

Next:
/clear
/kanban:refine 002
```

## Next Steps

```
/clear
/kanban:refine {id}
```
