---
name: kanban-backlog-refine-task
description: Refine vague tasks through Socratic Q&A to add clarity and acceptance criteria, then commit
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status), Grep, AskUserQuestion
---

# Refine Kanban Task

Refine vague tasks through Socratic Q&A dialogue to add clarity, acceptance criteria, and implementation hints. Task moves from **Backlog** to **Refined**. Commits the refinement.

## Column Transition

```
backlog → refined
```

See `.claudeban/workflow.yaml` for column definitions and valid transitions.

## Commit

Uses `commits.refine` format from `.claudeban/workflow.yaml`.

## Steps

1. **Load workflow schema**: Read `.claudeban/workflow.yaml` for column definitions, labels, priorities, and commit formats. Use these values throughout this skill.

2. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks with `needs-refinement` label from `.kanban/tasks/`
   - Show task IDs, titles, and current vagueness indicators
   - Ask user which task to refine

3. **Read task file**:
   - Find file matching `.kanban/tasks/{id}-*.md`
   - Parse YAML frontmatter
   - Verify task has `needs-refinement` label (from workflow.yaml):
     - If present, proceed with refinement
     - If not present, warn: "Task does not have needs-refinement label. Refine anyway? (y/n)"
   - Note current title, description, acceptance criteria (if any)
   - Error if task not found

4. **Check for command skills**:
   - Load `.kanban/config.yaml`
   - Find `commands."kanban:backlog-refine-task".skills` array
   - If skills array is non-empty:
     - Read each skill file at the listed paths
     - Follow their instructions as mandatory guidance for this command

5. **Analyze vagueness indicators**:
   - Check title for clarity issues:
     - Title too short (<5 words)?
     - Missing action verb (use `detect-keywords` from workflow.yaml labels)?
     - Contains ambiguous terms ("fix stuff", "improve things")?
   - Check description for completeness
   - Check acceptance criteria for specificity

6. **Conduct Q&A dialogue for each section**:
   Using AskUserQuestion tool, ask about each section ONE AT A TIME.
   For each question, allow the user to:
   - Provide an answer
   - Skip (user says "skip")
   - Have LLM fill it in (user says "you fill it in")

   **Questions to ask:**

   a. **Problem section**: "What problem are you trying to solve with this task?"
      - If user skips: Try to infer from title/description, or leave placeholder
      - If user says "you fill it in": Generate from available context

   b. **Value section**: "What value would it provide if solved?"
      - If user skips: Try to infer from problem statement, or leave placeholder
      - If user says "you fill it in": Generate from available context

   c. **Acceptance Criteria**: "What does 'done' look like for this task? (will be formatted as Given/When/Then)"
      - Always fill this - generate from context if user skips
      - Convert user's answer to Gherkin format

7. **Update task file**:
   - Follow template at `.claudeban/templates/task.md`
   - Fill sections for this phase:
     - `## What problem are you trying to solve?`
     - `## What value would it provide if solved?`
     - `## Acceptance Criteria` (in Gherkin format)
   - Update frontmatter:
     - Change status per `transitions.backlog` in workflow.yaml (`backlog` → `refined`)
     - Add `updated: {YYYY-MM-DD}`
     - Remove `needs-refinement` from labels if present

8. **Format acceptance criteria in Gherkin**:
   ```gherkin
   Given {precondition}
   And {additional precondition if needed}
   When {action}
   Then {expected outcome}
   And {additional outcome if needed}
   ```

   Example:
   ```gherkin
   Given a user is on the login page
   And they have entered valid credentials
   When they click the login button
   Then they are redirected to the dashboard
   And their session is established
   ```

9. **Write updated task file**

10. **Commit the refinement**:
    - Use `commits.refine` format from workflow.yaml
    ```bash
    git add .kanban/tasks/{id}-*.md
    git commit -m "docs({id}): refine - {title}"
    ```

11. **Confirm refinement complete**:
    - Print summary of changes made
    - Show updated acceptance criteria
    - Print commit hash

## Validation

All must pass. If any fail, fix and retry.

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Frontmatter contains `status: refined`
- [ ] Task file contains `## Acceptance Criteria` section with Gherkin format
- [ ] Git log shows `docs({id}): refine -`

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

Q1: What problem are you trying to solve with this task?
> The login form doesn't validate email format before submission.

Q2: What value would it provide if solved?
> skip

(Generating value statement from context...)

Q3: What does 'done' look like for this task?
> Email validated client-side with inline error message.

Converting to Gherkin format...

Refinement complete!

Task 003 updated:
- Title: "Fix login form email validation"
- Status: refined
- Acceptance Criteria:
  Given a user is on the login form
  And they have entered an invalid email format
  When they attempt to submit
  Then an inline error message is displayed
  And form submission is prevented

Commit: b2c3d4e docs(003): refine - Fix login form email validation

Task is now ready for scoping.
```

## Next Steps

```
/kanban:refined-scope-task {id}
```
