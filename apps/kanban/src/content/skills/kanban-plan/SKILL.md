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
{{> directory-reference}}

{{> helper-scripts show_find_task=true show_find_spec=true show_get_date_time=true show_get_skill_config=true}}

{{> product-docs-scripts show_search_product=true show_list_product=true}}

{{> engineering-docs-scripts show_search_engineering=true show_list_engineering=true}}

{{> column-transition from="scoped" to="planned"}}
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
    {{> workflow-load}}
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
    <action>Parse XML</action>
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
    <action>Get `spec` attribute from task XML</action>
    <branch condition="task not found">
      <output>Error: Task not found</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="verify_branch">
    {{> branch-verify-task}}
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
    <branch condition="task has `affects` field in XML">
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
    <branch condition="task has `engineering` field in XML">
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
    <validate>Check if `.kanban/tasks/{taskId}/plan.xml` exists</validate>
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

  <step name="load_directives">
    {{> load-directives skill="plan"}}
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

    <action name="breaking_changes">
      <note>For any renames, API changes, or config restructuring:</note>
      - Document exact old→new mapping (not just "rename X to Y")
      - List all affected locations
      - Format: old string/pattern → new string/pattern
    </action>

    <action name="inventory">
      <note>For bulk operations (updating many files, migrating many items):</note>
      - List ALL items explicitly (not "all 9 files")
      - Use inventory section with named sets
      - Prevents missing items during implementation
    </action>
  </step>

  <step name="create_plan_file" outputs="planPath">
    <action>Create at `.kanban/tasks/{taskId}/plan.xml`</action>
    <action>Use complexity-appropriate format (see templates in this skill)</action>
    <action>Link to spec in XML attributes</action>
    <action>Include all derived sections</action>

    <note>Plan must be self-contained: include enough context that the implementer doesn't need to constantly re-read the spec.</note>

    <example_code lang="xml" label="Plan Template (Pure XML)">
<plan task="{taskId}" spec="tasks/{taskId}/spec.xml" status="approved"
      complexity="{simple|medium|complex}" created="{YYYY-MM-DD}" updated="{YYYY-MM-DD}"
      generated-by="claude" model="{current model}" version="1" iteration="1">
  <title>{task title}</title>

  <overview>
    {2-3 sentence summary of the implementation approach - NOT just "see spec"}
    {Key architectural decision or pattern being followed}
  </overview>

  <approach>
    <rationale>
      {Why this approach - derived from spec's Existing Patterns and Research Findings}
      {Key patterns being followed with file:line references}
      {Any trade-offs considered during scoping}
    </rationale>
    <breaking-changes>
      <change type="rename|config|api">
        <old>{exact string/pattern/structure being replaced}</old>
        <new>{exact replacement}</new>
        <affects>{files or locations impacted}</affects>
      </change>
    </breaking-changes>
  </approach>

  <inventory>
    <set name="{descriptive-name}" count="{N}">
      <item>{path or identifier 1}</item>
      <item>{path or identifier 2}</item>
    </set>
  </inventory>

  <!-- Code Snippets: Include approximate code snippets in <action> when helpful.
       Show "current code" and "change to" for modifications. Snippets provide context
       for the implementing LLM since each command runs with fresh context.
       Snippets need not be perfect - they guide understanding. -->
  <tasks>
    <task id="1" type="auto">
      <name>First implementation step</name>
      <files>path/to/file.ts (create|modify|delete)</files>
      <requirements>FR1, FR2</requirements>
      <pattern>Pattern name at file:line</pattern>
      <action>
        - Step 1
        - Step 2
        - Step 3

        Current code (approximate):
        ```typescript
        // relevant snippet showing what exists
        ```

        Change to:
        ```typescript
        // snippet showing the target state
        ```
      </action>
      <verify>{verification command from directive OR project build/test command}</verify>
      <done>Acceptance criteria for this task</done>
    </task>

    <task id="2" type="auto" depends="1">
      <name>Second step (depends on first)</name>
      <files>path/to/other.ts (modify)</files>
      <requirements>FR3</requirements>
      <pattern>N/A</pattern>
      <action>
        - Implementation details
      </action>
      <verify>{verification command from directive OR project build/test command}</verify>
      <done>Verification criteria</done>
    </task>

    <task id="3" type="manual" depends="2">
      <name>Manual verification step</name>
      <files>N/A</files>
      <requirements>FR1-FR3</requirements>
      <pattern>N/A</pattern>
      <action>
        - Manual verification steps
      </action>
      <verify>Manual: Description of what to verify</verify>
      <done>All acceptance criteria verified</done>
    </task>
  </tasks>

  <testing>
    <automated>{what tests to write, if any - derived from FRs}</automated>
    <manual>{what to verify by hand - derived from acceptance criteria}</manual>
    <regression>{what existing behavior to confirm still works}</regression>
  </testing>

  <edge-cases>
    <case scenario="{edge case 1}">{how to handle}</case>
    <case scenario="{edge case 2}">{how to handle}</case>
    <case scenario="{edge case 3}">{how to handle}</case>
  </edge-cases>

  <pitfalls>
    <pitfall issue="{pitfall 1}">{mitigation}</pitfall>
    <pitfall issue="{pitfall 2}">{mitigation}</pitfall>
  </pitfalls>

  <iterations></iterations>
  <wip></wip>
  <completeness></completeness>
</plan>
    </example_code>

    <note>Task element attributes:</note>
    <table>
      | Attribute | Required | Description |
      |-----------|----------|-------------|
      | `id` | Yes | Sequential number (1, 2, 3...) |
      | `type` | Yes | "auto" (has executable verify) or "manual" (human verification) |
      | `depends` | No | Comma-separated IDs of prerequisite tasks |
    </table>

    <note>Task child elements:</note>
    <table>
      | Element | Required | Description |
      |---------|----------|-------------|
      | `<name>` | Yes | Brief description of the task |
      | `<files>` | Yes | Affected files with (create), (modify), or (delete) |
      | `<requirements>` | Yes | Which FRs from spec this satisfies |
      | `<pattern>` | No | Existing pattern to follow with file:line reference |
      | `<action>` | Yes | Specific steps to take (can be multi-line with - bullets) |
      | `<verify>` | Yes | Command to run OR "Manual: {description}" |
      | `<done>` | Yes | Acceptance criteria for this specific task |
    </table>

    <note>Verification types:</note>
    <note>- **Command verification:** `<verify>{command}</verify>` - Executed automatically. Derive from directive `<validation type="command">` when available.</note>
    <note>- **Manual verification:** `<verify>Manual: {description}</verify>` - Shown to user</note>
    <note>- Tasks with `type="manual"` always use manual verification</note>

    <note>Task creation guidelines:
1. ATOMIC: Each task = one logical change that leaves codebase working
2. VERIFIABLE: Every task has explicit `<verify>` command or manual step
3. TRACEABLE: Reference specific files and FRs from spec
4. ORDERED: Use `depends` to express prerequisites
5. PATTERN-AWARE: Include `<pattern>` reference when following existing code
6. SELF-CONTAINED: `<action>` has enough detail to implement without re-reading spec</note>
  </step>

  <step name="verify_plan_completeness">
    <note>Critical self-check: Ensure plan is implementable without conversation context.</note>

    <action>Re-read the plan you just created as if you had NO knowledge of this conversation</action>

    <validate>Ask yourself: "If context was cleared right now, could I implement this plan from scratch?"</validate>

    <checklist>
      <item>Does each task specify exact file paths (not relative references)?</item>
      <item>Does each task have enough detail in `<action>` to implement without re-reading spec?</item>
      <item>Are pattern references specific (file:line) not vague ("follow existing pattern")?</item>
      <item>Is the `<verify>` command concrete and executable?</item>
      <item>Are dependencies between tasks explicit via `depends` attribute?</item>
      <item>Does Technical Approach explain WHY this approach (not just WHAT)?</item>
      <item>Are edge cases specific to THIS implementation (not generic)?</item>
      <item>For breaking changes: Is there explicit old→new mapping for each change?</item>
      <item>For bulk operations: Is there an inventory listing ALL items (not "update all X files")?</item>
    </checklist>

    <branch condition="any checklist item fails">
      <action>Update the plan to add missing context</action>
      <action>Be specific: add file paths, line numbers, concrete commands</action>
      <action>Re-verify after updates</action>
    </branch>

    <output>
**Plan Completeness Check**
- [ ] File paths are absolute/specific
- [ ] Actions are self-contained
- [ ] Pattern references include file:line
- [ ] Verify commands are executable
- [ ] Dependencies are explicit
- [ ] Approach explains rationale
- [ ] Edge cases are specific
- [ ] Breaking changes have old→new mapping (or "None")
- [ ] Bulk operations have complete inventory (if applicable)

{If any failed, explain what was added to fix it}
    </output>
  </step>

  <step name="validate_plan">
    <note>Validate plan will achieve spec goals, not just complete tasks (GSD plan-checker pattern)</note>

    <action name="requirement_coverage">
      <note>Every functional requirement must have at least one task addressing it</note>
      <action>List all FRs from spec (FR1, FR2, etc.)</action>
      <action>For each FR, find tasks that reference it in their requirements field</action>
      <branch condition="any FR has no addressing task">
        <output>BLOCKER: FR{n} "{description}" has no task addressing it</output>
        <action>Add task to plan or update existing task to cover FR</action>
      </branch>
    </action>

    <action name="dependency_check">
      <note>No circular dependencies allowed</note>
      <action>Build dependency graph from task depends attributes</action>
      <branch condition="circular dependency detected">
        <output>BLOCKER: Circular dependency: {cycle}</output>
        <action>Fix dependency chain</action>
      </branch>
    </action>

    <action name="scope_sanity">
      <note>Plans should be reasonably sized</note>
      <branch condition="plan has more than 7 tasks">
        <output>WARNING: Plan has {n} tasks. Consider whether spec should be split.</output>
      </branch>
    </action>

    <action name="done_criteria_quality">
      <note>Done criteria should be observable outcomes, not implementation details</note>
      <action>Review each task's done element</action>
      <branch condition="done criteria describes implementation rather than outcome">
        <output>WARNING: Task {id} done criteria "{done}" describes implementation, not observable outcome</output>
        <note>Good: "User can log in with email and password"</note>
        <note>Bad: "Added validateCredentials function to auth.ts"</note>
      </branch>
    </action>

    <action name="wiring_check">
      <note>New components should be connected to existing code</note>
      <action>For each file marked as "create" in plan:</action>
      <action>Verify another task imports/uses/wires it</action>
      <branch condition="orphan file detected">
        <output>WARNING: {file} is created but never imported/used in plan</output>
      </branch>
    </action>

    <branch condition="any BLOCKER exists">
      <action>Fix blocking issues</action>
      <action>Re-run validate_plan</action>
    </branch>

    <branch condition="only WARNINGs exist">
      <output>Plan validated with warnings. Proceeding.</output>
    </branch>

    <branch condition="no issues">
      <output>Plan validated successfully.</output>
    </branch>
  </step>

  <step name="update_task_file">
    <action>Change `status: scoped` to `status: planned`</action>
    <action>Add `plan="tasks/{taskId}/plan.xml"` to task refs element</action>
    <action>Add `updated: {YYYY-MM-DD}`</action>
  </step>

  <step name="write_files">
    <action>Write plan file</action>
    <action>Write task file</action>
  </step>

  <step name="commit">
    <note>Format: `docs({taskId}): plan - {title}`</note>
    <command>git add .kanban/tasks/{taskId}/plan.xml .kanban/tasks/{taskId}/task.xml</command>
    <command>git commit -m "docs({taskId}): plan - {title}"</command>
  </step>

  {{> directive-compliance}}

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
    {{> skill-complete}}
  </step>
</process>

<success_criteria>
- Task file exists at `.kanban/tasks/{taskId}/task.xml`
- Task XML has `status="planned"`
- Task refs element has `plan="tasks/{taskId}/plan.xml"`
- Plan file exists at `.kanban/tasks/{taskId}/plan.xml`
- Plan is pure XML (no markdown or YAML frontmatter)
- Plan root element is `<plan>` with attributes: task, spec, status, complexity, iteration
- Plan has `<title>` element with task title
- Plan has `<overview>` element with implementation summary (not just "see spec")
- Plan has `<approach>` element with `<rationale>` and `<breaking-changes>` children
- Plan has `<tasks>` element with one or more `<task>` children
- Each `<task>` has: id, type attributes and name, files, requirements, action, verify, done children
- Plan has `<testing>` element with automated, manual, regression children
- Plan has `<edge-cases>` element with `<case>` children
- Plan has `<pitfalls>` element with `<pitfall>` children
- Git log shows `docs({taskId}): plan -`
- Next steps shown to user
</success_criteria>

<example>
User: `/kanban-plan 001`

```
Planning task 001 "Add localStorage persistence for app state"...

Reading functional specification...
- Spec: .kanban/tasks/001/spec.xml
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

Plan created: .kanban/tasks/001/plan.xml
- Complexity: medium
- 4 implementation steps (structured format)
- Testing strategy defined
- 3 edge cases identified
- 2 pitfalls documented

Task 001 moved to Planned
- Status: planned
- Spec: tasks/001/spec.xml
- Plan: tasks/001/plan.xml
Commit: g7h8i9j docs(001): plan - Add localStorage persistence for app state

Next:
/clear
/kanban-implement 001
```
</example>

<example_plan label="Example Medium-Complexity Plan Output">
```xml
<plan task="001" spec="tasks/001/spec.xml" status="approved"
      complexity="medium" created="2026-02-17" updated="2026-02-17"
      generated-by="claude" model="claude-opus-4-5-20251101" version="1" iteration="1">
  <title>Add localStorage persistence for app state</title>

  <overview>
    Implement state persistence using use-local-storage-state for reactive localStorage
    with cross-tab sync. State hydrates into Zustand on mount following the existing
    pattern in src/store/settings.ts. This approach was chosen over Zustand's built-in
    persist middleware because it provides tab synchronization.
  </overview>

  <approach>
    <rationale>
      Following two existing patterns:
      - State persistence: use-local-storage-state hook (new dependency, chosen during scoping for tab sync)
      - Hydration: Pattern at src/store/settings.ts:42-58 for loading external state into Zustand

      The localStorage key uses the app_ prefix convention found in src/utils/config.ts.
    </rationale>
    <breaking-changes>None</breaking-changes>
  </approach>

  <inventory></inventory>

  <tasks>
    <task id="1" type="auto">
      <name>Add persistence hook</name>
      <files>src/hooks/usePersistedState.ts (create)</files>
      <requirements>FR1, FR2</requirements>
      <pattern>Custom hook pattern from src/hooks/useSettings.ts:12</pattern>
      <action>
        - Create hook wrapping use-local-storage-state
        - Add TypeScript types for persisted state shape
        - Use app_state as localStorage key
      </action>
      <verify>pnpm --filter @example/app build</verify>
      <done>Hook exports correctly, build succeeds</done>
    </task>

    <task id="2" type="auto" depends="1">
      <name>Integrate with Zustand store</name>
      <files>src/store/index.ts (modify)</files>
      <requirements>FR3</requirements>
      <pattern>Hydration pattern at src/store/settings.ts:42-58</pattern>
      <action>
        - Import persistence hook
        - Add hydration effect on mount
        - Subscribe to store changes for persistence
      </action>
      <verify>pnpm --filter @example/app build</verify>
      <done>State persists after page refresh</done>
    </task>

    <task id="3" type="auto" depends="2">
      <name>Add sync subscription</name>
      <files>src/store/index.ts (modify)</files>
      <requirements>FR4</requirements>
      <pattern>N/A</pattern>
      <action>
        - Subscribe to localStorage changes from other tabs
        - Update Zustand state when external changes detected
      </action>
      <verify>pnpm --filter @example/app build</verify>
      <done>Change in one tab reflects in another tab</done>
    </task>

    <task id="4" type="manual" depends="3">
      <name>Final verification</name>
      <files>N/A</files>
      <requirements>FR1, FR2, FR3, FR4</requirements>
      <pattern>N/A</pattern>
      <action>
        - Verify all acceptance criteria from task met
        - Verify state persists across refresh
        - Verify state syncs across tabs
        - Verify no regressions in existing store functionality
      </action>
      <verify>Manual: Test all acceptance criteria</verify>
      <done>All acceptance criteria pass</done>
    </task>
  </tasks>

  <testing>
    <automated>None required (state management, manual verification sufficient)</automated>
    <manual>
      - Modify state, refresh page, verify state restored
      - Open two tabs, modify state in one, verify sync in other
      - Clear localStorage, verify app loads with defaults
    </manual>
    <regression>Verify existing Zustand actions still work correctly</regression>
  </testing>

  <edge-cases>
    <case scenario="localStorage unavailable (private browsing)">Fall back to in-memory state, no persistence</case>
    <case scenario="localStorage quota exceeded">Catch error, log warning, continue without persistence</case>
    <case scenario="Corrupted localStorage data">Validate on load, reset to defaults if invalid</case>
  </edge-cases>

  <pitfalls>
    <pitfall issue="Hydration timing">Must hydrate before first render to avoid flash; use Zustand persist subscribe pattern</pitfall>
    <pitfall issue="Key collision">Use unique app_state key with version prefix for future migrations</pitfall>
  </pitfalls>

  <iterations></iterations>
  <wip></wip>
  <completeness></completeness>
</plan>
```
</example_plan>

<next_steps>
```
/clear
/kanban-implement {id}
```
</next_steps>
