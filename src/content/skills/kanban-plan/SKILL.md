---
name: kanban-plan
description: Create a plan document for a scoped task. Transforms functional specification into executable implementation checkboxes.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *)
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Plan Kanban Task

<purpose>
Create a plan file in `.kanban/plans/` and move task from Scoped to Planned, then commit.
</purpose>

<context>
{{> directory-reference}}

{{> helper-scripts show_find_task=true show_find_spec=true show_get_date_time=true}}

{{> product-docs-scripts show_search_product=true show_list_product=true}}

{{> column-transition from="scoped" to="planned"}}
</context>

<prohibited>
- Do not create a plan without reading the spec first
- Do not create vague or non-atomic steps
- Do not skip the commit step
- Do not plan tasks that haven't been scoped
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="get_task_id" outputs="taskId">
    Use $ARGUMENTS if provided (e.g., "001"), otherwise:
    - List tasks in `scoped` status from `.kanban/tasks/`
    - Show task IDs and titles
    - Ask user which task to plan
  </step>

  <step name="read_task_file" outputs="taskPath, title, specPath">
    - Run `node .claude/scripts/find-task.cjs {taskId}` to get exact path
    - Read the file at the `path` from JSON output
    - Parse YAML frontmatter
    - Verify current status is `scoped`:
      - If not scoped, warn user and confirm they want to proceed
    - Get `spec` path from frontmatter
    - Error if task not found
  </step>

  <step name="verify_branch">
    {{> branch-verify-task}}
  </step>

  <step name="read_spec" outputs="functionalRequirements, affectedFiles, existingPatterns">
    - Run `node .claude/scripts/find-spec.cjs {taskId}` to get exact path
    - Read the spec file at the `path` from JSON output
    - If spec not found, BLOCK planning with message:
      ```
      Task {taskId} needs scoping before planning.
      Run: /kanban-scope {taskId}
      ```
    - Extract functional requirements, affected files, and existing patterns
  </step>

  <step name="research_product_docs" outputs="productContext">
    **Read product documentation for implementation context:**

    1. **Check task's affects field:**
       - If task has `affects` field in frontmatter:
         - For each product doc ID: Read `.kanban/product/{id}.md`
         - Note: current behavior, UI components, user flows, constraints

    2. **Search for related product docs:**
       - Extract key terms from spec (feature names, component names, domains)
       - Run `node .claude/scripts/search-product.cjs {keywords}` to find related docs
       - Read any docs with score ≥ 0.3 that weren't already read

    3. **List product docs if unsure:**
       - Run `node .claude/scripts/list-product.cjs` to see all available docs
       - Identify any obviously relevant docs by domain/name

    **Use this context to:**
    - Understand existing user-facing behavior that may constrain implementation
    - Identify UI patterns and terminology to maintain consistency
    - Ensure plan steps account for documented feature interactions
  </step>

  <step name="check_existing_plan">
    - Check if `.kanban/plans/{taskId}-{slug}.plan.md` exists
    - If exists, ask if user wants to overwrite or view existing
  </step>

  <step name="load_user_skills">
    {{> user-skills command="plan"}}
  </step>

  <step name="create_plan_file" outputs="planPath, slug">
    Create at `.kanban/plans/{taskId}-{slug}.plan.md`
    - Follow template at `.claude/kanban-templates/plan.md`
    - Link to spec in frontmatter
    - Create implementation steps based on spec

    ```yaml
    ---
    task: "{taskId}"
    spec: "specs/{taskId}-{slug}.spec.md"
    status: approved
    created: {YYYY-MM-DD}
    generated_by: claude
    model: {current model}
    version: 1
    iteration: 1
    ---

    # Plan: {task title}

    ## Overview

    {Brief summary referencing functional spec}
    See full specification: specs/{taskId}-{slug}.spec.md

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
    - [ ] Step N: Verify acceptance criteria are met
    ```

    **Step creation guidelines:**
    - Each step should be atomic and independently verifiable
    - Reference specific files from spec's Affected Files section
    - Map steps to Functional Requirements (FR1, FR2, etc.)
    - Include testing/verification as explicit steps
    - Order steps logically (dependencies first)
    - Don't mix refactoring with feature work
  </step>

  <step name="update_task_file">
    - Change `status: scoped` to `status: planned`
    - Add `plan: "plans/{taskId}-{slug}.plan.md"` to frontmatter
    - Add `updated: {YYYY-MM-DD}`
  </step>

  <step name="write_files">
    - Write plan file
    - Write task file
  </step>

  <step name="commit">
    Format: `docs({taskId}): plan - {title}`

    ```bash
    git add .kanban/plans/{taskId}-{slug}.plan.md .kanban/tasks/{taskId}-*.md
    git commit -m "docs({taskId}): plan - {title}"
    ```
  </step>

  <step name="output_result">
    - Print: "Task {taskId} moved to Planned"
    - Print plan file path
    - Print number of implementation steps created
    - Print commit hash
    - Print next steps:
      ```
      Next:
      /clear
      /kanban-implement {taskId}
      ```
  </step>
</process>

<success_criteria>
- Task file exists at `.kanban/tasks/{taskId}-*.md`
- Task frontmatter contains `status: planned`
- Task frontmatter contains `plan: "plans/{taskId}-{slug}.plan.md"`
- Plan file exists at `.kanban/plans/{taskId}-{slug}.plan.md`
- Plan frontmatter contains `task: "{taskId}"`
- Plan frontmatter contains `spec: "specs/{taskId}-{slug}.spec.md"`
- Plan frontmatter contains `status: approved`
- Plan frontmatter contains `iteration: 1`
- Plan contains `## Implementation Steps` section with checkboxes
- Git log shows `docs({taskId}): plan -`
- Next steps shown to user
</success_criteria>

## Example

User: `/kanban-plan 001`

```
Planning task 001 "Add OAuth Login"...

Reading functional specification...
- Spec: .kanban/specs/001.spec.md
- 4 functional requirements
- 3 files to modify, 1 new file
- Using Passport.js pattern from existing auth

Researching product documentation...
- Task affects: auth/login, auth/session
- Reading .kanban/product/auth/login.md
- Reading .kanban/product/auth/session.md
- Searched for "oauth provider" - found auth/providers.md
- Product context: Login page has email/password fields, session expires after 24h

Creating implementation plan...

Plan created: .kanban/plans/001.plan.md
- 8 implementation steps
- References FR1-FR4
- Includes verification step

Task 001 moved to Planned
- Status: planned
- Spec: specs/001.spec.md
- Plan: plans/001.plan.md
Commit: g7h8i9j docs(001): plan - Add OAuth Login

Next:
/clear
/kanban-implement 001
```

## Next Steps

```
/clear
/kanban-implement {id}
```
