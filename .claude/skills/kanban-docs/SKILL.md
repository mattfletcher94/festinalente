---
name: kanban-docs
description: Update product documentation and commit. Move task to PR column.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *, git push *), Grep, AskUserQuestion
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Update Kanban Task Documentation

<purpose>
Update product documentation, commit the changes, push to remote, and move task from Update Docs to PR.
</purpose>

<context>
<note>
- **`.claude/skills/kanban-*/`** — Installed kanban skills — READ ONLY
- **`.kanban/`** — Project data and config — READ/WRITE
- **`.kanban/tasks/{id}/`** — Task folder containing `task.xml`, `spec.xml`, `plan.xml`
- **`.kanban/scripts/`** — Helper scripts for kanban operations
- **`.kanban/templates/`** — Document templates
- **`.kanban/workflow.yaml`** — Workflow config (columns, labels, transitions)
- **`.kanban/directives/`** — User-defined directives (custom instructions for hooks)
</note>

<note>Use these scripts to reliably find files:</note>

<command description="Find task by ID (returns JSON with path and metadata)">node .kanban/scripts/find-task.cjs {id}</command>





<command description="Get current date/time (returns JSON with iso and date formats)">node .kanban/scripts/get-date-time.cjs</command>


<note>Use these scripts to work with product documentation:</note>


<command description="Search product docs by keywords (returns JSON sorted by relevance)">node .kanban/scripts/search-product.cjs keyword1 keyword2 ...</command>
<command description="With minimum score threshold">node .kanban/scripts/search-product.cjs password reset --min-score=0.3</command>
<note>Score interpretation: ≥0.5 = strong match | 0.3-0.5 = possible match | &lt;0.3 = weak match | No results = likely new feature</note>

<command description="Check if product docs exist by ID">node .kanban/scripts/check-product.cjs auth/login auth/mfa billing/invoices</command>

<note>Path rule: ID `auth/login` → Path `.kanban/product/auth/login.md`</note>

<note>Use these scripts to work with engineering documentation:</note>


<command description="Search engineering docs by keywords (returns JSON sorted by relevance)">node .kanban/scripts/search-engineering.cjs keyword1 keyword2 ...</command>
<command description="With minimum score threshold">node .kanban/scripts/search-engineering.cjs middleware pattern --min-score=0.3</command>
<note>Score interpretation: ≥0.5 = strong match | 0.3-0.5 = possible match | &lt;0.3 = weak match | No results = likely new pattern/system</note>

<command description="Check if engineering docs exist by ID">node .kanban/scripts/check-engineering.cjs systems/auth patterns/middleware</command>

<note>Path rules:
- `overview` → `.kanban/engineering/overview.md`
- `systems/auth` → `.kanban/engineering/systems/auth/_index.md`
- `systems/auth/validator` → `.kanban/engineering/systems/auth/validator.md`
- `patterns/acyclic-arch` → `.kanban/engineering/patterns/acyclic-arch.md`
- `conventions/file-naming` → `.kanban/engineering/conventions/file-naming.md`
</note>

<note>**`.kanban/product/`** — Product documentation files organized by domain (e.g., `auth/login.md`, `overview.md`) — This is where user-facing docs live</note>

<note>**`.kanban/engineering/`** — Engineering documentation files (systems, patterns, conventions)</note>

<note>**Smart Context:** `node .kanban/scripts/select-context.cjs {taskId} --tier=standard` — Load similar docs for reference</note>

<note>**Quality Check:** `node .kanban/scripts/validate-docs.cjs {path}` — Validate doc meets quality standards</note>

<note>**Glossary:** `.kanban/glossary.yaml` — Project terminology (update when introducing new terms)</note>

<note>Column transition: update-docs → pr</note>
<note>See `.kanban/workflow.yaml` for column definitions and valid transitions</note>
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
    <action>Read `.kanban/workflow.yaml` for column definitions, labels, priorities, and commit formats</action>
    <note>Use these values throughout this skill</note>
  </step>

  <step name="get_task_id" outputs="taskId">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as taskId</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <action>List tasks in `update-docs` status from `.kanban/tasks/`</action>
      <action>Use AskUserQuestion tool with:
        - header: "Task"
        - question: "Which task needs documentation?"
        - options: Build from task list (up to 4 tasks in update-docs status), each with:
          - label: "{taskId}: {short title}" (truncate title if needed)
          - description: "Status: update-docs | Ready for documentation"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a task ID directly</note>
    </branch>
  </step>

  <step name="read_task_file" outputs="taskPath, title, labels, affects">
    <command>node .kanban/scripts/find-task.cjs {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse XML</action>
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
    <command>git branch --show-current</command>
    <validate>Must be on branch `task/{id}` where {id} is the task ID</validate>
    <branch condition="not on expected branch">
      <output>Error: This command must be run on branch task/{id}. Current branch: {branch}</output>
      <output>Suggest: Switch to task branch with `git checkout task/{id}`</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="load_hook_config">
    <step name="load_hook_config">
      <command>node .kanban/scripts/get-hook-config.cjs kanban-docs</command>
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
      "hook": "kanban-docs",
      "directives": [
        { "name": "my-directive", "path": ".kanban/directives/my-directive/DIRECTIVE.md", "exists": true }
      ],
      "product": [],
      "engineering": []
    }
    </example_code>
  </step>

  <step name="analyze_product_doc_impact" outputs="stubDocs, existingDocs, missingDocs">
    <note>a. **Check affects field:**</note>
    <action>Read task's `affects` element from XML</action>
    <branch condition="affects has IDs">
      <command>node .kanban/scripts/check-product.cjs {affects IDs}</command>
    </branch>

    <note>b. **Categorize docs:**</note>
    <action>For each doc ID in affects:</action>
    <action>- Read the doc file if it exists</action>
    <action>- Check for `stub: true` in frontmatter</action>
    <action>Categorize into: stubDocs (need completing), existingDocs (need updating), missingDocs (need creating)</action>

    <note>c. **Analyze task for unlisted impacts:**</note>
    <action>Read task description, spec, and implementation context</action>
    <command>node .kanban/scripts/search-product.cjs {keywords from title/description}</command>
    <branch condition="high-scoring docs NOT in affects">
      <output>Suggest adding to affects</output>
    </branch>

    <note>d. **Present analysis to user:**</note>
    <output>Product Doc Analysis for Task {taskId}:</output>
    <output>Will COMPLETE (stub exists): {id} - stub created during /kanban-create</output>
    <output>Will UPDATE (doc exists): {id} - {summary}</output>
    <output>Will CREATE (new doc needed): {id}</output>
    <output>Unaffected (internal change): {reason if applicable}</output>
    <action>Use AskUserQuestion tool with:
      - header: "Product docs"
      - question: "Proceed with product documentation updates?"
      - options:
        - label: "Yes (Recommended)", description: "Update/create product docs as analyzed"
        - label: "No", description: "Skip product documentation updates"
      - multiSelect: false
    </action>
  </step>

  <step name="analyze_engineering_doc_impact">
    <note>a. **Check engineering field:**</note>
    <action>Read task's `engineering` element from XML</action>
    <branch condition="engineering has IDs">
      <command>node .kanban/scripts/check-engineering.cjs {engineering IDs}</command>
    </branch>
    <action>Categorize: existing docs vs missing docs</action>

    <note>b. **Analyze task for unlisted impacts:**</note>
    <action>Read task description, spec, and implementation context</action>
    <command>node .kanban/scripts/search-engineering.cjs {technical keywords}</command>
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
    <action>Use AskUserQuestion tool with:
      - header: "Eng docs"
      - question: "Proceed with engineering documentation updates?"
      - options:
        - label: "Yes (Recommended)", description: "Update/create engineering docs as analyzed"
        - label: "No", description: "Skip engineering documentation updates"
      - multiSelect: false
    </action>
  </step>

  <step name="load_smart_context" when="creating or completing docs">
    <note>**Load similar docs for reference on quality/structure**</note>
    <command>node .kanban/scripts/select-context.cjs {taskId} --tier=standard --max=3</command>
    <action>Parse JSON output</action>
    <action>For each doc in output, note the structure and quality patterns</action>
    <note>Use these as reference when writing new docs - match their level of detail</note>
  </step>

  <step name="update_existing_docs" when="docs need updating">
    <action>Read current doc at `.kanban/product/{id}.md`</action>
    <action>Identify sections that need changes based on implementation</action>
    <action>Make minimal, focused updates (don't rewrite entire doc)</action>
    <action>Preserve existing content that's still accurate</action>
    <warning>SCOPE RESTRICTION: Only update docs to reflect what THIS task implemented</warning>

    <note>**Verification Prompt:**</note>
    <action>Read implemented code for this task</action>
    <action>Compare to doc content</action>
    <prompt>Does this doc accurately reflect the implementation? (Yes/No/Needs correction)</prompt>
    <branch condition="user confirms">
      <command description="Get current date">node .kanban/scripts/get-date-time.cjs</command>
      <action>Update `verified: {YYYY-MM-DD}` in frontmatter</action>
      <action>Update `code_refs` with files touched by this task</action>
    </branch>
    <branch condition="user says needs correction">
      <prompt>What needs to be corrected?</prompt>
      <action>Make corrections</action>
      <action>Re-verify with user</action>
      <action>Update `verified: {YYYY-MM-DD}` in frontmatter</action>
    </branch>
  </step>

  <step name="complete_stub_docs" when="stub docs exist">
    <note>**Complete stub docs created during /kanban-create**</note>
    <action>Read the stub doc</action>
    <action>Remove `stub: true` and `task:` from frontmatter</action>
    <command description="Get current date">node .kanban/scripts/get-date-time.cjs</command>

    <note>**Required frontmatter fields:**</note>
    <action>Fill `tldr:` - Single sentence, max 100 chars, explains core purpose</action>
    <action>Fill `summary:` - One sentence for LLM discovery</action>
    <action>Fill `keywords:` - 3-5 terms users might search for</action>
    <action>Fill `aliases:` - Alternative names (e.g., "dark mode" → ["night mode", "theme toggle"])</action>
    <action>Fill `boundary:` - What this feature does NOT cover</action>
    <action>Update `updated:` with current date</action>
    <action>Add `verified:` with current date</action>
    <action>Add `code_refs:` with files touched by this task</action>

    <note>**Required content sections:**</note>
    <action>TL;DR blockquote at top (repeat tldr)</action>
    <action>Overview section with summary at end</action>
    <action>How It Works section with key workflows</action>
    <action>Examples section with code snippets from implementation</action>
    <action>Boundaries section listing what it does NOT do</action>

    <action>Write content based on what was actually implemented</action>
    <action>Reference actual code paths where relevant</action>
  </step>

  <step name="create_new_docs" when="new docs needed (no stub exists)">
    <action>Create domain folder if doesn't exist: `.kanban/product/{domain}/`</action>
    <command description="Get current date">node .kanban/scripts/get-date-time.cjs</command>
    <action>Use `date` field from output</action>

    <note>**For features** (use `.kanban/templates/product-feature.md`):</note>
    <action>Fill ALL frontmatter fields:</action>
    <action>- `id:` {domain}/{feature}</action>
    <action>- `type:` feature</action>
    <action>- `title:` Human-readable title</action>
    <action>- `tldr:` Single sentence, max 100 chars</action>
    <action>- `summary:` One sentence for LLM discovery</action>
    <action>- `keywords:` 3-5 search terms</action>
    <action>- `aliases:` Alternative names users might use</action>
    <action>- `boundary:` What this does NOT cover</action>
    <action>- `related:` IDs of related docs</action>
    <action>- `updated:` Current date</action>
    <action>- `verified:` Current date</action>
    <action>- `code_refs:` Files implementing this feature</action>
    <action>Fill sections: Overview (with summary), How It Works, Examples, Boundaries, Limitations</action>

    <note>**For concepts** (use `.kanban/templates/product-concept.md`):</note>
    <action>Same frontmatter fields as features</action>
    <action>Fill sections: Definition, Examples, Rules & Constraints, Boundaries</action>

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
    <command description="Get current date">node .kanban/scripts/get-date-time.cjs</command>
    <action>Use appropriate template from `.kanban/templates/engineering-*.md`</action>
    <action>Fill ALL frontmatter fields including tldr, aliases, boundary</action>
    <action>Fill content based on what was implemented</action>
  </step>

  <step name="update_domain_index" when="new doc created in a domain">
    <note>**Update the domain's _index.md to include the new doc**</note>
    <action>Check if `.kanban/product/{domain}/_index.md` exists</action>
    <branch condition="_index.md exists">
      <action>Read the _index.md file</action>
      <action>Add the new doc to the appropriate section (features list, concepts list)</action>
      <action>Add a one-line description matching the doc's tldr</action>
    </branch>
    <branch condition="_index.md doesn't exist">
      <note>Consider creating one if multiple docs now exist in this domain</note>
    </branch>
  </step>

  <step name="update_glossary" when="new terms introduced">
    <note>**Add new terminology to glossary**</note>
    <action>Identify any new terms introduced by this feature</action>
    <action>Check if terms exist in `.kanban/glossary.yaml`</action>
    <branch condition="new terms found">
      <action>Read `.kanban/glossary.yaml`</action>
      <action>Add new entries with:</action>
      <action>- term: The canonical name</action>
      <action>- aliases: Alternative names/spellings</action>
      <action>- definition: Brief explanation</action>
      <action>Write updated glossary</action>
      <output>Added to glossary: {terms}</output>
    </branch>
    <example_code lang="yaml">
# Example glossary entry:
- term: "Yolo mode"
  aliases: ["skip permissions", "dangerous mode", "auto-approve"]
  definition: "Mode that auto-approves all permission requests"
    </example_code>
  </step>

  <step name="validate_docs" when="docs were created or updated">
    <note>**Run quality validation on changed docs**</note>
    <command>node .kanban/scripts/validate-docs.cjs {changed doc paths}</command>
    <branch condition="validation passes">
      <output>Quality check passed</output>
    </branch>
    <branch condition="validation fails">
      <output>Quality issues found:</output>
      <output>{issues from validation}</output>
      <action>Fix the issues before proceeding</action>
      <action>Re-run validation</action>
    </branch>
  </step>

  <step name="move_to_pr">
    <action>Change `status: update-docs` to `status: pr`</action>
    <command description="Get current date">node .kanban/scripts/get-date-time.cjs</command>
    <action>Add `updated: {YYYY-MM-DD}` from output</action>
    <action>Write updated task file</action>
  </step>

  <step name="commit_docs_and_task">
    <note>Format: `docs({taskId}): product+engineering - {description}` or `docs({taskId}): product - {description}` if no engineering changes</note>
    <note>The description summarizes what documentation was updated (e.g., "add authentication guide", "update API reference")</note>
    <warning>CRITICAL: Use EXACTLY this format. Do NOT invent commit types like `kanban(...)`. The commit type is `docs`, not `kanban`.</warning>
    <command>git add .kanban/product/</command>
    <command>git add .kanban/engineering/</command>
    <command>git add .kanban/glossary.yaml</command>
    <command>git add .kanban/tasks/{taskId}/task.xml</command>
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
    ## Final Validation
    
    Before completing, validate all task XML:
    
    <command description="Validate XML in all task files">node .kanban/scripts/validate-xml.cjs</command>
    
    If validation fails, fix the reported errors before completing.
    
    <output>[KANBAN_COMPLETE]</output>
  </step>
</process>

<success_criteria>
- Task file exists at `.kanban/tasks/{taskId}/task.xml`
- Task XML has `status="pr"`
- If docs created/updated:
  - All frontmatter fields filled (tldr, summary, keywords, aliases, boundary)
  - TL;DR blockquote present at top
  - Examples section with code snippets
  - Boundaries section present
  - `verified` date set to current date
  - `code_refs` populated with touched files
  - `stub: true` removed if was stub doc
  - Domain _index.md updated if applicable
  - Glossary updated if new terms
  - validate-docs passes
- Branch has been pushed to remote
- Next steps shown to user
</success_criteria>

<example>
**Completing a stub doc (new feature):**

User: `/kanban-docs 001`

```
Completing documentation for task 001 "Add Yolo mode toggle"...

Task: 001 - Add Yolo mode toggle
Labels: [feature]
Affects: gui/yolo-mode

Product Doc Analysis:
Will COMPLETE (stub exists): gui/yolo-mode - stub created during /kanban-create

Loading context from similar docs...
Found: gui/terminal.md, gui/autoplay.md (using as reference)

Proceed with product documentation updates? [Yes (Recommended)]

Completing stub doc: .kanban/product/gui/yolo-mode.md

Filling frontmatter:
- tldr: "Toggle to skip all permission prompts in Claude sessions"
- keywords: [yolo, permissions, skip, auto-approve, settings]
- aliases: [skip permissions, dangerous mode, auto-approve]
- boundary: "Does not affect Claude's internal safety checks"
- verified: 2026-02-20
- code_refs: [src/settings/settings.orchestrator.ts, electron/main/pty-service.ts]

Writing content sections:
- Overview with summary
- How It Works (settings panel → toggle → PTY flag)
- Examples (enabling, disabling, persistence)
- Boundaries (what it doesn't do)

Updating domain index: .kanban/product/gui/_index.md
Added: yolo-mode - Toggle to skip permission prompts

Updating glossary: .kanban/glossary.yaml
Added term: "Yolo mode" (aliases: skip permissions, dangerous mode)

Running quality validation...
Quality check passed

Commit: h8i9j0k docs(001): product - complete yolo-mode documentation

Pushing branch...
Branch pushed to remote.

Task 001 moved to PR column.

Create PR on GitHub, then run:
/clear
/kanban-merge 001

Or if PR needs changes: /kanban-rework 001
```

**Updating existing docs:**

User: `/kanban-docs 002`

```
Completing documentation for task 002 "Fix login redirect bug"...

Task: 002 - Fix login redirect bug
Labels: [bug]
Affects: auth/login

Product Doc Analysis:
Will UPDATE (doc exists): auth/login - Authentication flow documentation

Proceed with product documentation updates? [Yes (Recommended)]

Updating: .kanban/product/auth/login.md
- Added redirect preservation to "How It Works" section
- Added example for deep link authentication
- Updated verified: 2026-02-20
- Updated code_refs with touched files

Running quality validation...
Quality check passed

Commit: a1b2c3d docs(002): product - update login redirect behavior

Task 002 moved to PR column.

Create PR on GitHub, then run:
/clear
/kanban-merge 002
```

**Internal change (no docs needed):**

User: `/kanban-docs 003`

```
Completing documentation for task 003 "Refactor database queries"...

Task: 003 - Refactor database queries
Labels: [refactor]
Affects: (empty)

Product Doc Analysis:
No user-facing changes detected (internal refactor)

Proceed with product documentation updates? [No]

Documentation skipped: Internal optimization

Task 003 moved to PR column.

Create PR on GitHub, then run:
/clear
/kanban-merge 003
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
