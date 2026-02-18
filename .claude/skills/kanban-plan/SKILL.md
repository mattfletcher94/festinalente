---
name: kanban-plan
description: Create a plan document for a scoped task. Transforms functional specification into executable implementation steps with appropriate detail based on complexity.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *), AskUserQuestion
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Plan Kanban Task

<purpose>
Create a plan file in `.kanban/tasks/{id}/` and move task from Scoped to Planned, then commit. Plans are self-contained documents with enough context to implement without constantly re-reading the spec. Detail scales with complexity.
</purpose>

<context>
<note>
- **`.claude/skills/kanban-*/`** — Installed kanban skills — READ ONLY
- **`.kanban/`** — Project data and config — READ/WRITE
- **`.kanban/tasks/{id}/`** — Task folder containing `task.md`, `spec.md`, `plan.md`
- **`.kanban/scripts/`** — Helper scripts for kanban operations
- **`.kanban/templates/`** — Document templates
- **`.kanban/workflow.yaml`** — Workflow config (columns, labels, transitions)
- **`.kanban/directives/`** — User-defined directives (custom instructions for hooks)
</note>

<note>Use these scripts to reliably find files:</note>

<command description="Find task by ID (returns JSON with path and metadata)">node .kanban/scripts/find-task.cjs {id}</command>

<command description="Find spec by ID (returns JSON with path)">node .kanban/scripts/find-spec.cjs {id}</command>




<command description="Get current date/time (returns JSON with iso and date formats)">node .kanban/scripts/get-date-time.cjs</command>


<note>Use these scripts to work with product documentation:</note>

<command description="List all product docs (returns JSON with count and docs array)">node .kanban/scripts/list-product.cjs</command>
<command description="Filter by type">node .kanban/scripts/list-product.cjs --type=feature</command>
<command description="Filter by domain">node .kanban/scripts/list-product.cjs --domain=auth</command>

<command description="Search product docs by keywords (returns JSON sorted by relevance)">node .kanban/scripts/search-product.cjs keyword1 keyword2 ...</command>
<command description="With minimum score threshold">node .kanban/scripts/search-product.cjs password reset --min-score=0.3</command>
<note>Score interpretation: ≥0.5 = strong match | 0.3-0.5 = possible match | &lt;0.3 = weak match | No results = likely new feature</note>


<note>Path rule: ID `auth/login` → Path `.kanban/product/auth/login.md`</note>

<note>Use these scripts to work with engineering documentation:</note>

<command description="List all engineering docs (returns JSON with count and docs array)">node .kanban/scripts/list-engineering.cjs</command>
<command description="Filter by type">node .kanban/scripts/list-engineering.cjs --type=pattern</command>
<command description="Filter components by system">node .kanban/scripts/list-engineering.cjs --system=auth</command>

<command description="Search engineering docs by keywords (returns JSON sorted by relevance)">node .kanban/scripts/search-engineering.cjs keyword1 keyword2 ...</command>
<command description="With minimum score threshold">node .kanban/scripts/search-engineering.cjs middleware pattern --min-score=0.3</command>
<note>Score interpretation: ≥0.5 = strong match | 0.3-0.5 = possible match | &lt;0.3 = weak match | No results = likely new pattern/system</note>


<note>Path rules:
- `overview` → `.kanban/engineering/overview.md`
- `systems/auth` → `.kanban/engineering/systems/auth/index.md`
- `systems/auth/validator` → `.kanban/engineering/systems/auth/validator.md`
- `patterns/acyclic-arch` → `.kanban/engineering/patterns/acyclic-arch.md`
- `conventions/file-naming` → `.kanban/engineering/conventions/file-naming.md`
</note>

<note>Column transition: scoped → planned</note>
<note>See `.kanban/workflow.yaml` for column definitions and valid transitions</note>
</context>

<prohibited>
- Do not create a plan without reading the spec first
- Do not create vague or non-atomic steps
- Do not skip the commit step
- Do not plan tasks that haven't been scoped
- Do not create steps that mix multiple concerns (refactoring + features)
- Do not omit verification criteria for steps
</prohibited>

<process>
  <step name="load_workflow">
    <action>Read `.kanban/workflow.yaml` for column definitions, labels, priorities, and commit formats</action>
    <note>Use these values throughout this skill</note>
  </step>

  <step name="get_task_id" outputs="taskId">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as taskId</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <action>List tasks in `scoped` status from `.kanban/tasks/`</action>
      <action>Use AskUserQuestion tool with:
        - header: "Task"
        - question: "Which task would you like to plan?"
        - options: Build from task list (up to 4 scoped tasks), each with:
          - label: "{taskId}: {short title}" (truncate title if needed)
          - description: "Priority: {priority} | Has spec ready for planning"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a task ID directly</note>
    </branch>
  </step>

  <step name="read_task_file" outputs="taskPath, title, specPath">
    <command>node .kanban/scripts/find-task.cjs {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse YAML frontmatter</action>
    <validate>Verify current status is `scoped`</validate>
    <branch condition="status is not scoped">
      <action>Use AskUserQuestion tool with:
        - header: "Continue?"
        - question: "Task is in {status} status. Expected: scoped. Continue with planning anyway?"
        - options:
          - label: "Yes", description: "Proceed with planning despite unexpected status"
          - label: "No", description: "Cancel and check task status first"
        - multiSelect: false
      </action>
    </branch>
    <action>Get `spec` path from frontmatter</action>
    <branch condition="task not found">
      <output>Error: Task not found</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="verify_branch">
    <command>git branch --show-current</command>
    <validate>Must be on branch `task/{id}` where {id} is the task ID</validate>
    <branch condition="not on expected branch">
      <output>Error: This command must be run on branch task/{id}. Current branch: {branch}</output>
      <output>Suggest: Switch to task branch with `git checkout task/{id}`</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="read_spec" outputs="functionalRequirements, affectedFiles, existingPatterns, risks, technicalConstraints, dependencies">
    <command>node .kanban/scripts/find-spec.cjs {taskId}</command>
    <branch condition="spec found">
      <action>Read the spec file at the `path` from JSON output</action>
    </branch>
    <branch condition="spec NOT found">
      <output>
Task {taskId} needs scoping before planning.
Run: /kanban-scope {taskId}
      </output>
      <action>Exit</action>
    </branch>
    <action>Extract all sections: functional requirements, affected files, existing patterns, risks, technical constraints, dependencies</action>
  </step>

  <step name="assess_complexity" outputs="complexity">
    <note>Determine complexity to scale plan detail appropriately:</note>

    <action>Count affected files from spec</action>
    <action>Count functional requirements from spec</action>
    <action>Count new files to create</action>
    <action>Count new external dependencies</action>

    <note>Complexity matrix (use highest level indicated):</note>
    <table>
      | Criteria              | Simple | Medium | Complex |
      |-----------------------|--------|--------|---------|
      | Affected files        | 1-2    | 3-5    | 6+      |
      | Functional requirements | ≤3   | 4-6    | 7+      |
      | New files created     | 0      | 1-2    | 3+      |
      | External dependencies | 0      | 0-1    | 2+      |
    </table>

    <output>Complexity: {simple|medium|complex}</output>
  </step>

  <step name="research_product_docs" outputs="productContext">
    <note>Read product documentation for implementation context:</note>

    <action>Check task's affects field</action>
    <branch condition="task has `affects` field in frontmatter">
      <action>For each product doc ID: Read `.kanban/product/{id}.md`</action>
      <action>Note: current behavior, UI components, user flows, constraints</action>
    </branch>

    <action>Search for related product docs</action>
    <action>Extract key terms from spec (feature names, component names, domains)</action>
    <command>node .kanban/scripts/search-product.cjs {keywords}</command>
    <action>Read any docs with score ≥ 0.3 that weren't already read</action>

    <action>List product docs if unsure</action>
    <command>node .kanban/scripts/list-product.cjs</command>
    <action>Identify any obviously relevant docs by domain/name</action>

    <note>Use this context to:
- Understand existing user-facing behavior that may constrain implementation
- Identify UI patterns and terminology to maintain consistency
- Ensure plan steps account for documented feature interactions</note>
  </step>

  <step name="research_engineering_docs" outputs="engineeringContext">
    <note>Read engineering documentation for implementation patterns:</note>

    <action>Check task's engineering field</action>
    <branch condition="task has `engineering` field in frontmatter">
      <action>For each engineering doc ID: Read doc (use ID→path rules)</action>
      <action>Note: patterns to follow, conventions, system interactions</action>
    </branch>

    <action>Search for related engineering docs</action>
    <action>Extract technical terms from spec (systems, patterns, components)</action>
    <command>node .kanban/scripts/search-engineering.cjs {keywords}</command>
    <action>Read any docs with score ≥ 0.3 that weren't already read</action>

    <action>List engineering docs if unsure</action>
    <command>node .kanban/scripts/list-engineering.cjs</command>
    <action>Identify any obviously relevant docs by type/name</action>

    <note>Use this context to:
- Follow established architectural patterns
- Reference existing implementations as guides
- Ensure plan steps align with codebase conventions
- Identify relevant systems and components to consider</note>
  </step>

  <step name="check_existing_plan">
    <validate>Check if `.kanban/tasks/{taskId}/plan.md` exists</validate>
    <branch condition="plan exists">
      <action>Use AskUserQuestion tool with:
        - header: "Plan exists"
        - question: "A plan already exists for this task. What would you like to do?"
        - options:
          - label: "Overwrite", description: "Create a new plan, replacing the existing one"
          - label: "View existing", description: "Show the current plan without changes"
        - multiSelect: false
      </action>
    </branch>
  </step>

  <step name="load_hook_config">
    <step name="load_hook_config">
      <command>node .kanban/scripts/get-hook-config.cjs kanban-plan</command>
      <action>Parse the JSON output</action>
    
      <branch condition="directives.length > 0">
        <warning>Directives are MANDATORY. You MUST follow them.</warning>
        <action>For EACH directive where `exists` is `true`:</action>
        <action>Read the directive file at `path`</action>
        <action>Follow ALL instructions as mandatory requirements</action>
      </branch>
    
      <branch condition="product.length > 0 OR engineering.length > 0">
        <note>Context docs are for guidance, not mandatory.</note>
        <action>Read any product/engineering docs where `exists` is `true`</action>
        <action>Use these for additional context as needed</action>
      </branch>
    </step>
    
    <example_code lang="json">
    {
      "hook": "kanban-plan",
      "directives": [
        { "name": "my-directive", "path": ".kanban/directives/my-directive/DIRECTIVE.md", "exists": true }
      ],
      "product": [],
      "engineering": []
    }
    </example_code>
  </step>

  <step name="derive_plan_sections" outputs="technicalApproach, testingStrategy, edgeCases, pitfalls">
    <note>Derive plan sections from spec content:</note>

    <action name="technical_approach">
      <note>Synthesize from spec's Existing Patterns, Technical Constraints, and Research Findings:</note>
      - What patterns are being followed and why
      - Key architectural decisions made during scoping
      - Trade-offs that were considered
    </action>

    <action name="testing_strategy">
      <note>Derive from functional requirements and affected files:</note>
      - Automated: What tests to write (unit, integration) based on FRs
      - Manual: What to verify by hand based on acceptance criteria
      - Regression: What existing behavior to confirm still works based on affected files
    </action>

    <action name="edge_cases">
      <note>Extract from spec's Risks section and acceptance criteria:</note>
      - Boundary conditions implied by requirements
      - Empty states, error states, limits
      - Each edge case with how to handle it
    </action>

    <action name="pitfalls">
      <note>Derive from spec's Risks & Mitigations and Technical Constraints:</note>
      - Known gotchas with mitigations
      - Order-dependent operations
      - Common mistakes to avoid
    </action>
  </step>

  <step name="create_plan_file" outputs="planPath">
    <action>Create at `.kanban/tasks/{taskId}/plan.md`</action>
    <action>Use complexity-appropriate format (see templates in this skill)</action>
    <action>Link to spec in frontmatter</action>
    <action>Include all derived sections</action>

    <note>Plan must be self-contained: include enough context that the implementer doesn't need to constantly re-read the spec.</note>

    <example_code lang="yaml" label="Plan Template">
---
task: "{taskId}"
spec: "tasks/{taskId}/spec.md"
status: approved
created: {YYYY-MM-DD}
generated_by: claude
model: {current model}
version: 1
iteration: 1
complexity: {simple|medium|complex}
---

# Plan: {task title}

## Overview

{2-3 sentence summary of the implementation approach - NOT just "see spec"}
{Key architectural decision or pattern being followed}

See full specification: tasks/{taskId}/spec.md

## Technical Approach

{Why this approach - derived from spec's Existing Patterns and Research Findings}
{Key patterns being followed with file:line references}
{Any trade-offs considered during scoping}

## Implementation Steps

{Format varies by complexity - see below}

## Testing Strategy

- **Automated:** {what tests to write, if any - derived from FRs}
- **Manual:** {what to verify by hand - derived from acceptance criteria}
- **Regression:** {what existing behavior to confirm still works}

## Edge Cases

- {edge case 1} — {how to handle}
- {edge case 2} — {how to handle}
- {edge case 3} — {how to handle}

## Potential Pitfalls

- {pitfall 1} — {mitigation}
- {pitfall 2} — {mitigation}
    </example_code>

    <note>Step format by complexity:</note>

    <example_code lang="markdown" label="Simple (1-2 files, ≤3 FRs): Flat checkboxes">
## Implementation Steps

- [ ] Step 1: {description} `path/to/file.ts` (FR1)
- [ ] Step 2: {description} `path/to/file.ts` (FR2)
- [ ] Step 3: {description} `path/to/file.ts` (FR3)
- [ ] Step 4: Verify acceptance criteria — {what to check}
    </example_code>

    <example_code lang="markdown" label="Medium (3-5 files, 4-6 FRs): Structured steps with sub-tasks">
## Implementation Steps

### Step 1: {description}
**Files:** `path/to/file.ts`
**Requirements:** FR1, FR2
**Pattern:** {pattern name} at `path/to/example.ts:42`

- [ ] {sub-task 1}
- [ ] {sub-task 2}
- [ ] {sub-task 3}

**Verify:** {how to confirm this step is complete}

### Step 2: {description}
**Files:** `path/to/file.ts`, `path/to/other.ts`
**Requirements:** FR3

- [ ] {sub-task 1}
- [ ] {sub-task 2}

**Verify:** {how to confirm this step is complete}

### Step N: Final verification
- [ ] All acceptance criteria from task met
- [ ] No regressions in {affected area}
    </example_code>

    <example_code lang="markdown" label="Complex (6+ files, 7+ FRs): Phased steps with code snippets">
## Implementation Steps

### Phase 1: {phase name}

#### Step 1.1: {description}
**Files:** `path/to/file.ts` (create)
**Requirements:** FR1, FR2
**Pattern:** {pattern name} at `path/to/example.ts:42`

- [ ] {sub-task 1}
- [ ] {sub-task 2}

**Snippet:**
```typescript
// Expected implementation pattern
const example = usePattern({
  option: 'value'
})
```

**Verify:** {success criteria for this step}

#### Step 1.2: {description}
**Files:** `path/to/file.ts`
**Requirements:** FR3

- [ ] {sub-task 1}

**Verify:** {success criteria for this step}

### Phase 2: {phase name}

#### Step 2.1: {description}
...

### Phase N: Final verification
- [ ] All acceptance criteria from task met
- [ ] Integration testing complete
- [ ] No regressions in {affected areas}
    </example_code>

    <note>Step creation guidelines:
1. ATOMIC: Each step = one logical change that leaves codebase working
2. COMPLETE: Include all sub-tasks, pattern references, and verification criteria
3. TRACEABLE: Reference specific file(s) and FR(s) from spec
4. SEPARABLE: Don't mix concerns — refactoring separate from features
5. VERIFIABLE: Every step has explicit success criteria
6. SELF-CONTAINED: Include enough context to implement without re-reading spec</note>
  </step>

  <step name="update_task_file">
    <action>Change `status: scoped` to `status: planned`</action>
    <action>Add `plan: "tasks/{taskId}/plan.md"` to frontmatter</action>
    <action>Add `updated: {YYYY-MM-DD}`</action>
  </step>

  <step name="write_files">
    <action>Write plan file</action>
    <action>Write task file</action>
  </step>

  <step name="commit">
    <note>Format: `docs({taskId}): plan - {title}`</note>
    <command>git add .kanban/tasks/{taskId}/plan.md .kanban/tasks/{taskId}/task.md</command>
    <command>git commit -m "docs({taskId}): plan - {title}"</command>
  </step>

  <step name="output_result">
    <output>Print: "Task {taskId} moved to Planned"</output>
    <output>Print complexity level</output>
    <output>Print plan file path</output>
    <output>Print number of implementation steps created</output>
    <output>Print commit hash</output>
    <output>
Next:
/clear
/kanban-implement {taskId}
    </output>
    ## Final Validation
    
    Before completing, validate all task YAML frontmatter:
    
    <command description="Validate YAML in all task files">node .kanban/scripts/validate-yaml.cjs</command>
    
    If validation fails, fix the reported errors before completing.
    
    <output>[KANBAN_COMPLETE]</output>
  </step>
</process>

<success_criteria>
- Task file exists at `.kanban/tasks/{taskId}/task.md`
- Task frontmatter contains `status: planned`
- Task frontmatter contains `plan: "tasks/{taskId}/plan.md"`
- Plan file exists at `.kanban/tasks/{taskId}/plan.md`
- Plan frontmatter contains `task: "{taskId}"`
- Plan frontmatter contains `spec: "tasks/{taskId}/spec.md"`
- Plan frontmatter contains `status: approved`
- Plan frontmatter contains `complexity: {simple|medium|complex}`
- Plan frontmatter contains `iteration: 1`
- Plan contains `## Overview` with implementation summary (not just "see spec")
- Plan contains `## Technical Approach` section
- Plan contains `## Implementation Steps` section with complexity-appropriate format
- Plan contains `## Testing Strategy` section
- Plan contains `## Edge Cases` section
- Plan contains `## Potential Pitfalls` section
- Git log shows `docs({taskId}): plan -`
- Next steps shown to user
</success_criteria>

<example>
User: `/kanban-plan 001`

```
Planning task 001 "Add localStorage persistence for app state"...

Reading functional specification...
- Spec: .kanban/tasks/001/spec.md
- 4 functional requirements
- 2 files to modify, 1 new file
- Using use-local-storage-state pattern

Assessing complexity...
- Affected files: 3
- Functional requirements: 4
- New files: 1
- External dependencies: 1
- Complexity: medium

Researching product documentation...
- Task affects: state/persistence
- Reading .kanban/product/state/persistence.md
- Product context: App currently loses state on refresh

Researching engineering documentation...
- Found: patterns/state-management
- Pattern: Zustand hydration at src/store/settings.ts:42

Deriving plan sections...
- Technical approach: use-local-storage-state + Zustand hydration
- Testing strategy: manual verification of persistence
- Edge cases: localStorage unavailable, quota exceeded
- Pitfalls: hydration timing, key collisions

Creating implementation plan...

Plan created: .kanban/tasks/001/plan.md
- Complexity: medium
- 4 implementation steps (structured format)
- Testing strategy defined
- 3 edge cases identified
- 2 pitfalls documented

Task 001 moved to Planned
- Status: planned
- Spec: tasks/001/spec.md
- Plan: tasks/001/plan.md
Commit: g7h8i9j docs(001): plan - Add localStorage persistence for app state

Next:
/clear
/kanban-implement 001
```
</example>

<example_plan label="Example Medium-Complexity Plan Output">
```markdown
---
task: "001"
spec: "tasks/001/spec.md"
status: approved
created: 2026-02-17
generated_by: claude
model: claude-opus-4-5-20251101
version: 1
iteration: 1
complexity: medium
---

# Plan: Add localStorage persistence for app state

## Overview

Implement state persistence using `use-local-storage-state` for reactive localStorage with cross-tab sync. State hydrates into Zustand on mount following the existing pattern in `src/store/settings.ts`. This approach was chosen over Zustand's built-in persist middleware because it provides tab synchronization.

See full specification: tasks/001/spec.md

## Technical Approach

Following two existing patterns:
- **State persistence:** `use-local-storage-state` hook (new dependency, chosen during scoping for tab sync)
- **Hydration:** Pattern at `src/store/settings.ts:42-58` for loading external state into Zustand

The localStorage key uses the `app_` prefix convention found in `src/utils/config.ts`.

## Implementation Steps

### Step 1: Add persistence hook
**Files:** `src/hooks/usePersistedState.ts` (create)
**Requirements:** FR1, FR2
**Pattern:** Custom hook pattern from `src/hooks/useSettings.ts`

- [ ] Create hook wrapping `use-local-storage-state`
- [ ] Add TypeScript types for persisted state shape
- [ ] Use `app_state` as localStorage key

**Verify:** Hook exports correctly, TypeScript compiles

### Step 2: Integrate with Zustand store
**Files:** `src/store/index.ts`
**Requirements:** FR3
**Pattern:** Hydration at `src/store/settings.ts:42-58`

- [ ] Import persistence hook
- [ ] Add hydration effect on mount
- [ ] Subscribe to store changes for persistence

**Verify:** State persists after page refresh

### Step 3: Add sync subscription
**Files:** `src/store/index.ts`
**Requirements:** FR4

- [ ] Subscribe to localStorage changes from other tabs
- [ ] Update Zustand state when external changes detected

**Verify:** Change in one tab reflects in another tab

### Step 4: Final verification
- [ ] All acceptance criteria from task met
- [ ] State persists across refresh
- [ ] State syncs across tabs
- [ ] No regressions in existing store functionality

## Testing Strategy

- **Automated:** None required (state management, manual verification sufficient)
- **Manual:**
  - Modify state, refresh page, verify state restored
  - Open two tabs, modify state in one, verify sync in other
  - Clear localStorage, verify app loads with defaults
- **Regression:** Verify existing Zustand actions still work correctly

## Edge Cases

- localStorage unavailable (private browsing) — fall back to in-memory state, no persistence
- localStorage quota exceeded — catch error, log warning, continue without persistence
- Corrupted localStorage data — validate on load, reset to defaults if invalid

## Potential Pitfalls

- Hydration timing — must hydrate before first render to avoid flash; use Zustand's `persist` subscribe pattern
- Key collision — use unique `app_state` key with version prefix for future migrations
```
</example_plan>

<next_steps>
```
/clear
/kanban-implement {id}
```
</next_steps>
