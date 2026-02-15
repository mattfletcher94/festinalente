---
name: kanban-scope
description: Research codebase and create functional specification through conversational Q&A. Focuses on engineering analysis - HOW to build it technically.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *, git checkout *), Glob, Grep, AskUserQuestion, WebSearch, WebFetch
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Scope Kanban Task

Create a functional specification through **iterative conversational Q&A** focused on technical decisions. Research the codebase and web as topics arise. The dialogue continues until you have enough information and the user confirms. Creates spec at `.kanban/specs/{id}-{slug}.spec.md` and moves task from **Refined** to **Scoped**. Commits the scoping.

{{> directory-reference}}

{{> helper-scripts show_find_task=true show_get_date_time=true}}

{{> column-transition from="refined" to="scoped"}}

## Commit

{{> commit-format type="docs" action="scope"}}

## Steps

1. **Load workflow schema**
   {{> workflow-load}}

2. **Verify on main branch**
   {{> branch-verify-main reason="to create the task branch"}}

3. **Get task ID**: Use $ARGUMENTS if provided (e.g., "001"), otherwise:
   - List tasks in `refined` status from `.kanban/tasks/`
   - Show task IDs and titles
   - Ask user which task to scope

4. **Read task file**:
   - Run `node .claude/scripts/find-task.cjs {id}` to get exact path
   - Read the file at the `path` from JSON output
   - Parse YAML frontmatter
   - Verify status is `refined`:
     - If not refined, warn: "Task is in {status} status. Expected: refined. Continue anyway? (y/n)"
   - Extract problem, value, and acceptance criteria for reference
   - Error if task not found

5. **User Skills** *(REQUIRED)*
   {{> user-skills command="scope"}}

6. **Initial codebase research**:
   Based on task description and acceptance criteria, do preliminary research:
   - Use Glob to find potentially affected files
   - Use Grep to search for relevant patterns, functions, or components
   - Read key files to understand existing patterns
   - Identify dependencies and libraries involved
   - Look for similar implementations that can serve as references

   **Pattern search strategy:**
   - Search for similar functionality: "How is X done elsewhere?"
   - Search for related types/interfaces: "What types are involved?"
   - Search for integration points: "What connects to this?"

7. **Conduct iterative Q&A dialogue**:

   This is a **conversational session** focused on **technical decisions**:
   - Architecture and approach
   - Existing patterns to follow
   - Dependencies and libraries
   - Technical constraints
   - Files to modify/create

   **How the dialogue works:**

   a. **Share initial findings and ask questions**:
      - Present what you found in the codebase
      - Ask about technical approach, preferences, constraints
      - Don't follow a rigid script - adapt to the conversation

   b. **User can volunteer information at any time**:
      - User may provide technology directives (e.g., "use Zustand", "use React Query")
      - User may request research (e.g., "research reactive localStorage packages for React")
      - User may share architectural preferences or constraints

   c. **Perform research when requested or beneficial**:

      **Local codebase research:**
      - Use Glob/Grep to find patterns as topics arise
      - Read files to understand existing implementations

      **Web research:**
      - If user asks to research packages/libraries, use WebSearch
      - Research npm packages, documentation, best practices
      - Compare options and present findings
      - Ask if findings influence the approach

      Example: User says "research reactive localStorage packages for React"
      → WebSearch for packages
      → Evaluate options (maintenance, API, bundle size)
      → Present comparison and recommendation
      → Ask which to use or if more research needed

   d. **Continue until you have enough information**:
      - You need enough to write a complete functional spec
      - When you feel ready, signal to the user:

        **"I think I have enough information to write the functional spec. Here's what I understand:**

        - **Approach:** {summary}
        - **Key files:** {list}
        - **Dependencies:** {list}
        - **Patterns to follow:** {summary}

        **Is there anything else you'd like to discuss before I write the spec?"**

   e. **User confirms or continues**:
      - If user says "that's good" / "go ahead" / similar → proceed to writing spec
      - If user adds more context → incorporate and ask if anything else
      - If user has corrections → update understanding and confirm again

   **Key principles:**
   - Focus on TECHNICAL decisions, not product requirements (those are in the task)
   - Research as topics arise, not just at the beginning
   - Let the conversation flow naturally
   - Don't rush - thoroughness now saves time during implementation

8. **Create functional specification file** at `.kanban/specs/{id}-{slug}.spec.md` (derive slug from task title, same as task file):
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
   - {Libraries/APIs - include any researched/chosen packages}

   ### Internal
   - {Other features/tasks}

   ## Research Findings
   {If web research was conducted, summarize findings and decisions}
   - **Topic:** {what was researched}
   - **Options considered:** {list}
   - **Decision:** {what was chosen and why}

   ## Risks & Mitigations
   | Risk | Impact | Mitigation |
   |------|--------|------------|
   | ... | ... | ... |

   ## Open Questions
   - [ ] {Unresolved items}
   ```

9. **Update task frontmatter**:
   - Change `status: refined` to `status: scoped`
   - Add `spec: "specs/{id}-{slug}.spec.md"` to frontmatter
   - Update `updated: {YYYY-MM-DD}`

10. **Write both files**:
    - Write spec file at `.kanban/specs/{id}-{slug}.spec.md`
    - Write updated task file

11. **Create and switch to task branch**:
    - Run `git checkout -b task/{id}`
    - Confirm: "Created branch task/{id}"

12. **CRITICAL: Commit the scoping**
    {{> commit-critical}}

    ```bash
    git add .kanban/specs/{id}-{slug}.spec.md .kanban/tasks/{id}-*.md
    git commit -m "docs({id}): scope - {title}"
    ```

13. **Confirm scoping complete**:
    - Print summary of affected files identified
    - Print existing patterns found
    - Print any research findings and decisions
    - Print any open questions
    - Print commit hash
    {{> next-steps next_command="plan"}}

## Validation

{{> validation-intro}}

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

User: `/kanban-scope 001`

```
Scoping task 001 "Add localStorage persistence for app state"...

Reading task details...
- Problem: App state is lost on page refresh
- Value: Better UX, users don't lose work
- Acceptance: State persists across refreshes, loads on startup

Let me search the codebase for existing patterns...

Found:
- State management in src/store/index.ts (using Zustand)
- No existing persistence layer
- Config loading pattern in src/utils/config.ts

I see you're using Zustand for state management. There are a few approaches
for adding persistence:

1. Zustand's built-in persist middleware
2. A separate localStorage abstraction
3. A reactive localStorage hook

Do you have a preference, or should I research options?
> Research reactive localStorage packages for React, I want something that
> handles sync across tabs.

Let me research that...

[Searches for reactive localStorage React packages]

Found several options:

| Package | Weekly Downloads | Last Update | Tab Sync |
|---------|-----------------|-------------|----------|
| use-local-storage-state | 150k | 2 months ago | Yes |
| @rehooks/local-storage | 80k | 1 year ago | Yes |
| zustand persist | (built-in) | Active | No |

**use-local-storage-state** looks promising:
- Active maintenance
- Built-in tab sync via storage events
- SSR safe
- TypeScript support

Would you like to go with this, or should I look into others?
> That looks good. How would it integrate with our Zustand store?

Good question. We have two options:

1. **Replace Zustand with the hook directly** - simpler but loses Zustand benefits
2. **Use alongside Zustand** - hook for persistence, Zustand for state logic

Looking at your store... you have computed values and actions. I'd recommend
option 2 - use the hook to persist, sync to Zustand on load/change.

Let me check if there are existing hydration patterns in the codebase...

[Searches for hydration patterns]

Found a pattern in src/store/settings.ts that loads from config on mount.
We could follow that pattern.

> Sounds good. Any other technical considerations?

A few things:
- Storage key naming convention (found "app_" prefix in config.ts)
- Error handling for localStorage quota exceeded
- Migration strategy if storage schema changes

Should we address migration now or defer?
> Defer migration for now, just note it as a risk.

I think I have enough information to write the functional spec. Here's what I understand:

- **Approach:** use-local-storage-state for persistence with tab sync, hydrate Zustand on mount
- **Key files:** src/store/index.ts (modify), src/hooks/usePersistedState.ts (create)
- **Dependencies:** use-local-storage-state (new)
- **Patterns to follow:** Hydration pattern from src/store/settings.ts, "app_" key prefix

Is there anything else you'd like to discuss before I write the spec?
> No, that's good.

Writing functional specification...

Spec created: .kanban/specs/001-add-localstorage-persistence.spec.md
- 4 functional requirements
- 2 files to modify, 1 new file
- 1 external dependency (use-local-storage-state)
- 1 existing pattern referenced
- 1 risk flagged (migration strategy deferred)

Task 001 scoped.
- Status: scoped
- Spec: specs/001-add-localstorage-persistence.spec.md
Commit: d4e5f6g docs(001): scope - Add localStorage persistence for app state

Next:
/clear
/kanban-plan 001
```

## Next Steps

```
/clear
/kanban-plan {id}
```
