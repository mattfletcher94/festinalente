# Templates System Plan

## Overview

This document captures the decisions made for implementing a centralized templates system in Claude Kanban. Templates will be reusable markdown files that skills reference, ensuring consistent structure and enabling LLM adherence to specific formats.

---

## Templates to Create

### 1. Task Template

**Location:** `.claudeban/templates/task.md`

**Purpose:** Master template for kanban task files. Sections are filled progressively across phases.

**Structure:**

```markdown
---
id: "{id}"
title: "{title}"
status: backlog|refined|scoped|planned|in-progress|verify|review|update-docs|done
priority: high|medium|low
labels: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
completed: YYYY-MM-DD
spec: "specs/{id}.spec.md"
plan: "plans/{id}.plan.md"
---

# {Title}

## Description
{Brief description of the task}

## What problem are you trying to solve?
{Filled during refine phase via Q&A - user may skip or have LLM fill in}

## What value would it provide if solved?
{Filled during refine phase via Q&A - user may skip or have LLM fill in}

## Acceptance Criteria

<!-- Use Gherkin format (Given/When/Then) -->

Given {precondition}
When {action}
Then {expected outcome}
And {additional outcome}

## Notes
{Technical notes, constraints, additional context}
```

**Phase Mapping:**
| Section | Filled During |
|---------|---------------|
| Title, Description | `define-task` |
| Problem, Value, Acceptance Criteria | `refine-task` (Q&A approach) |
| spec/plan frontmatter links | `scope-task` / `plan-task` |

---

### 2. Functional Specification Template

**Location:** `.claudeban/templates/spec.md`

**File Location:** `.kanban/specs/{id}.spec.md`

**Purpose:** Detailed specification that feeds directly into the planning step. Must contain enough detail for an unfamiliar developer (or LLM) to implement without clarifying questions.

**Structure:**

```markdown
---
task: "{id}"
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Functional Specification: {title}

## Context
{Background - what exists today, why this change is needed}
{Pulls from task's "problem" and "value" sections}

## Scope

### In Scope
- {What this spec covers}

### Out of Scope
- {Explicit boundaries - prevents scope creep}

## Functional Requirements
{What the system must do. Each requirement should be testable.}

- FR1: The system shall...
- FR2: The system shall...
- FR3: The system shall...

## Affected Files
- `path/to/file.ts` (modify) - {reason}
- `path/to/new-file.ts` (create) - {reason}
- `path/to/old-file.ts` (delete) - {reason}

## Existing Patterns
{LLM actively searches codebase for similar implementations}
{User-defined skills may provide additional pattern guidance}

- **Pattern:** {description}
  - Reference: `path/to/example.ts:42`
- **Pattern:** {description}
  - Reference: `path/to/another.ts:15`

## Technical Constraints
- {Must use existing X library}
- {Cannot modify Y because...}
- {Performance requirement: ...}
- {Compatibility requirement: ...}

## Dependencies

### External
- {Libraries/APIs needed}

### Internal
- {Other tasks/features this depends on}

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| {risk description} | {high/medium/low} | {mitigation strategy} |

## Open Questions
{Unresolved items that need clarification before/during implementation}

- [ ] {Question 1}
- [ ] {Question 2}
```

**Key Behaviors:**
- Created during `scope-task` phase
- LLM actively searches for existing patterns (not just user input)
- User-defined skills in `board.yaml` can provide additional guidance
- Linked from task frontmatter via `spec: "specs/{id}.spec.md"`

---

### 3. Plan Template

**Location:** `.claudeban/templates/plan.md`

**File Location:** `.kanban/plans/{id}.plan.md`

**Purpose:** Actionable implementation steps derived from the functional specification.

**Structure:**

```markdown
---
task: "{id}"
spec: "specs/{id}.spec.md"
status: draft|approved|in-progress|completed
created: YYYY-MM-DD
updated: YYYY-MM-DD
generated_by: human|claude
model: {model-name}
version: 1
iteration: 1
---

# Plan: {title}

## Overview
{Brief summary of implementation approach}
{References functional spec for full context}

## Implementation Steps

<!-- Step Guidelines:
1. ATOMIC: Each step = one logical change that leaves codebase working
2. COMPLETE: Understand desired change, definition of done, all sub-steps, all info needed
3. TRACEABLE: Reference specific file(s) and/or FR from spec
4. SEPARABLE: Don't mix concerns - refactoring separate from features
5. TESTABLE: The change can be verified (test, type-check, manual)
-->

- [ ] Step 1: {description} `path/to/file.ts` (FR1)
- [ ] Step 2: {description} `path/to/file.ts` (FR1)
- [ ] Step 3: {description} `path/to/new.ts` (FR2)

## Iterations
<!-- Added by verify-fail-task or review-fail-task -->

### Attempt {n} — {Phase} Failed ({YYYY-MM-DD})

**Phase:** verify|review
**Result:** failed

**Errors/Issues:**
- {error or feedback item}

**Action:** {guidance for fixing}

## WIP Notes
<!-- Added by in-progress-wip-commit -->

**Last WIP:** YYYY-MM-DD
**Progress:** {completed}/{total} steps

**Continuation hints:**
- Next step: {description}
- Context: {relevant context for resuming}
```

**Step Guidelines (Research-Backed):**

Based on best practices from atomic commits and task breakdown research:

1. **ATOMIC:** Each step represents one logical change that leaves the codebase in a working state
2. **COMPLETE:** Before starting, can answer "yes" to:
   - Do I understand what change is desired?
   - Do I understand what "done" looks like?
   - Can I define all sub-steps to get to "done"?
   - Do I have all info needed to start?
3. **TRACEABLE:** References specific file(s) and maps to Functional Requirements (FR1, FR2, etc.)
4. **SEPARABLE:** Don't mix concerns - refactoring should be separate from feature work
5. **TESTABLE:** The change can be verified through tests, type-checking, or manual verification

**Sources:**
- [Jacob Kaplan-Moss - Breaking Down Tasks](https://jacobian.org/2024/mar/11/breaking-down-tasks/)
- [Atomic Commits Best Practices](https://gitbybit.com/gitopedia/best-practices/atomic-commits)

---

## Template Reference Pattern

### How Skills Reference Templates

Skills will reference templates from the centralized folder rather than embedding format inline.

**Current approach (inline in skill):**
```markdown
Create a task file with this structure:
---
id: "001"
title: ...
---
## Description
...
```

**New approach (reference template):**
```markdown
Create a task file following the template at `.claudeban/templates/task.md`
Fill in the following sections for this phase:
- Title (frontmatter)
- Description
```

### Benefits
- Single source of truth for document structure
- Skills focus on workflow, not format
- Easier to update formats across all skills
- LLM has clear, consistent structure to follow

---

## Folder Structure

```
.claudeban/
├── templates/
│   ├── board.yaml          # (existing) Board initialization template
│   ├── task.md             # Task file template
│   ├── spec.md             # Functional specification template
│   └── plan.md             # Implementation plan template
├── commands/
│   └── kanban/
│       └── ...
└── skills/
    └── kanban-*/
        └── SKILL.md        # Skills reference templates, not embed formats
```

---

## Phase-to-Template Mapping

| Phase | Command | Template(s) Used | Sections Filled |
|-------|---------|------------------|-----------------|
| Define | `define-task` | `task.md` | title, description |
| Refine | `backlog-refine-task` | `task.md` | problem, value, acceptance criteria (Gherkin) |
| Scope | `refined-scope-task` | `task.md`, `spec.md` | spec link, full spec document |
| Plan | `scoped-plan-task` | `task.md`, `plan.md` | plan link, full plan document |
| Implement | `planned-implement-task` | `plan.md` | step checkboxes |
| WIP | `in-progress-wip-commit` | `plan.md` | WIP Notes section |
| Verify Fail | `verify-fail-task` | `plan.md` | Iterations section |
| Review Fail | `review-fail-task` | `plan.md` | Iterations section |

---

## Q&A Approach for Refine Phase

During `refine-task`, the LLM uses a Q&A approach for each section:

1. **Ask the user** for input on each section
2. **Allow skipping** - user can skip any question
3. **LLM fills in** if user skips but context exists
4. **Mark as empty** if no context available

Example flow:
```
LLM: "What problem are you trying to solve with this task?"
User: "skip" / provides answer / "you fill it in"
LLM: [Records answer or generates from context]
```

---

## Gherkin Format for Acceptance Criteria

All acceptance criteria use full Given/When/Then format:

```gherkin
Given a user is logged in
And they are on the dashboard page
When they click the logout button
Then they are redirected to the login page
And their session is invalidated
And a success message is displayed
```

**Keywords:**
- `Given` - preconditions/context
- `When` - action/trigger
- `Then` - expected outcome
- `And` - additional conditions/outcomes
- `But` - negative conditions (optional)

---

## Commit Message Conventions

All commits include the task ID in the scope for easy searching.

**Format:** `{type}({id}): {action} - {description}`

| Command | Commit Message |
|---------|----------------|
| `define-task` | `docs(001): define - Add user authentication` |
| `refine-task` | `docs(001): refine - Add user authentication` |
| `scope-task` | `docs(001): scope - Add user authentication` |
| `plan-task` | `docs(001): plan - Add user authentication` |
| `wip-commit` | `wip(001): completed auth routes` |
| `verify-fail` | `docs(001): verify-fail - test failures` |
| `review-pass` | `feat(001): Add user authentication` |
| `review-fail` | `docs(001): review-fail - needs error handling` |
| `complete-task` | `docs(001): product - add authentication guide` |

**Notes:**
- `review-pass` uses `feat`, `fix`, or `refactor` based on task labels (no action keyword needed - the type tells the story)
- `wip` commits don't need the action keyword - the type is self-explanatory

**Searching:**

```bash
# All commits for task 001
git log --grep="(001)"

# All define phase commits
git log --grep="define -"

# All product docs updates
git log --grep="product -"

# All feature commits
git log --grep="^feat"

# All failed verifications
git log --grep="verify-fail"
```

**Parsing:**
- **Scope** contains task ID: `(001)`
- **Action keyword** before description: `define`, `refine`, `scope`, `plan`, `product`, `verify-fail`, `review-fail`
- **Type prefix** indicates nature: `docs`, `feat`, `fix`, `wip`, `refactor`

---

## Implementation Details

### File Paths

| File | Location | Action |
|------|----------|--------|
| Task template | `.claudeban/templates/task.md` | Create |
| Spec template | `.claudeban/templates/spec.md` | Create |
| Plan template | `.claudeban/templates/plan.md` | Create |
| Task schema | `example-project/.kanban/config/schema.task.json` | Add `spec` field |
| Plan schema | `example-project/.kanban/config/schema.plan.json` | Add `spec` field |
| README | `README.md` (root) | Update sections |
| All skills | `.claudeban/skills/kanban-*/SKILL.md` | Update to reference templates + new commits |

---

### Skill Modification: Before → After

**Current skill structure** (example from `kanban-define-task/SKILL.md`):

```markdown
## Commit

\`\`\`
docs(task): add {id} {title}
\`\`\`

...

7. **Create task file** at `.kanban/tasks/{id}-{slug}.md`:

\`\`\`yaml
---
id: "{id}"
title: "{title}"
status: backlog
...
---

# {title}

## Description
...

## Acceptance Criteria
- [ ] ...
\`\`\`

8. **Commit the task file**:
   \`\`\`bash
   git commit -m "docs(task): add {id} {title}"
   \`\`\`
```

**New skill structure:**

```markdown
## Commit

\`\`\`
docs({id}): define - {title}
\`\`\`

...

7. **Create task file** at `.kanban/tasks/{id}-{slug}.md`:
   - Follow template at `.claudeban/templates/task.md`
   - Fill sections for this phase:
     - Frontmatter: `id`, `title`, `status: backlog`, `priority`, `labels`, `created`
     - Body: `## Description`, `## Notes`
   - Leave empty (filled in later phases):
     - `## What problem are you trying to solve?`
     - `## What value would it provide if solved?`
     - `## Acceptance Criteria`
     - Frontmatter: `spec`, `plan`

8. **Commit the task file**:
   \`\`\`bash
   git commit -m "docs({id}): define - {title}"
   \`\`\`
```

---

### Commit Message Changes: Current → New

| Command | Current | New |
|---------|---------|-----|
| `define-task` | `docs(task): add {id} {title}` | `docs({id}): define - {title}` |
| `refine-task` | `docs(task): refine {id} {title}` | `docs({id}): refine - {title}` |
| `scope-task` | `docs(task): scope {id} {title}` | `docs({id}): scope - {title}` |
| `plan-task` | `docs(plan): {id} {title}` | `docs({id}): plan - {title}` |
| `wip-commit` | `wip({id}): {progress}` | `wip({id}): {progress}` (unchanged) |
| `verify-fail` | `docs(verify): fail {id}` | `docs({id}): verify-fail - {title}` |
| `review-pass` | `feat({id}): {title}` | `feat({id}): {title}` (unchanged) |
| `review-fail` | `docs(review): fail {id}` | `docs({id}): review-fail - {title}` |
| `complete-task` | `docs(product): {message}` | `docs({id}): product - {message}` |

---

### Schema Changes

**schema.task.json** - Add `spec` field:

```json
"spec": {
  "type": "string",
  "description": "Path to linked functional specification file"
}
```

**schema.plan.json** - Add `spec` field:

```json
"spec": {
  "type": "string",
  "description": "Path to linked functional specification file"
}
```

---

### README Updates

The README at `README.md` needs these sections updated/added:

**1. Update "Commands" table** - Update commit message format column

**2. Update "Git History" section** - Show new commit format:
```
docs(001): define - Add user authentication
docs(001): refine - Add user authentication
docs(001): scope - Add user authentication
docs(001): plan - Add user authentication
wip(001): completed auth routes
feat(001): Add user authentication
docs(001): product - add authentication guide
```

**3. Add "Searching Git History" section:**
```bash
# All commits for task 001
git log --grep="(001)"

# All define phase commits
git log --grep="define -"

# All feature commits
git log --grep="^feat"
```

**4. Update "Task File Format" section** - Show new template structure with:
- `## What problem are you trying to solve?`
- `## What value would it provide if solved?`
- `## Acceptance Criteria` (Gherkin format)
- `spec` and `plan` frontmatter fields

**5. Add "Templates" section** - Document:
- Templates location: `.claudeban/templates/`
- Available templates: `task.md`, `spec.md`, `plan.md`
- How skills reference templates

**6. Add "Functional Specification" section** - Document:
- Spec file location: `.kanban/specs/{id}.spec.md`
- When created (scope phase)
- Structure overview

**7. Update "Acceptance Criteria" subsection** - Add Gherkin format:
```gherkin
Given a user is logged in
When they click the logout button
Then they are redirected to the login page
And their session is invalidated
```

---

### Skills to Update

Each skill needs these changes:

| Skill | Template Reference | Commit Format | Other Changes |
|-------|-------------------|---------------|---------------|
| `kanban-define-task` | `task.md` | `docs({id}): define - {title}` | — |
| `kanban-backlog-refine-task` | `task.md` | `docs({id}): refine - {title}` | Add Q&A approach, Gherkin AC |
| `kanban-refined-scope-task` | `task.md`, `spec.md` | `docs({id}): scope - {title}` | Active pattern search, create spec file |
| `kanban-scoped-plan-task` | `plan.md` | `docs({id}): plan - {title}` | Link spec in plan frontmatter |
| `kanban-planned-implement-task` | `plan.md` | — | — |
| `kanban-in-progress-wip-commit` | `plan.md` | (unchanged) | — |
| `kanban-in-progress-verify-task` | — | — | — |
| `kanban-verify-pass-task` | — | — | — |
| `kanban-verify-fail-task` | `plan.md` | `docs({id}): verify-fail - {title}` | — |
| `kanban-review-pass-task` | — | (unchanged) | — |
| `kanban-review-fail-task` | `plan.md` | `docs({id}): review-fail - {title}` | — |
| `kanban-update-docs-complete-task` | — | `docs({id}): product - {message}` | — |

---

## Implementation Tasks

- [ ] Create `.claudeban/templates/task.md`
- [ ] Create `.claudeban/templates/spec.md`
- [ ] Create `.claudeban/templates/plan.md`
- [ ] Update `kanban-define-task/SKILL.md` to reference task template
- [ ] Update `kanban-backlog-refine-task/SKILL.md` to reference task template + Q&A approach
- [ ] Update `kanban-refined-scope-task/SKILL.md` to reference spec template + active pattern search
- [ ] Update `kanban-scoped-plan-task/SKILL.md` to reference plan template
- [ ] Update remaining skills to reference templates as needed
- [ ] Update task frontmatter schema to include `spec` field
- [ ] Update plan frontmatter schema to include `spec` field
- [ ] Update all skills with new commit message format `{type}({id}): {action} - {description}`
- [ ] Update README with:
  - Templates system overview
  - Task lifecycle and template usage
  - Commit message conventions and search examples
  - Gherkin format for acceptance criteria
- [ ] Test full workflow with new templates

---

## Open Questions

None currently - all decisions captured above.
