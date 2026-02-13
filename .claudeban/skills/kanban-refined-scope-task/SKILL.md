---
name: kanban-refined-scope-task
description: Research codebase and create functional specification for a refined task. Focuses on engineering analysis - HOW to build it technically.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status), Glob, Grep
---

# Scope Kanban Task

Create a functional specification file at `.kanban/specs/{id}.spec.md` and move task from **Refined** to **Scoped**. Commits the scoping.

## Column Transition

```
refined → scoped
```

See `.claudeban/workflow.yaml` for column definitions and valid transitions.

## Commit

Uses `commits.scope` format from `.claudeban/workflow.yaml`.

## Steps

1. **Load workflow schema**: Read `.claudeban/workflow.yaml` for column definitions, labels, priorities, and commit formats. Use these values throughout this skill.

2. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `refined` status from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task to scope

2. **Read task file**:
   - Find file matching `.kanban/tasks/{id}-*.md`
   - Parse YAML frontmatter
   - Verify status is `refined`:
     - If not refined, warn: "Task is in {status} status. Expected: refined. Continue anyway? (y/n)"
   - Extract problem, value, and acceptance criteria for reference
   - Error if task not found

3. **Check for command skills**:
   - Load `.kanban/config.yaml`
   - Find `commands."kanban:refined-scope-task".skills` array
   - If skills array is non-empty:
     - Read each skill file at the listed paths
     - Follow their instructions as mandatory guidance

4. **Actively search codebase for patterns**:
   Based on task description and acceptance criteria:
   - Use Glob to find potentially affected files
   - Use Grep to search for relevant patterns, functions, or components
   - Read key files to understand existing patterns
   - Identify dependencies and libraries involved
   - Look for similar implementations that can serve as references

   **Pattern search strategy:**
   - Search for similar functionality: "How is X done elsewhere?"
   - Search for related types/interfaces: "What types are involved?"
   - Search for integration points: "What connects to this?"

5. **Create functional specification file** at `.kanban/specs/{id}.spec.md`:
   - Follow template at `.claudeban/templates/spec.md`
   - Fill ALL sections:

   ```markdown
   ---
   task: "{id}"
   created: {YYYY-MM-DD}
   updated: {YYYY-MM-DD}
   ---

   # Functional Specification: {title}

   ## Context
   {Pull from task's problem and value sections}

   ## Scope
   ### In Scope
   - {What this spec covers}

   ### Out of Scope
   - {Explicit boundaries}

   ## Functional Requirements
   - FR1: The system shall...
   - FR2: The system shall...

   ## Affected Files
   - `path/to/file.ts` (modify) - {reason}
   - `path/to/new.ts` (create) - {reason}

   ## Existing Patterns
   - **Pattern:** {description}
     - Reference: `path/to/example.ts:42`

   ## Technical Constraints
   - {Constraints discovered during research}

   ## Dependencies
   ### External
   - {Libraries/APIs}

   ### Internal
   - {Other features/tasks}

   ## Risks & Mitigations
   | Risk | Impact | Mitigation |
   |------|--------|------------|
   | ... | ... | ... |

   ## Open Questions
   - [ ] {Unresolved items}
   ```

6. **Update task frontmatter**:
   - Change `status: refined` to `status: scoped`
   - Add `spec: "specs/{id}.spec.md"` to frontmatter
   - Update `updated: {YYYY-MM-DD}`

7. **Write both files**:
   - Write spec file at `.kanban/specs/{id}.spec.md`
   - Write updated task file

8. **Commit the scoping**:
   ```bash
   git add .kanban/specs/{id}.spec.md .kanban/tasks/{id}-*.md
   git commit -m "docs({id}): scope - {title}"
   ```

9. **Confirm scoping complete**:
   - Print summary of affected files identified
   - Print existing patterns found
   - Print any open questions
   - Print commit hash

## Validation

All must pass. If any fail, fix and retry.

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Spec file exists at `.kanban/specs/{id}.spec.md`
- [ ] Task frontmatter contains `status: scoped`
- [ ] Task frontmatter contains `spec: "specs/{id}.spec.md"`
- [ ] Spec file contains `## Functional Requirements` section
- [ ] Spec file contains `## Affected Files` section
- [ ] Spec file contains `## Existing Patterns` section
- [ ] Git log shows `docs({id}): scope -`

## Arguments

- `$ARGUMENTS` - Task ID (e.g., "001")

## Example

User: `/kanban:refined-scope-task 001`

```
Scoping task 001 "Add OAuth Login"...

Reading task details...
- Problem: Users need to log in with Google/GitHub
- Value: Faster onboarding, fewer password issues

Searching codebase for patterns...
- Found auth patterns in src/middleware/auth.ts
- Found route patterns in src/routes/
- Found session handling in src/middleware/session.ts
- Found existing OAuth types in src/types/auth.ts

Creating functional specification...

Spec created: .kanban/specs/001.spec.md
- 4 functional requirements
- 3 files to modify, 1 new file
- 2 existing patterns referenced
- 1 open question flagged

Task 001 scoped.
- Status: scoped
- Spec: specs/001.spec.md
Commit: d4e5f6g docs(001): scope - Add OAuth Login
```

## Next Steps

```
/kanban:scoped-plan-task {id}
```
