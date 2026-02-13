---
name: kanban-refined-scope-task
description: Research codebase and create functional specification for a refined task. Focuses on engineering analysis - HOW to build it technically.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status), Glob, Grep
---

# Scope Kanban Task

Add Functional Specification section to a refined task, moving it from **Refined** to **Scoped**. Commits the scoping.

## Column Transition

```
Refined → Scoped
```

## Commit

```
docs(task): scope {id} {title}
```

## Steps

1. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `refined` status from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task to scope

2. **Read task file**:
   - Find file matching `.kanban/tasks/{id}-*.md`
   - Parse YAML frontmatter
   - Verify status is `refined`:
     - If not refined, warn: "Task is in {status} status. Expected: refined. Continue anyway? (y/n)"
   - Extract acceptance criteria for reference
   - Error if task not found

3. **Check for command skills**:
   - Load `.kanban/board.yaml`
   - Find `commands."kanban:refined-scope-task".skills` array
   - If skills array is non-empty:
     - Read each skill file at the listed paths
     - Follow their instructions as mandatory guidance

4. **Research codebase**:
   Based on task description and acceptance criteria:
   - Use Glob to find potentially affected files
   - Use Grep to search for relevant patterns, functions, or components
   - Read key files to understand existing patterns
   - Identify dependencies and libraries involved

5. **Create Functional Specification**:
   Add `## Functional Specification` section to task file with:

   ```markdown
   ## Functional Specification

   ### Affected Files
   - `path/to/file1.ts` (modify) - {brief reason}
   - `path/to/file2.ts` (new) - {brief reason}

   ### Existing Patterns
   - {Pattern 1 from codebase with file reference}
   - {Pattern 2}

   ### Technical Approach
   1. {Step 1 of technical approach}
   2. {Step 2}
   3. {Step 3}

   ### Dependencies
   - {library/package if any new ones needed}

   ### Risks & Considerations
   - {Risk 1}: {mitigation}
   - {Risk 2}: {mitigation}
   ```

6. **Update task frontmatter**:
   - Change `status: refined` to `status: scoped`
   - Update `updated: {YYYY-MM-DD}`

7. **Write updated task file**

8. **Commit the scoping**:
   ```bash
   git add .kanban/tasks/{id}-*.md
   git commit -m "docs(task): scope {id} {title}"
   ```

9. **Confirm scoping complete**:
   - Print summary of affected files identified
   - Print technical approach summary
   - Print commit hash

## Validation

All must pass. If any fail, fix and retry.

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Frontmatter contains `status: scoped`
- [ ] Task file contains `## Functional Specification` section
- [ ] Task file contains `### Affected Files` subsection
- [ ] Task file contains `### Technical Approach` subsection
- [ ] Git log shows `docs(task): scope {id}`

## Arguments

- `$ARGUMENTS` - Task ID (e.g., "001")

## Example

User: `/kanban:refined-scope-task 001`

```
Scoping task 001 "Add OAuth Login"...

Researching codebase...
- Found auth patterns in src/middleware/auth.ts
- Found route patterns in src/routes/
- Session handling in src/middleware/session.ts

Functional Specification added:
- 3 files to modify
- 1 new file to create
- Using Passport.js pattern from existing auth

Task 001 scoped.
- Status: scoped
Commit: d4e5f6g docs(task): scope 001 Add OAuth Login
```

## Next Steps

```
/kanban:scoped-plan-task {id}
```
