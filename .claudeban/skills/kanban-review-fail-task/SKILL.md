---
name: kanban-review-fail-task
description: Document review issues, commit notes, and return task to In Progress. Use when code review finds issues.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *)
---

# Review Fail Kanban Task

Document issues found during review, commit the notes, and move task from **Review** back to **In Progress** for fixes.

## Directory Reference
- **`.claude/`** — System config (workflow, templates, skills) — READ ONLY
- **`.kanban/`** — Project data (tasks, specs, plans, product docs) — READ/WRITE

## Column Transition

```
review → in-progress
```

See `.claude/kanban-workflow.yaml` for column definitions and valid transitions.

## Commit

**Format:** `docs({id}): review-fail - {title}`

**CRITICAL:** Use EXACTLY this format. Do NOT invent commit types like `kanban(...)`. The commit type is `docs`, not `kanban`.

## Steps

1. **Load workflow schema**: Read `.claude/kanban-workflow.yaml` for column definitions, labels, priorities, and commit formats. Use these values throughout this skill.

2. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `review` status from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task failed review

3. **Read task file**:
   - **NEVER guess filenames.** Glob for `.kanban/tasks/{id}-*.md` to find the exact filename
   - Parse YAML frontmatter
   - Verify current status is `review`:
     - If not `review`, warn user and confirm they want to proceed
   - Note current title and acceptance criteria
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
   - Plan will be updated with bug fixes needed

6. **Check for command skills**:
   - Load `.kanban/config.yaml`
   - Find `commands."kanban:review-fail-task".skills` array
   - If skills array is non-empty, for each skill path:
     - **Skill file location:** `{path}/SKILL.md`
     - Example: config lists `.kanban/skills/review` → read `.kanban/skills/review/SKILL.md`
     - **IMPORTANT:** The filename is always `SKILL.md`, NOT `instructions.md`
     - Read the skill file and follow its instructions as mandatory guidance

7. **Prompt for issues**:
   - Ask user: "What issues were found during review?"
   - Collect detailed description of problems
   - Parse into individual issues if multiple provided

8. **Update plan file with iteration** (following template at `.claude/kanban-templates/plan.md`):
   - Increment `iteration` in frontmatter
   - Add to `## Iterations` section (create if doesn't exist):
     ```markdown
     ## Iterations

     ### Attempt {n} — Review Failed ({YYYY-MM-DD})
     **Phase:** review
     **Result:** failed

     **Issues:**
     - [ ] {issue 1}
     - [ ] {issue 2}
     - [ ] {issue 3}

     **Action:** Address issues above, then re-verify

     ---
     ```

9. **Move to In Progress**:
   - Change `status: review` to `status: in-progress`
   - Add `updated: {YYYY-MM-DD}`
   - Write updated task file

10. **Commit the review notes**:
    ```bash
    git add .kanban/tasks/{id}-*.md
    git add .kanban/plans/{id}-{slug}.plan.md  # if exists
    git commit -m "docs({id}): review-fail - {title}"
    ```

11. **Confirm**:
    - Print commit hash
    - Print: "Review failed. Task {id} moved back to In Progress"
    - Print iteration number
    - Print number of issues to address
    - **REQUIRED OUTPUT** - Print next steps EXACTLY like this:
      ```
      Next:
      /clear
      /kanban:planned-implement-task {id}
      ```
    - Do NOT skip this output. The user needs these commands to continue.
    - Also mention: "Then re-verify with /kanban:in-progress-verify-task {id}"

## Validation

All must pass. If any fail, fix and retry.

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Plan file exists at `.kanban/plans/{id}-{slug}.plan.md`
- [ ] Task frontmatter contains `status: in-progress`
- [ ] Plan contains `## Iterations` section with review failure entry
- [ ] Git log shows `docs({id}): review-fail -`

## Arguments

- `$ARGUMENTS` - Task ID (e.g., "001")

## Example

User: `/kanban:review-fail-task 001`

```
Recording review failure for task 001 "Add user authentication"...

Task: 001 - Add user authentication
Column: review

What issues were found during review?
> 1. Password validation is missing minimum length check
> 2. JWT token expiry is not being checked
> 3. Error messages expose internal details

Updating plan with iteration...

Commit: g7h8i9j docs(001): review-fail - Add user authentication

Review failed.
Task 001 moved back to In Progress
- Iteration: 2
- Status: in-progress
- Issues to address: 3

Next:
/clear
/kanban:planned-implement-task 001

Then re-verify: /kanban:in-progress-verify-task 001
```

## Next Steps

Fix the issues (see plan's Iterations for checkboxes):
```
/clear
/kanban:planned-implement-task {id}
```

Then re-verify:
```
/clear
/kanban:in-progress-verify-task {id}
```
