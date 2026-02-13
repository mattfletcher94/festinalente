---
name: kanban-review-fail-task
description: Document review issues, commit notes, and return task to In Progress. Use when code review finds issues.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status)
---

# Review Fail Kanban Task

Document issues found during review, commit the notes, and move task from **Review** back to **In Progress** for fixes.

## Column Transition

```
Review → In Progress
```

## Commit

```
docs(review-fail): <id> <title>
```

## Steps

1. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `review` column from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task failed review

2. **Read task file**:
   - Find file matching `.kanban/tasks/{id}-*.md`
   - Parse YAML frontmatter
   - Verify current column is `review`:
     - If not `review`, warn user and confirm they want to proceed
   - Note current title and acceptance criteria
   - Error if task not found

3. **Find and read plan file**:
   - Check for `.kanban/plans/{id}.plan.md`
   - If plan found: Read plan content
   - Plan will be updated with bug fixes needed

4. **Check for command skills**:
   - Load `.kanban/board.yaml`
   - Find `commands."kanban:review-fail-task".skills` array
   - If skills array is non-empty:
     - Read each skill file at the listed paths
     - Follow their instructions as mandatory guidance for this command

5. **Prompt for issues**:
   - Ask user: "What issues were found during review?"
   - Collect detailed description of problems
   - Parse into individual issues if multiple provided

6. **Update task file with issues**:
   - Add or append to "## Review Issues" section:
     ```markdown
     ## Review Issues

     ### Review {date}

     **Status:** Failed

     **Issues found:**
     - {issue 1}
     - {issue 2}
     - {issue 3}
     ```

7. **Update plan file with bug fixes** (if plan exists):
   - Add "## Bug Fixes Needed" section:
     ```markdown
     ## Bug Fixes Needed

     **From review {date}:**

     - [ ] Fix: {issue 1}
     - [ ] Fix: {issue 2}
     - [ ] Fix: {issue 3}
     ```
   - These become new checkboxes to complete during implementation

8. **Move to In Progress**:
   - Change `column: review` to `column: in-progress`
   - Add `updated: {YYYY-MM-DD}`
   - Write updated task file

9. **Commit the review notes**:
   ```bash
   git add .kanban/tasks/{id}-*.md
   git add .kanban/plans/{id}.plan.md  # if exists
   git commit -m "docs(review-fail): {id} {title}"
   ```

10. **Confirm**:
    - Print commit hash
    - Print: "Review failed. Task {id} moved back to In Progress"
    - Print: "Issues logged on task and plan"
    - Print number of bug fix items added

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

Updating task with review issues...

Adding bug fixes to plan...
- [ ] Fix: Password validation missing minimum length check
- [ ] Fix: JWT token expiry not being checked
- [ ] Fix: Error messages expose internal details

Commit: g7h8i9j docs(review-fail): 001 Add user authentication

Review failed.
Task 001 moved back to In Progress
- Column: in-progress
- Issues logged: 3
- Bug fixes added to plan: 3

Resume fixes with: /kanban:planned-implement-task 001
```

## Next Steps

To fix the issues:
```
/kanban:planned-implement-task {id}
```

The plan now contains bug fix checkboxes that need to be completed before the next review.
