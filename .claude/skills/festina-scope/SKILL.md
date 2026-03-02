---
name: festina-scope
description: Research codebase and create functional specification through conversational Q&A. Focuses on engineering analysis - HOW to build it technically.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *, git checkout *), Glob, Grep, AskUserQuestion, WebSearch, WebFetch, Task
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Scope Festina Lente Task

<purpose>
Create a functional specification through iterative conversational Q&A focused on technical decisions, then move to Scoped and commit.
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

<command description="Find task by ID (returns JSON with path and metadata)">node .festinalente/scripts/festinalente.cjs find-task {id}</command>





<command description="Get current date/time (returns JSON with iso and date formats)">node .festinalente/scripts/festinalente.cjs get-date-time</command>

<command description="Get skill configuration (returns JSON with directives)">node .festinalente/scripts/festinalente.cjs get-skill-config {skill}</command>
<example_code lang="json">
{
  "skill": "festina-check",
  "directives": [
    { "name": "code-review", "path": ".festinalente/directives/code-review.xml", "exists": true }
  ]
}
</example_code>



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

<note>Column transition: backlog → scoped</note>
<note>See `.festinalente/workflow.yaml` for column definitions and valid transitions</note>
</context>

<prohibited>
- Do not skip codebase research before the Q&A dialogue
- Do not create a spec without understanding existing patterns
- Do not skip the commit step
- Do not forget to create the task branch
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
      <action>List tasks in `backlog` status from `.festinalente/tasks/`</action>
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
    <command>node .festinalente/scripts/festinalente.cjs find-task {taskId}</command>
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
    <command>node .festinalente/scripts/festinalente.cjs get-skill-config festina-scope</command>
    <action>Parse the JSON output</action>
    
    <branch condition="directives.length > 0">
      <warning>Directives are MANDATORY. You MUST follow them.</warning>
      <action>For EACH directive where `exists` is `true`:</action>
      <action>Read the directive XML file at `path`</action>
      <action>Parse and apply:</action>
      <action>- `<context>` principles: Maintain as ongoing mindset</action>
      <action>- `<process>` rules where phase="scope": Follow as requirements</action>
      <action>- `<override>` sections where phase="scope": Apply step replacements</action>
      <action>- `<verification>` commands: Note for use in task `<verify>` elements</action>
    
      <branch condition="directive has <override> section for phase=scope">
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
      "skill": "festina-scope",
      "directives": [
        { "name": "architecture", "path": ".festinalente/directives/architecture.xml", "exists": true }
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
          <action>For each ID in `affects`: Read `.festinalente/product/{id}.md`</action>
          <action>Note: current behavior, constraints, user flows, feature interactions</action>
        </branch>
        <action>Search for additional relevant product docs</action>
        <command>node .festinalente/scripts/festinalente.cjs search-product {keywords from title and description}</command>
        <note>Search results include `relatedDocs` with tldr previews of connected docs.
Only read full content of related docs if their tldr suggests relevance to this task.
Avoid loading more than 2-3 related docs to preserve context window.</note>
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
        <command>node .festinalente/scripts/festinalente.cjs search-engineering {technical keywords}</command>
        <note>Search results include `relatedDocs` with tldr previews of connected docs.
Only read full content of related docs if their tldr suggests relevance to this task.
Avoid loading more than 2-3 related docs to preserve context window.</note>
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
      <substep name="reconnaissance">
        <note>Sequential recon phase - read referenced docs before spawning agents</note>
        <note>Recon runs in main context (not as agent) because subagents cannot spawn subagents</note>

        <action name="read_product_context">
          <branch condition="task has `affects` field">
            <action>For each ID in `affects`: Read `.festinalente/product/{id}.md`</action>
            <action>Extract: current behavior, constraints, user flows, feature interactions</action>
          </branch>
        </action>

        <action name="read_engineering_context">
          <branch condition="task has `engineering` field">
            <action>For each ID: Read engineering doc using ID to path rules</action>
            <action>Extract: patterns to follow, conventions, system interactions</action>
          </branch>
        </action>

        <action name="identify_focus_areas">
          <action>Based on docs read, determine which areas need deeper exploration:</action>
          <action>- If product docs exist: productFocus = {docIds, keyTerms, relatedFeatures}</action>
          <action>- If engineering docs exist: engineeringFocus = {patterns, fileRefs, systemBoundaries}</action>
        </action>

        <branch condition="no affects AND no engineering docs were read">
          <note>Fallback: extract focus areas from task content</note>
          <action>Extract keywords from task title, description, acceptance criteria</action>
          <action>Use Grep to find related files based on keywords</action>
          <action>Build initial focusAreas from grep results</action>
          <action>All 4 agents will be spawned but with keyword-based focus</action>
        </branch>

        <output_variable>reconFindings: {
          productContext: {docs read, key insights},
          engineeringContext: {patterns found, file references},
          focusAreas: [{area, reason, grepPatterns, filePaths}]
        }</output_variable>
      </substep>

      <substep name="determine_agents">
        <note>Spawn only the agents needed based on recon findings</note>
        <action>agentsToSpawn = []</action>

        <branch condition="reconFindings.focusAreas includes product-related area OR no product docs were read">
          <action>Add Product Context Researcher to agentsToSpawn</action>
        </branch>

        <branch condition="reconFindings.focusAreas includes engineering-related area OR no engineering docs were read">
          <action>Add Pattern Finder to agentsToSpawn</action>
        </branch>

        <branch condition="reconFindings.focusAreas includes codebase-related area">
          <action>Add Codebase Analyzer to agentsToSpawn</action>
          <note>Always include if any implementation work needed</note>
        </branch>

        <branch condition="always">
          <action>Add Pitfall Detector to agentsToSpawn</action>
          <note>Pitfall detection always valuable, but with focused scope</note>
        </branch>

        <branch condition="agentsToSpawn is empty">
          <note>Edge case: recon found everything, no agents needed</note>
          <action>Skip to synthesize_research using recon findings only</action>
        </branch>
      </substep>

      <note>**CRITICAL: Spawn selected agents in parallel using Task tool**</note>
      <action>Use the Task tool for agents in agentsToSpawn in a SINGLE message to achieve parallelism</action>

      <parallel>
        <agent name="Product Context Researcher" subagent_type="Explore">
          <description>Find product docs and constraints</description>
          <prompt>
Research product context for task: "{title}"

**RECON CONTEXT (start here):**
{reconFindings.productContext.summary}
Already read docs: {reconFindings.productContext.docs}

**FOCUS on:**
{For each focusArea related to product:}
- {area}: Search for {grepPatterns}, check files like {filePaths}

Task details:
- Problem: {problem}
- Value: {value}
- Acceptance criteria: {acceptanceCriteria}

Your job:
1. Search for additional product docs NOT already read in recon
2. Focus on areas identified above
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

**RECON CONTEXT (start here):**
{reconFindings.engineeringContext.summary}
Already read docs: {reconFindings.engineeringContext.docs}

**FOCUS on:**
{For each focusArea related to engineering:}
- {area}: Check patterns in {fileRefs}, look for {patterns}

Task details:
- Problem: {problem}
- Value: {value}

Your job:
1. Search for additional engineering patterns NOT already found in recon
2. Focus on areas identified above
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

**RECON CONTEXT (start here):**
{reconFindings.engineeringContext.fileReferences}

**FOCUS on:**
{For each focusArea related to codebase:}
- {area}: Examine {filePaths}, grep for {grepPatterns}

Task details:
- Problem: {problem}
- Value: {value}
- Acceptance criteria: {acceptanceCriteria}

Your job:
1. Start from file references in recon context
2. Use Glob to find related files based on recon focus areas
3. Use Grep to search for similar implementations
4. Read key files to understand existing patterns

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

**RECON CONTEXT (start here):**
Product docs read: {reconFindings.productContext.docs}
Engineering docs read: {reconFindings.engineeringContext.docs}

**FOCUS on:**
{For each focusArea:}
- {area}: Check for pitfalls in {filePaths}

Task details:
- Problem: {problem}
- Value: {value}
- Acceptance criteria: {acceptanceCriteria}

Your job:
1. Focus on areas identified by recon, not the entire codebase
2. Search for error handling patterns in focus areas
3. Look for TODO/FIXME/HACK comments in related code
4. Check for edge cases or known issues in similar implementations

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

      <action>Wait for selected agents to complete</action>
    </branch>
  </step>

  <step name="synthesize_research" outputs="synthesis">
    <note>Consolidate all research findings into a structured summary.</note>
    <note>Present to user for approval BEFORE proceeding to Q&A.</note>

    <branch condition="researchDepth is 'Deep'">
      <action>Include reconFindings as base context</action>
      <action>Combine outputs from agents that were spawned (may be fewer than 4)</action>
      <action>For areas covered by recon but no agent spawned: use recon findings directly</action>
      <action>Deduplicate findings (same file/pattern mentioned by recon and agents)</action>
      <action>Resolve conflicts using these rules:</action>
      <rule>If recon and agent identify same area, prefer agent's deeper findings</rule>
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
    <note>Follow the structured AskUserQuestion pattern used in festina-rework and festina-create.</note>

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
    <note>Use AskUserQuestion tool for **one question at a time**.</note>

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
    <action>Present what you found in the codebase analysis</action>

    <note>User can volunteer information at any time:
- User may provide technology directives (e.g., "use Zustand", "use React Query")
- User may request research (e.g., "research reactive localStorage packages for React")
- User may share architectural preferences or constraints</note>

    <note>**Technical Decision Questions:** Ask as relevant to the task (not all will apply).</note>
    <questions name="technical_decisions">
      <action>Use AskUserQuestion tool with:
        - header: "Approach"
        - question: "I found {existing pattern}. Should we follow this approach or do you have a different preference?"
        - options:
          - label: "Follow existing", description: "Use the pattern I found"
          - label: "Different approach", description: "I have a different idea"
          - label: "Skip", description: "Move to next question"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe their preferred approach</note>

      <action>Use AskUserQuestion tool with:
        - header: "Files"
        - question: "Based on the task, I'd modify/create these files: {list}. Does this look right?"
        - options:
          - label: "Yes", description: "File list is correct"
          - label: "Add files", description: "Include additional files"
          - label: "Skip", description: "Move to next question"
        - multiSelect: false
      </action>
      <note>User can select "Other" to specify different files</note>

      <action>Use AskUserQuestion tool with:
        - header: "Dependencies"
        - question: "Are there any libraries or dependencies we should use (or avoid)?"
        - options:
          - label: "None", description: "No special requirements"
          - label: "Skip", description: "Move to next question"
        - multiSelect: false
      </action>
      <note>User can select "Other" to specify dependencies</note>

      <action>Use AskUserQuestion tool with:
        - header: "Patterns"
        - question: "I found these patterns in the codebase: {patterns}. Should we follow them?"
        - options:
          - label: "Yes", description: "Follow existing patterns"
          - label: "Modify", description: "Adjust the pattern for this task"
          - label: "Skip", description: "Move to next question"
        - multiSelect: false
      </action>
      <note>User can select "Other" to explain pattern preferences</note>

      <action>Use AskUserQuestion tool with:
        - header: "Constraints"
        - question: "Are there any technical constraints I should know about?"
        - options:
          - label: "None", description: "No constraints"
          - label: "Skip", description: "Move to next question"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe constraints</note>
    </questions>

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

    <action>Use AskUserQuestion tool with:
      - header: "Confirm"
      - question: "I have enough information for the spec. Does this summary look correct? Approach: {summary}, Key files: {list}, Dependencies: {list}, Patterns: {summary}"
      - options:
        - label: "Yes, proceed", description: "Create the functional spec"
        - label: "Add more", description: "I have additional context"
        - label: "Corrections", description: "Some details need fixing"
      - multiSelect: false
    </action>
    <note>User can select "Other" to provide corrections or additions</note>

    <branch condition="user says 'Yes, proceed'">
      <action>Proceed to writing spec</action>
    </branch>
    <branch condition="user says 'Add more'">
      <action>Incorporate additional context and confirm again</action>
    </branch>
    <branch condition="user says 'Corrections'">
      <action>Update understanding and confirm again</action>
    </branch>

    <note>Key principles:
- Focus on TECHNICAL decisions, not product requirements (those are in the task)
- Research as topics arise, not just at the beginning
- Let the conversation flow naturally
- Don't rush - thoroughness now saves time during implementation</note>
  </step>

  <step name="create_spec_file" outputs="specPath">
    <action>Create at `.festinalente/tasks/{taskId}/spec.xml`</action>
    <action>Follow template at `.festinalente/templates/spec.xml`</action>
    <action>Link to spec in XML attributes</action>
    <action>Fill ALL sections</action>

    <example_code lang="xml">
<spec task="{taskId}" created="{YYYY-MM-DD}" updated="{YYYY-MM-DD}">
  <title>{title}</title>

  <context>
    {Pull from task's problem and value sections}
  </context>

  <scope>
    <in-scope>
      <item>{What this spec covers}</item>
      <item>{Another scope item}</item>
    </in-scope>
    <out-of-scope>
      <item>{Explicit boundaries}</item>
    </out-of-scope>
  </scope>

  <requirements>
    <requirement id="FR1">The system shall...</requirement>
    <requirement id="FR2">The system shall...</requirement>
  </requirements>

  <files>
    <file action="modify" path="path/to/file.ts" reason="{reason}"/>
    <file action="create" path="path/to/new.ts" reason="{reason}"/>
  </files>

  <patterns>
    <pattern name="{Pattern Name}">
      <description>{description}</description>
      <reference>path/to/example.ts:42</reference>
    </pattern>
  </patterns>

  <research>
    <product>
      <finding doc="{doc-id}">{From synthesis - product docs read and key insights}</finding>
    </product>
    <engineering>
      <finding doc="{doc-id}">{From synthesis - patterns to follow with file:line references}</finding>
    </engineering>
    <codebase>
      <finding component="{name}" path="{path}">{From synthesis - similar implementations found}</finding>
    </codebase>
    <pitfalls>
      <pitfall issue="{issue}" mitigation="{mitigation}"/>
    </pitfalls>
  </research>

  <constraints>
    <constraint>{Constraints discovered during research}</constraint>
  </constraints>

  <dependencies>
    <dependency type="external">{Libraries/APIs - include any researched/chosen packages}</dependency>
    <dependency type="internal">{Other features/tasks}</dependency>
  </dependencies>

  <risks>
    <risk impact="{high|medium|low}" mitigation="{mitigation}">{risk description}</risk>
  </risks>

  <open-questions>
    <question>{Unresolved items, if any}</question>
  </open-questions>
</spec>
    </example_code>

    <note>Pitfalls section in spec should reflect the ACTUAL decisions made:</note>
    <note>- Include all pitfalls from resolvedPitfalls</note>
    <note>- For user-decided pitfalls: "{issue}: {user's chosen mitigation}"</note>
    <note>- For standard mitigations: "{issue}: {standard mitigation}"</note>

    <note>Open questions should only contain genuinely unresolved items:</note>
    <note>- If user selected "Other" during pitfall resolution but gave unclear answer → add as open question</note>
    <note>- If user explicitly deferred ("decide during implementation") → add as open question</note>
    <note>- If user raised a concern during Q&A that wasn't fully resolved → add as open question</note>
    <note>- Do NOT write "None - all resolved" if there are genuine uncertainties</note>
    <note>- Empty open-questions section is fine if everything was actually resolved</note>
  </step>

  <step name="update_task_xml">
    <action>Change status to `scoped`</action>
    <action>Add `spec="tasks/{taskId}/spec.xml"` to refs element</action>
    <action>Update `updated: {YYYY-MM-DD}`</action>
  </step>

  <step name="write_files">
    <action>Write spec file at `.festinalente/tasks/{taskId}/spec.xml`</action>
    <action>Write updated task file</action>
  </step>

  <step name="create_task_branch">
    <command>git checkout -b task/{taskId}</command>
    <output>Confirm: "Created branch task/{taskId}"</output>
  </step>

  <step name="commit">
    <note>Format: `docs({taskId}): scope - {title}`</note>
    <command>git add .festinalente/tasks/{taskId}/spec.xml .festinalente/tasks/{taskId}/task.xml</command>
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
/festina-plan {taskId}
```
    </output>
    ## Final Validation
    
    Before completing, validate all task XML:
    
    <command description="Validate XML in task files">node .festinalente/scripts/festinalente.cjs validate-xml {taskId}</command>
    
    If validation fails, fix the reported errors before completing.
    
    <output>[FESTINA_COMPLETE]</output>
  </step>
</process>

<success_criteria>
- Task file exists at `.festinalente/tasks/{taskId}/task.xml`
- Spec file exists at `.festinalente/tasks/{taskId}/spec.xml`
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
User: `/festina-scope 001`

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
User: `/festina-scope 002`

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
/festina-plan {id}
```
</next_steps>
