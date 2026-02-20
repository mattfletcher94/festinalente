---
name: kanban-scope
description: Research codebase and create functional specification through conversational Q&A. Focuses on engineering analysis - HOW to build it technically.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *, git checkout *), Glob, Grep, AskUserQuestion, WebSearch, WebFetch
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Scope Kanban Task

<purpose>
Create a functional specification through iterative conversational Q&A focused on technical decisions, then move to Scoped and commit.
</purpose>

<context>
<note>
- **`.claude/skills/kanban-*/`** — Installed kanban skills — READ ONLY
- **`.kanban/`** — Project data and config — READ/WRITE
- **`.kanban/tasks/{id}/`** — Task folder containing `task.xml`, `spec.xml`, `plan.xml`
- **`.kanban/scripts/`** — Helper scripts for kanban operations
- **`.kanban/templates/`** — Document templates
- **`.kanban/workflow.yaml`** — Workflow config (columns, labels, transitions)
- **`.kanban/directives/`** — User-defined directives (custom instructions for skills)
</note>

<note>Use these scripts to reliably find files:</note>

<command description="Find task by ID (returns JSON with path and metadata)">node .kanban/scripts/find-task.cjs {id}</command>





<command description="Get current date/time (returns JSON with iso and date formats)">node .kanban/scripts/get-date-time.cjs</command>


<note>Use these scripts to work with engineering documentation:</note>


<command description="Search engineering docs by keywords (returns JSON sorted by relevance)">node .kanban/scripts/search-engineering.cjs keyword1 keyword2 ...</command>
<command description="With minimum score threshold">node .kanban/scripts/search-engineering.cjs middleware pattern --min-score=0.3</command>
<note>Score interpretation: ≥0.5 = strong match | 0.3-0.5 = possible match | &lt;0.3 = weak match | No results = likely new pattern/system</note>


<note>Path rules:
- `overview` → `.kanban/engineering/overview.md`
- `systems/auth` → `.kanban/engineering/systems/auth/_index.md`
- `systems/auth/validator` → `.kanban/engineering/systems/auth/validator.md`
- `patterns/acyclic-arch` → `.kanban/engineering/patterns/acyclic-arch.md`
- `conventions/file-naming` → `.kanban/engineering/conventions/file-naming.md`
</note>

<note>Column transition: backlog → scoped</note>
<note>See `.kanban/workflow.yaml` for column definitions and valid transitions</note>
</context>

<prohibited>
- Do not skip codebase research before the Q&A dialogue
- Do not create a spec without understanding existing patterns
- Do not skip the commit step
- Do not forget to create the task branch
</prohibited>

<process>
  <step name="load_workflow">
    <action>Read `.kanban/workflow.yaml` for column definitions, labels, priorities, and commit formats</action>
    <note>Use these values throughout this skill</note>
  </step>

  <step name="verify_branch">
    <command>git branch --show-current</command>
    <validate>Must be on `main` or `master` branch</validate>
    <branch condition="not on main/master">
      <output>Error: This command must be run on the main branch to create the task branch. Current branch: {branch}</output>
      <output>Suggest: Switch to main with `git checkout main`</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="get_task_id" outputs="taskId">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as taskId</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <action>List tasks in `backlog` status from `.kanban/tasks/`</action>
      <action>Use AskUserQuestion tool with:
        - header: "Task"
        - question: "Which task would you like to scope?"
        - options: Build from task list (up to 4 most relevant tasks), each with:
          - label: "{taskId}: {short title}" (truncate title if needed)
          - description: "Priority: {priority} | {first ~50 chars of description}"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a task ID directly</note>
    </branch>
  </step>

  <step name="read_task_file" outputs="taskPath, title, acceptanceCriteria, status">
    <command>node .kanban/scripts/find-task.cjs {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse XML</action>
    <validate>Verify status is `backlog`</validate>
    <branch condition="status is not backlog">
      <output>Task is in {status} status. Expected: backlog.</output>
      <action>Use AskUserQuestion tool with:
        - header: "Continue?"
        - question: "Task is in {status} status. Continue with scoping anyway?"
        - options:
          - label: "Yes", description: "Proceed with scoping despite unexpected status"
          - label: "No", description: "Cancel and check task status first"
        - multiSelect: false
      </action>
    </branch>
    <action>Extract problem, value, and acceptance criteria for reference</action>
    <branch condition="task not found">
      <output>Error: Task not found</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="load_directives">
    <step name="load_directives">
      <command>node .kanban/scripts/get-skill-config.cjs kanban-scope</command>
      <action>Parse the JSON output</action>
    
      <branch condition="directives.length > 0">
        <warning>Directives are MANDATORY. You MUST follow them.</warning>
        <action>For EACH directive where `exists` is `true`:</action>
        <action>Read the directive XML file at `path`</action>
        <action>Parse and apply:</action>
        <action>- `<context>` principles: Maintain as ongoing mindset</action>
        <action>- `<process>` rules where phase="scope": Follow as requirements</action>
        <note>`<validation>` checks will run in directive_compliance step</note>
        <note>`<examples>` will be shown if violations are found</note>
      </branch>
    </step>
    
    <example_code lang="json">
    {
      "skill": "kanban-scope",
      "directives": [
        { "name": "architecture", "path": ".kanban/directives/architecture.xml", "exists": true }
      ]
    }
    </example_code>
  </step>

  <step name="structured_research" outputs="researchFindings">
    <note>Conduct structured research in four areas BEFORE the Q&A dialogue.</note>
    <note>This ensures thorough exploration and pattern discovery.</note>

    <substep name="research_product_context">
      <note>Understand existing product behavior that may constrain implementation.</note>
      <branch condition="task has `affects` field">
        <action>For each ID in `affects`: Read `.kanban/product/{id}.md`</action>
        <action>Note: current behavior, constraints, user flows, feature interactions</action>
      </branch>
      <action>Search for additional relevant product docs</action>
      <command>node .kanban/scripts/search-product.cjs {keywords from title and description}</command>
      <branch condition="docs with score ≥ 0.3 found">
        <action>Read top matches not already read</action>
      </branch>
      <output_variable>productFindings: list of {docId, keyInsight}</output_variable>
    </substep>

    <substep name="research_engineering_patterns">
      <note>Find established patterns and conventions to follow.</note>
      <branch condition="task has `engineering` field">
        <action>For each ID: Read engineering doc using ID→path rules</action>
        <action>Note: patterns to follow, conventions, system interactions</action>
      </branch>
      <action>Search for additional relevant engineering docs</action>
      <command>node .kanban/scripts/search-engineering.cjs {technical keywords}</command>
      <branch condition="docs with score ≥ 0.3 found">
        <action>Read top matches not already read</action>
      </branch>
      <output_variable>engineeringFindings: list of {docId, pattern, reference}</output_variable>
    </substep>

    <substep name="research_codebase_architecture">
      <note>Find similar implementations to use as references.</note>
      <action>Use Glob to find potentially affected files based on task description</action>
      <action>Use Grep to search for similar implementations, related functions, types</action>
      <action>Read key files to understand existing patterns with file:line references</action>
      <output_variable>codebaseFindings: list of {component, filePath, relevance}</output_variable>
    </substep>

    <substep name="research_pitfalls">
      <note>Identify known issues and constraints to avoid.</note>
      <action>Search for error handling patterns in affected areas</action>
      <action>Look for TODO/FIXME/HACK comments in related code</action>
      <action>Check engineering docs for documented constraints or gotchas</action>
      <action>Search for closed issues or known problems in the area</action>
      <output_variable>pitfallFindings: list of {issue, impact, mitigation}</output_variable>
    </substep>
  </step>

  <step name="synthesize_research" outputs="synthesis">
    <note>Consolidate all research findings into a structured summary.</note>
    <note>Present to user for approval BEFORE proceeding to Q&A.</note>

    <action>Consolidate findings from all four research areas</action>

    <output>
**Research Synthesis**

### Product Context
{List each product doc read and key insight for this task}
- **{docId}**: {key insight - how it relates to this task}

### Engineering Patterns
{List patterns found that should be followed}
- **{pattern-name}**: {how it applies} — Reference: `{file}:{line}`

### Codebase Architecture
{List similar implementations found}
- **{component/feature}**: `{file}` — {what it does that's relevant}

### Pitfalls & Constraints
{List known issues to avoid}
- **{issue}**: {why it matters} — Mitigation: {approach}

---

**Does this synthesis look complete? Any areas you'd like me to explore further?**
    </output>

    <branch condition="user says 'looks good' / 'continue' / 'that's fine'">
      <action>Store synthesis for inclusion in spec</action>
      <action>Proceed to conduct_qa_dialogue step</action>
    </branch>
    <branch condition="user requests more research in specific area">
      <action>Conduct additional research in requested area</action>
      <action>Update synthesis and present again</action>
    </branch>
  </step>

  <step name="conduct_qa_dialogue">
    <note>This is a **conversational session** focused on **technical decisions**:
- Architecture and approach
- Existing patterns to follow
- Dependencies and libraries
- Technical constraints
- Files to modify/create</note>

    <note>How the dialogue works:</note>

    <action>Share initial findings and ask questions</action>
    <note>Present what you found in the codebase</note>
    <note>Ask about technical approach, preferences, constraints</note>
    <note>Don't follow a rigid script - adapt to the conversation</note>

    <note>User can volunteer information at any time:
- User may provide technology directives (e.g., "use Zustand", "use React Query")
- User may request research (e.g., "research reactive localStorage packages for React")
- User may share architectural preferences or constraints</note>

    <note>Perform research when requested or beneficial:</note>

    <note>**Local codebase research:**</note>
    <action>Use Glob/Grep to find patterns as topics arise</action>
    <action>Read files to understand existing implementations</action>

    <note>**Web research:**</note>
    <branch condition="user asks to research packages/libraries">
      <action>Use WebSearch to research npm packages, documentation, best practices</action>
      <action>Compare options and present findings</action>
      <prompt>Ask if findings influence the approach</prompt>
    </branch>

    <action>Continue until you have enough information to write a complete functional spec</action>

    <output>
**"I think I have enough information to write the functional spec. Here's what I understand:**

- **Approach:** {summary}
- **Key files:** {list}
- **Dependencies:** {list}
- **Patterns to follow:** {summary}

**Is there anything else you'd like to discuss before I write the spec?"**
    </output>

    <branch condition="user says 'that's good' / 'go ahead' / similar">
      <action>Proceed to writing spec</action>
    </branch>
    <branch condition="user adds more context">
      <action>Incorporate and ask if anything else</action>
    </branch>
    <branch condition="user has corrections">
      <action>Update understanding and confirm again</action>
    </branch>

    <note>Key principles:
- Focus on TECHNICAL decisions, not product requirements (those are in the task)
- Research as topics arise, not just at the beginning
- Let the conversation flow naturally
- Don't rush - thoroughness now saves time during implementation</note>
  </step>

  <step name="create_spec_file" outputs="specPath">
    <action>Create at `.kanban/tasks/{taskId}/spec.xml`</action>
    <action>Follow template at `.kanban/templates/spec.xml`</action>
    <action>Link to spec in XML attributes</action>
    <action>Fill ALL sections</action>

    <example_code lang="markdown">
---
task: "{taskId}"
created: {YYYY-MM-DD}
updated: {YYYY-MM-DD}
---

# Functional Specification: {title}

## Context
{Pull from task's problem and value sections}

## Scope
### In Scope
- {What this spec covers}

### Out of Scope
- {Explicit boundaries}

## Functional Requirements
- FR1: The system shall...
- FR2: The system shall...

## Affected Files
- `path/to/file.ts` (modify) - {reason}
- `path/to/new.ts` (create) - {reason}

## Existing Patterns
- **Pattern:** {description}
  - Reference: `path/to/example.ts:42`

## Research Findings

### Product Context
{From synthesis - product docs read and key insights}

### Engineering Patterns
{From synthesis - patterns to follow with file:line references}

### Codebase Analysis
{From synthesis - similar implementations found}

### Pitfalls Identified
{From synthesis - known issues and constraints to avoid}

## Technical Constraints
- {Constraints discovered during research}

## Dependencies
### External
- {Libraries/APIs - include any researched/chosen packages}

### Internal
- {Other features/tasks}

## Research Findings
{If web research was conducted, summarize findings and decisions}
- **Topic:** {what was researched}
- **Options considered:** {list}
- **Decision:** {what was chosen and why}

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| ... | ... | ... |

## Open Questions
- [ ] {Unresolved items}
    </example_code>
  </step>

  <step name="update_task_xml">
    <action>Change status to `scoped`</action>
    <action>Add `spec="tasks/{taskId}/spec.xml"` to refs element</action>
    <action>Update `updated: {YYYY-MM-DD}`</action>
  </step>

  <step name="write_files">
    <action>Write spec file at `.kanban/tasks/{taskId}/spec.xml`</action>
    <action>Write updated task file</action>
  </step>

  <step name="create_task_branch">
    <command>git checkout -b task/{taskId}</command>
    <output>Confirm: "Created branch task/{taskId}"</output>
  </step>

  <step name="commit">
    <note>Format: `docs({taskId}): scope - {title}`</note>
    <command>git add .kanban/tasks/{taskId}/spec.xml .kanban/tasks/{taskId}/task.xml</command>
    <command>git commit -m "docs({taskId}): scope - {title}"</command>
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
      <prompt>Fix now or acknowledge and continue?</prompt>
    </branch>
  </step>

  <step name="output_result">
    <output>Print summary of affected files identified</output>
    <output>Print existing patterns found</output>
    <output>Print any research findings and decisions</output>
    <output>Print any open questions</output>
    <output>Print commit hash</output>
    <output>
**Next: Plan the implementation**
```
/clear
/kanban-plan {taskId}
```
    </output>
    ## Final Validation
    
    Before completing, validate all task XML:
    
    <command description="Validate XML in all task files">node .kanban/scripts/validate-xml.cjs</command>
    
    If validation fails, fix the reported errors before completing.
    
    <output>[KANBAN_COMPLETE]</output>
  </step>
</process>

<success_criteria>
- Task file exists at `.kanban/tasks/{taskId}/task.xml`
- Spec file exists at `.kanban/tasks/{taskId}/spec.xml`
- Task XML has `status="scoped"`
- Task refs element has `spec="tasks/{taskId}/spec.xml"`
- Spec file contains `## Functional Requirements` section
- Spec file contains `## Affected Files` section
- Spec file contains `## Existing Patterns` section
- Git log shows `docs({taskId}): scope -`
- Current branch is `task/{taskId}` after completion
- Next steps shown to user
</success_criteria>

<example>
User: `/kanban-scope 001`

```
Scoping task 001 "Add localStorage persistence for app state"...

Reading task details...
- Problem: App state is lost on page refresh
- Value: Better UX, users don't lose work
- Acceptance: State persists across refreshes, loads on startup

Let me search the codebase for existing patterns...

Found:
- State management in src/store/index.ts (using Zustand)
- No existing persistence layer
- Config loading pattern in src/utils/config.ts

I see you're using Zustand for state management. There are a few approaches
for adding persistence:

1. Zustand's built-in persist middleware
2. A separate localStorage abstraction
3. A reactive localStorage hook

Do you have a preference, or should I research options?
> Research reactive localStorage packages for React, I want something that
> handles sync across tabs.

Let me research that...

[Searches for reactive localStorage React packages]

Found several options:

| Package | Weekly Downloads | Last Update | Tab Sync |
|---------|-----------------|-------------|----------|
| use-local-storage-state | 150k | 2 months ago | Yes |
| @rehooks/local-storage | 80k | 1 year ago | Yes |
| zustand persist | (built-in) | Active | No |

**use-local-storage-state** looks promising:
- Active maintenance
- Built-in tab sync via storage events
- SSR safe
- TypeScript support

Would you like to go with this, or should I look into others?
> That looks good. How would it integrate with our Zustand store?

Good question. We have two options:

1. **Replace Zustand with the hook directly** - simpler but loses Zustand benefits
2. **Use alongside Zustand** - hook for persistence, Zustand for state logic

Looking at your store... you have computed values and actions. I'd recommend
option 2 - use the hook to persist, sync to Zustand on load/change.

Let me check if there are existing hydration patterns in the codebase...

[Searches for hydration patterns]

Found a pattern in src/store/settings.ts that loads from config on mount.
We could follow that pattern.

> Sounds good. Any other technical considerations?

A few things:
- Storage key naming convention (found "app_" prefix in config.ts)
- Error handling for localStorage quota exceeded
- Migration strategy if storage schema changes

Should we address migration now or defer?
> Defer migration for now, just note it as a risk.

I think I have enough information to write the functional spec. Here's what I understand:

- **Approach:** use-local-storage-state for persistence with tab sync, hydrate Zustand on mount
- **Key files:** src/store/index.ts (modify), src/hooks/usePersistedState.ts (create)
- **Dependencies:** use-local-storage-state (new)
- **Patterns to follow:** Hydration pattern from src/store/settings.ts, "app_" key prefix

Is there anything else you'd like to discuss before I write the spec?
> No, that's good.

Writing functional specification...

Spec created: .kanban/tasks/001/spec.md
- 4 functional requirements
- 2 files to modify, 1 new file
- 1 external dependency (use-local-storage-state)
- 1 existing pattern referenced
- 1 risk flagged (migration strategy deferred)

Task 001 scoped.
- Status: scoped
- Spec: tasks/001/spec.md
Commit: d4e5f6g docs(001): scope - Add localStorage persistence for app state

Next:
/clear
/kanban-plan 001
```
</example>

<next_steps>
```
/clear
/kanban-plan {id}
```
</next_steps>
