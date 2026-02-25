---
name: kanban-scope
description: Research codebase and create functional specification through conversational Q&A. Focuses on engineering analysis - HOW to build it technically.
tools:
  read: true
  write: true
  bash(ls *: true
  git add *: true
  git commit *: true
  git status: true
  git branch *: true
  git checkout *): true
  glob: true
  grep: true
  question: true
  websearch: true
  webfetch: true
  task: true
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Scope Kanban Task

<purpose>
Create a functional specification through iterative conversational Q&A focused on technical decisions, then move to Scoped and commit.
</purpose>

<context>
<note>
- **`.opencode/skills/kanban-*/`** — Installed kanban skills — READ ONLY
- **`.kanban/`** — Project data and config — READ/WRITE
- **`.kanban/tasks/{id}/`** — Task folder containing `task.xml`, `spec.xml`, `plan.xml`
- **`.kanban/quick/{id}/`** — Quick task folder containing `quick.xml` (for /kanban-quick)
- **`.kanban/scripts/`** — Helper scripts for kanban operations
- **`.kanban/templates/`** — Document templates
- **`.kanban/workflow.yaml`** — Workflow config (columns, labels, transitions)
- **`.kanban/directives/`** — User-defined directives (custom instructions for skills)
</note>

<note>Use these scripts to reliably find files:</note>

<command description="Find task by ID (returns JSON with path and metadata)">node .kanban/scripts/find-task.cjs {id}</command>





<command description="Get current date/time (returns JSON with iso and date formats)">node .kanban/scripts/get-date-time.cjs</command>

<command description="Get skill configuration (returns JSON with directives)">node .kanban/scripts/get-skill-config.cjs {skill}</command>
<example_code lang="json">
{
  "skill": "kanban-check",
  "directives": [
    { "name": "code-review", "path": ".kanban/directives/code-review.xml", "exists": true }
  ]
}
</example_code>

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

  <step name="read_task_file" outputs="taskPath, title, acceptanceCriteria, status, affects, engineering">
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
    <action>Extract problem, value, acceptance criteria, affects, and engineering fields for reference</action>
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

  <step name="choose_research_depth" outputs="researchDepth">
    <action>Use AskUserQuestion tool with:
      - header: "Research"
      - question: "How thorough should the codebase research be?"
      - options:
        - label: "Quick", description: "For simple, well-understood changes. Faster, uses fewer tokens."
        - label: "Deep", description: "For complex or unfamiliar areas. Parallel exploration, more thorough."
      - multiSelect: false
    </action>
  </step>

  <step name="structured_research" outputs="researchFindings">
    <branch condition="researchDepth is 'Quick'">
      <note>Sequential research - faster, fewer tokens</note>

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

        <note>Categorize each pitfall found:</note>
        <action>For each pitfall, determine category:
          - "decision": Multiple valid approaches exist, trade-offs involved, user preference matters
          - "fyi": Only one reasonable approach, obvious/standard mitigation, constraint to be aware of</action>
        <action>For "decision" pitfalls: Generate 2-4 suggested mitigation options</action>
        <action>For "fyi" pitfalls: Provide the single recommended mitigation</action>

        <output_variable>pitfallFindings: list of {issue, impact, category, suggestedMitigations[]}</output_variable>
      </substep>
    </branch>

    <branch condition="researchDepth is 'Deep'">
      <note>**CRITICAL: Spawn 4 agents in parallel using Task tool**</note>
      <action>Use the Task tool 4 times in a SINGLE message to achieve parallelism</action>

      <parallel>
        <agent name="Product Context Researcher" subagent_type="Explore">
          <description>Find product docs and constraints</description>
          <prompt>
Research product context for task: "{title}"

Task details:
- Problem: {problem}
- Value: {value}
- Acceptance criteria: {acceptanceCriteria}
{If affects field exists: - Affects docs: {affects}}

Your job:
1. If the task has `affects` field, read those product docs from `.kanban/product/{id}.md`
2. Search for additional relevant product docs using keywords from the task
3. Identify current behavior, constraints, user flows, and feature interactions

For each relevant doc found, provide:
- docId: The document ID
- keyInsight: How this doc relates to the task (1-2 sentences)
- constraints: Any constraints this imposes on implementation

Output as a structured list.
          </prompt>
        </agent>

        <agent name="Pattern Finder" subagent_type="Explore">
          <description>Find engineering patterns to follow</description>
          <prompt>
Find engineering patterns for task: "{title}"

Task details:
- Problem: {problem}
- Value: {value}
{If engineering field exists: - Engineering docs: {engineering}}

Your job:
1. If the task has `engineering` field, read those docs from `.kanban/engineering/`
2. Search for additional relevant engineering docs
3. Find established patterns and conventions to follow

For each pattern found, provide:
- pattern: Name of the pattern
- description: What it does and how it applies
- reference: File path and line number (e.g., `src/utils/api.ts:42`)
- usage: How to apply this pattern to the task

Output as a structured list.
          </prompt>
        </agent>

        <agent name="Codebase Analyzer" subagent_type="Explore">
          <description>Find similar implementations</description>
          <prompt>
Analyze codebase for task: "{title}"

Task details:
- Problem: {problem}
- Value: {value}
- Acceptance criteria: {acceptanceCriteria}

Your job:
1. Use Glob to find potentially affected files based on task description
2. Use Grep to search for similar implementations, related functions, types
3. Read key files to understand existing patterns
4. Identify files that will likely need modification

For each finding, provide:
- component: Name of the component/feature
- filePath: Full file path
- relevance: Why this is relevant (1-2 sentences)
- pattern: Any pattern this demonstrates with file:line reference

Also provide a summary of:
- Likely files to modify
- Likely files to create
- Key functions/types to understand

Output as a structured list.
          </prompt>
        </agent>

        <agent name="Pitfall Detector" subagent_type="Explore">
          <description>Find known issues and constraints</description>
          <prompt>
Find pitfalls and constraints for task: "{title}"

Task details:
- Problem: {problem}
- Value: {value}
- Acceptance criteria: {acceptanceCriteria}

Your job:
1. Search for error handling patterns in areas related to this task
2. Look for TODO/FIXME/HACK comments in related code
3. Check engineering docs for documented constraints or gotchas
4. Look for edge cases or known issues in similar implementations

For each pitfall found, provide:
- issue: What the issue is
- location: Where it was found (file:line or doc reference)
- impact: Why it matters for this task
- category: "decision" or "fyi"
  - Use "decision" when: multiple valid approaches exist, trade-offs involved, user preference matters
  - Use "fyi" when: only one reasonable approach, obvious/standard mitigation
- suggestedMitigations: Array of approaches
  - For "decision": provide 2-4 options the user can choose from
  - For "fyi": provide single recommended mitigation

Output as a structured list.
          </prompt>
        </agent>
      </parallel>

      <action>Wait for all 4 agents to complete</action>
    </branch>
  </step>

  <step name="synthesize_research" outputs="synthesis">
    <note>Consolidate all research findings into a structured summary.</note>
    <note>Present to user for approval BEFORE proceeding to Q&A.</note>

    <branch condition="researchDepth is 'Deep'">
      <action>Combine outputs from all 4 agents</action>
      <action>Deduplicate findings (same file/pattern mentioned by multiple agents)</action>
      <action>Resolve conflicts using these rules:</action>
      <rule>If Product Context and Codebase Analyzer identify different affected areas, include both</rule>
      <rule>If Pattern Finder and Codebase Analyzer find same pattern, use Pattern Finder's description</rule>
      <rule>If Pitfall Detector contradicts other agents, flag as open question</rule>
    </branch>

    <branch condition="researchDepth is 'Quick'">
      <action>Consolidate findings from all sequential research substeps</action>
    </branch>

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

**Decisions needed** (we'll discuss these next):
{For each pitfall where category is "decision":}
- **{issue}**: {impact}

**For your awareness** (standard mitigations apply):
{For each pitfall where category is "fyi":}
- **{issue}**: {impact} → {mitigation}

{If no decision-needed pitfalls, omit that section}
{If no fyi pitfalls, omit that section}

    </output>

    <action>Use AskUserQuestion tool with:
      - header: "Synthesis"
      - question: "Does this research synthesis look complete?"
      - options:
        - label: "Looks complete (Recommended)", description: "Proceed to resolve pitfalls and technical Q&A"
        - label: "Explore product docs", description: "Research additional product documentation"
        - label: "Explore codebase", description: "Analyze more code patterns or implementations"
        - label: "Explore pitfalls", description: "Identify additional risks or constraints"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe specific areas to explore</note>

    <branch condition="user selects 'Looks complete'">
      <action>Store synthesis for inclusion in spec</action>
      <action>Proceed to resolve_pitfalls step</action>
    </branch>
    <branch condition="user selects exploration option OR provides custom input">
      <action>Conduct additional research in requested area</action>
      <action>Update synthesis and present again</action>
    </branch>
  </step>

  <step name="resolve_pitfalls" outputs="resolvedPitfalls">
    <note>For each pitfall categorized as "decision", ask the user how to handle it.</note>
    <note>Follow the structured AskUserQuestion pattern used in kanban-rework and kanban-create.</note>

    <branch condition="no decision-needed pitfalls exist">
      <output>All identified pitfalls have standard mitigations. Proceeding to technical Q&A.</output>
      <action>Add all fyi pitfalls to resolvedPitfalls with their mitigations</action>
    </branch>

    <branch condition="decision-needed pitfalls exist">
      <output>
**Resolving Pitfalls**

Let's decide how to handle the pitfalls that have multiple valid approaches.
      </output>

      <action>For each pitfall where category is "decision":</action>

      <action>Use AskUserQuestion tool with:
        - header: "Pitfall"
        - question: "{issue} — {impact}. How should we handle this?"
        - options: Build from suggestedMitigations (2-4 options), each with:
          - label: Short action phrase (e.g., "Use locks", "Accept risk", "Add retry logic")
          - description: Fuller explanation of what this approach means and its trade-offs
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a custom mitigation</note>

      <action>Record the user's choice: {issue, chosenMitigation, source: "user"}</action>
    </branch>

    <action>For each pitfall where category is "fyi":</action>
    <action>Record with standard mitigation: {issue, mitigation, source: "standard"}</action>

    <output>
**Pitfall Decisions Recorded**

{For each resolved pitfall:}
- **{issue}**: {chosenMitigation}

Proceeding to technical Q&A. You can raise any concerns about the standard mitigations there.
    </output>
  </step>

  <step name="conduct_qa_dialogue">
    <note>This is a **conversational session** focused on **technical decisions**:
- Architecture and approach
- Existing patterns to follow
- Dependencies and libraries
- Technical constraints
- Files to modify/create</note>

    <note>**FYI Pitfalls:** User may want to discuss pitfalls that were shown as "for your awareness" earlier.
If user raises concerns about a standard mitigation, discuss alternatives and update resolvedPitfalls.
The Q&A phase is the natural place to challenge any assumption made during synthesis.</note>

    <note>**For UI tasks:** Propose, don't interrogate.
- INFER decisions from context and acceptance criteria
- PROPOSE solutions with reasoning: "I'd place X here because Y. Does that work?"
- Only ASK when there's genuine ambiguity the context doesn't resolve</note>

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
      <action>Use AskUserQuestion tool with:
        - header: "Findings"
        - question: "Do these findings influence your approach?"
        - options:
          - label: "Yes", description: "Adjust approach based on findings"
          - label: "No", description: "Keep original approach"
        - multiSelect: false
      </action>
      <note>User can select "Other" to explain how findings affect the approach</note>
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
{From resolvedPitfalls - list each with the confirmed mitigation}
- {issue}: {mitigation}

<note>Pitfalls section in spec should reflect the ACTUAL decisions made:</note>
<note>- Include all pitfalls from resolvedPitfalls</note>
<note>- For user-decided pitfalls: "{issue}: {user's chosen mitigation}"</note>
<note>- For standard mitigations: "{issue}: {standard mitigation}"</note>

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

<note>Open questions should only contain genuinely unresolved items:</note>
<note>- If user selected "Other" during pitfall resolution but gave unclear answer → add as open question</note>
<note>- If user explicitly deferred ("decide during implementation") → add as open question</note>
<note>- If user raised a concern during Q&A that wasn't fully resolved → add as open question</note>
<note>- Do NOT write "None - all resolved" if there are genuine uncertainties</note>
<note>- Empty open-questions section is fine if everything was actually resolved</note>
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
    
    <command description="Validate XML in task files">node .kanban/scripts/validate-xml.cjs {taskId}</command>
    
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

<example label="Quick Research Path">
User: `/kanban-scope 001`

```
Scoping task 001 "Fix button alignment on mobile"...

Reading task details...
- Problem: Button is misaligned on mobile devices
- Value: Better mobile UX
- Acceptance: Button aligned correctly on all screen sizes

How thorough should the codebase research be?
> Quick

Researching (sequential)...

Found:
- Component in src/components/Button.tsx
- Mobile styles in src/styles/mobile.css
- Similar fix in src/components/Header.tsx:45

**Research Synthesis**

### Product Context
- **ui/buttons**: Standard button component with variants

### Engineering Patterns
- **responsive-pattern**: Mobile-first breakpoints — Reference: `src/styles/breakpoints.ts:12`

### Codebase Architecture
- **Button.tsx**: `src/components/Button.tsx` — Main component to modify

### Pitfalls & Constraints

**For your awareness** (standard mitigations apply):
- **z-index stacking**: Mobile nav uses z-index 100 → Use lower value

Does this research synthesis look complete?
- [x] Looks complete (Recommended)
- [ ] Explore product docs
- [ ] Explore codebase
- [ ] Explore pitfalls

All identified pitfalls have standard mitigations. Proceeding to technical Q&A.

[Q&A dialogue continues...]
```
</example>

<example label="Deep Research Path">
User: `/kanban-scope 002`

```
Scoping task 002 "Add real-time collaboration features"...

Reading task details...
- Problem: Users can't see each other's changes in real-time
- Value: Better collaboration, reduced conflicts
- Acceptance: Changes sync within 500ms, presence indicators shown

How thorough should the codebase research be?
> Deep

Launching parallel research agents...

[Product Context Researcher] Finding product docs and constraints...
[Pattern Finder] Finding engineering patterns...
[Codebase Analyzer] Analyzing codebase structure...
[Pitfall Detector] Finding known issues...

All agents complete. Synthesizing findings...

**Research Synthesis**

### Product Context
- **collaboration/overview**: Existing sharing model is document-level
- **state/persistence**: Uses localStorage, will need WebSocket layer

### Engineering Patterns
- **event-system**: Pub/sub pattern at `src/events/emitter.ts:23`
- **state-sync**: Optimistic updates at `src/store/sync.ts:45`

### Codebase Architecture
- **WebSocket client**: Existing in `src/api/socket.ts` (inactive)
- **State store**: Zustand at `src/store/index.ts`
- **Presence UI**: No existing implementation

### Pitfalls & Constraints

**Decisions needed** (we'll discuss these next):
- **Race conditions**: Concurrent edits need conflict resolution

**For your awareness** (standard mitigations apply):
- **Reconnection**: Socket reconnect logic is incomplete → Complete reconnect handler at `src/api/socket.ts:78`
- **Performance**: Frequent updates may cause render thrashing → Throttle state updates

Does this research synthesis look complete?
- [ ] Looks complete (Recommended)
- [ ] Explore product docs
- [x] Explore codebase
- [ ] Explore pitfalls
> Other: Can you look more into conflict resolution patterns?

[Additional research...]

Found CRDT pattern documented in engineering docs...

[Updated synthesis presented]

Does this research synthesis look complete?
- [x] Looks complete (Recommended)

**Resolving Pitfalls**

Let's decide how to handle the pitfalls that have multiple valid approaches.

Race conditions — Concurrent edits need conflict resolution. How should we handle this?
[Use CRDTs] Conflict-free replicated data types, automatic merge
[Last-write-wins] Simple timestamp-based resolution, may lose edits
[Operational transform] Complex but preserves intent, like Google Docs
> Use CRDTs

**Pitfall Decisions Recorded**
- **Race conditions**: Use CRDTs for automatic conflict-free merging

Proceeding to technical Q&A. You can raise any concerns about the standard mitigations there.

[Q&A dialogue continues...]
```
</example>

<next_steps>
```
/clear
/kanban-plan {id}
```
</next_steps>
