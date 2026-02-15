---
name: kanban-create
description: Create a new task in the kanban board and commit. Use when the user wants to add a task, ticket, bug, or feature to track.
allowed-tools: Read, Write, Bash(node *, git add *, git commit *, git status, git branch *)
argument-hint: "[task title]"
disable-model-invocation: true
---

# Create Kanban Task

<purpose>
Create a new task file in `.kanban/tasks/` in the Backlog column and commit it.
</purpose>

<context>
{{> directory-reference}}

{{> helper-scripts show_next_id=true show_get_date_time=true}}

{{> product-docs-scripts show_search_product=true}}

{{> column-transition from="[New Task]" to="backlog"}}
</context>

<prohibited>
- Do not use `Search()` or `Glob()` to find files manually
- Do not read `.kanban/config.yaml` directly
- Do not run `ls` commands to explore directories
- Do not create files in `.kanban/product/` (that's for product docs, not tasks)
- Do not skip the commit step
- Do not guess filenames or IDs — always use the helper scripts
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="verify_branch">
    {{> branch-verify-main}}
  </step>

  <step name="verify_kanban_exists">
    <validate>Check that `.kanban/tasks/` directory exists</validate>
    <branch condition="directory doesn't exist">
      <output>Error: Kanban not initialized. Run `npx claude-kanban init` first.</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="load_user_skills">
    {{> user-skills command="create"}}
  </step>

  <step name="get_next_id" outputs="nextId">
    <command>node .claude/scripts/next-id.cjs</command>
    <action>Use `nextId` from JSON output</action>
  </step>

  <step name="search_product_docs" when="`.kanban/product/` directory exists and is not empty">
    <action>Extract keywords from the task title (nouns, verbs, domain terms)</action>
    <command>node .claude/scripts/search-product.cjs {keyword1} {keyword2} ...</command>

    <branch condition="docs with score ≥ 0.5 found">
      <note>These docs describe existing features this task relates to</note>
      <action>Set `affects: [{matched-ids}]` in task frontmatter</action>
      <output>Related product docs: {ids}</output>
    </branch>

    <branch condition="no docs with score ≥ 0.3 found">
      <note>This may be a NEW feature not yet documented</note>
      <prompt>This looks like a new feature. What domain should it belong to? (e.g., auth, billing, users)</prompt>
      <action>Set `affects: [{domain}/{slug-from-title}]` - doc will be created during /kanban-docs</action>
    </branch>

    <branch condition="`.kanban/product/` is empty or doesn't exist">
      <action>Skip this step</action>
      <output>No product docs yet</output>
    </branch>
  </step>

  <step name="get_task_details" outputs="title, slug, priority, labels">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as title</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <prompt>What is the task title?</prompt>
    </branch>
    <action>Ensure title follows best practices (suggest improvements if needed)</action>
    <action>Generate initial description based on title</action>
    <action>Set status to first column ID from kanban-workflow.yaml (`backlog`)</action>
    <prompt>What priority? (use priority IDs from kanban-workflow.yaml)</prompt>
    <note>Default to `medium` if not specified</note>
  </step>

  <step name="detect_vague" when="task has vagueness indicators">
    <validate>Check if task was created with ONLY a title (no $ARGUMENTS body/description provided)</validate>
    <validate>Check if title is very short (&lt;5 words) without clear action verb</validate>
    <validate>Check if no description could be generated (title too ambiguous)</validate>
    <branch condition="ANY vagueness indicator detected">
      <action>Add `needs-refinement` to labels array (from kanban-workflow.yaml)</action>
      <output>Task marked as needs-refinement. Run `/kanban-refine {id}` to clarify before planning.</output>
    </branch>
  </step>

  <step name="determine_label">
    <action>Use `labels[].detect-keywords` from kanban-workflow.yaml to auto-detect label from title/context</action>
    <branch condition="label unclear">
      <prompt>Confirm label or skip?</prompt>
    </branch>
  </step>

  <step name="create_task_file">
    <warning>Write to `.kanban/tasks/` — NOT `.kanban/product/`</warning>
    <action>Read template from `.claude/kanban-templates/task.md`</action>
    <action>Create file at `.kanban/tasks/{nextId}-{slug}.md`</action>
    <note>`{nextId}` = the nextId from step get_next_id (e.g., "001")</note>
    <note>`{slug}` = lowercase title with hyphens (e.g., "add-priority-status")</note>
    <action>Fill frontmatter: `id`, `title`, `status: backlog`, `priority`, `labels`, `created`, `affects`</action>
    <action>Fill body: `## Description`, `## Notes`</action>
    <note>Leave empty (filled in later phases): other sections</note>
  </step>

  <step name="commit">
    <note>Format: `docs({nextId}): create - {title}`</note>
    <command>git add .kanban/tasks/{nextId}-{slug}.md</command>
    <command>git commit -m "docs({nextId}): create - {title}"</command>
  </step>

  <step name="output_result">
    <output>Print the created file path and task ID</output>
    <output>Print commit hash</output>
    <branch condition="needs-refinement label was added">
      <output>Note: Task marked as needs-refinement</output>
    </branch>
  </step>
</process>

<success_criteria>
- Task file exists at `.kanban/tasks/{nextId}-*.md`
- Frontmatter contains `id: "{nextId}"`
- Frontmatter contains `status: backlog`
- Frontmatter contains `title: "{title}"`
- Task file contains `## Description` section
- Git log shows `docs({nextId}): create -`
- Next steps shown to user
</success_criteria>

<example>
User: `/kanban-create Fix login redirect bug`

Creates: `.kanban/tasks/002-fix-login-redirect-bug.md`

```
Task 002 created in Backlog
Title: Fix login redirect bug
Labels: [bug]
File: .kanban/tasks/002-fix-login-redirect-bug.md
Commit: a1b2c3d docs(002): create - Fix login redirect bug

Next:
/clear
/kanban-refine 002
```
</example>

<next_steps>
```
/clear
/kanban-refine {id}
```
</next_steps>
