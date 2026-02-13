---
name: kanban-verify-pass-task
description: Move a verified task to human review. Used after all automated checks have passed.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status)
---

# Pass Verification

Move a task from **Verify** to **Review** for human approval.

## Column Transition

```
verify → review
```

See `.claudeban/workflow.yaml` for column definitions and valid transitions.

## Commit

None.

## Steps

1. **Load workflow schema**: Read `.claudeban/workflow.yaml` for column definitions, labels, priorities, and commit formats. Use these values throughout this skill.

2. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `verify` status from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task to move to review

3. **Read task file**:
   - Find file matching `.kanban/tasks/{id}-*.md`
   - Parse YAML frontmatter
   - Verify status is `verify`:
     - If not, warn: "Task is in {status} status. Expected: verify. Continue anyway? (y/n)"
   - Error if task not found

4. **Check for command skills**:
   - Load `.kanban/config.yaml`
   - Find `commands."kanban:verify-pass-task".skills` array
   - If skills array is non-empty:
     - Read each skill file at the listed paths
     - Follow their instructions as mandatory guidance

5. **Update task frontmatter**:
   - Change `status: verify` to `status: review`
   - Update `updated: {YYYY-MM-DD}`

6. **Write updated task file**

7. **Confirm transition**:
   - Print: "Task {id} moved to Review"
   - Print: "Awaiting human review. Run /kanban:review-pass-task {id} or /kanban:review-fail-task {id}"

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
- To approve: /kanban:review-pass-task 001
- To reject: /kanban:review-fail-task 001
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
