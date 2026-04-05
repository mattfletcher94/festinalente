---
name: festina-create-project
description: Create a project through conversational Q&A, capture requirements, then auto-decompose into vertically-sliced tasks with requirement traceability.
allowed-tools: Read, Write, Bash(node *, git add *, git commit *, git status, git branch *), Grep, Glob, WebSearch, WebFetch
argument-hint: "[project title]"
disable-model-invocation: false
---

# Create Festina Lente Project

<purpose>
Create a project through conversational Q&A, capturing problem, value, scope, numbered requirements, and acceptance criteria. Then auto-decompose into 2-5 vertically-sliced tasks with full requirement traceability.
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





<command description="Get next task ID (returns JSON with nextId, currentHighest, padding, slug)">node .festinalente/scripts/festinalente.cjs next-id --title="{title}"</command>

<command description="Get current date/time (returns JSON with iso and date formats)">node .festinalente/scripts/festinalente.cjs get-date-time</command>




<command description="Get next project ID (returns JSON with nextId, currentHighest, slug using P-prefixed IDs)">node .festinalente/scripts/festinalente.cjs next-project-id --title="{title}"</command>






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

<note>**Project template:** `.festinalente/templates/project.xml` - Template for project files</note>

<note>**Task template:** `.festinalente/templates/task.xml` - Template for task files</note>

<note>Column transition: [New Project] → open</note>
<note>See `.festinalente/workflow.yaml` for column definitions and valid transitions</note>
</context>

<prohibited>
- Do not use `Search()` or `Glob()` to find files manually
- Do not read `.festinalente/config.yaml` directly
- Do not run `ls` commands to explore directories
- Do not guess filenames or IDs — always use the helper scripts
- Do not create tasks without user confirmation of the decomposition
</prohibited>

<process>
  <step name="load_workflow">
    <action>Read `.festinalente/workflow.yaml` for column definitions, labels, priorities, and transitions</action>
    <note>Use these values throughout this skill</note>
  </step>

  <step name="verify_festina_exists">
    <validate>Check that `.festinalente/projects/` directory exists (create if needed)</validate>
    <validate>Check that `.festinalente/tasks/` directory exists</validate>
    <branch condition="directories don't exist">
      <output>Error: Festina Lente not initialized. Run `npx festinalente init` first.</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="load_directives">
    <command>node .festinalente/scripts/festinalente.cjs get-skill-config festina-create-project</command>
    <action>Parse the JSON output</action>
    
    <branch condition="directives.length > 0">
      <warning>Directives are MANDATORY. You MUST follow them.</warning>
      <action>For EACH directive where `exists` is `true`:</action>
      <action>Read the directive XML file at `path`</action>
      <action>Parse and apply:</action>
      <action>- `<context>` principles: Maintain as ongoing mindset</action>
      <note>The `keywords` attribute on context principles is metadata for LLM relevance — use keywords to recognize when a principle applies to the current work.</note>
      <action>- `<process>` rules where the phase attribute, split on comma and trimmed, includes "create-project" as an exact element (e.g. phase="plan,implement" matches "plan" and "implement" but NOT "plan-review"): Follow as requirements</action>
      <action>- `<override>` sections where the phase attribute, split on comma and trimmed, includes "create-project" as an exact element: Apply step replacements</action>
      <action>- `<verification>` commands: Used by festina-plan to populate task &lt;verify&gt; elements and festina-implement to run step checks. Other skills can ignore this section.</action>
    
      <branch condition="directive has <override> section for phase=create-project">
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
      <note>Directives are loaded in config.yaml array order. All matching phase rules from all loaded directives apply additively. Avoid mapping two directives that both override the same phase.</note>
    </branch>
    
    <example_code lang="json">
    {
      "skill": "festina-create-project",
      "directives": [
        { "name": "architecture", "path": ".festinalente/directives/architecture.xml", "exists": true }
      ]
    }
    </example_code>
  </step>

  <step name="get_project_title" outputs="title">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as title</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <action>Use AskUserQuestion tool with:
        - header: "Project Title"
        - question: "What is the project title? Describe the outcome this project delivers."
        - options:
          - label: "Skip", description: "I'll provide the title"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type the project title</note>
    </branch>
    <action>Ensure title follows best practices (suggest improvements if needed)</action>
  </step>

  <step name="detect_greenfield" outputs="isGreenfield">
    <note>Determine if this is a greenfield project (no existing product/engineering docs)</note>
    <command description="List product docs">node .festinalente/scripts/festinalente.cjs search-product overview --min-score=0</command>
    <command description="List engineering docs">node .festinalente/scripts/festinalente.cjs search-engineering overview --min-score=0</command>
    <action>Count substantive docs in each directory:
      - Product docs: count files in `.festinalente/product/` (exclude overview.md)
      - Engineering docs: count files in `.festinalente/engineering/` (exclude overview.md)
    </action>
    <action>Set isGreenfield = true if BOTH directories have 0 substantive docs (only overview.md or empty)</action>
    <action>Detection is deterministic — no user confirmation needed</action>

    <branch condition="isGreenfield is true">
      <output>Greenfield project detected — no existing product or engineering docs found.</output>
      <output>Activating enhanced flow with vision capture and AI research.</output>
    </branch>
    <branch condition="isGreenfield is false">
      <output>Existing docs found — using standard project flow.</output>
    </branch>
  </step>

  <step name="greenfield_vision_capture" when="isGreenfield is true" outputs="vision, techPrefs, mvpScope, additionalContext, problem, value, inScope, outOfScope, requirements, acceptanceCriteria">
    <note>Adaptive vision capture with 2-4 broad questions. Replaces socratic_qa for greenfield projects.</note>
    <note>If the user cancels at ANY point during vision capture, output "Cancelled. No files created." and exit immediately. No partial state left behind.</note>

    <questions name="vision_question">
      <action>Use AskUserQuestion tool with:
        - header: "Vision"
        - question: "What are you building? Describe the core idea in a few sentences."
        - options:
          - label: "Cancel", description: "Exit without creating anything"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type their vision</note>
      <branch condition="user selects 'Cancel'">
        <output>Cancelled. No files created.</output>
        <action>Exit</action>
      </branch>
      <branch condition="user provides only a title and no description (minimal input)">
        <note>Flag as minimal input — AI will infer everything from title alone later (FR11)</note>
      </branch>
    </questions>

    <questions name="tech_question">
      <action>Use AskUserQuestion tool with:
        - header: "Tech Stack"
        - question: "What tech stack do you want to use?"
        - options:
          - label: "React + Node.js", description: "Full-stack JavaScript/TypeScript"
          - label: "Next.js", description: "React meta-framework with SSR"
          - label: "Python + FastAPI", description: "Python backend with FastAPI"
          - label: "Unsure", description: "Let the AI research and propose options"
          - label: "Cancel", description: "Exit without creating anything"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type their preferred stack</note>
      <branch condition="user selects 'Cancel'">
        <output>Cancelled. No files created.</output>
        <action>Exit</action>
      </branch>
      <action>Store tech preference and whether user said "Unsure" (affects research agent behavior)</action>
    </questions>

    <questions name="mvp_question">
      <action>Use AskUserQuestion tool with:
        - header: "MVP Scope"
        - question: "What's the MVP — the minimum that makes this useful? And what's explicitly NOT in v1?"
        - options:
          - label: "Cancel", description: "Exit without creating anything"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe MVP scope and exclusions</note>
      <branch condition="user selects 'Cancel'">
        <output>Cancelled. No files created.</output>
        <action>Exit</action>
      </branch>
    </questions>

    <questions name="additional_question">
      <action>Use AskUserQuestion tool with:
        - header: "Additional Context"
        - question: "Anything else I should know? (Skip if nothing comes to mind)"
        - options:
          - label: "Skip", description: "Nothing else to add"
          - label: "Cancel", description: "Exit without creating anything"
        - multiSelect: false
      </action>
      <note>User can select "Other" to provide additional context</note>
      <branch condition="user selects 'Cancel'">
        <output>Cancelled. No files created.</output>
        <action>Exit</action>
      </branch>
    </questions>

    <action>If minimal input was detected (FR11): use AI judgment to infer vision, tech preferences, and MVP scope from the title alone. Mark all inferred items as "(inferred)" for transparency.</action>
    <note>Vision capture outputs (problem, value, scope, etc.) are derived by AI from the user's answers — not asked separately like in brownfield socratic_qa. The AI synthesizes these from the broader vision/MVP conversation.</note>
  </step>

  <step name="greenfield_research" when="isGreenfield is true" outputs="researchFindings">
    <note>Launch 4 parallel research agents to fill the knowledge gap that existing docs would normally provide.</note>
    <note>All 4 agents ALWAYS launch regardless of user input. Use Agent tool with all 4 in a SINGLE message for parallelism.</note>
    <note>These agents use WebSearch for real-world research (not codebase exploration — there's no codebase for greenfield).</note>

    <parallel>
      <agent name="Stack Researcher" subagent_type="Explore">
        <description>Research tech stack for greenfield project</description>
        <prompt>
Research the best tech stack for this project:

**Project vision:** {vision from vision_question}
**User's tech preference:** {techPrefs from tech_question — may be "Unsure" or a specific stack}
**MVP scope:** {mvpScope from mvp_question}

Your job:
- If user specified a tech stack: validate the choice for this project type, research best practices, and identify complementary tools/libraries
- If user said "Unsure": propose 2-3 stack options with pros/cons specifically for this project type

Use WebSearch to find:
- Current best practices for this project type
- Popular libraries and frameworks
- Deployment and hosting options
- Developer experience considerations

Output a structured recommendation with:
- Recommended stack (or 2-3 options if user was unsure)
- Rationale for each recommendation
- Key libraries/tools to use
- Deployment considerations
        </prompt>
      </agent>

      <agent name="Feature Researcher" subagent_type="Explore">
        <description>Research features for greenfield project</description>
        <prompt>
Research common features for this type of project:

**Project vision:** {vision from vision_question}
**MVP scope:** {mvpScope from mvp_question}
**Additional context:** {additionalContext if provided}

Your job:
- Research similar products/projects and their feature sets
- Categorize features as: "essential for MVP", "nice to have", "future/v2"
- Use WebSearch to find feature lists of comparable products

Output a structured feature list with:
- Essential MVP features (must-have for minimum viable product)
- Nice-to-have features (improve UX but not critical)
- Future/v2 features (valuable but should wait)
- For each feature: brief rationale for categorization
        </prompt>
      </agent>

      <agent name="Architecture Researcher" subagent_type="Explore">
        <description>Research architecture for greenfield project</description>
        <prompt>
Research architectural patterns for this project:

**Project vision:** {vision from vision_question}
**Tech stack:** {techPrefs from tech_question}
**MVP scope:** {mvpScope from mvp_question}

Your job:
- Research recommended project structure for this stack/project type
- Identify key architectural patterns (state management, routing, data flow, etc.)
- Consider scalability and maintainability
- Use WebSearch to find architecture guides for the chosen stack

Output a structured recommendation with:
- Recommended project structure (folder layout)
- Key architectural patterns to follow
- Data flow and state management approach
- API design considerations (if applicable)
- Scalability considerations for MVP scope
        </prompt>
      </agent>

      <agent name="Pitfall Researcher" subagent_type="Explore">
        <description>Research common pitfalls for greenfield project</description>
        <prompt>
Research common mistakes and pitfalls for this project type:

**Project vision:** {vision from vision_question}
**Tech stack:** {techPrefs from tech_question}
**MVP scope:** {mvpScope from mvp_question}

Your job:
- Research common mistakes for this project type + stack
- Identify security concerns and vulnerabilities to avoid
- Find performance pitfalls and bottlenecks
- Identify UX anti-patterns for this type of application
- Use WebSearch to find "mistakes to avoid" and "lessons learned" content

Output a structured list with categories:
- Security pitfalls (with mitigations)
- Performance pitfalls (with mitigations)
- Architecture anti-patterns (with alternatives)
- UX/design pitfalls (with better approaches)
- Common beginner mistakes (with correct patterns)
        </prompt>
      </agent>
    </parallel>

    <action>Collect results from all 4 agents. Handle failures gracefully (FR10):</action>
    <branch condition="an agent fails or returns empty results">
      <output>Note: {agent name} research was unavailable.</output>
      <action>Continue with remaining agent results — do not block the flow</action>
    </branch>

    <action>Synthesize findings into a brief summary for the user</action>
    <output>Show research summary highlighting key findings from each agent</output>

    <branch condition="user said 'Unsure' about tech AND stack agent returned proposals">
      <action>Use AskUserQuestion tool with:
        - header: "Tech Stack Recommendation"
        - question: "Based on research, here are the recommended options: {stack agent proposals with pros/cons}. Which do you prefer?"
        - options: Build from stack agent's proposals (up to 3 options), each with:
          - label: "{stack name}", description: "{brief rationale}"
        - multiSelect: false
      </action>
      <note>User can select "Other" to specify a different stack</note>
      <action>Update techPrefs with user's validated choice</action>
    </branch>

    <note>Research findings will be stored in project.xml's research section during write_project_xml step</note>
  </step>

  <step name="greenfield_requirements" when="isGreenfield is true" outputs="requirements, acceptanceCriteria, v2Requirements, outOfScopeRequirements">
    <note>AI proposes versioned requirements based on research findings and vision capture. User validates.</note>

    <action>Synthesize research findings + vision capture into three requirement categories:
      - **v1 (MVP):** Core requirements that deliver the minimum useful product
      - **v2 (future):** Enhancements and nice-to-haves for later
      - **out-of-scope:** Explicitly excluded from this project entirely
    </action>
    <action>If minimal input was detected (FR11): mark all proposed requirements as "(inferred)"</action>

    <action>Use AskUserQuestion tool with:
      - header: "Proposed Requirements"
      - question: "Based on research, here are the proposed requirements:

**v1 (MVP) — will be implemented:**
{R1: requirement text}
{R2: requirement text}
...

**v2 (future) — stored for later:**
{requirement text}
...

**Out of scope:**
{item text}
...

You can move items between categories, add, or remove requirements."
      - options:
        - label: "Approve", description: "Requirements look good as proposed"
        - label: "Adjust", description: "I want to move/add/remove items"
        - label: "You decide", description: "Use your judgment"
      - multiSelect: false
    </action>
    <note>User can select "Other" to provide specific adjustments</note>

    <branch condition="user selects 'Adjust'">
      <action>Incorporate user feedback — allow moving items between v1/v2/out-of-scope, adding, or removing</action>
      <action>Re-present updated requirements for validation</action>
    </branch>

    <branch condition="all requirements moved to v2 or out-of-scope (no v1 requirements)">
      <output>At least one v1 requirement is needed for task decomposition. Please move at least one requirement to v1.</output>
      <action>Re-present requirements for adjustment</action>
    </branch>

    <action>After validation:
      - v1 requirements become the numbered R1-Rn requirements used for decomposition
      - v2 requirements are stored in project.xml notes as "v2 (future): ..."
      - out-of-scope items are stored in project.xml scope/out-of-scope
    </action>

    <action>Also derive problem, value, inScope, and acceptanceCriteria from the vision capture + research:
      - problem: synthesized from user's vision and research pitfalls
      - value: synthesized from user's vision and research features
      - inScope: derived from v1 requirements
      - acceptanceCriteria: Gherkin format covering v1 requirements
    </action>

    <note>After this step, flow merges to validate_requirements, then continues through decompose_tasks as normal. Only v1 (R1-Rn) requirements are passed to decomposition — v2 and out-of-scope are stored but never decomposed into tasks.</note>
  </step>

  <step name="brownfield_socratic_qa" when="isGreenfield is false" outputs="problem, value, inScope, outOfScope, requirements, acceptanceCriteria">
    <note>Use AskUserQuestion tool for **one question at a time**.</note>

    <note>This is a **conversational session** focused on **product/business concerns**:
- What problem does this project solve?
- What does success look like?
- What's in scope and what's explicitly NOT in scope?
- What are the numbered requirements?
- What are the project-level acceptance criteria?</note>

    <note>How the dialogue works: **Propose first, then validate.**
- Analyze the user's initial input to form an understanding
- Propose your understanding and ask user to validate
- User confirms, corrects, or says "You decide" for LLM inference</note>

    <questions name="problem_validation">
      <action>Use AskUserQuestion tool with:
        - header: "Problem"
        - question: "I understand the problem as: {proposed problem based on user input}. Is this accurate?"
        - options:
          - label: "Yes", description: "Understanding is correct"
          - label: "Partly", description: "Needs some adjustment"
          - label: "No", description: "This is incorrect"
          - label: "You decide", description: "Use your judgment"
        - multiSelect: false
      </action>
      <note>User can select "Other" to provide corrections</note>

      <branch condition="user selects 'You decide'">
        <action>Use judgment to fill gaps - research if helpful, infer from context</action>
        <note>Document what was inferred vs confirmed</note>
      </branch>
    </questions>

    <questions name="value_validation">
      <action>Use AskUserQuestion tool with:
        - header: "Value"
        - question: "The value I see is: {proposed value}. Does this capture it?"
        - options:
          - label: "Yes", description: "Value is correct"
          - label: "Partly", description: "Needs adjustment"
          - label: "No", description: "This is incorrect"
          - label: "You decide", description: "Use your judgment"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe the value</note>

      <branch condition="user selects 'You decide'">
        <action>Use judgment to fill gaps - research if helpful, infer from context</action>
        <note>Document what was inferred vs confirmed</note>
      </branch>
    </questions>

    <questions name="scope_validation">
      <action>Use AskUserQuestion tool with:
        - header: "Scope"
        - question: "Here's what I think is in scope: {proposed in-scope items}. What's explicitly OUT of scope or non-goals for this project?"
        - options:
          - label: "Looks good", description: "Scope is correct as proposed"
          - label: "Adjust", description: "Needs changes"
          - label: "You decide", description: "Use your judgment"
        - multiSelect: false
      </action>
      <note>User can select "Other" to define scope boundaries</note>
      <note>IMPORTANT: Explicitly ask about non-goals to prevent scope creep (AC-B14)</note>
    </questions>

    <questions name="requirements_validation">
      <note>Requirements are numbered R1-Rn. Each must be independently testable, user-facing, and specific (AC-B15).</note>
      <action>Use AskUserQuestion tool with:
        - header: "Requirements"
        - question: "Based on our discussion, here are the proposed requirements:
{R1: requirement text}
{R2: requirement text}
...
Each is independently testable and user-facing. Are these correct?"
        - options:
          - label: "Yes", description: "Requirements are correct"
          - label: "Add more", description: "Need additional requirements"
          - label: "Adjust", description: "Some requirements need changes"
          - label: "You decide", description: "Use your judgment"
        - multiSelect: false
      </action>
      <note>User can select "Other" to provide requirement details</note>
    </questions>

    <questions name="acceptance_criteria_validation">
      <action>Use AskUserQuestion tool with:
        - header: "Acceptance Criteria"
        - question: "For project-level acceptance criteria (Gherkin format), I'd propose:
{Given ... When ... Then ...}
These define when the WHOLE PROJECT is complete. Correct?"
        - options:
          - label: "Yes", description: "Criteria are correct"
          - label: "Adjust", description: "Needs changes"
          - label: "You decide", description: "Use your judgment"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe acceptance criteria</note>
    </questions>

    <branch condition="user requests research">
      <action>Use WebSearch/WebFetch to research domain topics, best practices</action>
      <action>Use AskUserQuestion tool with:
        - header: "Findings"
        - question: "I found: {findings summary}. Does this influence the requirements?"
        - options:
          - label: "Yes", description: "Adjust based on findings"
          - label: "No", description: "Keep original approach"
        - multiSelect: false
      </action>
    </branch>

    <action>Continue until you have: problem, value, in-scope, out-of-scope, numbered requirements (R1-Rn), acceptance criteria</action>
  </step>

  <step name="search_product_docs" when="isGreenfield is false AND `.festinalente/product/` directory exists and is not empty" outputs="affectedDocs">
    <action>Extract keywords from the established title, problem, and requirements</action>
    <command>node .festinalente/scripts/festinalente.cjs search-product {keyword1} {keyword2} ...</command>
    <note>Search results include `relatedDocs` with tldr previews of connected docs.
Only read full content of related docs if their tldr suggests relevance.
Avoid loading more than 2-3 related docs to preserve context window.</note>

    <branch condition="docs with score >= 0.5 found">
      <note>These docs describe existing features this project relates to</note>
      <action>Note matched doc IDs for project affects field</action>
    </branch>

    <branch condition="`.festinalente/product/` is empty or doesn't exist">
      <action>Skip this step</action>
    </branch>
  </step>

  <step name="search_engineering_docs" when="isGreenfield is false AND `.festinalente/engineering/` directory exists and is not empty" outputs="engineeringDocs">
    <action>Extract technical keywords from requirements and problem statement</action>
    <command>node .festinalente/scripts/festinalente.cjs search-engineering {keyword1} {keyword2} ...</command>

    <branch condition="docs with score >= 0.5 found">
      <action>Note matched doc IDs for project engineering field</action>
    </branch>

    <branch condition="`.festinalente/engineering/` is empty or doesn't exist">
      <action>Skip this step</action>
    </branch>
  </step>

  <step name="validate_requirements">
    <note>Ensure each requirement R1-Rn meets quality criteria (AC-B15):</note>
    <action>For each requirement, verify:
      - Independently testable: Can be verified without checking other requirements
      - User-facing: Describes something the user can observe or interact with
      - Specific: Clear enough that two people would agree on whether it's met</action>
    <branch condition="any requirement fails validation">
      <action>Refine the requirement and re-confirm with user</action>
    </branch>
  </step>

  <step name="generate_project_id" outputs="projectId">
    <command>node .festinalente/scripts/festinalente.cjs next-project-id --title="{title}"</command>
    <action>Use `nextId` from JSON output (format: P001-slug)</action>
  </step>

  <step name="write_project_xml">
    <action>Read template from `.festinalente/templates/project.xml`</action>
    <command description="Get current date">node .festinalente/scripts/festinalente.cjs get-date-time</command>
    <action>Create folder `.festinalente/projects/{projectId}/`</action>
    <action>Create file at `.festinalente/projects/{projectId}/project.xml`</action>
    <action>Fill XML attributes: `id="{projectId}"`, `status="open"`, `created="{date}"`, `updated="{date}"`</action>
    <action>Fill `<title>` with project title</action>
    <action>Fill `<description>` with project description</action>
    <action>Fill `<problem>` with problem statement from Q&A</action>
    <action>Fill `<value>` with value statement from Q&A</action>
    <action>Fill `<scope>` with in-scope and out-of-scope items</action>
    <action>Fill `<requirements>` with numbered R1-Rn requirements</action>
    <action>Fill `<acceptance-criteria>` with Gherkin-format project-level criteria</action>
    <action>Leave `<tasks>` empty (filled during decompose step)</action>
    <action>Fill `<notes>` — for greenfield: include v2 (future) requirements as "v2 (future): ..." entries</action>
    <action>Fill `<research>` section — for greenfield: populate stack/features/architecture/pitfalls subsections with findings from the 4 research agents. For brownfield: leave empty.</action>
    <action>Fill `<affects>` with matched product doc IDs (if any)</action>
    <action>Fill `<engineering>` with matched engineering doc IDs (if any)</action>
  </step>

  <step name="decompose_tasks" outputs="taskDecomposition">
    <note>Auto-decompose the project into 2-5 vertically-sliced tasks.</note>
    <note>CRITICAL: Reason about the FULL SET of tasks simultaneously to guarantee no overlap (AC-B9).</note>

    <action>Analyze requirements R1-Rn and determine the optimal task breakdown:</action>
    <action>For each proposed task, define:
      - Title: Clear, action-oriented
      - Description: What this task does, with sibling context explaining how it fits into the project (AC-B18)
      - Problem: Task-specific problem statement
      - Value: Task-specific value statement
      - Acceptance criteria: Gherkin format, scoped to THIS task only (AC-C6)
      - Requirements covered: Which R1-Rn this task addresses (AC-B7)
      - Boundary notes: What this task does NOT cover (handled by sibling tasks)</action>

    <validate>Every requirement R1-Rn must map to at least one task (AC-B8)</validate>

    <branch condition="6+ tasks would be needed (AC-B20)">
      <action>Use AskUserQuestion tool with:
        - header: "Warning"
        - question: "This project would need {count} tasks, which exceeds the recommended 2-5. This may indicate the project scope is too broad. Options:"
        - options:
          - label: "Proceed", description: "Create all {count} tasks anyway"
          - label: "Split project", description: "Break this into multiple smaller projects"
          - label: "Reduce scope", description: "Remove some requirements to reduce task count"
        - multiSelect: false
      </action>
    </branch>
  </step>

  <step name="confirm_decomposition">
    <action>Show summary table to user:</action>
    <output>
| # | Task Title | Requirements | Dependencies |
|---|-----------|-------------|-------------|
| 1 | {title}   | R1, R3      | None        |
| 2 | {title}   | R2, R4      | After #1    |
...

**Requirement Coverage:**
- R1: Task #1
- R2: Task #2
...
    </output>

    <action>Use AskUserQuestion tool with:
      - header: "Decomposition"
      - question: "Does this task breakdown look correct?"
      - options:
        - label: "Yes, create tasks", description: "Create all tasks as shown"
        - label: "Adjust", description: "I want to change the breakdown"
        - label: "Re-decompose", description: "Start the decomposition over with guidance"
      - multiSelect: false
    </action>
    <note>User can select "Other" to provide specific guidance (AC-B16, AC-B17)</note>

    <branch condition="user says 'Adjust'">
      <action>Incorporate user feedback and show updated table</action>
    </branch>
    <branch condition="user says 'Re-decompose'">
      <action>Ask user for decomposition guidance, then redo decompose_tasks step</action>
    </branch>
  </step>

  <step name="write_tasks" outputs="taskIds">
    <note>Create each task with project context embedded.</note>
    <action>For each task in the confirmed decomposition:</action>

    <action>Generate task ID:</action>
    <command>node .festinalente/scripts/festinalente.cjs next-id --title="{task title}"</command>

    <action>Read template from `.festinalente/templates/task.xml`</action>
    <command description="Get current date">node .festinalente/scripts/festinalente.cjs get-date-time</command>
    <action>Create folder `.festinalente/tasks/{taskId}/`</action>
    <action>Create file at `.festinalente/tasks/{taskId}/task.xml` with:
      - id="{taskId}", status="backlog", priority="medium"
      - project-id="{projectId}" attribute on task element
      - project-requirements="{comma-separated R-ids this task covers}" attribute (AC-B7)
      - title, description (including sibling context and boundary notes)
      - problem, value, acceptance-criteria (scoped to this task)
      - For each project-level affects/engineering doc:
        - Determine which task(s) are most likely to impact this doc based on
          task description and requirements coverage
        - Assign the doc to those task(s)
      - Validate: every project-level doc is assigned to at least one task
      - Fallback: unassigned docs go to the task with broadest scope
      - Log assignment table: "Doc assignments: {doc} → {task-ids}"
      - affects: the specific subset of project docs assigned to THIS task
      - engineering: the specific subset of project engineering docs assigned to THIS task</action>

    <action>Update project.xml `<tasks>` element with task reference:</action>
    <example_code lang="xml">
<tasks>
  <task-ref id="{taskId}" requirements="{R1,R3}" />
  <task-ref id="{taskId2}" requirements="{R2,R4}" />
</tasks>
    </example_code>
    <note>Update project.xml after ALL tasks are created (AC-B19)</note>
  </step>

  <step name="create_stubs" when="new product or engineering docs needed (AC-B21)">
    <note>Create stub product/engineering docs if the project introduces new features not yet documented</note>
    <command description="Get current date">node .festinalente/scripts/festinalente.cjs get-date-time</command>

    <branch condition="new product feature detected (no matching product docs)">
      <action>Use AskUserQuestion tool with:
        - header: "Domain"
        - question: "This project introduces a new feature. What domain should it belong to?"
        - options: Build from existing domain folders (up to 4), each with:
          - label: "{domain}", description: "Group with other {domain} features"
        - multiSelect: false
      </action>
      <action>Create stub doc at `.festinalente/product/{domain}/{slug}.md` with `stub: true`</action>
      <action>Add doc ID to project affects and all relevant task affects</action>
    </branch>

    <branch condition="new engineering pattern detected">
      <action>Use AskUserQuestion tool with:
        - header: "Eng type"
        - question: "This project may introduce new technical patterns. What type?"
        - options:
          - label: "System", description: "New subsystem or service"
          - label: "Pattern", description: "Recurring solution"
          - label: "Convention", description: "Team standard"
          - label: "None needed", description: "No new engineering documentation required"
        - multiSelect: false
      </action>
      <branch condition="user selects type (not 'None needed')">
        <action>Create stub doc at `.festinalente/engineering/{type}s/{slug}.md` with `stub: true`</action>
        <action>Add doc ID to project engineering and all relevant task engineering</action>
      </branch>
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
      <action>Check content against `<forbidden>` regex</action>
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
      <branch condition="user selects Fix now">
        <action>Attempt remediation for the violation</action>
        <action>Re-run the failed validation checks (only the ones that failed, not all checks)</action>
        <branch condition="checks now pass">
          <output>Violation resolved.</output>
        </branch>
        <branch condition="still failing after remediation">
          <output>Violation persists after fix attempt: {check id} - {reason}. Continuing.</output>
        </branch>
      </branch>
    </branch>
  </step>

  <step name="validate_xml">
    <command description="Validate project XML">node .festinalente/scripts/festinalente.cjs validate-xml projects/{projectId}</command>
    <action>For each task-ref in taskIds:</action>
    <command description="Validate task XML">node .festinalente/scripts/festinalente.cjs validate-xml {taskId}</command>
    <branch condition="validation fails">
      <output>Warning: XML validation failed. Fix errors before completing.</output>
    </branch>
  </step>

  <step name="output_result">
    <output>
**Project {projectId} created**

- Title: {title}
- Status: open
- Tasks: {taskCount}
- Requirements: {requirementCount} (R1-R{n})

**Requirement Coverage Matrix:**
| Requirement | Task(s) |
|-------------|---------|
| R1: {text}  | {taskId} |
| R2: {text}  | {taskId} |
...

**Created files:**
- `.festinalente/projects/{projectId}/project.xml`
{for each task:}
- `.festinalente/tasks/{taskId}/task.xml`
{if stubs:}
- `.festinalente/product/{domain}/{slug}.md` (stub)
- `.festinalente/engineering/{type}s/{slug}.md` (stub)

**Next: Scope the first task**
```
/clear
/festina-scope {firstTaskId}
```
    </output>
    <output>[FESTINA_COMPLETE]</output>
  </step>
</process>

<success_criteria>
- Project folder exists at `.festinalente/projects/{projectId}/`
- Project file exists at `.festinalente/projects/{projectId}/project.xml`
- Project XML has `id="{projectId}"` and `status="open"`
- Project XML has `<problem>` section filled
- Project XML has `<value>` section filled
- Project XML has `<scope>` with both in-scope and out-of-scope items
- Project XML has `<requirements>` with numbered R1-Rn entries
- Project XML has `<acceptance-criteria>` in Gherkin format
- Project XML has `<tasks>` with task-ref entries for all created tasks (AC-B19)
- 2-5 task files created (or user-approved count if 6+)
- Each task has project-id and project-requirements attributes (AC-B7)
- Each task has sibling context in description (AC-B18)
- Each task has boundary notes explaining what it does NOT cover
- Each task has acceptance criteria scoped to that task only (AC-C6)
- Every requirement R1-Rn maps to at least one task (AC-B8)
- No overlapping task scope (AC-B9)
- If new feature: stub doc exists with `stub: true` (AC-B21)
- Directive compliance checks passed
- Next steps point to `/festina-scope`
</success_criteria>

<example>
**Creating a project:**

User: `/festina-create-project User authentication system`

```
Creating project...

Title: User authentication system

I understand the problem as: The application currently has no way to identify
or authenticate users, meaning all access is anonymous and uncontrolled.
Is this accurate? [Yes / Partly / No / You decide] > Yes

The value I see is: Users can securely identify themselves, enabling
personalized experiences and access control.
Does this capture it? [Yes / Partly / No / You decide] > Yes

Here's what I think is in scope:
- Login/logout flows
- Password-based authentication
- Session management
What's explicitly OUT of scope? > Social login, 2FA, password recovery

Requirements:
R1: Users can register with email and password
R2: Users can log in with valid credentials
R3: Users can log out and have their session invalidated
R4: Invalid credentials show a clear error message
R5: Sessions persist across browser refreshes

Each is independently testable and user-facing. Correct? > Yes

Project-level acceptance criteria:
Given a new user visits the application
When they complete registration and login
Then they have a persistent authenticated session
And can log out to end the session
Correct? > Yes

Searching product docs... Related: auth/overview (score: 0.68)
Searching engineering docs... No matches.

Decomposing into tasks...

| # | Task Title                        | Requirements | Dependencies |
|---|----------------------------------|-------------|-------------|
| 1 | Add user registration flow       | R1, R4       | None         |
| 2 | Add login and session management | R2, R3, R5   | After #1     |

Requirement Coverage:
- R1: Task #1
- R2: Task #2
- R3: Task #2
- R4: Task #1
- R5: Task #2

Does this look correct? > Yes, create tasks

Creating tasks...
- 004-add-user-registration-flow (R1, R4)
- 005-add-login-and-session-management (R2, R3, R5)

Project P001-user-authentication-system created
- Status: open
- Tasks: 2
- Requirements: 5 (R1-R5)

Next:
/clear
/festina-scope 004-add-user-registration-flow
```
</example>

<next_steps>
```
/clear
/festina-scope {firstTaskId}
```
</next_steps>
</output>
