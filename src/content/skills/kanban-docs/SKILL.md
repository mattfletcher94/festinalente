---
name: kanban-docs
description: Update product documentation and commit. Move task to PR column.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *, git push *), Grep
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Update Kanban Task Documentation

<purpose>
Update product documentation, commit the changes, push to remote, and move task from Update Docs to PR.
</purpose>

<context>
{{> directory-reference}}

{{> helper-scripts show_find_task=true show_get_date_time=true}}

{{> product-docs-scripts show_search_product=true show_check_product=true}}

{{> engineering-docs-scripts show_search_engineering=true show_check_engineering=true}}

<note>**`.kanban/product/`** — Product documentation files organized by domain (e.g., `auth/login.md`, `overview.md`) — This is where user-facing docs live</note>

<note>**`.kanban/engineering/`** — Engineering documentation files (systems, patterns, conventions)</note>

{{> column-transition from="update-docs" to="pr"}}
</context>

<prohibited>
- Do not use invented commit types like `kanban(...)` — valid types are: `docs`
- Do not update docs for features NOT touched by this task
- Do not mark unrelated features as "Planned" or "Not yet implemented"
- Do not add strikethroughs to features not touched by this task
- Do not skip pushing to remote
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
      <action>List tasks in `update-docs` status from `.kanban/tasks/`</action>
      <output>Show task IDs and titles</output>
      <prompt>Which task needs documentation?</prompt>
    </branch>
  </step>

  <step name="read_task_file" outputs="taskPath, title, labels, affects">
    <command>node .claude/scripts/find-task.cjs {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse YAML frontmatter</action>
    <validate>Verify current status is `update-docs`</validate>
    <branch condition="status is qa">
      <output>Suggest `/kanban-approve {taskId}` first</output>
      <action>Exit</action>
    </branch>
    <branch condition="status is earlier">
      <output>Suggest appropriate command</output>
      <action>Exit</action>
    </branch>
    <action>Note title, labels, description for documentation context</action>
    <branch condition="task not found">
      <output>Error: Task not found</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="verify_branch">
    {{> branch-verify-task}}
  </step>

  <step name="load_user_skills">
    {{> user-skills command="docs"}}
  </step>

  <step name="analyze_product_doc_impact">
    <note>a. **Check affects field:**</note>
    <action>Read task's `affects` array from frontmatter</action>
    <branch condition="affects has IDs">
      <command>node .claude/scripts/check-product.cjs {affects IDs}</command>
    </branch>
    <action>Categorize: existing docs vs missing docs</action>

    <note>b. **Analyze task for unlisted impacts:**</note>
    <action>Read task description, spec, and implementation context</action>
    <command>node .claude/scripts/search-product.cjs {keywords from title/description}</command>
    <branch condition="high-scoring docs NOT in affects">
      <output>Suggest adding to affects</output>
    </branch>

    <note>c. **Determine action for each:**</note>
    <action>Existing docs → Will UPDATE</action>
    <action>Missing docs → Will CREATE (new feature)</action>

    <note>d. **Present analysis to user:**</note>
    <output>Product Doc Analysis for Task {taskId}:</output>
    <output>Will UPDATE (doc exists): {id} - {summary}</output>
    <output>Will CREATE (new feature): {id} - (new doc needed)</output>
    <output>Unaffected (internal change): {reason if applicable}</output>
    <prompt>Proceed with product documentation? [Y/n]</prompt>
  </step>

  <step name="analyze_engineering_doc_impact">
    <note>a. **Check engineering field:**</note>
    <action>Read task's `engineering` array from frontmatter</action>
    <branch condition="engineering has IDs">
      <command>node .claude/scripts/check-engineering.cjs {engineering IDs}</command>
    </branch>
    <action>Categorize: existing docs vs missing docs</action>

    <note>b. **Analyze task for unlisted impacts:**</note>
    <action>Read task description, spec, and implementation context</action>
    <command>node .claude/scripts/search-engineering.cjs {technical keywords}</command>
    <branch condition="high-scoring docs NOT in engineering">
      <output>Suggest adding to engineering</output>
    </branch>

    <note>c. **Determine action for each:**</note>
    <action>Existing docs → Will UPDATE if implementation changed patterns</action>
    <action>Missing docs → Will CREATE (new pattern/system)</action>

    <note>d. **Present analysis to user:**</note>
    <output>Engineering Doc Analysis for Task {taskId}:</output>
    <output>Will UPDATE: {id} - {summary}</output>
    <output>Will CREATE: {id} - (new doc needed)</output>
    <output>No changes needed: {reason if applicable}</output>
    <prompt>Proceed with engineering documentation? [Y/n]</prompt>
  </step>

  <step name="update_existing_docs" when="docs need updating">
    <action>Read current doc at `.kanban/product/{id}.md`</action>
    <action>Identify sections that need changes based on implementation</action>
    <action>Make minimal, focused updates (don't rewrite entire doc)</action>
    <action>Preserve existing content that's still accurate</action>
    <warning>SCOPE RESTRICTION: Only update docs to reflect what THIS task implemented</warning>
  </step>

  <step name="create_new_docs" when="new docs needed">
    <action>Create domain folder if doesn't exist: `.kanban/product/{domain}/`</action>
    <command description="Get current date">node .claude/scripts/get-date-time.cjs</command>
    <action>Use `date` field from output</action>

    <note>**For features** (use `.claude/kanban-templates/product-doc.md`):</note>
    <action>Fill frontmatter: `id: {domain}/{feature}`, `type: feature`, title, summary, keywords, updated</action>
    <action>Fill sections: Overview, How It Works, Limitations</action>

    <note>**For concepts** (use `.claude/kanban-templates/concept-doc.md`):</note>
    <action>Fill frontmatter: `id: {domain}/{concept}`, `type: concept`, title, summary, keywords, updated</action>
    <action>Fill sections: Definition, Examples, Rules & Constraints</action>

    <action>Write content based on what was implemented</action>
    <action>Keep scope focused on THIS feature/concept only</action>
  </step>

  <step name="handle_internal_changes" when="no user-facing changes">
    <branch condition="affects is empty AND task labels include [bug, refactor, chore]">
      <action>Analyze if any product behavior actually changed</action>
      <branch condition="no user-facing changes">
        <output>No product doc updates needed - internal change</output>
        <action>Log reason and proceed without doc changes</action>
      </branch>
    </branch>
    <note>Use generic commit message: "docs({taskId}): product - no updates needed for {title}"</note>
  </step>

  <step name="update_engineering_docs" when="engineering docs need updating">
    <action>Read current doc (use ID→path rules from check-engineering)</action>
    <action>Identify sections that need changes based on implementation</action>
    <action>Make minimal, focused updates</action>
    <warning>SCOPE RESTRICTION: Only update docs to reflect what THIS task implemented</warning>
  </step>

  <step name="create_new_engineering_docs" when="new engineering docs needed">
    <action>Determine doc type (system, component, pattern, convention)</action>
    <action>Create appropriate folder structure</action>
    <command description="Get current date">node .claude/scripts/get-date-time.cjs</command>
    <action>Use appropriate template from `.claude/kanban-templates/engineering-*.md`</action>
    <action>Fill content based on what was implemented</action>
  </step>

  <step name="move_to_pr">
    <action>Change `status: update-docs` to `status: pr`</action>
    <command description="Get current date">node .claude/scripts/get-date-time.cjs</command>
    <action>Add `updated: {YYYY-MM-DD}` from output</action>
    <action>Write updated task file</action>
  </step>

  <step name="commit_docs_and_task">
    <note>Format: `docs({taskId}): product+engineering - {description}` or `docs({taskId}): product - {description}` if no engineering changes</note>
    <note>The description summarizes what documentation was updated (e.g., "add authentication guide", "update API reference")</note>
    <warning>CRITICAL: Use EXACTLY this format. Do NOT invent commit types like `kanban(...)`. The commit type is `docs`, not `kanban`.</warning>
    <command>git add .kanban/product/</command>
    <command>git add .kanban/engineering/</command>
    <command>git add .kanban/tasks/{taskId}/task.md</command>
    <branch condition="both product and engineering docs were changed">
      <command>git commit -m "docs({taskId}): product+engineering - {description of doc changes}"</command>
    </branch>
    <branch condition="only product docs were changed">
      <command>git commit -m "docs({taskId}): product - {description of doc changes}"</command>
    </branch>
    <branch condition="only engineering docs were changed">
      <command>git commit -m "docs({taskId}): engineering - {description of doc changes}"</command>
    </branch>
    <branch condition="no docs changed">
      <command>git commit -m "docs({taskId}): product - no updates needed"</command>
    </branch>
  </step>

  <step name="push_branch">
    <command>git push -u origin task/{taskId}</command>
    <output>Branch pushed to remote</output>
  </step>

  <step name="output_result">
    <output>Print documentation status (updated/skipped)</output>
    <output>Print commit hash (if docs were committed)</output>
    <output>Print: "Branch pushed. Ready for PR creation."</output>
    <output>Print: "Task {taskId} moved to PR column."</output>
    <warning>REQUIRED OUTPUT - Print next steps EXACTLY like this:</warning>
    <example_code lang="text">
Create PR on GitHub, then run:
/clear
/kanban-merge {taskId}
    </example_code>
    <warning>Do NOT skip this output. The user needs these commands to continue.</warning>
    <output>Also mention: "Or if PR needs changes: /kanban-rework {taskId}"</output>
  </step>
</process>

<success_criteria>
- Task file exists at `.kanban/tasks/{taskId}/task.md`
- Task frontmatter contains `status: pr`
- Branch has been pushed to remote
- Next steps shown to user
</success_criteria>

<example>
**Documentation Updated:**

User: `/kanban-docs 001`

```
Completing documentation for task 001 "Add user authentication"...

Task: 001 - Add user authentication
Labels: [feature, api]

This task may require documentation updates.
Detected: feature, api labels

Update documentation? [Y/n]
> Y

What documentation needs to be updated?
> Add authentication section to README and create docs/auth.md

Creating docs/auth.md...
Updating README.md with auth section...

Note: Only documenting what THIS task implemented.
NOT modifying docs for unrelated features.

Staging documentation:
- docs/auth.md
- README.md

Commit: h8i9j0k docs(001): product - add authentication guide

Pushing branch...
Branch pushed to remote.

Task 001 moved to PR column.
- Status: pr
- Docs commit: h8i9j0k

Create PR on GitHub, then run:
/clear
/kanban-merge 001

Or if PR needs changes: /kanban-rework 001
```

**Documentation Skipped:**

User: `/kanban-docs 002`

```
Completing documentation for task 002 "Refactor database queries"...

Task: 002 - Refactor database queries
Labels: [refactor]

This task may require documentation updates.
Detected: internal change (refactor)

Update documentation? [Y/n]
> n

Reason (optional):
> Internal optimization, no user-facing changes

Documentation skipped: Internal optimization

Pushing branch...
Branch pushed to remote.

Task 002 moved to PR column.
- Status: pr

Create PR on GitHub, then run:
/clear
/kanban-merge 002

Or if PR needs changes: /kanban-rework 002
```
</example>

<note>
**Git History Example:**

Complete task lifecycle commits:
```
docs(001): create - Add user authentication
docs(001): refine - Add user authentication
docs(001): scope - Add user authentication
docs(001): plan - Add user authentication
wip(001): completed auth routes                    # optional, if interrupted
docs(001): verify-retry - Add user authentication  # optional, if verify failed
docs(001): rework - Add user authentication        # optional, if QA/PR failed
feat(001): Add user authentication                 # when QA passes
docs(001): product - add authentication guide      # docs step
# PR created and merged on GitHub
docs(001): done - Add user authentication          # after merge on main
```
</note>

<next_steps>
Create PR on GitHub, then merge:
```
/clear
/kanban-merge {id}
```

Or if the PR needs changes:
```
/clear
/kanban-rework {id}
```
</next_steps>
