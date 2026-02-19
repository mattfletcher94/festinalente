---
name: kanban-create
description: Create a new task in the kanban board and commit. Use when the user wants to add a task, ticket, bug, or feature to track.
allowed-tools: Read, Write, Bash(node *, git add *, git commit *, git status, git branch *), AskUserQuestion
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

{{> engineering-docs-scripts show_search_engineering=true}}

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

  <step name="load_hook_config">
    {{> hook-config command="create"}}
  </step>

  <step name="get_next_id" outputs="nextId">
    <command>node .kanban/scripts/next-id.cjs</command>
    <action>Use `nextId` from JSON output</action>
  </step>

  <step name="get_task_title" outputs="title, slug">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as title</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <prompt>What is the task title?</prompt>
    </branch>
    <action>Ensure title follows best practices (suggest improvements if needed)</action>
    <action>Generate slug from title for file naming</action>
  </step>

  <step name="search_product_docs" when="`.kanban/product/` directory exists and is not empty">
    <action>Extract keywords from the established title (nouns, verbs, domain terms)</action>
    <command>node .kanban/scripts/search-product.cjs {keyword1} {keyword2} ...</command>

    <branch condition="docs with score ≥ 0.5 found">
      <note>These docs describe existing features this task relates to</note>
      <action>Set `affects: [{matched-ids}]` in task XML</action>
      <output>Related product docs: {ids}</output>
    </branch>

    <branch condition="no docs with score ≥ 0.3 found">
      <note>This may be a NEW feature not yet documented</note>
      <action>If existing domains are known from `.kanban/product/` folder structure, use AskUserQuestion tool with:
        - header: "Domain"
        - question: "This looks like a new feature. What domain should it belong to?"
        - options: Build from existing domain folders (up to 4), each with:
          - label: "{domain}", description: "Group with other {domain} features"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a custom domain</note>
      <action>Set `affects: [{domain}/{slug-from-title}]` - doc will be created during /kanban-docs</action>
    </branch>

    <branch condition="`.kanban/product/` is empty or doesn't exist">
      <action>Skip this step</action>
      <output>No product docs yet</output>
    </branch>
  </step>

  <step name="search_engineering_docs" when="`.kanban/engineering/` directory exists and is not empty">
    <action>Extract keywords from the established title (technical terms, patterns, system names)</action>
    <command>node .kanban/scripts/search-engineering.cjs {keyword1} {keyword2} ...</command>

    <branch condition="docs with score ≥ 0.5 found">
      <note>These docs describe existing patterns/systems this task relates to</note>
      <action>Set `engineering: [{matched-ids}]` in task XML</action>
      <output>Related engineering docs: {ids}</output>
    </branch>

    <branch condition="no docs with score ≥ 0.3 found">
      <note>This may involve new patterns/systems not yet documented</note>
      <action>Leave `engineering: []` empty - docs will be created during /kanban-docs if needed</action>
    </branch>

    <branch condition="`.kanban/engineering/` is empty or doesn't exist">
      <action>Skip this step</action>
      <output>No engineering docs yet</output>
    </branch>
  </step>

  <step name="get_priority" outputs="priority">
    <action>Use AskUserQuestion tool with:
      - header: "Priority"
      - question: "What priority should this task have?"
      - options:
        - label: "High", description: "Urgent or blocking other work"
        - label: "Medium (Recommended)", description: "Normal priority, will be done in order"
        - label: "Low", description: "Nice to have, can wait"
      - multiSelect: false
    </action>
  </step>

  <step name="determine_label">
    <action>Use `labels[].detect-keywords` from kanban-workflow.yaml to auto-detect label from title/context</action>
    <branch condition="label auto-detected">
      <action>Use AskUserQuestion tool with:
        - header: "Label"
        - question: "Auto-detected label: {detected-label}. Is this correct?"
        - options:
          - label: "Yes", description: "Use {detected-label} as the task label"
          - label: "No", description: "Choose a different label"
        - multiSelect: false
      </action>
      <branch condition="user selects No">
        <action>Use AskUserQuestion tool with:
          - header: "Label"
          - question: "Which label should this task have?"
          - options: Build from labels in workflow.yaml (bug, feature, docs, refactor), each with:
            - label: "{label-name}", description: "{label description from workflow}"
          - multiSelect: false
        </action>
      </branch>
    </branch>
    <branch condition="label unclear">
      <action>Use AskUserQuestion tool with:
        - header: "Label"
        - question: "Which label should this task have?"
        - options: Build from labels in workflow.yaml (bug, feature, docs, refactor), each with:
          - label: "{label-name}", description: "{label description from workflow}"
        - multiSelect: false
      </action>
    </branch>
  </step>

  <step name="create_task_file">
    <warning>Write to `.kanban/tasks/` — NOT `.kanban/product/`</warning>
    <action>Read template from `.kanban/templates/task.xml`</action>
    <action>Create folder `.kanban/tasks/{nextId}/`</action>
    <action>Create file at `.kanban/tasks/{nextId}/task.xml`</action>
    <note>`{nextId}` = the nextId from step get_next_id (e.g., "001")</note>
    <action>Fill XML attributes: `id`, `title`, `status: backlog`, `priority`, `labels`, `created`, `affects`, `engineering`</action>
    <action>Fill body: `## Description`, `## Notes`</action>
    <note>Leave empty (filled in later phases): other sections</note>
  </step>

  <step name="commit">
    <note>Format: `docs({nextId}): create - {title}`</note>
    <command>git add .kanban/tasks/{nextId}/task.xml</command>
    <command>git commit -m "docs({nextId}): create - {title}"</command>
  </step>

  <step name="output_result">
    <output>Print the created file path and task ID</output>
    <output>Print commit hash</output>
    <output>
**Next: Refine the task**
```
/clear
/kanban-refine {nextId}
```
    </output>
    {{> skill-complete}}
  </step>
</process>

<success_criteria>
- Task folder exists at `.kanban/tasks/{nextId}/`
- Task file exists at `.kanban/tasks/{nextId}/task.xml`
- Task XML has `id="{nextId}"`
- Task XML has `status="backlog"`
- Task XML has `title` element with "{title}"
- Task file contains `## Description` section
- Git log shows `docs({nextId}): create -`
- Next steps shown to user
</success_criteria>

<example>
User: `/kanban-create Fix login redirect bug`

Creates: `.kanban/tasks/002/task.md`

```
Task 002 created in Backlog
Title: Fix login redirect bug
Labels: [bug]
File: .kanban/tasks/002/task.xml
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
