---
name: kanban-scope
description: Research codebase and create functional specification through conversational Q&A. Focuses on engineering analysis - HOW to build it technically.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *, git checkout *), Glob, Grep, AskUserQuestion, WebSearch, WebFetch, Task
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Scope Kanban Task

<purpose>
Create a functional specification through iterative conversational Q&A focused on technical decisions, then move to Scoped and commit.
</purpose>

<context>
{{> directory-reference}}

{{> helper-scripts show_find_task=true show_get_date_time=true show_get_skill_config=true}}

{{> engineering-docs-scripts show_search_engineering=true}}

{{> column-transition from="backlog" to="scoped"}}
</context>

<prohibited>
- Do not skip codebase research before the Q&A dialogue
- Do not create a spec without understanding existing patterns
- Do not skip the commit step
- Do not forget to create the task branch
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="verify_branch">
    {{> branch-verify-main reason="to create the task branch"}}
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
    {{> load-directives skill="scope"}}
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
        <output_variable>pitfallFindings: list of {issue, impact, mitigation}</output_variable>
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
- mitigation: How to avoid or handle it

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

  {{> directive-compliance}}

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
    {{> skill-complete}}
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
- **z-index stacking**: Mobile nav uses z-index 100 — Mitigation: Use lower value

Does this synthesis look complete?
> Looks good

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
- **Race conditions**: Concurrent edits need conflict resolution
- **Reconnection**: Socket reconnect logic is incomplete at `src/api/socket.ts:78`
- **Performance**: Frequent updates may cause render thrashing

Does this synthesis look complete?
> Can you look more into conflict resolution patterns?

[Additional research...]

Found CRDT pattern documented in engineering docs...

[Updated synthesis presented]

> Looks good now

[Q&A dialogue continues...]
```
</example>

<next_steps>
```
/clear
/kanban-plan {id}
```
</next_steps>
