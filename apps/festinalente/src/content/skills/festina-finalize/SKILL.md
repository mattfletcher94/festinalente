---
name: festina-finalize
description: Validate, commit, document, and complete a task. Consolidates check, docs, and merge into a single command.
allowed-tools: Read, Write, Bash(*), Grep, AskUserQuestion, Task
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Finalize Festina Lente Task

<purpose>
Run directive checks, commit implementation, update documentation, and complete the task. This skill consolidates the check, docs, and merge phases into a single streamlined command.
</purpose>

<context>
{{> directory-reference}}

{{> helper-scripts show_find_task=true show_find_plan=true show_get_date_time=true show_get_skill_config=true}}

{{> product-docs-scripts show_search_product=true show_check_product=true}}

{{> engineering-docs-scripts show_search_engineering=true show_check_engineering=true}}

<note>**`.festinalente/product/`** - Product documentation files organized by domain</note>

<note>**`.festinalente/engineering/`** - Engineering documentation files (systems, patterns, conventions)</note>

{{> diagram-guidelines}}

<note>**Smart Context:** `node .festinalente/scripts/festinalente.cjs select-context {taskId} --tier=standard` - Load similar docs for reference</note>

<note>**Quality Check:** `node .festinalente/scripts/festinalente.cjs validate-docs {path}` - Validate doc meets quality standards</note>

<note>**Glossary:** `.festinalente/glossary.yaml` - Project terminology (update when introducing new terms)</note>

{{> column-transition from="finalize" to="done"}}

<note>
**This skill is an orchestrator with three phases:**
- **Phase 1 (Validate):** Run directive checks, auto-fix if needed, commit implementation
- **Phase 2 (Document):** Update product/engineering docs based on task's affects/engineering fields
- **Phase 3 (Complete):** Push branch, merge to main (or create PR via directive), move task to done
</note>

## Reference Files

Load these as needed during each phase:

- **[checks.md](checks.md)** - Load in Phase 1: Contains plan verification, check execution by type, auto-fix loop with iteration logging, uncommitted changes check, and commit type determination
- **[docs-product.md](docs-product.md)** - Load in Phase 2 if product docs needed: Contains impact analysis, smart context loading, doc update/complete/create flows, domain index updates, glossary updates, and validation
- **[docs-engineering.md](docs-engineering.md)** - Load in Phase 2 if engineering docs needed: Contains impact analysis, smart context loading, type-specific sections (system/pattern/convention), and engineering index updates
</context>

<prohibited>
- Do not commit code that fails directive checks without user approval
- Do not skip documentation analysis
- Do not merge with dirty working tree
- Do not use invented commit types like `festina(...)` - valid types are: `feat`, `fix`, `refactor`, `docs`
- Do not auto-fix without asking the user first
- Do not commit sensitive files (.env, credentials)
- Do not update docs for features NOT touched by this task
- Do not skip pushing to remote before merge
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
      <action>List tasks in `finalize` status from `.festinalente/tasks/`</action>
      <action>Use AskUserQuestion tool with:
        - header: "Task"
        - question: "Which task would you like to finalize?"
        - options: Build from task list (up to 4 tasks in finalize status), each with:
          - label: "{taskId}: {short title}" (truncate title if needed)
          - description: "Ready for finalization"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a task ID directly</note>
    </branch>
  </step>

  <step name="read_task_file" outputs="taskPath, title, labels, affects, engineering">
    <command>node .festinalente/scripts/festinalente.cjs find-task {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse XML</action>
    <validate>Verify status is `finalize`</validate>
    <branch condition="status is not finalize">
      <action>Use AskUserQuestion tool with:
        - header: "Continue?"
        - question: "Task is in {status} status. Expected: finalize. Continue anyway?"
        - options:
          - label: "Yes", description: "Proceed despite unexpected status"
          - label: "No", description: "Cancel and check task status first"
        - multiSelect: false
      </action>
    </branch>
    <action>Extract title, labels, affects, engineering, and acceptance-criteria for later use</action>
    <branch condition="task not found">
      <output>Error: Task not found</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="verify_branch">
    {{> branch-verify-task}}
  </step>

  <step name="load_directives">
    {{> load-directives skill="finalize"}}
  </step>

  <step name="detect_resume_state" outputs="resumeFrom">
    <note>Check what's already been done for resumability</note>
    <command>git log --oneline -1</command>
    <action>Check if last commit matches patterns:</action>
    <branch condition="last commit is 'docs({taskId}): done - {title}'">
      <output>Task already complete!</output>
      <action>Exit</action>
    </branch>
    <branch condition="last commit is 'docs({taskId}): product' or 'docs({taskId}): engineering' or 'docs({taskId}): product+engineering'">
      <note>Docs committed, skip to Phase 3</note>
      <action>Set resumeFrom = "phase3"</action>
    </branch>
    <branch condition="last commit is '{type}({taskId}): {title}' where type is feat/fix/refactor">
      <note>Implementation committed, skip to Phase 2</note>
      <action>Set resumeFrom = "phase2"</action>
    </branch>
    <branch condition="else">
      <action>Set resumeFrom = "phase1"</action>
    </branch>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════════
       PHASE 1: VALIDATE AND COMMIT
       Reference: checks.md
       ═══════════════════════════════════════════════════════════════════════════ -->

  <step name="phase1_validate" when="resumeFrom is phase1">
    <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1: VALIDATE AND COMMIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    </output>
    <action>Read checks.md for detailed guidance on this phase</action>
  </step>

  <step name="verify_plan_completion" when="resumeFrom is phase1">
    <command>node .festinalente/scripts/festinalente.cjs find-plan {taskId}</command>
    <action>Read the plan at the `path` from JSON output</action>
    <validate>Verify all implementation tasks have completed="true"</validate>
    <branch condition="any uncompleted tasks">
      <action>Use AskUserQuestion tool with:
        - header: "Incomplete"
        - question: "Plan has incomplete tasks. Run checks anyway?"
        - options:
          - label: "Yes", description: "Proceed despite incomplete plan tasks"
          - label: "No", description: "Cancel and complete remaining tasks first"
        - multiSelect: false
      </action>
    </branch>
  </step>

  <step name="run_checks" when="resumeFrom is phase1">
    <action>Read checks.md for check execution guidance</action>
    <note>
**For each check directive, determine type and execute:**

```
for each directive in checkDirectives:
    Print: "Running check: {directive name}..."

    # Determine check type from directive XML
    if directive contains type="command":
        Execute the command from <run> element
        if exit code == 0:
            Print "PASS: {directive name}"
            continue to next directive
        else:
            issues = command error output

    else if directive contains type="pattern":
        Scan files matching glob for forbidden/required patterns
        if no violations:
            Print "PASS: {directive name}"
            continue to next directive
        else:
            issues = list of pattern violations

    else if directive contains type="checklist":
        Review code against checklist items
        if all items satisfied:
            Print "PASS: {directive name}"
            continue to next directive
        else:
            issues = unsatisfied items

    # Handle failure
    Print "FAIL: {directive name}"
    Print issues

    Use AskUserQuestion tool with:
        - header: "Fix?"
        - question: "Check failed. How should I proceed?"
        - options:
          - label: "Fix (Recommended)", description: "Attempt to fix the issues automatically"
          - label: "Skip", description: "Continue to next check"
          - label: "Abort", description: "Exit and fix manually"
        - multiSelect: false

    if user selects Fix:
        Analyze the issues
        Make code changes to fix

        # Log attempt to plan
        Add to <iterations> section:
            <iteration phase="finalize" date="{YYYY-MM-DD}">
              <fix directive="{name}">{description of fix}</fix>
            </iteration>

        # Commit the fix
        git add {changed files}
        git commit -m "docs({taskId}): check-retry - {title}"

        # Restart all checks from beginning
        break and restart loop

    if user selects Skip:
        continue to next directive

    if user selects Abort:
        Print: "Exiting. Fix issues manually and re-run /festina-finalize {taskId}"
        Exit

# If we get here, all checks passed
Print "All automated checks passed!"
```
    </note>
  </step>

  <step name="check_uncommitted_changes" when="resumeFrom is phase1" outputs="changedFiles">
    <command>git status</command>
    <command>git diff --name-only</command>
    <output>Display files that will be committed</output>
    <branch condition="no changes found">
      <output>Warning: No uncommitted changes to commit.</output>
      <action>Use AskUserQuestion tool with:
        - header: "Proceed?"
        - question: "No uncommitted changes found. Proceed anyway (just move status)?"
        - options:
          - label: "Yes", description: "Continue to documentation phase"
          - label: "No", description: "Cancel and investigate missing changes"
        - multiSelect: false
      </action>
    </branch>
  </step>

  <step name="determine_commit_type" when="resumeFrom is phase1" outputs="commitType">
    <action>Read checks.md for commit type determination guidance</action>
    <action>Check task labels array</action>
    <branch condition="contains `bug`">
      <action>type = `fix`</action>
    </branch>
    <branch condition="contains `refactor`">
      <action>type = `refactor`</action>
    </branch>
    <branch condition="contains `docs`">
      <action>type = `docs`</action>
    </branch>
    <branch condition="contains `feature` or default">
      <action>type = `feat`</action>
    </branch>
  </step>

  <step name="commit_implementation" when="resumeFrom is phase1">
    <note>Format: `{commitType}({taskId}): {title}`</note>
    <warning>Valid commit types: `feat`, `fix`, `refactor`, `docs`</warning>

    <action>Stage implementation files AND .festinalente files together</action>
    <command>git add {implementation files}</command>
    <command>git add .festinalente/</command>
    <note>`.festinalente` files MUST be included - they accumulate status and plan changes</note>
    <command>git commit -m "{commitType}({taskId}): {title}"</command>
    <output>Implementation committed: {commitType}({taskId}): {title}</output>
  </step>

  <!-- ═══════════════════════════════════════════════════════════════════════════
       PHASE 2: DOCUMENTATION
       Reference: docs-product.md, docs-engineering.md
       ═══════════════════════════════════════════════════════════════════════════ -->

  <step name="phase2_document" when="resumeFrom is phase1 or phase2">
    <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2: DOCUMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    </output>
  </step>

  <step name="analyze_doc_impact" when="resumeFrom is phase1 or phase2" outputs="needsProductDocs, needsEngineeringDocs, productContext, engineeringContext, currentProductDocs, currentEngineeringDocs, stubDocs, existingDocs, missingDocs, engStubDocs, engExistingDocs, engMissingDocs">
    <action>Check task's `affects` element for product docs</action>
    <action>Check task's `engineering` element for engineering docs</action>
    <branch condition="affects is empty AND engineering is empty AND labels include [bug, refactor, chore]">
      <output>No documentation updates needed (internal change)</output>
      <action>Set needsProductDocs = false, needsEngineeringDocs = false</action>
    </branch>
    <branch condition="affects has values">
      <action>Set needsProductDocs = true</action>
    </branch>
    <branch condition="engineering has values">
      <action>Set needsEngineeringDocs = true</action>
    </branch>

    <note>**Pre-load context and categorize docs ONCE before spawning agents**</note>

    <branch condition="needsProductDocs is true">
      <action>Pre-load smart context for product docs:</action>
      <command>node .festinalente/scripts/festinalente.cjs select-context {taskId} --tier=standard --max=3 --type=product</command>
      <action>Store result in productContext</action>

      <action>Pre-fetch current doc content for each doc ID in affects:</action>
      <action>Read `.festinalente/product/{path}.md` for each affected doc</action>
      <action>Store in currentProductDocs</action>

      <action>Categorize product docs:</action>
      <command>node .festinalente/scripts/festinalente.cjs check-product {affects IDs}</command>
      <action>Parse output into: stubDocs (need completing), existingDocs (need updating), missingDocs (need creating)</action>
    </branch>

    <branch condition="needsEngineeringDocs is true">
      <action>Pre-load smart context for engineering docs:</action>
      <command>node .festinalente/scripts/festinalente.cjs select-context {taskId} --tier=standard --max=3 --type=engineering</command>
      <action>Store result in engineeringContext</action>

      <action>Pre-fetch current doc content for each doc ID in engineering:</action>
      <action>Read `.festinalente/engineering/{path}.md` for each engineering doc (using ID→path rules)</action>
      <action>Store in currentEngineeringDocs</action>

      <action>Categorize engineering docs:</action>
      <command>node .festinalente/scripts/festinalente.cjs check-engineering {engineering IDs}</command>
      <action>Parse output into: engStubDocs, engExistingDocs, engMissingDocs</action>
    </branch>

    <note>**Show combined analysis and single checkpoint before spawning agents**</note>
    <branch condition="needsProductDocs OR needsEngineeringDocs">
      <output>
Documentation Analysis for Task {taskId}:
      </output>

      <branch condition="needsProductDocs">
        <output>
**Product Docs:**
Will COMPLETE (stub exists): {stubDocs}
Will UPDATE (doc exists): {existingDocs}
Will CREATE (new doc needed): {missingDocs}
        </output>
      </branch>
      <branch condition="NOT needsProductDocs">
        <output>
**Product Docs:** No updates needed
        </output>
      </branch>

      <branch condition="needsEngineeringDocs">
        <output>
**Engineering Docs:**
Will COMPLETE (stub exists): {engStubDocs}
Will UPDATE (doc exists): {engExistingDocs}
Will CREATE (new doc needed): {engMissingDocs}
        </output>
      </branch>
      <branch condition="NOT needsEngineeringDocs">
        <output>
**Engineering Docs:** No updates needed
        </output>
      </branch>

      <action>Use AskUserQuestion tool with:
        - header: "Docs"
        - question: "Proceed with documentation updates as analyzed?"
        - options:
          - label: "Yes (Recommended)", description: "Spawn agents to update/create docs as shown"
          - label: "No", description: "Skip all documentation updates"
        - multiSelect: false
      </action>

      <branch condition="user selects No">
        <output>Documentation updates skipped.</output>
        <action>Set needsProductDocs = false, needsEngineeringDocs = false</action>
      </branch>
    </branch>
  </step>

  <step name="spawn_doc_agents" when="needsProductDocs OR needsEngineeringDocs" outputs="productAgentResult, engineeringAgentResult">
    <note>**CRITICAL: Spawn agents in parallel using Task tool**</note>
    <note>Use Task tool invocations in a SINGLE message to achieve parallelism</note>
    <note>Agents return structured summaries, not full file diffs, to reduce context overhead</note>

    <output>Spawning documentation agents...</output>

    <parallel>
      <agent name="Product Docs Agent" subagent_type="general-purpose" when="needsProductDocs is true">
        <description>Update product documentation based on task changes</description>
        <prompt>
You are a Product Documentation Agent. Your job is to update product documentation for a completed task.

**Task Context:**
- Task ID: {taskId}
- Title: {title}
- Affects: {affects field}
- Acceptance Criteria: {acceptanceCriteria}

**Documentation Categories (from analysis):**
- COMPLETE (stub exists): {stubDocs}
- UPDATE (doc exists): {existingDocs}
- CREATE (new doc needed): {missingDocs}

**Current Doc Content:**
{currentProductDocs - include full content of each doc being modified}

**Smart Context (similar docs for reference):**
{productContext}

**Reference Guidance:**
Read docs-product.md for detailed guidance on:
- Doc structure and frontmatter requirements
- Update vs complete vs create flows
- Quality standards and validation

**Your Instructions:**
1. For stub docs: Remove stub:true, fill ALL frontmatter fields, fill ALL content sections
2. For existing docs: Make minimal focused updates, update verified date and code_refs
3. For new docs: Create using templates, fill ALL fields, keep scope focused
4. Write all doc changes to disk using Write tool
5. Do NOT update domain _index.md or glossary.yaml (orchestrator handles these)

**Output Format:**
Return a structured summary:
```json
{
  "filesChanged": [
    {"path": ".festinalente/product/domain/doc.md", "action": "updated|created|completed"}
  ],
  "summary": "Brief description of changes made",
  "newTerms": ["term1", "term2"],
  "validationErrors": []
}
```

If you encounter errors, return:
```json
{
  "filesChanged": [],
  "summary": "",
  "validationErrors": [{"file": "path", "error": "description"}]
}
```
        </prompt>
      </agent>

      <agent name="Engineering Docs Agent" subagent_type="general-purpose" when="needsEngineeringDocs is true">
        <description>Update engineering documentation based on task changes</description>
        <prompt>
You are an Engineering Documentation Agent. Your job is to update engineering documentation for a completed task.

**Task Context:**
- Task ID: {taskId}
- Title: {title}
- Engineering: {engineering field}
- Acceptance Criteria: {acceptanceCriteria}

**Documentation Categories (from analysis):**
- COMPLETE (stub exists): {engStubDocs}
- UPDATE (doc exists): {engExistingDocs}
- CREATE (new doc needed): {engMissingDocs}

**Current Doc Content:**
{currentEngineeringDocs - include full content of each doc being modified}

**Smart Context (similar docs for reference):**
{engineeringContext}

**Reference Guidance:**
Read docs-engineering.md for detailed guidance on:
- Type-specific sections (system/pattern/convention)
- Engineering doc structure and requirements
- Quality standards

**Your Instructions:**
1. For stub docs: Remove stub:true, fill ALL fields, use type-specific sections
2. For existing docs: Make minimal focused updates
3. For new docs: Determine type (system/pattern/convention), use correct template
4. Write all doc changes to disk using Write tool
5. Do NOT update engineering _index.md (orchestrator handles this)

**Output Format:**
Return a structured summary:
```json
{
  "filesChanged": [
    {"path": ".festinalente/engineering/type/doc.md", "action": "updated|created|completed"}
  ],
  "summary": "Brief description of changes made",
  "validationErrors": []
}
```

If you encounter errors, return:
```json
{
  "filesChanged": [],
  "summary": "",
  "validationErrors": [{"file": "path", "error": "description"}]
}
```
        </prompt>
      </agent>
    </parallel>

    <output>
Spawning documentation agents in parallel...
- Product Docs Agent: {if needsProductDocs: "Processing {count} docs" else: "Skipped (not needed)"}
- Engineering Docs Agent: {if needsEngineeringDocs: "Processing {count} docs" else: "Skipped (not needed)"}
    </output>

    <action>Wait for agents to complete and collect results</action>

    <output>
Waiting for agents to complete...
    </output>
  </step>

  <step name="validate_agent_outputs" when="needsProductDocs OR needsEngineeringDocs" outputs="allFilesChanged, combinedSummary, newTermsFound">
    <note>**Validate all agent outputs before writing anything permanent**</note>
    <note>Follow Result Synthesis pattern from festina-scope</note>

    <action>Collect results from both agents (if spawned)</action>

    <branch condition="productAgentResult is not empty">
      <output>✓ Product Docs Agent completed: {productAgentResult.filesChanged.length} files</output>
    </branch>
    <branch condition="engineeringAgentResult is not empty">
      <output>✓ Engineering Docs Agent completed: {engineeringAgentResult.filesChanged.length} files</output>
    </branch>

    <action>Check each agent result for errors</action>

    <branch condition="any agent returned validationErrors array with items OR agent failed to complete">
      <output>
Agent Error Details:
      </output>

      <branch condition="productAgentResult has errors">
        <output>Product Docs Agent: {productAgentResult.validationErrors}</output>
      </branch>
      <branch condition="engineeringAgentResult has errors">
        <output>Engineering Docs Agent: {engineeringAgentResult.validationErrors}</output>
      </branch>

      <action>Use AskUserQuestion tool with:
        - header: "Agent Error"
        - question: "Documentation agent encountered an error. How should I proceed?"
        - options:
          - label: "Retry", description: "Re-run the failed agent(s)"
          - label: "Skip", description: "Continue without that agent's documentation"
          - label: "Abort", description: "Cancel Phase 2 documentation"
        - multiSelect: false
      </action>

      <branch condition="user selects Retry">
        <note>Only re-spawn the failed agent(s), not both</note>
        <branch condition="productAgentResult has errors AND needsProductDocs">
          <action>Re-spawn Product Docs Agent only</action>
        </branch>
        <branch condition="engineeringAgentResult has errors AND needsEngineeringDocs">
          <action>Re-spawn Engineering Docs Agent only</action>
        </branch>
        <action>Return to validate_agent_outputs step</action>
      </branch>

      <branch condition="user selects Skip">
        <output>Skipping failed agent's documentation.</output>
        <action>Remove failed agent's results from processing</action>
        <action>Continue with successful agent results only</action>
      </branch>

      <branch condition="user selects Abort">
        <output>Phase 2 documentation aborted.</output>
        <action>Set needsProductDocs = false, needsEngineeringDocs = false</action>
        <action>Skip to Phase 3</action>
      </branch>
    </branch>

    <branch condition="all agents completed successfully">
      <output>
Validating outputs...
All validations passed
      </output>

      <action>Combine filesChanged lists from both agents</action>
      <action>Store combined list in allFilesChanged</action>

      <action>Combine summaries from both agents</action>
      <action>Store in combinedSummary</action>

      <branch condition="productAgentResult.newTerms has items">
        <action>Store new terms in newTermsFound</action>
      </branch>
    </branch>
  </step>

  <step name="commit_docs" when="allFilesChanged has items">
    <note>**Orchestrator handles glossary and _index.md updates after agents complete**</note>

    <branch condition="newTermsFound has items">
      <output>Updating glossary... Adding terms: {newTermsFound}</output>
      <action>Read .festinalente/glossary.yaml</action>
      <action>Add each new term with definition</action>
      <action>Write updated glossary.yaml</action>
    </branch>

    <branch condition="allFilesChanged includes new docs (action='created')">
      <output>Updating domain indexes...</output>
      <action>For each new product doc: Update domain _index.md in .festinalente/product/{domain}/</action>
      <action>For each new engineering doc: Update type _index.md in .festinalente/engineering/{type}/</action>
    </branch>

    <action>Run validation on all changed docs</action>
    <command>node .festinalente/scripts/festinalente.cjs validate-docs {all paths from allFilesChanged}</command>
    <branch condition="validation fails">
      <output>Warning: Documentation validation failed: {errors}</output>
      <action>Use AskUserQuestion tool with:
        - header: "Validation"
        - question: "Doc validation failed. How should I proceed?"
        - options:
          - label: "Continue anyway", description: "Commit despite validation warnings"
          - label: "Abort", description: "Cancel commit, fix manually"
        - multiSelect: false
      </action>
    </branch>

    <output>Running final validation... Quality check passed</output>

    <note>**Atomic commit: Stage all changes together**</note>
    <command>git add .festinalente/product/</command>
    <command>git add .festinalente/engineering/</command>
    <command>git add .festinalente/glossary.yaml</command>

    <branch condition="both needsProductDocs AND needsEngineeringDocs">
      <command>git commit -m "docs({taskId}): product+engineering - {combinedSummary}"</command>
    </branch>
    <branch condition="only needsProductDocs">
      <command>git commit -m "docs({taskId}): product - {combinedSummary}"</command>
    </branch>
    <branch condition="only needsEngineeringDocs">
      <command>git commit -m "docs({taskId}): engineering - {combinedSummary}"</command>
    </branch>
    <output>Documentation committed</output>
  </step>

  <step name="check_referencing_docs" when="allFilesChanged has items">
    <note>Check if other docs reference the updated docs</note>
    <action>For each doc in allFilesChanged, run reverse-lookup:</action>
    <command>node .festinalente/scripts/festinalente.cjs reverse-lookup {docId}</command>
    <branch condition="referencedBy or usedBy has entries">
      <output>These docs reference the updated doc - consider if they need updates:</output>
      <output>- {id}: {tldr}</output>
      <action>Use AskUserQuestion tool with:
        - header: "Related"
        - question: "Review these referencing docs for updates?"
        - options:
          - label: "Skip (Recommended)", description: "No updates needed - references are still accurate"
          - label: "Review", description: "Check these docs for potential updates"
        - multiSelect: false
      </action>
      <branch condition="user selects Review">
        <action>Read each referencing doc and check if references are still accurate</action>
        <action>If updates needed, add to allFilesChanged and include in next commit</action>
      </branch>
    </branch>
  </step>


  <step name="phase3_complete">
    <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3: COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    </output>
  </step>

  <step name="check_already_pushed">
    <command>git log origin/task/{taskId}..HEAD --oneline 2>/dev/null || echo "no-remote"</command>
    <branch condition="no new commits (already pushed)">
      <note>Resuming - skip to merge confirmation</note>
    </branch>
    <branch condition="has new commits OR remote doesn't exist">
      <command>git push -u origin task/{taskId}</command>
      <output>Branch pushed to remote</output>
    </branch>
  </step>

  <step name="verify_ready_to_merge" outputs="commitsToMerge">
    <command>git status</command>
    <validate>Ensure working tree is clean</validate>
    <command>git log main..HEAD --oneline</command>
    <output>Show commits to be merged</output>
    <branch condition="working tree is dirty">
      <output>Error: "Please commit or stash changes first"</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="prompt_merge_confirmation">
    <note>DEFAULT behavior. Directives can override (e.g., github.xml skips this, uses PR approval instead)</note>
    <output>Task: {taskId} - {title}</output>
    <output>Branch: task/{taskId}</output>
    <output>Commits to merge: {list from verify_ready_to_merge}</output>
    <action>Use AskUserQuestion tool with:
      - header: "Merge?"
      - question: "Ready to merge this branch into main?"
      - options:
        - label: "Yes", description: "Merge branch task/{taskId} into main"
        - label: "No", description: "Cancel - I'll merge later"
      - multiSelect: false
    </action>
    <branch condition="user selects No">
      <output>Branch pushed. Run /festina-finalize {taskId} again when ready to merge.</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="move_to_done_and_commit">
    <note>Format: `docs({taskId}): done - {title}`</note>
    <action>Change status to `done`</action>
    <command>node .festinalente/scripts/festinalente.cjs get-date-time</command>
    <action>Add `updated: {YYYY-MM-DD}`</action>
    <action>Add `completed: {YYYY-MM-DD}`</action>
    <action>Write updated task file</action>
    <command>git add .festinalente/tasks/{taskId}/task.xml</command>
    <command>git commit -m "docs({taskId}): done - {title}"</command>
  </step>

  <step name="merge_branch">
    <command>git checkout main</command>
    <command>git merge task/{taskId} --no-ff -m "Merge branch 'task/{taskId}'"</command>
    <note>Use `--no-ff` to preserve branch history</note>
  </step>

  <step name="cleanup_branch">
    <command>git branch -d task/{taskId}</command>
  </step>

  {{> directive-compliance}}

  <step name="output_result">
    <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Task {taskId} completed!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Status: done
- Completed: {date}
- Current branch: main

Congratulations! Task complete.

**Ready for next task:**
```
/clear
/festina-overview
```
    </output>
    {{> skill-complete}}
  </step>
</process>

<success_criteria>
- Task file exists at `.festinalente/tasks/{taskId}/task.xml`
- Task XML has `status="done"`
- Task XML has `completed` attribute with date
- All directive checks passed (or skipped with user approval)
- Documentation updated (or skipped for internal changes)
- Branch merged into main
- Branch `task/{taskId}` deleted locally
- Next steps shown to user
</success_criteria>

<example>
**Full Finalization Flow:**

User: `/festina-finalize 001`

```
Finalizing task 001 "Add user authentication"...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1: VALIDATE AND COMMIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Loading directives from config.yaml...
- coding

Running check: TypeScript...
PASS: TypeScript

Running check: Tests...
PASS: Tests

All automated checks passed!

Staging files:
- src/routes/auth.ts
- src/middleware/jwt.ts
- src/types/auth.ts
- .festinalente/tasks/001/plan.xml

Commit type: feat (from feature label)

Commit: e5f6g7h feat(001): Add user authentication

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2: DOCUMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Documentation Analysis for Task 001:

**Product Docs:**
Will COMPLETE (stub exists): auth/login

**Engineering Docs:** No updates needed

[User selects "Yes (Recommended)"]

Spawning documentation agents in parallel...
- Product Docs Agent: Processing 1 doc
- Engineering Docs Agent: Skipped (not needed)

Waiting for agents to complete...
✓ Product Docs Agent completed: 1 file updated

Validating outputs...
All validations passed

Updating glossary... Added term "JWT"
Running final validation... Quality check passed

Commit: h8i9j0k docs(001): product - complete login documentation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3: COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pushing branch...
Branch pushed to remote.

Task: 001 - Add user authentication
Branch: task/001
Commits to merge:
  e5f6g7h feat(001): Add user authentication
  h8i9j0k docs(001): product - complete login documentation

[User selects "Yes" to merge]

Merging branch into main...
Branch merged successfully!

Deleting branch task/001...
Branch task/001 deleted.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Task 001 completed!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Status: done
- Completed: 2026-02-27
- Current branch: main

Congratulations! Task complete.

Ready for next task:
/clear
/festina-overview
```
</example>

<example>
**Check Fails, User Fixes:**

User: `/festina-finalize 001`

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1: VALIDATE AND COMMIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Running check: TypeScript...
FAIL: TypeScript

Error output:
  src/routes/auth.ts:45:10 - error TS2345: Argument of type 'string' is not assignable

[User selects "Fix (Recommended)"]

Analyzing failure...
Found issue: Type mismatch in auth handler
Fixing: Adding type assertion in src/routes/auth.ts:45

Logging fix to plan.xml iterations...
Committing fix...
Commit: a1b2c3d docs(001): check-retry - Add user authentication

Restarting checks...

Running check: TypeScript...
PASS: TypeScript

Running check: Tests...
PASS: Tests

All automated checks passed!

[Continues to commit implementation and remaining phases...]
```
</example>

<example>
**Internal Change (No Docs Needed):**

User: `/festina-finalize 003`

```
Finalizing task 003 "Refactor database queries"...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1: VALIDATE AND COMMIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Running check: TypeScript...
PASS: TypeScript

All automated checks passed!

Commit: d4e5f6g refactor(003): Refactor database queries

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2: DOCUMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No documentation updates needed (internal change)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3: COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Merge flow continues...]

Task 003 completed!
```
</example>

<next_steps>
Task complete! To start a new task:
```
/clear
/festina-create "Task title"
```

Or view the board:
```
/clear
/festina-overview
```
</next_steps>
