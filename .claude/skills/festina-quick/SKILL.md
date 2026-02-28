---
name: festina-quick
description: Fast implementation for simple fixes, config changes, and small features. Minimal Q&A, optional research, single commit.
allowed-tools: Read, Write, Edit, Bash(node *, git add *, git commit *, git status, git branch *, git checkout *, git diff *, git merge *), Grep, Glob, AskUserQuestion
argument-hint: "[task description]"
disable-model-invocation: true
---

# Quick Implementation

<purpose>
Fast implementation for simple tasks. Minimal Q&A (problem + done), optional research,
implementation, optional review before commit, optional doc updates.
</purpose>

<context>
<note>
- **`.claude/skills/festina-*/`** — Installed festina skills — READ ONLY
- **`.festinalente/`** — Project data and config — READ/WRITE
- **`.festinalente/tasks/{id}/`** — Task folder containing `task.xml`, `spec.xml`, `plan.xml`
- **`.festinalente/quick/{id}/`** — Quick task folder containing `quick.xml` (for /festina-quick)
- **`.festinalente/scripts/`** — Helper scripts for festina operations
- **`.festinalente/templates/`** — Document templates
- **`.festinalente/workflow.yaml`** — Workflow config (columns, labels, transitions)
- **`.festinalente/directives/`** — User-defined directives (custom instructions for skills)
</note>

<note>Use these scripts to reliably find files:</note>






<command description="Get current date/time (returns JSON with iso and date formats)">node .festinalente/scripts/festinalente.cjs get-date-time</command>


<command description="Get next quick ID (returns JSON with nextId, currentHighest, padding)">node .festinalente/scripts/festinalente.cjs next-quick-id</command>

<command description="Find quick task by ID (returns JSON with path and metadata)">node .festinalente/scripts/festinalente.cjs find-quick {id}</command>

<note>Quick tasks are stored in `.festinalente/quick/{id}/` — separate from the full workflow.</note>

<note>Use these scripts to work with product documentation:</note>


<command description="Search product docs by keywords (returns JSON sorted by relevance)">node .festinalente/scripts/festinalente.cjs search-product keyword1 keyword2 ...</command>
<command description="With minimum score threshold">node .festinalente/scripts/festinalente.cjs search-product password reset --min-score=0.3</command>
<note>Score interpretation: ≥0.5 = strong match | 0.3-0.5 = possible match | &lt;0.3 = weak match | No results = likely new feature</note>


<note>Path rule: ID `auth/login` → Path `.festinalente/product/auth/login.md`</note>
<note>Use these scripts to work with engineering documentation:</note>


<command description="Search engineering docs by keywords (returns JSON sorted by relevance)">node .festinalente/scripts/festinalente.cjs search-engineering keyword1 keyword2 ...</command>
<command description="With minimum score threshold">node .festinalente/scripts/festinalente.cjs search-engineering middleware pattern --min-score=0.3</command>
<note>Score interpretation: ≥0.5 = strong match | 0.3-0.5 = possible match | &lt;0.3 = weak match | No results = likely new pattern/system</note>


<note>Path rules:
- `overview` → `.festinalente/engineering/overview.md`
- `systems/auth` → `.festinalente/engineering/systems/auth/_index.md`
- `systems/auth/validator` → `.festinalente/engineering/systems/auth/validator.md`
- `patterns/acyclic-arch` → `.festinalente/engineering/patterns/acyclic-arch.md`
- `conventions/file-naming` → `.festinalente/engineering/conventions/file-naming.md`
</note>
</context>

<prohibited>
- Do not skip the commit step
- Do not create full task.xml/spec.xml/plan.xml (use quick.xml only)
- Do not use this for complex multi-file changes (use full workflow instead)
- Do not ask about "value" - keep Q&A minimal
</prohibited>

<process>
  <step name="load_workflow">
    <action>Read `.festinalente/workflow.yaml` for column definitions, labels, priorities, and commit formats</action>
    <note>Use these values throughout this skill</note>
  </step>

  <step name="verify_branch">
    <command>git branch --show-current</command>
    <validate>Must be on `main` or `master` branch</validate>
    <branch condition="not on main/master">
      <output>Error: This command must be run on the main branch. Current branch: {branch}</output>
      <output>Suggest: Switch to main with `git checkout main`</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="verify_festina_exists">
    <validate>Check that `.festinalente/` directory exists</validate>
    <branch condition="directory doesn't exist">
      <output>Error: Festina Lente not initialized. Run `npx festinalente init` first.</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="load_directives">
    <command>node .festinalente/scripts/festinalente.cjs get-skill-config festina-quick</command>
    <action>Parse the JSON output</action>
    
    <branch condition="directives.length > 0">
      <warning>Directives are MANDATORY. You MUST follow them.</warning>
      <action>For EACH directive where `exists` is `true`:</action>
      <action>Read the directive XML file at `path`</action>
      <action>Parse and apply:</action>
      <action>- `<context>` principles: Maintain as ongoing mindset</action>
      <action>- `<process>` rules where phase="quick": Follow as requirements</action>
      <action>- `<override>` sections where phase="quick": Apply step replacements</action>
      <action>- `<verification>` commands: Note for use in task `<verify>` elements</action>
    
      <branch condition="directive has <override> section for phase=quick">
        <output>
    **DIRECTIVE OVERRIDE ACTIVE: {directive.name}**
    
    The following skill steps are REPLACED by this directive:
    
    {For each &lt;skip&gt; element:}
    **SKIP STEP: `{step}`** - Do NOT execute this step when you reach it in the skill process.
    
    **REPLACEMENT:** Execute directive rules {override.instead.rules} instead.
    
    **Reason:** {override.reason}
    
    **CRITICAL:** When you encounter any skipped step in the skill's &lt;process&gt;,
    you MUST skip it entirely and follow the directive's replacement rules instead.
        </output>
      </branch>
      <note>`<validation>` checks will run in directive_compliance step</note>
      <note>`<examples>` will be shown if violations are found</note>
    </branch>
    
    <example_code lang="json">
    {
      "skill": "festina-quick",
      "directives": [
        { "name": "architecture", "path": ".festinalente/directives/architecture.xml", "exists": true }
      ]
    }
    </example_code>
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
No problem. Your progress is saved in `.festinalente/quick/{quickId}/quick.xml`.

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

  <step name="directive_compliance">
    <note>Verify compliance with all loaded directives</note>
  
    <action>For each directive loaded in load_directives step:</action>
    <action>Re-read the directive XML file</action>
  
    <action>Run each `<validation>` check:</action>
  
    <branch condition="check type=command">
      <command>{content of <run> element}</command>
      <validate>{content of <expect> element}</validate>
    </branch>
  
    <branch condition="check type=pattern">
      <action>For each file matching `files` glob that was modified:</action>
      <action>Check content against `<forbidden>` or `<required>` regex</action>
    </branch>
  
    <branch condition="check type=checklist">
      <action>Self-assess each `<item>` as Y/N</action>
    </branch>
  
    <branch condition="any check fails">
      <output>Directive violation: {check id} - {reason}</output>
      <action>Find `<example>` elements where ref matches failed check</action>
      <action>Show violation examples to illustrate the problem</action>
      <action>Show correct examples to illustrate the fix</action>
      <action>Use AskUserQuestion tool with:
        - header: "Violation"
        - question: "Directive check failed. How would you like to proceed?"
        - options:
          - label: "Fix now", description: "Address the violation before continuing"
          - label: "Continue anyway", description: "Acknowledge and proceed despite violation"
        - multiSelect: false
      </action>
    </branch>
  </step>

  <step name="commit">
    <action>Stage all changes: git add .</action>
    <command>git commit -m "quick({quickId}): {title}"</command>
    <action>Capture commit hash</action>
    <output>Committed: quick({quickId}): {title}</output>
  </step>

  <step name="update_quick_xml">
    <action>Get current date/time from get-date-time.cjs</action>
    <action>Update `.festinalente/quick/{quickId}/quick.xml`:</action>
    <action>- Change `status` attribute from "in-progress" to "completed"</action>
    <action>- Update `updated` attribute on root element</action>
    <action>- Update `<files>` section with files modified/created during implementation</action>
    <action>- Update `<commit>` element with hash, message, and date</action>
    <action>- Update `<summary>` element with brief description of what was done</action>
    <action>Stage and amend commit to include updated quick.xml</action>
    <command>git add .festinalente/quick/{quickId}/quick.xml && git commit --amend --no-edit</command>
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
    <command>node .festinalente/scripts/festinalente.cjs search-product {keywords from changes}</command>
    <command>node .festinalente/scripts/festinalente.cjs search-engineering {keywords from changes}</command>
    <branch condition="relevant docs found">
      <action>Read and update the relevant docs</action>
      <action>Update `<docs>` section in quick.xml</action>
      <command>git add .festinalente/product/ .festinalente/engineering/ .festinalente/quick/{quickId}/ && git commit --amend --no-edit</command>
      <output>Updated docs: {doc ids}</output>
    </branch>
    <branch condition="no relevant docs found">
      <output>No existing docs to update for this change.</output>
    </branch>
  </step>

  <step name="validate_xml">
    <command description="Validate quick.xml">node .festinalente/scripts/festinalente.cjs validate-xml quick/{quickId}</command>
    <branch condition="validation fails">
      <output>Warning: XML validation failed. Fix errors before completing.</output>
    </branch>
  </step>

  <step name="ask_merge">
    <action>Use AskUserQuestion tool with:
      - header: "Merge"
      - question: "Do you want to merge to main?"
      - options:
        - label: "Yes", description: "Merge quick/{quickId} into main now"
        - label: "No", description: "Keep changes on the quick/{quickId} branch"
      - multiSelect: false
    </action>
    <branch condition="user selects Yes">
      <command>git checkout main</command>
      <command>git merge quick/{quickId}</command>
      <output>Merged quick/{quickId} into main.</output>
    </branch>
    <branch condition="user selects No">
      <note>Changes remain on quick/{quickId} branch</note>
    </branch>
  </step>

  <step name="output_result">
    <branch condition="merge was performed">
      <output>
**Quick task {quickId} complete!**

- Branch: quick/{quickId} (merged to main)
- Commit: {hash}
- Files: {list of modified files}
      </output>
    </branch>
    <branch condition="merge was not performed">
      <output>
**Quick task {quickId} complete!**

- Branch: quick/{quickId}
- Commit: {hash}
- Files: {list of modified files}

To merge later:
```
git checkout main
git merge quick/{quickId}
```

Or to create a PR:
```
gh pr create --title "quick({quickId}): {title}"
```
      </output>
    </branch>
    <output>[FESTINA_COMPLETE]</output>
  </step>
</process>

<success_criteria>
- Quick folder exists at `.festinalente/quick/{quickId}/`
- Quick file exists at `.festinalente/quick/{quickId}/quick.xml`
- Quick XML is valid (passes validate-xml.cjs)
- Branch `quick/{quickId}` exists
- Git log shows `quick({quickId}): {title}`
- Code changes committed
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

Want me to research the codebase first?
> No

Created branch quick/000

Created quick task: .festinalente/quick/000/quick.xml

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

Do you want to merge to main? [Yes / No]
> Yes

Merged quick/000 into main.

**Quick task 000 complete!**

- Branch: quick/000 (merged to main)
- Commit: a1b2c3d
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

Created branch quick/001

Created quick task: .festinalente/quick/001/quick.xml
(with context section populated from research findings)

**Approach:** Add loading state to useApi hook, show Spinner component when loading
**Constraints:** Use existing Spinner component, don't modify API client directly
**Verification:** API calls show spinner while pending

...
```
</example>

<next_steps>
If you chose not to merge, you can merge later:
```
git checkout main
git merge quick/{id}
```

Or create a PR instead:
```
gh pr create --title "quick({id}): {title}"
```
</next_steps>
