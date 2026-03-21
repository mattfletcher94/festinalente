---
name: festina-scope
description: Research codebase and create functional specification through conversational Q&A. Focuses on engineering analysis - HOW to build it technically.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *, git checkout *), Glob, Grep, WebSearch, WebFetch, Task
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Scope Festina Lente Task

<purpose>
Create a functional specification through iterative conversational Q&A focused on technical decisions, then move to Scoped.
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




<command description="Find project by ID (returns JSON with path, id, title, status, taskCount)">node .festinalente/scripts/festinalente.cjs find-project {id}</command>




<command description="Get sibling tasks for a task in its project (returns compact JSON: projectId, projectTitle, siblings[])">node .festinalente/scripts/festinalente.cjs get-project-siblings {task-id}</command>

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
</prohibited>

<process>
  <step name="load_workflow">
    <action>Read `.festinalente/workflow.yaml` for column definitions, labels, priorities, and transitions</action>
    <note>Use these values throughout this skill</note>
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

  <step name="load_project_context" outputs="projectContext, siblingTasks" when="task has non-empty project-id attribute">
    <note>AC-D7: This step only executes when the task belongs to a project. Skip entirely for standalone tasks.</note>

    <branch condition="task has non-empty project-id attribute">
      <command description="Find parent project">node .festinalente/scripts/festinalente.cjs find-project {project-id}</command>
      <action>Read the project.xml file at the returned path to understand the broader goal, requirements, and scope</action>
      <action>Store project requirements list for later traceability (AC-D4)</action>

      <command description="Get sibling tasks (compact data, AC-D6)">node .festinalente/scripts/festinalente.cjs get-project-siblings {taskId}</command>
      <action>Store sibling task list: id, title, status, description for each sibling</action>
      <action>This provides awareness of what other tasks in the project handle (AC-D3)</action>

      <output_variable>projectContext: {
        projectId: {project-id},
        projectTitle: {title from project.xml},
        projectGoal: {goal from project.xml},
        projectRequirements: [{id, text} from project.xml requirements],
        projectScope: {scope from project.xml}
      }</output_variable>
      <output_variable>siblingTasks: [{id, title, status, description}]</output_variable>
    </branch>

    <branch condition="task has no project-id or project-id is empty">
      <action>Skip — standalone task, no project context needed (AC-D7)</action>
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
      <action>- `<process>` rules where phase contains "scope" (phase may be comma-separated, e.g. phase="plan,implement" applies to both): Follow as requirements</action>
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

  <step name="detect_brownfield" outputs="specFormat">
    <note>Detect whether task affects existing product docs (brownfield) or is entirely new (greenfield).</note>

    <branch condition="task has affects field with product doc references">
      <action>Check if any affected product docs exist and contain substantive content (not stubs)</action>
      <branch condition="existing non-stub product docs found">
        <action>Use AskUserQuestion tool with:
          - header: "Spec Format"
          - question: "This task affects existing features ({list affected doc IDs}). Use delta spec format (documents what's changing vs staying the same) or full spec format?"
          - options:
            - label: "Delta spec (Recommended)", description: "Focuses on what's changing. Includes current state, changes, and unchanged sections from product docs."
            - label: "Full spec", description: "Standard full specification. Better for tasks that substantially rework a feature."
          - multiSelect: false
        </action>
        <action>Set specFormat based on user choice</action>
      </branch>
      <branch condition="all affected docs are stubs or missing">
        <action>Set specFormat = "full"</action>
        <output>Affected docs are stubs or missing. Using full spec format.</output>
      </branch>
    </branch>

    <branch condition="task has no affects field">
      <action>Set specFormat = "full"</action>
    </branch>
  </step>

  <step name="run_reconnaissance" outputs="reconFindings">
    <note>Always run recon first — read referenced docs before any depth decision</note>
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
    </branch>

    <output_variable>reconFindings: {
      productContext: {docs read, key insights},
      engineeringContext: {patterns found, file references},
      focusAreas: [{area, reason, grepPatterns, filePaths}]
    }</output_variable>
  </step>

  <step name="recommend_depth" outputs="researchDepth">
    <note>Assess recon findings and recommend Quick or Deep research depth</note>

    <action name="assess_signals">
      <note>Evaluate observable signals from reconnaissance:</note>
      <action>Count files likely affected (from focusAreas file paths and grep results)</action>
      <action>Count distinct systems/modules touched</action>
      <action>Assess pattern clarity (are existing patterns obvious or unclear?)</action>
      <action>Check for cross-cutting concerns (does the change span multiple domains?)</action>
    </action>

    <action name="determine_recommendation">
      <note>Recommend Quick when:</note>
      <action>- Few affected files (1-3) in a single module/system</action>
      <action>- Clear existing patterns to follow (found specific file:line references)</action>
      <action>- No cross-cutting concerns</action>
      <action>- Task description is well-understood from recon alone</action>

      <note>Recommend Deep when:</note>
      <action>- Many affected files (4+) or multiple systems/modules</action>
      <action>- Unclear patterns (no obvious reference implementations found)</action>
      <action>- Cross-cutting concerns (change spans auth + UI + API, etc.)</action>
      <action>- Large surface area of change or unfamiliar codebase area</action>
    </action>

    <action>Use AskUserQuestion tool with:
      - header: "Research"
      - question: "Based on recon, I recommend {Quick|Deep} research. Rationale: {1-2 sentence summary of signals found — e.g., 'Single file change in a well-understood module with clear patterns to follow' or 'Multiple systems affected with unclear interaction patterns'}. Accept or override?"
      - options:
        - label: "{recommended} (Recommended)", description: "{rationale summary}"
        - label: "{other option}", description: "{what this option means for this task}"
      - multiSelect: false
    </action>
  </step>

  <step name="structured_research" outputs="researchFindings">
    <branch condition="researchDepth is 'Quick'">
      <note>Sequential research - faster, fewer tokens</note>

      <substep name="research_product_context">
        <note>Recon already read affected product docs. Search for additional docs only.</note>
        <action>Search for additional relevant product docs not already in reconFindings</action>
        <command>node .festinalente/scripts/festinalente.cjs search-product {keywords from title and description}</command>
        <note>Search results include `relatedDocs` with tldr previews of connected docs.
Only read full content of related docs if their tldr suggests relevance to this task.
Avoid loading more than 2-3 related docs to preserve context window.</note>
        <branch condition="docs with score ≥ 0.3 found that are NOT in reconFindings.productContext">
          <action>Read top matches not already read during recon</action>
        </branch>
        <output_variable>productFindings: reconFindings.productContext + any additional docs</output_variable>
      </substep>

      <substep name="research_engineering_patterns">
        <note>Recon already read referenced engineering docs. Search for additional patterns only.</note>
        <action>Search for additional relevant engineering docs not already in reconFindings</action>
        <command>node .festinalente/scripts/festinalente.cjs search-engineering {technical keywords}</command>
        <note>Search results include `relatedDocs` with tldr previews of connected docs.
Only read full content of related docs if their tldr suggests relevance to this task.
Avoid loading more than 2-3 related docs to preserve context window.</note>
        <branch condition="docs with score ≥ 0.3 found that are NOT in reconFindings.engineeringContext">
          <action>Read top matches not already read during recon</action>
        </branch>
        <output_variable>engineeringFindings: reconFindings.engineeringContext + any additional patterns</output_variable>
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
      <action>Include reconFindings as base context</action>
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

      <action>Use AskUserQuestion tool with:
        - header: "Boundaries"
        - question: "Are there boundaries for the implementation agent? Things it should always do, ask about first, or never touch?"
        - options:
          - label: "None needed", description: "No specific autonomy boundaries"
          - label: "Yes", description: "I want to define always/ask-first/never rules"
          - label: "Skip", description: "Move to next question"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe boundaries directly</note>
      <branch condition="user selects 'Yes' or provides boundaries via 'Other'">
        <action>Capture boundaries into three categories:
          - always: Things the agent should always do without asking (e.g., "run tests", "preserve existing API")
          - ask-first: Things that need user approval before proceeding (e.g., "changing public interfaces", "modifying shared config")
          - never: Hard stops the agent must not cross (e.g., "delete user data", "modify auth logic")
        </action>
      </branch>
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

  <step name="derive_contracts" outputs="contractsList">
    <note>Optionally derive behavioral contracts (preconditions, postconditions, invariants) from the gathered requirements.</note>

    <branch condition="a contracts directive is loaded">
      <note>FR11: When a contracts directive is active, contract derivation is mandatory — skip the prompt and proceed directly to deriving contracts.</note>
      <action>Set deriveContracts to true</action>
    </branch>

    <branch condition="no contracts directive is loaded">
      <action>Use AskUserQuestion tool with:
        - header: "Contracts"
        - question: "Would you like to derive behavioral contracts (preconditions, postconditions, invariants) from the requirements?"
        - options:
          - label: "Yes"
            description: "Derive contracts for each functional requirement"
          - label: "No"
            description: "Skip contracts"
        - multiSelect: false
      </action>
    </branch>

    <branch condition="user selects 'Yes' or contracts directive is active">
      <action>For each functional requirement (FR1, FR2, ...):
        Use AskUserQuestion tool with:
        - header: "Contract for {requirement id}: {short description}"
        - question: "What must be true before, after, and always for this requirement?"
        - freeform input (no options)
      </action>
      <action>Build contract elements from user responses:
        - id: C1, C2, ... (sequential)
        - requirement: reference to the FR (FR1, FR2, ...)
        - name: short descriptive name for the contract
        - precondition: what must be true before (natural language)
        - postcondition: what must be true after (natural language)
        - invariant: what must always be true (natural language)
        - property: general property that should hold (natural language)
      </action>
      <output>contractsList — list of contract elements ready for spec XML</output>
    </branch>

    <branch condition="user selects 'No'">
      <action>Skip contract derivation — contracts will be absent from spec</action>
      <output>contractsList — empty</output>
    </branch>
  </step>

  <step name="validate_gaps">
    <note>Check the draft requirements for gaps and conflicts before creating the spec file.</note>

    <action>Review all requirements gathered during Q&amp;A for:</action>

    <action name="check_conflicts">
      <note>Look for requirements that contradict each other</note>
      <action>Compare each pair of requirements for logical conflicts</action>
      <action>Flag any where satisfying one would prevent satisfying another</action>
    </action>

    <action name="check_error_handling">
      <note>Look for requirements that imply error scenarios but don't address them</note>
      <action>For each requirement involving external input, file I/O, or network: verify error case is covered</action>
    </action>

    <action name="check_dangling_references">
      <note>Look for references to components, files, or features that don't exist</note>
      <action>Verify each referenced file, function, or component exists in the codebase</action>
    </action>

    <action name="check_acceptance_coverage">
      <note>Verify every acceptance criterion from the task has at least one requirement addressing it</note>
      <action>Map each acceptance criterion to its covering requirement(s)</action>
      <action>Flag any acceptance criteria with no matching requirement</action>
    </action>

    <branch condition="any gaps or conflicts found">
      <output>
**Gap Validation Results**

{For each issue found:}
- **{type}**: {description}
      </output>
      <action>Use AskUserQuestion tool with:
        - header: "Gaps Found"
        - question: "Found {n} gap(s) in requirements. Address them now or proceed?"
        - options:
          - label: "Address now (Recommended)", description: "Discuss and resolve each gap before creating spec"
          - label: "Proceed anyway", description: "Acknowledge gaps and create spec as-is"
        - multiSelect: false
      </action>
      <branch condition="user selects 'Address now'">
        <action>For each gap, discuss with user and update requirements accordingly</action>
      </branch>
    </branch>

    <branch condition="no gaps found">
      <output>Gap validation passed. No conflicts, missing error handling, dangling references, or uncovered acceptance criteria found.</output>
    </branch>
  </step>

  <step name="spec_self_critique" outputs="deferredFindings, boundarySuggestions">
    <note>Review gathered requirements for quality defects before spec creation. This complements validate_gaps (which checks structural correctness — conflicts, dangling references, acceptance coverage) by focusing on requirement quality: clarity, testability, completeness, and consistency. Do not duplicate validate_gaps checks.</note>

    <action name="check_vague_language">
      <note>FR7, FR15: Scan each requirement for vague quantifiers, modal weakenings, and passive voice with ambiguous actors</note>
      <action>Check for vague quantifiers: "some", "many", "most", "few", "several", "various"</action>
      <action>Check for modal weakenings: "might", "should", "could", "may"</action>
      <action>Check for passive voice with ambiguous actors (e.g., "data is processed" — by whom?)</action>
      <action>Flag as CRITICAL with specific suggestions (e.g., "'fast processing' is untestable — suggest specifying a target latency")</action>
    </action>

    <action name="check_testability">
      <note>FR8, FR15: Scan each requirement for subjective adjectives without measurable criteria</note>
      <action>Check for subjective adjectives: "efficient", "reliable", "user-friendly", "fast", "simple", "intuitive"</action>
      <action>Flag as CRITICAL with suggestions to add measurable definitions (e.g., "'reliable' — suggest defining acceptable failure rate or uptime target")</action>
    </action>

    <action name="check_edge_cases">
      <note>FR9, FR15: Check requirements involving conditional logic or external input for missing edge cases</note>
      <action>For each requirement involving conditional logic or external input:</action>
      <action>Check for missing error states</action>
      <action>Check for missing boundary conditions</action>
      <action>Check for missing state transitions</action>
      <action>Flag gaps as MODERATE</action>
    </action>

    <action name="check_consistency">
      <note>FR10, FR15: Compare requirements for logical contradictions</note>
      <action>Compare each pair of requirements for logical contradictions (e.g., "always validate input" vs "skip validation in batch mode")</action>
      <action>Flag as CRITICAL, referencing both requirement IDs in the finding</action>
    </action>

    <action name="check_project_coverage">
      <note>FR14: Validate project requirement coverage when task has project-id</note>
      <branch condition="task has project-id AND project requirements exist (from selectedRequirements/project context)">
        <action>For each selected project requirement, verify at least one functional requirement addresses it</action>
        <action>Flag unaddressed project requirements as CRITICAL</action>
      </branch>
    </action>

    <branch condition="a spec-quality directive was loaded during the load_directives step">
      <note>FR6: Apply directive-defined quality rules alongside generic checks</note>
      <action>Read directive quality rules from the already-loaded directives (via get-skill-config mechanism)</action>
      <action>Apply directive-defined quality checks to all requirements</action>
      <action>Add any directive findings to the categorized findings list with appropriate severity</action>
    </branch>

    <action>Collect all findings into a categorized list, each tagged as CRITICAL or MODERATE (FR2)</action>

    <branch condition="no findings">
      <output>Self-critique passed. No quality issues found.</output>
    </branch>

    <branch condition="findings found">
      <note>FR3: Present CRITICAL findings individually</note>
      <action>For each CRITICAL finding, use AskUserQuestion tool with:
        - header: "Quality Issue (CRITICAL)"
        - question: "{requirement ID}: {issue description}\n\nSuggestion: {specific improvement}"
        - options:
          - label: "Address now", description: "Revise this requirement"
          - label: "Defer to open-questions", description: "Add to spec open-questions for later resolution"
          - label: "Dismiss", description: "Acknowledge and continue without change"
        - multiSelect: false
      </action>

      <branch condition="user selects 'Address now'">
        <action>Ask user for revised requirement text</action>
        <action>Replace the requirement in gathered requirements with the revised text</action>
        <action>FR11: Re-run quality checks on ONLY the revised requirement (not all requirements)</action>
        <branch condition="new issues found on revised requirement">
          <action>Present new findings to user again with the same address/defer/dismiss options</action>
        </branch>
      </branch>
      <branch condition="user selects 'Defer to open-questions'">
        <action>FR12: Add finding description to the deferredFindings list (flows to create_spec_file open-questions)</action>
      </branch>
      <branch condition="user selects 'Dismiss'">
        <action>Log dismissal, continue to next finding</action>
      </branch>

      <note>FR4: Present MODERATE findings in batch</note>
      <action>Present all MODERATE findings together using AskUserQuestion tool with:
        - header: "Quality Issues (MODERATE)"
        - question: "{list of all moderate findings with requirement IDs and descriptions}"
        - options:
          - label: "Review individually", description: "Address each finding one by one"
          - label: "Defer all", description: "Add all to spec open-questions"
          - label: "Dismiss all", description: "Acknowledge and continue"
        - multiSelect: false
      </action>

      <branch condition="user selects 'Review individually'">
        <action>Loop through each MODERATE finding with the same address/defer/dismiss pattern as CRITICAL findings</action>
      </branch>
      <branch condition="user selects 'Defer all'">
        <action>FR12: Add all MODERATE findings to deferredFindings list</action>
      </branch>
      <branch condition="user selects 'Dismiss all'">
        <action>Continue</action>
      </branch>

      <note>FR13: Check for autonomy boundary implications</note>
      <action>After finding resolution, check if any findings imply autonomy boundaries (always/ask-first/never)</action>
      <branch condition="boundary implications found">
        <action>For each implied boundary, use AskUserQuestion tool with:
          - header: "Boundary Suggestion"
          - question: "This finding implies an autonomy boundary: {description}. Add to spec boundaries?"
          - options:
            - label: "Always", description: "Agent should always do this"
            - label: "Ask-first", description: "Agent should ask before doing this"
            - label: "Never", description: "Agent must never do this"
            - label: "Skip", description: "Don't add as boundary"
          - multiSelect: false
        </action>
        <branch condition="user selects Always, Ask-first, or Never">
          <action>Add to boundarySuggestions list with the selected category</action>
        </branch>
      </branch>
    </branch>

    <output>
**Self-Critique Summary**

{N} findings total, {N} addressed, {N} deferred, {N} dismissed.
    </output>
  </step>

  <step name="create_spec_file" outputs="specPath">
    <action>Create at `.festinalente/tasks/{taskId}/spec.xml`</action>
    <action>Follow template at `.festinalente/templates/spec.xml`</action>
    <action>Link to spec in XML attributes</action>
    <action>Fill ALL sections</action>

    <branch condition="specFormat is 'delta'">
      <action>Include delta section in spec XML:
        - current: Summarize current behavior from affected product docs (what exists today)
        - changing: What this task modifies (derived from requirements and Q&amp;A)
        - unchanged: What explicitly stays the same (important for implementation agent to know what NOT to touch)
      </action>
    </branch>

    <branch condition="boundaries were captured during Q&amp;A">
      <action>Include boundaries section in spec XML:
        - always: Items from always category, each as an item element
        - ask-first: Items from ask-first category, each as an item element
        - never: Items from never category, each as an item element
      </action>
    </branch>

    <branch condition="boundarySuggestions from spec_self_critique exist">
      <action>Add each boundary suggestion to the boundaries section in the appropriate category (always/ask-first/never), each as an item element</action>
    </branch>

    <branch condition="deferredFindings from spec_self_critique exist">
      <action>Add each deferred finding as a question element in the open-questions section of the spec XML</action>
    </branch>

    <branch condition="contracts were derived during derive_contracts step">
      <action>Include contracts element in spec XML with each contract referencing the requirement
        it constrains. Each contract has id, requirement, name, precondition, postcondition,
        invariant, and property elements using natural language descriptions.</action>
    </branch>

    <note>Project-aware spec sections (only when projectContext exists):</note>
    <branch condition="projectContext exists (task belongs to a project)">
      <action>AC-D3: In out-of-scope, reference what sibling tasks handle.
        e.g., "Session management is handled by task 004-session-mgmt"</action>
      <action>AC-D4: In requirements, map each FR to BOTH the spec-level requirement AND the project requirement ID it traces to.
        e.g., FR1 traces to R2 (from project requirements)</action>
      <action>AC-D5: In dependencies type="internal", reference sibling tasks if this task depends on or is blocked by them</action>
    </branch>

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
      <!-- AC-D3: When task belongs to a project, reference sibling tasks here -->
      <item>{sibling task area} is handled by task {sibling-task-id}</item>
    </out-of-scope>
  </scope>

    <!-- Conditional: only when specFormat is "delta" -->
    <delta>
      <current>{what exists today, from product docs}</current>
      <changing>{what this task modifies}</changing>
      <unchanged>{what explicitly stays the same}</unchanged>
    </delta>

    <!-- Conditional: only when boundaries were captured during Q&A -->
    <boundaries>
      <always>
        <item>{always do this without asking}</item>
      </always>
      <ask-first>
        <item>{ask user before doing this}</item>
      </ask-first>
      <never>
        <item>{never do this}</item>
      </never>
    </boundaries>

    <!-- Conditional: only when contracts were derived -->
    <contracts>
      <contract id="C1" requirement="FR1">
        <name>{contract name}</name>
        <precondition>{what must be true before}</precondition>
        <postcondition>{what must be true after}</postcondition>
        <invariant>{what must always be true}</invariant>
        <property>{general property that holds}</property>
      </contract>
    </contracts>

  <requirements>
    <!-- AC-D4: When task belongs to a project, add traces-to attribute linking to project requirement IDs -->
    <requirement id="FR1" traces-to="{project-requirement-id, e.g. R2}">The system shall...</requirement>
    <requirement id="FR2" traces-to="{project-requirement-id}">The system shall...</requirement>
    <!-- Omit traces-to for standalone tasks or FRs that don't map to a project requirement -->
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
    <!-- AC-D5: When task belongs to a project, reference sibling tasks if needed -->
    <dependency type="internal">{Other features/tasks or sibling task IDs from project}</dependency>
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

  <step name="check_leakage">
    <note>Review each requirement in the spec for implementation leakage — requirements should describe WHAT (outcomes) not HOW (implementation details).</note>

    <action>For each requirement in the spec:</action>
    <action>Check if it prescribes specific:
      - Function names, class names, or variable names
      - Exact code patterns or algorithms
      - Specific library APIs or method calls
      - File structure or directory layout (beyond what's in the files section)
    </action>
    <action>A requirement should describe the observable outcome, not the code structure.</action>

    <branch condition="leakage found in any requirements">
      <output>
**Implementation Leakage Check**

The following requirements prescribe HOW instead of WHAT:
{For each leaking requirement:}
- **{FR id}**: "{requirement text}"
  Issue: {what's leaking — e.g., "specifies function name 'handleAuth'"}
  Suggested: {rewrite focusing on outcome}
      </output>
      <action>Use AskUserQuestion tool with:
        - header: "Leakage"
        - question: "Found {n} requirement(s) with implementation leakage. Rewrite them to focus on outcomes?"
        - options:
          - label: "Rewrite (Recommended)", description: "Update flagged requirements to describe outcomes instead of implementation"
          - label: "Keep as-is", description: "Requirements are intentionally specific (e.g., matching existing API names)"
        - multiSelect: false
      </action>
      <branch condition="user selects 'Rewrite'">
        <action>Update the spec file with rewritten requirements</action>
      </branch>
    </branch>

    <branch condition="no leakage found">
      <output>Leakage check passed. All requirements describe outcomes, not implementation details.</output>
    </branch>
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
