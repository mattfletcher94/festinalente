---
name: festina-quick
description: Fast implementation for simple fixes, config changes, and small features. Minimal Q&A, optional research.
allowed-tools: Read, Write, Edit, Bash(node *, git add *, git commit *, git status, git branch *, git checkout *, git diff *, git merge *), Grep, Glob
argument-hint: "[task description]"
disable-model-invocation: true
---

# Quick Implementation

<purpose>
Fast implementation for simple tasks. Minimal Q&A (problem + done), optional research,
implementation, optional review, optional doc updates.
</purpose>

<context>
{{> directory-reference}}

{{> helper-scripts show_next_quick_id=true show_find_quick=true show_get_date_time=true}}

<note>Quick tasks are stored in `.festinalente/quick/{id}/` — separate from the full workflow.</note>

{{> product-docs-scripts show_search_product=true}}
{{> engineering-docs-scripts show_search_engineering=true}}
</context>

<prohibited>
- Do not create full task.xml/spec.xml/plan.xml (use quick.xml only)
- Do not use this for complex multi-file changes (use full workflow instead)
- Do not ask about "value" - keep Q&A minimal
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="verify_festina_exists">
    <validate>Check that `.festinalente/` directory exists</validate>
    <branch condition="directory doesn't exist">
      <output>Error: Festina Lente not initialized. Run `npx festinalente init` first.</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="load_directives">
    {{> load-directives skill="quick"}}
  </step>

  <step name="get_next_quick_id" outputs="quickId">
    <command>node .festinalente/scripts/festinalente.cjs next-quick-id</command>
    <action>Use `nextId` from JSON output</action>
  </step>

  <step name="get_title" outputs="title">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as title</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <action>Use AskUserQuestion tool with:
        - header: "Title"
        - question: "What is the task title?"
        - options:
          - label: "Skip", description: "I'll provide the title"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type the task title</note>
    </branch>
  </step>

  <step name="ask_problem" outputs="problem">
    <action>Use AskUserQuestion tool with:
      - header: "Problem"
      - question: "What problem are you solving?"
      - options:
        - label: "Skip", description: "I'll describe the problem"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe the problem</note>
  </step>

  <step name="ask_done" outputs="done">
    <action>Use AskUserQuestion tool with:
      - header: "Done"
      - question: "What does done look like?"
      - options:
        - label: "Skip", description: "I'll describe what done looks like"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe done criteria</note>
  </step>

  <step name="auto_decide_research" outputs="doResearch">
    <note>Auto-decide whether codebase research is needed based on task complexity.</note>
    <action>Assess task complexity from problem description and done criteria:
      - Simple (typo, config change, single-file edit): skip research
      - Complex (multi-file, unfamiliar area, integration): do research
    </action>
    <branch condition="simple task">
      <action>Set doResearch = false</action>
      <output>Simple task — skipping codebase research.</output>
    </branch>
    <branch condition="complex task">
      <action>Set doResearch = true</action>
      <output>Task involves {reason} — researching codebase first.</output>
    </branch>
  </step>

  <step name="optional_research" when="doResearch is true" outputs="findings">
    <action>Use Glob/Grep to find affected files based on problem and title</action>
    <action>Read relevant files to understand context</action>
    <action>Store findings for later inclusion in quick.xml</action>
    <output>Found {n} potentially affected files:</output>
    <output>- {file1}: {reason}</output>
    <output>- {file2}: {reason}</output>
    <note>Findings will be stored in quick.xml context section for LLM resume</note>
  </step>

  <step name="create_quick_xml">
    <action>Create directory `.festinalente/quick/{quickId}/`</action>
    <action>Get current date/time from get-date-time.cjs</action>
    <action>Create file at `.festinalente/quick/{quickId}/quick.xml` with content:</action>
    <example_code lang="xml">
<quick id="{quickId}" status="in-progress" created="{date}" updated="{date}">
  <title>{title}</title>

  <problem>{problem from ask_problem step}</problem>
  <done>{done from ask_done step}</done>

  <!-- Research findings (populated if research was requested) -->
  <context>
    <finding file="{path}" reason="{why this file is relevant}"/>
    <!-- Include each finding from optional_research step, or leave empty if no research -->
  </context>

  <!-- Will be populated after determine_approach step -->
  <approach></approach>

  <!-- Will be populated after determine_approach step -->
  <constraints>
  </constraints>

  <files>
    <!-- Will be populated after implementation -->
  </files>

  <!-- Will be populated after determine_approach step -->
  <verify>
  </verify>

  <commit hash="" message="" date=""/>

  <summary></summary>

  <docs>
    <!-- Will be populated if docs are updated -->
  </docs>
</quick>
    </example_code>
    <output>Created quick task: .festinalente/quick/{quickId}/quick.xml</output>
  </step>

  <step name="determine_approach" outputs="approach, constraints, verifySteps">
    <note>Based on problem, done criteria, and any research findings, determine implementation approach</note>
    <action>Analyze the problem and context to decide on implementation strategy</action>
    <action>Identify constraints (things to avoid, existing patterns to follow)</action>
    <action>Define verification steps to confirm implementation is correct</action>
    <action>Update quick.xml with approach, constraints, and verify sections</action>
    <output>
**Approach:** {brief description of implementation strategy}
**Constraints:** {things to avoid or patterns to follow}
**Verification:** {how to confirm it works}
    </output>
  </step>

  <step name="implement">
    <action>Make the code changes to solve the problem</action>
    <action>Track which files were modified, created, or read</action>
    <note>Follow any loaded directive rules</note>
  </step>

  <step name="proceed_to_finalization">
    <output>Implementation complete. Proceeding to finalization.</output>
  </step>

  {{> directive-compliance}}

  <step name="update_quick_xml">
    <action>Get current date/time from get-date-time.cjs</action>
    <action>Update `.festinalente/quick/{quickId}/quick.xml`:</action>
    <action>- Change `status` attribute from "in-progress" to "completed"</action>
    <action>- Update `updated` attribute on root element</action>
    <action>- Update `<files>` section with files modified/created during implementation</action>
    <action>- Update `<commit>` element with hash, message, and date</action>
    <action>- Update `<summary>` element with brief description of what was done</action>
  </step>

  <step name="detect_docs">
    <note>Auto-detect whether relevant docs exist for the changes made.
    If code introduces new features with no matching doc, create a stub.</note>
    <action>Analyze the code changes to detect which docs might be affected</action>
    <command>node .festinalente/scripts/festinalente.cjs search-product {keywords from changes}</command>
    <command>node .festinalente/scripts/festinalente.cjs search-engineering {keywords from changes}</command>
    <branch condition="relevant docs found">
      <action>Read and update the relevant docs</action>
      <action>Update `<docs>` section in quick.xml</action>
      <output>Updated docs: {doc ids}</output>
    </branch>
    <branch condition="no relevant docs found AND code introduces new exports/handlers/features">
      <note>New feature detected with no matching product doc — create stub</note>
      <action>Determine appropriate doc ID based on the new feature (e.g., cli/new-command, skills/new-skill)</action>
      <action>Create stub product doc at .festinalente/product/{doc-id}.md with frontmatter:
        stub: true, title, tldr, summary, keywords, updated: {current date}</action>
      <action>Add stub doc ID to quick.xml affects field</action>
      <output>Quick created stub doc: {path}</output>
    </branch>
    <branch condition="no relevant docs found AND no new features detected">
      <output>No existing docs to update for this change.</output>
    </branch>
  </step>

  <step name="validate_xml">
    <command description="Validate quick.xml">node .festinalente/scripts/festinalente.cjs validate-xml quick/{quickId}</command>
    <branch condition="validation fails">
      <output>Warning: XML validation failed. Fix errors before completing.</output>
    </branch>
  </step>

  <step name="output_result">
    <output>
**Quick task {quickId} complete!**

- Files: {list of modified files}
    </output>
    <output>[FESTINA_COMPLETE]</output>
  </step>
</process>

<success_criteria>
- Quick folder exists at `.festinalente/quick/{quickId}/`
- Quick file exists at `.festinalente/quick/{quickId}/quick.xml`
- Quick XML is valid (passes validate-xml.cjs)
- Code changes implemented and verified
- Directive compliance checks passed (if directives exist)
- Next steps shown to user
</success_criteria>

<example>
**Simple fix:**

User: `/festina-quick Fix typo in login button`

```
Starting quick implementation...

Title: Fix typo in login button

What problem are you solving?
> The login button says "Sing In" instead of "Sign In"

What does done look like?
> The button text is spelled correctly

Simple task — skipping codebase research.

Created quick task: .festinalente/quick/000/quick.xml

**Approach:** Find the LoginButton component and fix the text string
**Constraints:** Only change the string, no refactoring
**Verification:** Button displays "Sign In" correctly

Fixing the typo in src/components/LoginButton.tsx...

Implementation complete. Proceeding to finalization.

No related docs to update.

**Quick task 000 complete!**

- Files: src/components/LoginButton.tsx

[FESTINA_COMPLETE]
```

**With research:**

User: `/festina-quick Add loading spinner to API calls`

```
Starting quick implementation...

Title: Add loading spinner to API calls

What problem are you solving?
> Users don't know when API calls are in progress

What does done look like?
> A spinner shows during API requests

Want me to research the codebase first?
> Yes

Found 3 potentially affected files:
- src/api/client.ts: Main API client
- src/components/Spinner.tsx: Existing spinner component
- src/hooks/useApi.ts: API hook used throughout the app

Created quick task: .festinalente/quick/001/quick.xml
(with context section populated from research findings)

**Approach:** Add loading state to useApi hook, show Spinner component when loading
**Constraints:** Use existing Spinner component, don't modify API client directly
**Verification:** API calls show spinner while pending

...
```
</example>

<next_steps>
Run `/festina-overview` to view the board.
</next_steps>
