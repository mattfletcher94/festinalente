---
name: kanban-rework
description: Return task to In Progress for fixes. Works from QA or PR columns.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *, gh pr *)
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Rework Kanban Task

Return a task to In Progress when human review finds issues. This consolidated command works from both **QA** and **PR** columns.

## Directory Reference
- **`.claude/`** — System config (workflow, templates, skills) — READ ONLY
- **`.kanban/`** — Project data (tasks, specs, plans, product docs) — READ/WRITE

## Column Transitions

```
qa → in-progress
pr → in-progress
```

See `.claude/kanban-workflow.yaml` for column definitions and valid transitions.

## Commit

**Format:** `docs({id}): rework - {title}`

**CRITICAL:** Use EXACTLY this format. Do NOT invent commit types like `kanban(...)`. The commit type is `docs`, not `kanban`.

## Steps

1. **Load workflow schema**: Read `.claude/kanban-workflow.yaml` for column definitions, labels, priorities, and commit formats. Use these values throughout this skill.

2. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `qa` or `pr` status from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task needs rework

3. **Read task file**:
   - **NEVER guess filenames.** Glob for `.kanban/tasks/{id}-*.md` to find the exact filename
   - Parse YAML frontmatter
   - Verify current status is `qa` or `pr`:
     - If not `qa` or `pr`, warn user and confirm they want to proceed
   - Note current title, status, and acceptance criteria
   - Error if task not found

4. **Verify on task branch**:
   - Run `git branch --show-current`
   - Expected branch: `task/{id}` (where {id} is the task ID from step 2/3)
   - If not on expected branch:
     - Error: "This command must be run on branch task/{id}. Current branch: {branch}"
     - Suggest: "Switch to task branch with `git checkout task/{id}`"
     - Exit

5. **Find and read plan file**:
   - Check for `.kanban/plans/{id}-{slug}.plan.md`
   - If plan found: Read plan content
   - Plan will be updated with issues to address

6. **User Skills** *(REQUIRED)*:

   **STOP.** Before proceeding, you MUST load and apply user-defined skills. This is mandatory.

   1. Load `.kanban/config.yaml`
   2. Find `user-skills."kanban-rework".skills` array
   3. If the array is non-empty, for EACH skill name:
      - Read `.claude/skills/{skill-name}/SKILL.md`
      - Follow ALL instructions as mandatory requirements
      - User skill instructions take precedence over defaults

   **Skipping user skills is a critical error. Do not proceed without applying them.**

   Example config:
   ```yaml
   user-skills:
     "kanban-rework":
       skills:
         - my-custom-check    # Reads .claude/skills/my-custom-check/SKILL.md
         - coding-standards   # Reads .claude/skills/coding-standards/SKILL.md
   ```

7. **If task was in PR column, close the PR**:
   - If status was `pr`:
     ```bash
     gh pr close
     ```
   - Print: "PR closed"

8. **Prompt for issues**:
   - Ask user: "What issues need to be fixed?"
   - Collect detailed description of problems
   - Parse into individual issues if multiple provided

9. **Update plan file with iteration** (following template at `.claude/kanban-templates/plan.md`):
   - Increment `iteration` in frontmatter
   - Determine phase name based on original status:
     - `qa` → "QA Failed"
     - `pr` → "PR Rejected"
   - Add to `## Iterations` section (create if doesn't exist):
     ```markdown
     ## Iterations

     ### Attempt {n} — {phase name} ({YYYY-MM-DD})
     **Phase:** {qa|pr}
     **Result:** failed

     **Issues:**
     - [ ] {issue 1}
     - [ ] {issue 2}
     - [ ] {issue 3}

     **Action:** Address issues above, then re-verify

     ---
     ```

10. **Move to In Progress**:
    - Change `status: {qa|pr}` to `status: in-progress`
    - Add `updated: {YYYY-MM-DD}`
    - Write updated task file

11. **CRITICAL: Commit the rework notes**:

    **This step is MANDATORY. Do not proceed without committing.**

    ```bash
    git add .kanban/tasks/{id}-*.md
    git add .kanban/plans/{id}-{slug}.plan.md  # if exists
    git commit -m "docs({id}): rework - {title}"
    ```

    **DO NOT skip this step. If the commit fails, stop and report the error.**

12. **Confirm**:
    - Print commit hash
    - Print: "Task {id} returned to In Progress for rework"
    - Print iteration number
    - Print number of issues to address
    - **REQUIRED OUTPUT** - Print next steps EXACTLY like this:
      ```
      Next:
      /clear
      /kanban-implement {id}
      ```
    - Do NOT skip this output. The user needs these commands to continue.
    - Also mention: "Then re-verify with /kanban-verify {id}"

## Validation

**STOP. You MUST verify ALL items pass before declaring success. Do not skip validation.**

All must pass. If any fail, fix and retry.

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Plan file exists at `.kanban/plans/{id}-{slug}.plan.md`
- [ ] Task frontmatter contains `status: in-progress`
- [ ] Plan contains `## Iterations` section with rework entry
- [ ] Git log shows `docs({id}): rework -`
- [ ] If was in PR: PR is closed (verify with `gh pr view --json state`)

## Arguments

- `$ARGUMENTS` - Task ID (e.g., "001")

## Example

User: `/kanban-rework 001`

```
Handling rework for task 001 "Add user authentication"...

Task: 001 - Add user authentication
Status: qa

What issues need to be fixed?
> 1. Password validation is missing minimum length check
> 2. JWT token expiry is not being checked
> 3. Error messages expose internal details

Updating plan with iteration...

Commit: g7h8i9j docs(001): rework - Add user authentication

Task 001 returned to In Progress for rework.
- Iteration: 2
- Status: in-progress
- Issues to address: 3

Next:
/clear
/kanban-implement 001

Then re-verify: /kanban-verify 001
```

## Next Steps

Fix the issues (see plan's Iterations for checkboxes):
```
/clear
/kanban-implement {id}
```

Then re-verify:
```
/clear
/kanban-verify {id}
```
