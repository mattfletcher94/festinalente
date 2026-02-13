---
name: kanban-verify-pass-task
description: Move a verified task to human review. Used after all automated checks have passed.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *)
---

# Pass Verification

Move a task from **Verify** to **Review** for human approval.

## Directory Reference
- **`.claude/`** — System config (workflow, templates, skills) — READ ONLY
- **`.kanban/`** — Project data (tasks, specs, plans, product docs) — READ/WRITE

## Column Transition

```
verify → review
```

See `.claude/kanban-workflow.yaml` for column definitions and valid transitions.

## Commit

None.

## Steps

1. **Load workflow schema**: Read `.claude/kanban-workflow.yaml` for column definitions, labels, priorities, and commit formats. Use these values throughout this skill.

2. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `verify` status from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task to move to review

3. **Read task file**:
   - **NEVER guess filenames.** Glob for `.kanban/tasks/{id}-*.md` to find the exact filename
   - Parse YAML frontmatter
   - Verify status is `verify`:
     - If not, warn: "Task is in {status} status. Expected: verify. Continue anyway? (y/n)"
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
   - Find `commands."kanban:verify-pass-task".skills` array
   - If skills array is non-empty, for each skill path:
     - **Skill file location:** `{path}/SKILL.md`
     - Example: config lists `.kanban/skills/verify` → read `.kanban/skills/verify/SKILL.md`
     - **IMPORTANT:** The filename is always `SKILL.md`, NOT `instructions.md`
     - Read the skill file and follow its instructions as mandatory guidance

6. **Update task frontmatter**:
   - Change `status: verify` to `status: review`
   - Update `updated: {YYYY-MM-DD}`

7. **Write updated task file**

8. **Confirm transition**:
   - Print: "Task {id} moved to Review"
   - Print: "Awaiting human review."
   - **REQUIRED OUTPUT** - Print next steps EXACTLY like this:
     ```
     Next:
     /clear
     /kanban:review-pass-task {id}
     ```
   - Do NOT skip this output. The user needs these commands to continue.
   - Also mention: "Or if changes needed: /kanban:review-fail-task {id}"

## Validation

All must pass. If any fail, fix and retry.

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Frontmatter contains `status: review`

## Arguments

- `$ARGUMENTS` - Task ID (e.g., "001")

## Example

User: `/kanban:verify-pass-task 001`

```
Moving task 001 "Add OAuth Login" to Review...

Task 001 moved to Review
- Status: review

Awaiting human review.

Next:
/clear
/kanban:review-pass-task 001

Or if changes needed: /kanban:review-fail-task 001
```

## Next Steps

```
/clear
/kanban:review-pass-task {id}
```

Or if changes needed:
```
/clear
/kanban:review-fail-task {id}
```
