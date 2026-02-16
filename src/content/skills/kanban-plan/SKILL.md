---
name: kanban-plan
description: Create a plan document for a scoped task. Transforms functional specification into executable implementation checkboxes.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *)
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Plan Kanban Task

<purpose>
Create a plan file in `.kanban/tasks/{id}/` and move task from Scoped to Planned, then commit.
</purpose>

<context>
{{> directory-reference}}

{{> helper-scripts show_find_task=true show_find_spec=true show_get_date_time=true}}

{{> product-docs-scripts show_search_product=true show_list_product=true}}

{{> engineering-docs-scripts show_search_engineering=true show_list_engineering=true}}

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
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as taskId</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <action>List tasks in `scoped` status from `.kanban/tasks/`</action>
      <output>Show task IDs and titles</output>
      <prompt>Which task to plan?</prompt>
    </branch>
  </step>

  <step name="read_task_file" outputs="taskPath, title, specPath">
    <command>node .kanban/scripts/find-task.cjs {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse YAML frontmatter</action>
    <validate>Verify current status is `scoped`</validate>
    <branch condition="status is not scoped">
      <prompt>Task is in {status} status. Expected: scoped. Continue anyway? (y/n)</prompt>
    </branch>
    <action>Get `spec` path from frontmatter</action>
    <branch condition="task not found">
      <output>Error: Task not found</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="verify_branch">
    {{> branch-verify-task}}
  </step>

  <step name="read_spec" outputs="functionalRequirements, affectedFiles, existingPatterns">
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
    <action>Extract functional requirements, affected files, and existing patterns</action>
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
      <prompt>Plan already exists. Overwrite or view existing?</prompt>
    </branch>
  </step>

  <step name="load_user_skills">
    {{> hook-config command="plan"}}
  </step>

  <step name="create_plan_file" outputs="planPath">
    <action>Create at `.kanban/tasks/{taskId}/plan.md`</action>
    <action>Follow template at `.kanban/templates/plan.md`</action>
    <action>Link to spec in frontmatter</action>
    <action>Create implementation steps based on spec</action>

    <example_code lang="yaml">
---
task: "{taskId}"
spec: "tasks/{taskId}/spec.md"
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
See full specification: tasks/{taskId}/spec.md

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
    </example_code>

    <note>Step creation guidelines:
- Each step should be atomic and independently verifiable
- Reference specific files from spec's Affected Files section
- Map steps to Functional Requirements (FR1, FR2, etc.)
- Include testing/verification as explicit steps
- Order steps logically (dependencies first)
- Don't mix refactoring with feature work</note>
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
    <output>Print plan file path</output>
    <output>Print number of implementation steps created</output>
    <output>Print commit hash</output>
    <output>
Next:
/clear
/kanban-implement {taskId}
    </output>
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
- Plan frontmatter contains `iteration: 1`
- Plan contains `## Implementation Steps` section with checkboxes
- Git log shows `docs({taskId}): plan -`
- Next steps shown to user
</success_criteria>

<example>
User: `/kanban-plan 001`

```
Planning task 001 "Add OAuth Login"...

Reading functional specification...
- Spec: .kanban/tasks/001/spec.md
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

Plan created: .kanban/tasks/001/plan.md
- 8 implementation steps
- References FR1-FR4
- Includes verification step

Task 001 moved to Planned
- Status: planned
- Spec: tasks/001/spec.md
- Plan: tasks/001/plan.md
Commit: g7h8i9j docs(001): plan - Add OAuth Login

Next:
/clear
/kanban-implement 001
```
</example>

<next_steps>
```
/clear
/kanban-implement {id}
```
</next_steps>
