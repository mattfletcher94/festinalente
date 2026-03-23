---
name: festina-discover
description: Systematically surface feature opportunities, gaps, and improvements through multi-perspective analysis. Handles both generative ("find opportunities") and evaluative ("is X worth doing?") use cases, replacing /festina-explore.
allowed-tools: Read, Glob, Grep, Bash(node *, git log *), Agent, Skill
argument-hint: "[area to focus on, or question to evaluate]"
disable-model-invocation: true
---

# Discover Opportunities

<purpose>
Systematic product discovery through parallel lens agents. Spawns four specialized agents (User, Product, Engineering, Backlog) to analyze the project from different perspectives, then synthesizes deduplicated and prioritized opportunities for the user to act on.
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




<command description="List all tasks (returns JSON with count and tasks array)">node .festinalente/scripts/festinalente.cjs list-tasks</command>
<command description="List tasks filtered by status">node .festinalente/scripts/festinalente.cjs list-tasks --status=in-progress</command>
<command description="List tasks excluding a status">node .festinalente/scripts/festinalente.cjs list-tasks --exclude-status=done</command>



<command description="Get skill configuration (returns JSON with directives)">node .festinalente/scripts/festinalente.cjs get-skill-config {skill}</command>
<example_code lang="json">
{
  "skill": "festina-check",
  "directives": [
    { "name": "code-review", "path": ".festinalente/directives/code-review.xml", "exists": true }
  ]
}
</example_code>









<note>Use these scripts to work with product documentation:</note>

<command description="List all product docs (returns JSON with count and docs array)">node .festinalente/scripts/festinalente.cjs list-product</command>
<command description="Filter by type">node .festinalente/scripts/festinalente.cjs list-product --type=feature</command>
<command description="Filter by domain">node .festinalente/scripts/festinalente.cjs list-product --domain=auth</command>

<command description="Search product docs by keywords (returns JSON sorted by relevance)">node .festinalente/scripts/festinalente.cjs search-product keyword1 keyword2 ...</command>
<command description="With minimum score threshold">node .festinalente/scripts/festinalente.cjs search-product password reset --min-score=0.3</command>
<note>Score interpretation: ≥0.5 = strong match | 0.3-0.5 = possible match | &lt;0.3 = weak match | No results = likely new feature</note>


<note>Path rule: ID `auth/login` → Path `.festinalente/product/auth/login.md`</note>

<note>Use these scripts to work with engineering documentation:</note>

<command description="List all engineering docs (returns JSON with count and docs array)">node .festinalente/scripts/festinalente.cjs list-engineering</command>
<command description="Filter by type">node .festinalente/scripts/festinalente.cjs list-engineering --type=pattern</command>
<command description="Filter components by system">node .festinalente/scripts/festinalente.cjs list-engineering --system=auth</command>

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
- Do not create any files — output is conversational only
- Do not automatically create tasks — user must explicitly choose to invoke /festina-create
- Do not cache results between runs — always perform fresh analysis
- Do not skip data source checks — always verify what's available before spawning agents
</prohibited>

<process>
  <step name="load_directives">
    <command>node .festinalente/scripts/festinalente.cjs get-skill-config festina-discover</command>
    <action>Parse the JSON output</action>
    
    <branch condition="directives.length > 0">
      <warning>Directives are MANDATORY. You MUST follow them.</warning>
      <action>For EACH directive where `exists` is `true`:</action>
      <action>Read the directive XML file at `path`</action>
      <action>Parse and apply:</action>
      <action>- `<context>` principles: Maintain as ongoing mindset</action>
      <action>- `<process>` rules where phase contains "discover" (phase may be comma-separated, e.g. phase="plan,implement" applies to both): Follow as requirements</action>
      <action>- `<override>` sections where phase="discover": Apply step replacements</action>
      <action>- `<verification>` commands: Note for use in task `<verify>` elements</action>
    
      <branch condition="directive has <override> section for phase=discover">
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
      "skill": "festina-discover",
      "directives": [
        { "name": "architecture", "path": ".festinalente/directives/architecture.xml", "exists": true }
      ]
    }
    </example_code>
  </step>

  <step name="determine_mode" outputs="mode, focus">
    <branch condition="$ARGUMENTS not provided">
      <action>Set mode = "broad_generative"</action>
      <action>Set focus = null (scan everything)</action>
    </branch>

    <branch condition="$ARGUMENTS contains question pattern (is X worth?, should we?, can we?, does it make sense to?)">
      <action>Set mode = "evaluative"</action>
      <action>Set focus = the specific question from $ARGUMENTS</action>
    </branch>

    <branch condition="$ARGUMENTS contains area focus (opportunities in X, gaps in Y, improvements to Z)">
      <action>Set mode = "focused_generative"</action>
      <action>Set focus = the specified area from $ARGUMENTS</action>
    </branch>

    <branch condition="$ARGUMENTS provided but mode is ambiguous">
      <action>Use AskUserQuestion tool with:
        - header: "Discovery Mode"
        - question: "I'm not sure how to interpret your request. What are you looking for?"
        - options:
          - label: "Find opportunities", description: "Surface gaps, improvements, and new feature ideas"
          - label: "Evaluate an idea", description: "Assess whether a specific idea is worth pursuing"
          - label: "Focus on an area", description: "Narrow discovery to a specific part of the project"
        - multiSelect: false
      </action>
      <note>User can select "Other" to clarify in their own words</note>
    </branch>

    <output>
Discovery mode: {mode}
Focus: {focus or "broad scan"}
    </output>
  </step>

  <step name="check_data_sources" outputs="hasProductDocs, hasEngineeringDocs, hasTasks">
    <action>Check which data sources are available:</action>

    <command description="Check product docs">node .festinalente/scripts/festinalente.cjs list-product</command>
    <action>Set hasProductDocs = true if count > 0, else false</action>

    <command description="Check engineering docs">node .festinalente/scripts/festinalente.cjs list-engineering</command>
    <action>Set hasEngineeringDocs = true if count > 0, else false</action>

    <command description="Check tasks">node .festinalente/scripts/festinalente.cjs list-tasks</command>
    <action>Set hasTasks = true if count > 0, else false</action>

    <note>Codebase is always available as a baseline data source</note>

    <output>
Data sources available:
- Product docs: {hasProductDocs ? "Yes" : "No"}
- Engineering docs: {hasEngineeringDocs ? "Yes" : "No"}
- Tasks: {hasTasks ? "Yes" : "No"}
- Codebase: Yes (always available)
    </output>

    <branch condition="none of hasProductDocs, hasEngineeringDocs, hasTasks are true">
      <output>No documentation or tasks found. Discovery will rely on codebase analysis only. Results may be limited.</output>
    </branch>
  </step>

  <step name="spawn_lens_agents">
    <note>**CRITICAL: Spawn 4 agents in parallel using Agent tool**</note>
    <action>Use the Agent tool 4 times in a SINGLE message to achieve parallelism</action>
    <note>Each agent uses subagent_type="Explore"</note>
    <note>If mode is "focused_generative" or "evaluative", include the focus in each agent prompt to narrow analysis</note>

    <parallel>
      <agent name="User Lens" subagent_type="Explore">
        <description>Analyze from user perspective — journeys, friction, coverage gaps</description>
        <prompt>
You are analyzing this project from the USER perspective to find opportunities.

No product docs available. Skip this lens and output:
"No product docs available — User Lens skipped."


**Output format — for each finding:**
- title: Brief description
- evidence: What was found (with file paths or doc references)
- problem: What's wrong or missing
- confidence: high/medium/low
        </prompt>
      </agent>

      <agent name="Product Lens" subagent_type="Explore">
        <description>Compare product docs against codebase — staleness, undocumented features, domain gaps</description>
        <prompt>
You are analyzing this project from the PRODUCT perspective to find opportunities.

**Step 1:** Grep the codebase for TODO, FIXME, HACK comments to find acknowledged issues.
**Step 2:** Use Glob to scan for major feature entry points (routes, commands, exports).

**Step 3:** No product docs available. Focus entirely on codebase analysis:
  - Identify features that should be documented
  - Note areas with high complexity but no documentation


**Output format — for each finding:**
- title: Brief description
- evidence: What was found (with file:line references)
- problem: What's wrong or missing
- confidence: high/medium/low
        </prompt>
      </agent>

      <agent name="Engineering Lens" subagent_type="Explore">
        <description>Analyze engineering docs, patterns, tech debt, and code churn</description>
        <prompt>
You are analyzing this project from the ENGINEERING perspective to find opportunities.

**Step 1:** Grep for TODO, FIXME, HACK comments across the codebase.
**Step 2:** Run `git log --oneline -100` to identify recently active areas.
**Step 3:** Run `git log --format='' --name-only -200 | sort | uniq -c | sort -rn | head -20` to find churn hotspots (files changed frequently).

**Step 4:** No engineering docs available. Focus on codebase analysis:
  - Identify patterns that should be documented
  - Note inconsistent approaches to the same problem

**Step 7:** Check for tech debt indicators:
  - Files with high churn AND TODO/FIXME comments
  - Large files (> 300 lines) that may need decomposition
  - Missing or sparse test coverage (look for test files)


**Output format — for each finding:**
- title: Brief description
- evidence: What was found (with file:line references)
- problem: What's wrong or missing
- confidence: high/medium/low
        </prompt>
      </agent>

      <agent name="Backlog Lens" subagent_type="Explore">
        <description>Analyze task backlog for themes, stale items, and ripple effects</description>
        <prompt>
You are analyzing this project's BACKLOG to find opportunities.

No tasks available. Skip this lens and output:
"No tasks available — Backlog Lens skipped."


**Output format — for each finding:**
- title: Brief description
- evidence: What was found (with task IDs or references)
- problem: What's wrong or missing
- confidence: high/medium/low
        </prompt>
      </agent>
    </parallel>

    <action>Wait for all 4 agents to complete</action>
    <note>Agents run concurrently for faster discovery</note>
  </step>

  <step name="synthesize_opportunities" outputs="opportunities">
    <action>Collect all findings from all four lenses</action>

    <action>Deduplicate: merge findings about the same topic from different lenses into a single opportunity</action>
    <action>Cross-reference: note when multiple lenses found the same issue (increases confidence)</action>

    <action>For each unique opportunity, create a structured entry:</action>
    <note>
- title: Clear, actionable description
- perspective: Which lens(es) found this (e.g., "User + Engineering")
- evidence: Specific references (file:line, doc IDs, task IDs)
- problem: What's wrong or missing
- confidence: high (multiple lenses or strong evidence) / medium / low
- suggested_next_action: What to do about it (e.g., "Create task to...", "Investigate further...")
    </note>

    <action>Sort opportunities: high confidence first, then by number of lenses that found it</action>

    <branch condition="mode = evaluative">
      <action>Focus synthesis on answering the user's specific question</action>
      <action>Frame opportunities as evidence for or against the evaluated idea</action>
    </branch>
  </step>

  <step name="present_opportunities">
    <branch condition="mode = evaluative">
      <output>
## Evaluation: {focus}

**Verdict:** {assessment based on evidence}

**Evidence For:**
{findings supporting the idea}

**Evidence Against:**
{findings opposing the idea}

**Opportunities Found:**
      </output>
    </branch>

    <branch condition="mode = broad_generative or mode = focused_generative">
      <output>
## Discovery Results{focus ? ": " + focus : ""}

**Data sources analyzed:** {list of available sources}
**Lenses that produced findings:** {list}
      </output>
    </branch>

    <action>Present each opportunity grouped by confidence level:</action>
    <output>
### High Confidence
{For each high-confidence opportunity:}
**{number}. {title}**
- Perspective: {which lenses}
- Evidence: {references}
- Problem: {description}
- Next action: {suggestion}

### Medium Confidence
{...}

### Low Confidence
{...}
    </output>

    <action>Use AskUserQuestion tool with:
      - header: "Opportunities"
      - question: "Which opportunity would you like to act on?"
      - options: (up to 4 top opportunities by confidence, plus fallback)
        - label: "{opportunity 1 title}", description: "{brief problem statement}"
        - label: "{opportunity 2 title}", description: "{brief problem statement}"
        - label: "{opportunity 3 title}", description: "{brief problem statement}"
        - label: "{opportunity 4 title}", description: "{brief problem statement}"
      - multiSelect: false
    </action>
    <note>User can select "Other" to specify a different action or ask follow-up questions</note>
  </step>

  <step name="follow_up_dialogue">
    <branch condition="user selects an opportunity to explore deeper">
      <action>Ask clarifying questions about the selected opportunity</action>
      <action>Do additional targeted research (grep, read files, search docs)</action>
      <action>Re-present with enriched detail</action>
      <action>Use AskUserQuestion tool with:
        - header: "Next"
        - question: "What would you like to do with this opportunity?"
        - options:
          - label: "Create task", description: "Invoke /festina-create with this opportunity"
          - label: "Keep exploring", description: "Continue discussing, ask more questions"
          - label: "Go back", description: "Return to the opportunity list"
        - multiSelect: false
      </action>
      <note>User can select "Other" to specify a custom action</note>
    </branch>

    <branch condition="user selects 'Create task'">
      <action>Invoke Skill tool: skill="festina-create", args="{opportunity title}"</action>
      <note>Conversation context (problem, value, evidence) carries forward to festina-create</note>
    </branch>

    <branch condition="user wants to see more opportunities or asks follow-up questions">
      <action>Continue dialogue, do additional research as needed</action>
      <action>Return to present_opportunities step when new findings are ready</action>
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

  <step name="complete">
    <output>[FESTINA_COMPLETE]</output>
  </step>
</process>

<success_criteria>
- At least one lens agent produced findings
- Opportunities are deduplicated and prioritized
- Each opportunity has required fields (title, perspective, evidence, problem, confidence, suggested next action)
- User can select an opportunity and invoke /festina-create
- Works with partial data sources (graceful degradation)
</success_criteria>

<contracts>
  <contract name="Discovery Phase" id="C1" constrains="FR1,FR3,FR4,FR5,FR6,FR9,FR10,FR17">
    <precondition>At least one data source exists (product docs, engineering docs, tasks, or codebase)</precondition>
    <postcondition>Each lens that had data to analyze produces a list of findings with evidence</postcondition>
  </contract>

  <contract name="Synthesis Phase" id="C2" constrains="FR2,FR7">
    <precondition>All lens agents have completed and returned findings</precondition>
    <postcondition>Opportunities are deduplicated, cross-referenced across lenses, and sorted by confidence level</postcondition>
  </contract>

  <contract name="User Interaction" id="C3" constrains="FR8,FR11,FR12">
    <precondition>Opportunities have been presented to the user</precondition>
    <postcondition>If user selects an opportunity for task creation, /festina-create is invoked with title, problem, value, and evidence context</postcondition>
  </contract>
</contracts>

<example label="Broad Generative Discovery">
User: `/festina-discover`

```
Discovery mode: broad_generative
Focus: broad scan

Checking data sources...
- Product docs: Yes (12 docs)
- Engineering docs: Yes (5 docs)
- Tasks: Yes (8 tasks)
- Codebase: Yes

Spawning 4 lens agents in parallel...

[User Lens] Analyzing user journeys and friction points...
[Product Lens] Comparing docs against codebase...
[Engineering Lens] Scanning for tech debt and pattern gaps...
[Backlog Lens] Analyzing task themes and ripple effects...

All agents complete. Synthesizing findings...

## Discovery Results

**Data sources analyzed:** Product docs, Engineering docs, Tasks, Codebase
**Lenses that produced findings:** User, Product, Engineering, Backlog

### High Confidence

**1. Missing error handling in auth flow**
- Perspective: User + Engineering
- Evidence: product/auth/login.md documents happy path only; src/auth/handler.ts:45 has bare catch
- Problem: Users hitting errors get no guidance; error paths undocumented
- Next action: Create task to add error handling and document error states

**2. Stale notification docs**
- Perspective: Product + Backlog
- Evidence: product/notifications/email.md references removed sendgrid integration; task #005 replaced it
- Problem: Documentation describes a system that no longer exists
- Next action: Create task to update notification docs

### Medium Confidence

**3. Recurring auth churn**
- Perspective: Engineering + Backlog
- Evidence: git log shows src/auth/ modified in 8 of last 20 commits; tasks #003, #006, #008 all touch auth
- Problem: Frequent changes suggest unstable design or growing requirements
- Next action: Investigate whether auth needs architectural review

Which opportunity would you like to act on?
```
</example>

<example label="Evaluative Discovery">
User: `/festina-discover is it worth adding a plugin system?`

```
Discovery mode: evaluative
Focus: is it worth adding a plugin system?

Checking data sources...
- Product docs: Yes (12 docs)
- Engineering docs: Yes (5 docs)
- Tasks: Yes (8 tasks)
- Codebase: Yes

Spawning 4 lens agents (focused on plugin/extensibility)...

All agents complete. Synthesizing findings...

## Evaluation: Is it worth adding a plugin system?

**Verdict:** Likely premature. Evidence suggests extensibility needs are real
but can be addressed with simpler patterns first.

**Evidence For:**
- 3 TODO comments mention "make this configurable" (src/core/pipeline.ts:89, src/output/formatter.ts:12, src/input/parser.ts:34)
- Task #004 requested custom output formats
- Engineering docs describe a "pipeline" pattern that could benefit from plugins

**Evidence Against:**
- Only 2 active users of the codebase (git log shows 2 committers)
- No external contributor requests or issues asking for plugins
- Current extension points (config files) are underutilized

**Opportunities Found:**

### High Confidence

**1. Extract pipeline stages into configurable steps**
- Perspective: Engineering + Product
- Evidence: pipeline.ts has 4 hardcoded stages that could be config-driven
- Problem: Adding new stages requires code changes
- Next action: Create task to make pipeline configurable before committing to full plugin system

Which opportunity would you like to act on?
```
</example>

<next_steps>
If an opportunity is worth pursuing:
```
/festina-create {opportunity title}
```

For deeper exploration of a specific area:
```
/festina-discover opportunities in {area}
```

To evaluate a specific idea:
```
/festina-discover is it worth {doing X}?
```
</next_steps>
