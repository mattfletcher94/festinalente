---
name: kanban-feature-discovery
description: Analyze codebase and product to discover and suggest new features. Optionally focus on a specific area.
tools:
  read: true
  bash(ls *: true
  node .kanban/scripts/*): true
  glob: true
  grep: true
  question: true
  websearch: true
  webfetch: true
  task: true
argument-hint: "[focus-area]"
disable-model-invocation: true
---

# Feature Discovery

<purpose>
Analyze the codebase, product docs, and patterns to discover potential new features. Presents findings for user to act on.
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




<command description="List all tasks (returns JSON with count and tasks array)">node .kanban/scripts/list-tasks.cjs</command>
<command description="List tasks filtered by status">node .kanban/scripts/list-tasks.cjs --status=in-progress</command>
<command description="List tasks excluding a status">node .kanban/scripts/list-tasks.cjs --exclude-status=done</command>




<note>Use these scripts to work with product documentation:</note>

<command description="List all product docs (returns JSON with count and docs array)">node .kanban/scripts/list-product.cjs</command>
<command description="Filter by type">node .kanban/scripts/list-product.cjs --type=feature</command>
<command description="Filter by domain">node .kanban/scripts/list-product.cjs --domain=auth</command>

<command description="Search product docs by keywords (returns JSON sorted by relevance)">node .kanban/scripts/search-product.cjs keyword1 keyword2 ...</command>
<command description="With minimum score threshold">node .kanban/scripts/search-product.cjs password reset --min-score=0.3</command>
<note>Score interpretation: ≥0.5 = strong match | 0.3-0.5 = possible match | &lt;0.3 = weak match | No results = likely new feature</note>


<note>Path rule: ID `auth/login` → Path `.kanban/product/auth/login.md`</note>

<note>Use these scripts to work with engineering documentation:</note>

<command description="List all engineering docs (returns JSON with count and docs array)">node .kanban/scripts/list-engineering.cjs</command>
<command description="Filter by type">node .kanban/scripts/list-engineering.cjs --type=pattern</command>
<command description="Filter components by system">node .kanban/scripts/list-engineering.cjs --system=auth</command>

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
</context>

<prohibited>
- Do not create tasks - only list discoveries
- Do not suggest features without evidence/rationale
</prohibited>

<process>
  <step name="determine_focus" outputs="focusArea">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as focusArea</action>
      <output>Focusing discovery on: {focusArea}</output>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <action>Use AskUserQuestion tool with:
        - header: "Focus"
        - question: "What area should I focus on for feature discovery?"
        - options:
          - label: "Entire product", description: "Analyze all areas for feature opportunities"
          - label: "UI/UX", description: "User interface and experience improvements"
          - label: "Performance", description: "Speed, efficiency, and optimization opportunities"
          - label: "Developer experience", description: "Tooling, workflows, and code quality"
        - multiSelect: false
      </action>
      <note>User can select "Other" to specify a custom focus area</note>
    </branch>
  </step>

  <step name="choose_discovery_depth" outputs="discoveryDepth">
    <action>Use AskUserQuestion tool with:
      - header: "Depth"
      - question: "How thorough should the discovery process be?"
      - options:
        - label: "Quick", description: "Fast scan of obvious opportunities. Fewer tokens."
        - label: "Deep", description: "Parallel analysis of multiple dimensions. More thorough."
      - multiSelect: false
    </action>
  </step>

  <step name="discovery_research" outputs="findings">
    <branch condition="discoveryDepth is 'Quick'">
      <note>Sequential discovery - faster, fewer tokens</note>

      <substep name="scan_product_docs">
        <command>node .kanban/scripts/list-product.cjs</command>
        <action>Read product docs to understand current feature set</action>
        <command>node .kanban/scripts/search-product.cjs {focusArea keywords}</command>
        <action>Identify gaps, incomplete features, "future work" mentions</action>
        <output_variable>productGaps: list of {area, gap, evidence}</output_variable>
      </substep>

      <substep name="scan_engineering_docs">
        <command>node .kanban/scripts/list-engineering.cjs</command>
        <action>Review engineering patterns for extensible systems</action>
        <command>node .kanban/scripts/search-engineering.cjs {focusArea keywords}</command>
        <action>Find TODOs in patterns, plugin points, incomplete systems</action>
        <output_variable>engineeringOpportunities: list of {pattern, opportunity}</output_variable>
      </substep>

      <substep name="scan_codebase">
        <action>Use Grep to find TODOs, FIXMEs, incomplete implementations</action>
        <action>Look for commented-out features, stub functions</action>
        <output_variable>codebaseOpportunities: list of {location, opportunity, type}</output_variable>
      </substep>

      <substep name="analyze_existing_tasks">
        <command>node .kanban/scripts/list-tasks.cjs --exclude-status=done</command>
        <action>Group tasks by theme/area</action>
        <action>Identify gaps not covered by existing tasks</action>
        <output_variable>taskGaps: list of {theme, missingFeature}</output_variable>
      </substep>
    </branch>

    <branch condition="discoveryDepth is 'Deep'">
      <note>**CRITICAL: Spawn 4 agents in parallel using Task tool**</note>
      <action>Use the Task tool 4 times in a SINGLE message to achieve parallelism</action>

      <parallel>
        <agent name="Product Gap Analyzer" subagent_type="Explore">
          <description>Find product gaps and opportunities</description>
          <prompt>
Analyze product documentation for feature opportunities.
Focus area: "{focusArea}"

Your job:
1. Search and read product docs in `.kanban/product/`
2. Identify incomplete features, known gaps, user pain points
3. Look for "future work" or "out of scope" sections
4. Find features mentioned but not implemented

For each finding, provide:
- area: Product area (e.g., "authentication", "dashboard")
- gap: What's missing or could be better
- evidence: Quote or reference from docs
- impact: Who benefits and how (users, devs, business)
- complexity: rough estimate (small/medium/large)

Output as a structured list.
          </prompt>
        </agent>

        <agent name="Codebase Pattern Scanner" subagent_type="Explore">
          <description>Find extensible patterns and TODOs</description>
          <prompt>
Scan codebase for feature opportunities.
Focus area: "{focusArea}"

Your job:
1. Search for TODO, FIXME, HACK comments related to the focus area
2. Find stub functions, incomplete implementations
3. Identify patterns that could be extended (e.g., existing plugin system)
4. Look for feature flags or commented-out features
5. Find areas with high complexity that could benefit from new features

For each finding, provide:
- location: file:line reference
- type: "todo" | "stub" | "extensible-pattern" | "feature-flag"
- description: What the opportunity is
- context: Surrounding code context
- effort: rough estimate (small/medium/large)

Output as a structured list.
          </prompt>
        </agent>

        <agent name="Competitor Researcher" subagent_type="general-purpose">
          <description>Research competitor features</description>
          <prompt>
Research what competitors offer in this space.
Focus area: "{focusArea}"

Your job:
1. Use WebSearch to find competitor products in this space
2. Identify features they offer that we might be missing
3. Look for industry trends and emerging patterns
4. Find highly-requested features in the category

For each finding, provide:
- feature: Name of the feature
- competitors: Who offers it
- description: What it does
- differentiation: How we could do it better/differently
- relevance: How relevant to our focus area (high/medium/low)

Output as a structured list.
          </prompt>
        </agent>

        <agent name="Task Theme Analyzer" subagent_type="Explore">
          <description>Analyze existing tasks for gaps</description>
          <prompt>
Analyze existing kanban tasks to find gaps.
Focus area: "{focusArea}"

Your job:
1. Run: node .kanban/scripts/list-tasks.cjs --exclude-status=done
2. Read task files in `.kanban/tasks/` for non-done tasks
3. Group tasks by theme/area
4. Identify themes with few or no tasks
5. Find related features that would complement existing tasks
6. Look for patterns in done tasks that suggest next steps

For each finding, provide:
- theme: The area/theme
- existingTasks: Count and IDs of related tasks
- gap: What's missing from this theme
- suggestion: Feature that would fill the gap
- synergy: How it connects to existing work

Output as a structured list.
          </prompt>
        </agent>
      </parallel>

      <action>Wait for all 4 agents to complete</action>
    </branch>
  </step>

  <step name="synthesize_discoveries" outputs="featureIdeas">
    <branch condition="discoveryDepth is 'Deep'">
      <action>Combine outputs from all 4 agents</action>
      <action>Deduplicate similar findings</action>
      <action>Rank by impact and feasibility</action>
    </branch>

    <branch condition="discoveryDepth is 'Quick'">
      <action>Consolidate findings from sequential research</action>
    </branch>

    <action>Group into 3-6 distinct feature ideas</action>
    <action>For each idea, determine:
      - Title (action-oriented)
      - Problem it solves
      - Value it provides
      - Evidence/rationale
      - Rough complexity (small/medium/large)
    </action>
  </step>

  <step name="present_findings">
    <output>
## Feature Discovery: {focusArea}

**Depth:** {discoveryDepth}

---

{For each feature idea, numbered:}

### {n}. {Title}

**Problem:** {What gap or pain point this addresses}

**Value:** {Who benefits and how}

**Evidence:**
- {Evidence 1 - from product docs, code, or research}
- {Evidence 2}

**Complexity:** {small/medium/large}

---

**To create a task for any of these:**
```
/kanban-create "{feature title}"
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
- Focus area determined (from arg or question)
- Discovery depth chosen
- Research performed (sequential or parallel based on depth)
- Feature ideas presented with evidence and rationale
- Next steps shown (how to create tasks)
</success_criteria>

<example label="Quick Discovery">
User: `/kanban-feature-discovery UI/UX`

```
Focusing discovery on: UI/UX

How thorough should the discovery process be?
> Quick

Scanning product docs...
Scanning engineering docs...
Scanning codebase...
Analyzing existing tasks...

## Feature Discovery: UI/UX

**Depth:** Quick

---

### 1. Dark Mode Support

**Problem:** No dark mode option, users report eye strain

**Value:** Better accessibility, user preference support

**Evidence:**
- TODO in `src/theme/index.ts:23`: "Add dark mode toggle"
- Product doc `ui/theming.md` mentions "dark mode planned"

**Complexity:** medium

---

### 2. Keyboard Shortcuts

**Problem:** Power users can't navigate quickly

**Value:** Faster workflows, accessibility compliance

**Evidence:**
- No keyboard navigation in codebase
- Competitor analysis: VS Code, Notion all have shortcuts

**Complexity:** medium

---

### 3. Mobile Responsive Improvements

**Problem:** Several components break on mobile

**Value:** Mobile users can use the product

**Evidence:**
- FIXME in `src/components/Sidebar.tsx:45`: "breaks on mobile"
- No tasks address mobile in backlog

**Complexity:** large

---

**To create a task for any of these:**
/kanban-create "Add dark mode support"
```
</example>

<example label="Deep Discovery">
User: `/kanban-feature-discovery`

```
What area should I focus on for feature discovery?
> Performance

How thorough should the discovery process be?
> Deep

Launching parallel discovery agents...

[Product Gap Analyzer] Searching product docs...
[Codebase Pattern Scanner] Scanning for TODOs and patterns...
[Competitor Researcher] Researching competitor features...
[Task Theme Analyzer] Analyzing existing tasks...

All agents complete. Synthesizing findings...

## Feature Discovery: Performance

**Depth:** Deep

---

### 1. Query Caching Layer

**Problem:** Same API queries repeated frequently, causing slow page loads

**Value:** Faster load times, reduced server load

**Evidence:**
- Product doc `api/overview.md`: "no caching implemented"
- Codebase: 15+ duplicate fetch calls in dashboard components
- Competitors: All major tools use React Query or SWR

**Complexity:** medium

---

### 2. Virtual Scrolling for Large Lists

**Problem:** Lists with 1000+ items cause browser lag

**Value:** Smooth scrolling regardless of list size

**Evidence:**
- FIXME `src/components/TaskList.tsx:89`: "virtualize for performance"
- No existing tasks cover this

**Complexity:** medium

---

### 3. Bundle Size Optimization

**Problem:** Initial load is 2.5MB, slow on mobile networks

**Value:** Faster first load, better mobile experience

**Evidence:**
- No code splitting in place
- Competitor average: 500KB initial bundle

**Complexity:** large

---

**To create a task for any of these:**
/kanban-create "Add query caching layer"
```
</example>

<next_steps>
Create tasks for discoveries you want to pursue:
```
/kanban-create "{feature title}"
```

Run another discovery in a different area:
```
/kanban-feature-discovery [area]
```
</next_steps>
