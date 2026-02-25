---
name: kanban-quick
description: Fast implementation for simple fixes, config changes, and small features. Minimal Q&A, optional research, single commit.
allowed-tools: Read, Write, Edit, Bash(node *, git add *, git commit *, git status, git branch *, git checkout *, git diff *), Grep, Glob, AskUserQuestion
argument-hint: "[task description]"
disable-model-invocation: true
---

# Quick Implementation

<purpose>
Fast implementation for simple tasks. Minimal Q&A (problem + done), optional research,
implementation, optional review before commit, optional doc updates.
</purpose>

<context>
{{> directory-reference}}

{{> helper-scripts show_next_quick_id=true show_find_quick=true show_get_date_time=true}}

<note>Quick tasks are stored in `.kanban/quick/{id}/` — separate from the full workflow.</note>

{{> product-docs-scripts show_search_product=true}}
{{> engineering-docs-scripts show_search_engineering=true}}
</context>

<prohibited>
- Do not skip the commit step
- Do not create full task.xml/spec.xml/plan.xml (use quick.xml only)
- Do not use this for complex multi-file changes (use full workflow instead)
- Do not ask about "value" - keep Q&A minimal
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="verify_branch">
    {{> branch-verify-main}}
  </step>

  <step name="verify_kanban_exists">
    <validate>Check that `.kanban/` directory exists</validate>
    <branch condition="directory doesn't exist">
      <output>Error: Kanban not initialized. Run `npx claude-kanban init` first.</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="load_directives">
    {{> load-directives skill="quick"}}
  </step>

  <step name="get_next_quick_id" outputs="quickId">
    <command>node .kanban/scripts/next-quick-id.cjs</command>
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

  <step name="ask_research" outputs="doResearch">
    <action>Use AskUserQuestion tool with:
      - header: "Research"
      - question: "Want me to research the codebase first?"
      - options:
        - label: "No (Recommended)", description: "Jump straight to implementation"
        - label: "Yes", description: "Explore the codebase to find affected files"
      - multiSelect: false
    </action>
  </step>

  <step name="optional_research" when="doResearch is Yes" outputs="findings">
    <action>Use Glob/Grep to find affected files based on problem and title</action>
    <action>Read relevant files to understand context</action>
    <action>Store findings for later inclusion in quick.xml</action>
    <output>Found {n} potentially affected files:</output>
    <output>- {file1}: {reason}</output>
    <output>- {file2}: {reason}</output>
    <note>Findings will be stored in quick.xml context section for LLM resume</note>
  </step>

  <step name="create_branch">
    <command>git branch --list "quick/{quickId}"</command>
    <branch condition="branch already exists">
      <output>Error: Branch quick/{quickId} already exists. Use a different ID or delete the existing branch.</output>
      <action>Exit</action>
    </branch>
    <command>git checkout -b quick/{quickId}</command>
    <output>Created branch quick/{quickId}</output>
  </step>

  <step name="create_quick_xml">
    <action>Create directory `.kanban/quick/{quickId}/`</action>
    <action>Get current date/time from get-date-time.cjs</action>
    <action>Create file at `.kanban/quick/{quickId}/quick.xml` with content:</action>
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
    <output>Created quick task: .kanban/quick/{quickId}/quick.xml</output>
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

  <step name="pause_for_review">
    <output>
**Implementation complete.**

Now's the time to review changes if you'd like. You can run `git diff` to see what changed.
    </output>
    <action>Use AskUserQuestion tool with:
      - header: "Commit"
      - question: "Ready to commit?"
      - options:
        - label: "Yes, commit", description: "Commit the changes now"
        - label: "Wait", description: "I need to review or make changes first"
      - multiSelect: false
    </action>
    <branch condition="user selects Wait">
      <note>Status remains "in-progress" in quick.xml for LLM resume</note>
      <output>
No problem. Your progress is saved in `.kanban/quick/{quickId}/quick.xml`.

To resume later, read the quick.xml for context then continue.

When you're ready to commit:
```
git add .
git commit -m "quick({quickId}): {title}"
```

Or continue with Claude to make more changes.
      </output>
      <action>Exit</action>
    </branch>
  </step>

  {{> directive-compliance}}

  <step name="commit">
    <action>Stage all changes: git add .</action>
    <command>git commit -m "quick({quickId}): {title}"</command>
    <action>Capture commit hash</action>
    <output>Committed: quick({quickId}): {title}</output>
  </step>

  <step name="update_quick_xml">
    <action>Get current date/time from get-date-time.cjs</action>
    <action>Update `.kanban/quick/{quickId}/quick.xml`:</action>
    <action>- Change `status` attribute from "in-progress" to "completed"</action>
    <action>- Update `updated` attribute on root element</action>
    <action>- Update `<files>` section with files modified/created during implementation</action>
    <action>- Update `<commit>` element with hash, message, and date</action>
    <action>- Update `<summary>` element with brief description of what was done</action>
    <action>Stage and amend commit to include updated quick.xml</action>
    <command>git add .kanban/quick/{quickId}/quick.xml && git commit --amend --no-edit</command>
  </step>

  <step name="ask_docs">
    <action>Use AskUserQuestion tool with:
      - header: "Docs"
      - question: "Do you want me to update docs?"
      - options:
        - label: "No", description: "Skip doc updates"
        - label: "Yes", description: "Update product/engineering docs based on changes"
      - multiSelect: false
    </action>
  </step>

  <step name="detect_docs" when="user selected Yes for docs">
    <action>Analyze the code changes to detect which docs might be affected</action>
    <command>node .kanban/scripts/search-product.cjs {keywords from changes}</command>
    <command>node .kanban/scripts/search-engineering.cjs {keywords from changes}</command>
    <branch condition="relevant docs found">
      <action>Read and update the relevant docs</action>
      <action>Update `<docs>` section in quick.xml</action>
      <command>git add .kanban/product/ .kanban/engineering/ .kanban/quick/{quickId}/ && git commit --amend --no-edit</command>
      <output>Updated docs: {doc ids}</output>
    </branch>
    <branch condition="no relevant docs found">
      <output>No existing docs to update for this change.</output>
    </branch>
  </step>

  <step name="validate_xml">
    <command description="Validate quick.xml">node .kanban/scripts/validate-xml.cjs quick/{quickId}</command>
    <branch condition="validation fails">
      <output>Warning: XML validation failed. Fix errors before completing.</output>
    </branch>
  </step>

  <step name="output_result">
    <output>
**Quick task {quickId} complete!**

- Branch: quick/{quickId}
- Commit: {hash}
- Files: {list of modified files}

To merge to main:
```
git checkout main
git merge quick/{quickId}
```

Or to create a PR:
```
gh pr create --title "quick({quickId}): {title}"
```
    </output>
    <output>[KANBAN_COMPLETE]</output>
  </step>
</process>

<success_criteria>
- Quick folder exists at `.kanban/quick/{quickId}/`
- Quick file exists at `.kanban/quick/{quickId}/quick.xml`
- Quick XML is valid (passes validate-xml.cjs)
- Branch `quick/{quickId}` exists
- Git log shows `quick({quickId}): {title}`
- Code changes committed
</success_criteria>

<example>
**Simple fix:**

User: `/kanban-quick Fix typo in login button`

```
Starting quick implementation...

Title: Fix typo in login button

What problem are you solving?
> The login button says "Sing In" instead of "Sign In"

What does done look like?
> The button text is spelled correctly

Want me to research the codebase first?
> No

Created branch quick/000

Created quick task: .kanban/quick/000/quick.xml

**Approach:** Find the LoginButton component and fix the text string
**Constraints:** Only change the string, no refactoring
**Verification:** Button displays "Sign In" correctly

Fixing the typo in src/components/LoginButton.tsx...

**Implementation complete.**

Now's the time to review changes if you'd like.

Ready to commit? [Yes, commit / Wait]
> Yes, commit

Committed: quick(000): Fix typo in login button

Do you want me to update docs?
> No

**Quick task 000 complete!**

- Branch: quick/000
- Commit: a1b2c3d
- Files: src/components/LoginButton.tsx

To merge to main:
git checkout main
git merge quick/000

[KANBAN_COMPLETE]
```

**With research:**

User: `/kanban-quick Add loading spinner to API calls`

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

Created branch quick/001

Created quick task: .kanban/quick/001/quick.xml
(with context section populated from research findings)

**Approach:** Add loading state to useApi hook, show Spinner component when loading
**Constraints:** Use existing Spinner component, don't modify API client directly
**Verification:** API calls show spinner while pending

...
```
</example>

<next_steps>
To merge your changes:
```
git checkout main
git merge quick/{id}
```

Or to create a PR:
```
gh pr create --title "quick({id}): {title}"
```
</next_steps>
