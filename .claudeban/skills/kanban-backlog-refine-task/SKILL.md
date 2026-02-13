---
name: kanban-backlog-refine-task
description: Refine vague tasks through Socratic Q&A to add clarity and acceptance criteria, then commit
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status)
---

# Refine Kanban Task

Refine vague tasks through Socratic Q&A dialogue to add clarity, acceptance criteria, and implementation hints. Task stays in **Backlog** but becomes ready for planning. Commits the refinement.

## Column Transition

```
Backlog (needs-refinement) → Backlog (refined)
```

## Commit

```
docs(refine-task): <id> <title>
```

## Steps

1. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks with `needs-refinement` label from `.kanban/tasks/`
   - Show task IDs, titles, and current vagueness indicators
   - Ask user which task to refine

2. **Read task file**:
   - Find file matching `.kanban/tasks/{id}-*.md`
   - Parse YAML frontmatter
   - Verify task has `needs-refinement` label:
     - If present, proceed with refinement
     - If not present, warn: "Task does not have needs-refinement label. Refine anyway? (y/n)"
   - Note current title, description, acceptance criteria (if any)
   - Error if task not found

3. **Check for command skills**:
   - Load `.kanban/board.yaml`
   - Find `commands."kanban:backlog-refine-task".skills` array
   - If skills array is non-empty:
     - Read each skill file at the listed paths
     - Follow their instructions as mandatory guidance for this command

4. **Analyze vagueness indicators**:
   - Check title for clarity issues:
     - Title too short (<5 words)?
     - Missing action verb (add, fix, implement, create, etc.)?
     - Contains ambiguous terms ("fix stuff", "improve things")?
   - Check description for completeness
   - Check acceptance criteria for specificity

5. **Conduct Socratic Q&A dialogue**:
   - Based on vagueness analysis, prepare 1-4 focused questions
   - Ask questions ONE AT A TIME using AskUserQuestion tool
   - After each answer, determine if more clarification needed

   **Question selection guide:**

   | Vagueness Type | Question to Ask |
   |----------------|-----------------|
   | Unclear purpose | "What specific problem does this task solve?" |
   | No acceptance criteria | "What does 'done' look like for this task?" |
   | Missing constraints | "Are there specific patterns or libraries to follow?" |
   | Unknown scope | "What files or areas of the codebase are involved?" |

6. **Update task based on answers**:
   - Enhance title if needed (make more specific and action-oriented)
   - Update description with gathered context
   - Add/improve acceptance criteria (each must be testable)
   - Add implementation hints if technical context was provided

7. **Update labels**:
   - Remove `needs-refinement` from labels array
   - Add `refined` to labels array

8. **Write updated task file**:
   - Update frontmatter with new labels
   - Add "## Refinement Notes" section:
     ```markdown
     ## Refinement Notes

     **Refined:** {YYYY-MM-DD}

     **Clarifications:**
     - [Key clarification 1 from Q&A]
     - [Key clarification 2 from Q&A]
     ```

9. **Commit the refinement**:
   ```bash
   git add .kanban/tasks/{id}-*.md
   git commit -m "docs(refine-task): {id} {title}"
   ```

10. **Confirm refinement complete**:
    - Print summary of changes made
    - Show updated acceptance criteria
    - Print commit hash

## Arguments

- `$ARGUMENTS` - Task ID (e.g., "001")

## Example

User: `/kanban:backlog-refine-task 003`

```
Analyzing task 003 "Fix the thing"...

Vagueness indicators found:
- Title lacks specificity
- Description is placeholder text
- Acceptance criteria are unmeasurable

Q1: What specific problem does this task solve?
> The login form doesn't validate email format before submission.

Q2: What does 'done' look like for this task?
> Email validated client-side with inline error message.

Refinement complete!

Task 003 updated:
- Title: "Fix login form email validation"
- Labels: [refined, bug]
- 4 acceptance criteria added
Commit: b2c3d4e docs(refine-task): 003 Fix login form email validation

Task is now ready for planning.
```

## Next Steps

```
/kanban:backlog-plan-task {id}
```
