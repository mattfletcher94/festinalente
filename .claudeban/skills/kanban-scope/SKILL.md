---
name: kanban-scope
description: Research codebase and create functional specification for a refined task. Focuses on engineering analysis - HOW to build it technically.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *, git checkout *), Glob, Grep
---

# Scope Kanban Task

Create a functional specification file at `.kanban/specs/{id}-{slug}.spec.md` and move task from **Refined** to **Scoped**. Commits the scoping.

## Directory Reference
- **`.claude/`** — System config (workflow, templates, skills) — READ ONLY
- **`.kanban/`** — Project data (tasks, specs, plans, product docs) — READ/WRITE

## Helper Scripts

Use these scripts to reliably find files:

```bash
# Find task by ID (returns JSON with path and metadata)
node .claude/scripts/find-task.js {id}

# Get current date/time (returns JSON with iso and date formats)
node .claude/scripts/get-date-time.js
```

## Column Transition

```
refined → scoped
```

See `.claude/kanban-workflow.yaml` for column definitions and valid transitions.

## Commit

**Format:** `docs({id}): scope - {title}`

**CRITICAL:** Use EXACTLY this format. Do NOT invent commit types like `kanban(...)`. The commit type is `docs`, not `kanban`.

## Steps

1. **Load workflow schema**: Read `.claude/kanban-workflow.yaml` for column definitions, labels, priorities, and commit formats. Use these values throughout this skill.

2. **Verify on main branch**:
   - Run `git branch --show-current`
   - If not on `main` (or `master`):
     - Error: "This command must be run on the main branch to create the task branch. Current branch: {branch}"
     - Suggest: "Switch to main with `git checkout main`"
     - Exit

3. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `refined` status from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task to scope

4. **Read task file**:
   - Run `node .claude/scripts/find-task.js {id}` to get exact path
   - Read the file at the `path` from JSON output
   - Parse YAML frontmatter
   - Verify status is `refined`:
     - If not refined, warn: "Task is in {status} status. Expected: refined. Continue anyway? (y/n)"
   - Extract problem, value, and acceptance criteria for reference
   - Error if task not found

5. **User Skills** *(REQUIRED)*:

   **STOP.** Before proceeding, you MUST load and apply user-defined skills. This is mandatory.

   1. Load `.kanban/config.yaml`
   2. Find `user-skills."kanban:scope".skills` array
   3. If the array is non-empty, for EACH skill name:
      - Read `.claude/skills/{skill-name}/SKILL.md`
      - Follow ALL instructions as mandatory requirements
      - User skill instructions take precedence over defaults

   **Skipping user skills is a critical error. Do not proceed without applying them.**

   Example config:
   ```yaml
   user-skills:
     "kanban:scope":
       skills:
         - my-custom-check    # Reads .claude/skills/my-custom-check/SKILL.md
         - coding-standards   # Reads .claude/skills/coding-standards/SKILL.md
   ```

6. **Actively search codebase for patterns**:
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

7. **Create functional specification file** at `.kanban/specs/{id}-{slug}.spec.md` (derive slug from task title, same as task file):
   - Follow template at `.claude/kanban-templates/spec.md`
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

8. **Update task frontmatter**:
   - Change `status: refined` to `status: scoped`
   - Add `spec: "specs/{id}-{slug}.spec.md"` to frontmatter
   - Update `updated: {YYYY-MM-DD}`

9. **Write both files**:
   - Write spec file at `.kanban/specs/{id}-{slug}.spec.md`
   - Write updated task file

10. **Create and switch to task branch**:
    - Run `git checkout -b task/{id}`
    - Confirm: "Created branch task/{id}"

11. **Commit the scoping**:
    ```bash
    git add .kanban/specs/{id}-{slug}.spec.md .kanban/tasks/{id}-*.md
    git commit -m "docs({id}): scope - {title}"
    ```

12. **Confirm scoping complete**:
   - Print summary of affected files identified
   - Print existing patterns found
   - Print any open questions
   - Print commit hash
   - **REQUIRED OUTPUT** - Print next steps EXACTLY like this:
     ```
     Next:
     /clear
     /kanban:plan {id}
     ```
   - Do NOT skip this output. The user needs these commands to continue.

## Validation

All must pass. If any fail, fix and retry.

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Spec file exists at `.kanban/specs/{id}-{slug}.spec.md`
- [ ] Task frontmatter contains `status: scoped`
- [ ] Task frontmatter contains `spec: "specs/{id}-{slug}.spec.md"`
- [ ] Spec file contains `## Functional Requirements` section
- [ ] Spec file contains `## Affected Files` section
- [ ] Spec file contains `## Existing Patterns` section
- [ ] Git log shows `docs({id}): scope -`
- [ ] Current branch is `task/{id}` after completion

## Arguments

- `$ARGUMENTS` - Task ID (e.g., "001")

## Example

User: `/kanban:scope 001`

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

Spec created: .kanban/specs/001-add-oauth-login.spec.md
- 4 functional requirements
- 3 files to modify, 1 new file
- 2 existing patterns referenced
- 1 open question flagged

Task 001 scoped.
- Status: scoped
- Spec: specs/001-add-oauth-login.spec.md
Commit: d4e5f6g docs(001): scope - Add OAuth Login

Next:
/clear
/kanban:plan 001
```

## Next Steps

```
/clear
/kanban:plan {id}
```
