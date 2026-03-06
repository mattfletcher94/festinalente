---
name: festina-map-engineering
description: Analyze existing codebase and create engineering documentation through parallel exploration and Socratic Q&A
allowed-tools: Read, Write, Glob, Grep, Bash(git add *, git commit *, git status), Task
disable-model-invocation: true
---

# Skill: Map Engineering

<purpose>
Analyze existing codebase and create engineering documentation through parallel exploration and Socratic Q&A.
</purpose>

<context>
{{> helper-scripts show_get_date_time=true}}

{{> engineering-docs-scripts show_list_engineering=true}}

{{> diagram-guidelines}}

<note>**Column Transition:** N/A - This is a documentation command, not a task workflow command.</note>

<note>**Glossary:** This skill updates `.festinalente/glossary.yaml` with technical terms and aliases.</note>
</context>

<arguments>
  <hint>Arguments provide focus or constraints for the discovery process — they do NOT replace it. Even if arguments describe a narrow update, run the full skill process. The parallel agents and Q&A will be scoped by the arguments, not skipped because of them.</hint>
</arguments>

<prohibited>
- Do not skip the parallel discovery phase
- Do not write docs without validating with user through Q&A
- Do not skip the validation phase
- Do not bypass this skill to make direct edits — always run the full process
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="preflight_check">
    <action>Check if `.festinalente/engineering/` has files OTHER than `overview.md`</action>
    <command>node .festinalente/scripts/festinalente.cjs list-engineering</command>
    <branch condition="count > 1, OR if count == 1 and the doc is not `overview`">
      <action>Use AskUserQuestion tool with:
        - header: "Existing Docs"
        - question: "I found existing engineering docs. How should I proceed?"
        - options:
          - label: "Preserve and extend", description: "Keep existing docs, add new findings"
          - label: "Merge with findings", description: "Combine existing docs with new discoveries"
          - label: "Start fresh", description: "Replace existing docs entirely"
        - multiSelect: false
      </action>
    </branch>
    <branch condition="only `overview.md` exists (or no docs)">
      <action>Proceed without prompting (this is expected for new installs)</action>
    </branch>
  </step>

  <step name="parallel_discovery">
    <note>**CRITICAL: Spawn 4 agents in parallel using Task tool**</note>
    <action>Use the Task tool 4 times in a SINGLE message to achieve parallelism</action>

    <parallel>
      <agent name="Stack Analyzer" subagent_type="Explore">
        <description>Analyze tech stack and dependencies</description>
        <prompt>
Analyze the technology stack of this codebase:
1. Read package.json, requirements.txt, Cargo.toml, go.mod, etc.
2. Identify programming languages used
3. List frameworks and their versions
4. Note key dependencies and what they're used for
5. Identify build tools (webpack, vite, cargo, etc.)
6. Find testing frameworks
7. Note database technologies

Provide a structured summary:
- Languages: {list with versions if available}
- Frameworks: {list with versions}
- Key Dependencies: {name: purpose}
- Build Tools: {list}
- Testing: {frameworks used}
- Database: {type and driver}
        </prompt>
      </agent>

      <agent name="Architecture Mapper" subagent_type="Explore">
        <description>Map systems and data flow</description>
        <prompt>
Map the system architecture of this codebase:
1. Identify major subsystems (auth, api, database, cache, etc.)
2. Find entry points for each system
3. Trace data flow between systems
4. Identify integration points (APIs, events, queues)
5. Find configuration and environment handling
6. Note any microservices or separate deployables

For each system, provide:
- name: System name
- purpose: What it does (1 sentence)
- entry_points: Main files/classes
- components: Key internal components (for Architecture diagram)
- interacts_with: Other systems it communicates with
- data_flow: How data moves through it (for Data Flow diagram)

Provide Mermaid-ready descriptions:
- System relationships (which systems connect to which)
- Data flow sequences (input → processing → output)
- Component hierarchy within each system
        </prompt>
      </agent>

      <agent name="Convention Extractor" subagent_type="Explore">
        <description>Extract coding conventions and patterns</description>
        <prompt>
Extract coding conventions and patterns from this codebase:
1. File naming conventions (PascalCase, kebab-case, etc.)
2. Folder organization patterns
3. Import/export patterns (barrels, direct imports)
4. Error handling approach (exceptions, Result types, error codes)
5. Dependency injection pattern (if any)
6. State management approach
7. API design patterns (REST, GraphQL conventions)
8. Testing conventions

For each convention/pattern found, provide:
- name: Convention name
- type: naming | structure | error-handling | state | api | testing
- rule: The convention rule (1-2 sentences)
- example_file: File that demonstrates this
- evidence: Code snippet showing the pattern
        </prompt>
      </agent>

      <agent name="Risk Identifier" subagent_type="Explore">
        <description>Identify technical debt and risks</description>
        <prompt>
Identify technical risks and debt in this codebase:
1. Look for TODO, FIXME, HACK, XXX comments
2. Find deprecated code or dependencies
3. Identify potential security concerns
4. Look for missing error handling
5. Find hard-coded values that should be config
6. Identify code duplication patterns
7. Note missing tests or test coverage gaps
8. Find performance concerns (N+1 queries, blocking I/O)

For each issue, provide:
- type: tech_debt | security | performance | maintainability
- severity: high | medium | low
- location: File and line
- description: What the issue is
- recommendation: How to address it
        </prompt>
      </agent>
    </parallel>

    <action>Wait for all 4 agents to complete</action>
    <note>Agents run concurrently - this is faster than sequential exploration</note>
  </step>

  <step name="synthesize_findings">
    <action>Combine outputs from all 4 agents</action>
    <action>Organize systems by dependency order</action>
    <action>Group patterns by category</action>
    <action>Prioritize risks by severity</action>

    <note>**Synthesis Rules:**</note>
    <rule>Stack Analyzer provides the foundation - verify against actual usage</rule>
    <rule>Architecture Mapper systems become the systems/ docs</rule>
    <rule>Convention Extractor patterns become patterns/ and conventions/ docs</rule>
    <rule>Risk Identifier issues can be documented as "Known Issues" in relevant system docs</rule>

    <action>Present summary to user for validation</action>
  </step>

  <step name="write_relationships_to_frontmatter">
    <note>Persist Architecture Mapper findings to doc frontmatter</note>
    <action>For each doc being created, populate relationship fields from Architecture Mapper output:</action>
    <action>- `interacts_with` relationships → add to `references: []`</action>
    <action>- `data_flow` dependencies → add to `uses: []`</action>
    <action>Only include relationships where BOTH docs exist in the documentation set</action>
  </step>

  <step name="create_engineering_overview">
    <note>Based on synthesis, draft overview content:</note>
    <action>Use AskUserQuestion tool with:
      - header: "Tech Stack"
      - question: "What is the main technology stack?"
      - options:
        - label: "Use detected", description: "Use stack found by Stack Analyzer"
        - label: "Skip", description: "I'll provide this later"
      - multiSelect: false
    </action>
    <note>User can select "Other" to specify a different stack</note>

    <action>Use AskUserQuestion tool with:
      - header: "Architecture"
      - question: "What's the high-level architecture approach?"
      - options:
        - label: "Use detected", description: "Use architecture found by mapper"
        - label: "Skip", description: "I'll provide this later"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe the architecture</note>

    <warning>IMMEDIATELY create overview.md:</warning>
    <action>Create `.festinalente/engineering/overview.md`</action>
    <action>Use template from `.festinalente/templates/engineering-overview.md`</action>
    <action>Fill frontmatter: `id: overview`, `type: overview`, `title`, `tldr`, `summary`, `keywords`, `aliases`, `boundary`</action>
    <action>Fill body sections: Tech Stack (from Stack Analyzer), Architecture Summary, Directory Structure</action>
  </step>

  <step name="present_summary">
    <output>I analyzed the codebase using 4 parallel agents and found the following:</output>
    <output>**Tech Stack:** {languages, frameworks from Stack Analyzer}</output>
    <output>**Systems:** {major subsystems from Architecture Mapper}</output>
    <output>**Patterns:** {key patterns from Convention Extractor}</output>
    <output>**Risks Identified:** {count} issues ({high} high, {medium} medium, {low} low)</output>
    <output>Let me ask some questions to validate and expand on this understanding.</output>
  </step>

  <step name="socratic_qa_dialogue">
    <note>Use AskUserQuestion tool for **one question at a time**.</note>
    <warning>CRITICAL: Write docs incrementally to prevent context loss</warning>

    <note>**For each system (depth-first), ask Discovery Questions:**</note>
    <questions name="system_discovery">
      <action>Use AskUserQuestion tool with:
        - header: "Verify"
        - question: "I found {system} that appears to handle {description}. Is this accurate?"
        - options:
          - label: "Yes", description: "Description is accurate"
          - label: "Partly", description: "Needs some corrections"
          - label: "No", description: "This is incorrect"
        - multiSelect: false
      </action>
      <note>User can select "Other" to provide corrections</note>

      <action>Use AskUserQuestion tool with:
        - header: "Components"
        - question: "What are the key components within {system}?"
        - options:
          - label: "Use detected", description: "Use components found in analysis"
          - label: "Skip", description: "Move to next question"
        - multiSelect: false
      </action>
      <note>User can select "Other" to list key components</note>

      <action>Use AskUserQuestion tool with:
        - header: "Design"
        - question: "Why was this system designed this way? What alternatives were considered?"
        - options:
          - label: "Skip", description: "Move to next question"
          - label: "Unsure", description: "Don't know the history"
        - multiSelect: false
      </action>
      <note>User can select "Other" to explain design decisions</note>

      <action>Use AskUserQuestion tool with:
        - header: "Scale"
        - question: "What are the performance or scalability constraints?"
        - options:
          - label: "None", description: "No special constraints"
          - label: "Skip", description: "Move to next question"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe constraints</note>

      <action>Use AskUserQuestion tool with:
        - header: "Boundaries"
        - question: "What does this system NOT handle? (boundaries)"
        - options:
          - label: "Skip", description: "Move to next question"
          - label: "None", description: "No specific boundaries"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe boundaries</note>

      <action>Use AskUserQuestion tool with:
        - header: "Debt"
        - question: "Are there any known issues or technical debt?"
        - options:
          - label: "None known", description: "No known issues"
          - label: "Skip", description: "Move to next question"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe known issues</note>
    </questions>

    <warning>IMMEDIATELY write the engineering doc:</warning>
    <action>Create folder if needed: `.festinalente/engineering/systems/{system}/`</action>
    <command description="Get current date">node .festinalente/scripts/festinalente.cjs get-date-time</command>
    <action>Create `.festinalente/engineering/systems/{system}/_index.md`</action>
    <action>Use template from `.festinalente/templates/engineering-system.md`</action>
    <action>Fill frontmatter: `id`, `type: system`, `title`, `tldr`, `summary`, `keywords`, `aliases`, `boundary`, `paths`</action>

    <note>**Diagram Generation:**</note>
    <action>For each system doc, generate:</action>
    <action>- Architecture diagram showing components (Mermaid flowchart TB with subgraph)</action>
    <action>- Data flow diagram (Mermaid flowchart LR)</action>
    <action>For pattern docs, generate:</action>
    <action>- Structure diagram showing relationships (Mermaid classDiagram)</action>
    <action>For convention docs where structure matters, generate:</action>
    <action>- ASCII diagrams showing correct vs incorrect structure</action>

    <note>**For patterns discovered:**</note>
    <questions name="pattern_discovery">
      <action>Use AskUserQuestion tool with:
        - header: "Pattern"
        - question: "I noticed a {pattern} pattern. Can you tell me more about when/how to apply it?"
        - options:
          - label: "Skip", description: "Move to next question"
          - label: "Unsure", description: "Need to investigate"
        - multiSelect: false
      </action>
      <note>User can select "Other" to explain the pattern</note>

      <action>Use AskUserQuestion tool with:
        - header: "Problem"
        - question: "What problem does this pattern solve?"
        - options:
          - label: "Skip", description: "Move to next question"
          - label: "Unsure", description: "Need to investigate"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe the problem</note>

      <action>Use AskUserQuestion tool with:
        - header: "Anti-use"
        - question: "When should this pattern NOT be used?"
        - options:
          - label: "Always use it", description: "Use pattern everywhere applicable"
          - label: "Skip", description: "Move to next question"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe anti-patterns</note>

      <action>Use AskUserQuestion tool with:
        - header: "Examples"
        - question: "Can you show me a good example and a bad example?"
        - options:
          - label: "Use detected", description: "Use examples found in codebase"
          - label: "Skip", description: "Move to next question"
        - multiSelect: false
      </action>
      <note>User can select "Other" to provide examples</note>
    </questions>

    <action>Create `.festinalente/engineering/patterns/{pattern}.md`</action>
    <action>Use template from `.festinalente/templates/engineering-pattern.md`</action>
    <action>Include correct and incorrect examples from the codebase</action>

    <note>**For conventions discovered:**</note>
    <questions name="convention_discovery">
      <action>Use AskUserQuestion tool with:
        - header: "Rules"
        - question: "I see a convention for {thing}. Are there specific rules to follow?"
        - options:
          - label: "Use detected", description: "Use rules found in analysis"
          - label: "Skip", description: "Move to next question"
        - multiSelect: false
      </action>
      <note>User can select "Other" to specify rules</note>

      <action>Use AskUserQuestion tool with:
        - header: "Violations"
        - question: "What happens if someone violates this convention?"
        - options:
          - label: "CI fails", description: "Linting/CI catches violations"
          - label: "Code review", description: "Caught in code review"
          - label: "Skip", description: "Move to next question"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe consequences</note>

      <action>Use AskUserQuestion tool with:
        - header: "Exceptions"
        - question: "Are there any exceptions to this convention?"
        - options:
          - label: "None", description: "No exceptions, always follow"
          - label: "Skip", description: "Move to next question"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe exceptions</note>
    </questions>

    <action>Create `.festinalente/engineering/conventions/{convention}.md`</action>
    <action>Use template from `.festinalente/templates/engineering-convention.md`</action>

    <note>**Documentation Review (per doc):**</note>
    <action>Read the draft back to user</action>
    <action>Use AskUserQuestion tool with:
      - header: "Accuracy"
      - question: "Is this documentation accurate? What's missing?"
      - options:
        - label: "Looks good", description: "Documentation is accurate"
        - label: "Needs changes", description: "Some parts need correction"
      - multiSelect: false
    </action>
    <note>User can select "Other" to specify what's missing</note>

    <action>Use AskUserQuestion tool with:
      - header: "Clarity"
      - question: "Would this help a new developer understand the system?"
      - options:
        - label: "Yes", description: "Clear enough for newcomers"
        - label: "Needs more detail", description: "Add more explanation"
      - multiSelect: false
    </action>

    <note>**Exit:**</note>
    <action>Use AskUserQuestion tool with:
      - header: "Wrap Up"
      - question: "Is there anything else about the engineering/architecture you'd like to document?"
      - options:
        - label: "No, done", description: "Proceed to glossary update"
        - label: "Yes, more", description: "I have more to document"
      - multiSelect: false
    </action>
    <note>User can select "Other" to add more details</note>
    <branch condition="user says no/nothing/that's all">
      <action>Proceed to glossary update</action>
    </branch>
    <branch condition="user has more">
      <action>Continue Q&A</action>
    </branch>
  </step>

  <step name="update_glossary">
    <note>Update project glossary with technical terms</note>
    <action>Check if `.festinalente/glossary.yaml` exists</action>
    <branch condition="exists">
      <action>Read existing glossary</action>
      <action>Add new technical terms discovered</action>
    </branch>
    <branch condition="does not exist">
      <action>Create `.festinalente/glossary.yaml` with technical terms</action>
    </branch>

    <example_code lang="yaml">
# Project Glossary - Technical terms section
version: 1
terms:
  # ... existing terms ...
  - term: "{technical-term}"
    aliases: ["{synonym1}", "{synonym2}"]
    domain: engineering
    definition: "{brief definition}"
    auto_generated: true
    </example_code>

    <action>Use AskUserQuestion tool with:
      - header: "Glossary"
      - question: "Review technical terms - any to add, remove, or rename?"
      - options:
        - label: "Looks good", description: "Glossary is complete"
        - label: "Add terms", description: "I want to add more terms"
        - label: "Remove terms", description: "Some terms should be removed"
        - label: "Rename terms", description: "Some terms need renaming"
      - multiSelect: true
    </action>
    <note>User can select "Other" to specify changes</note>
  </step>

  <step name="validation_phase">
    <note>Validate documentation quality and completeness</note>

    <action>Check all `references` and `uses` fields resolve to existing docs</action>
    <action>Check all `paths` fields point to existing files</action>
    <action>Check for orphan docs (not referenced anywhere)</action>
    <action>Verify each doc has required fields: tldr, summary, keywords, boundary</action>

    <output>
Validation Report:
────────────────────────────────────────
Total docs created: {count}
- Systems: {count}
- Patterns: {count}
- Conventions: {count}

ISSUES FOUND:
- Related field issues: {list or "None"}
- Invalid paths: {list or "None"}
- Orphan docs: {list or "None"}
- Missing fields: {list or "None"}

Risks documented: {count} from Risk Identifier
    </output>

    <branch condition="issues found">
      <action>Use AskUserQuestion tool with:
        - header: "Fix Issues"
        - question: "Would you like to fix these issues now?"
        - options:
          - label: "Yes", description: "Fix issues before completing"
          - label: "No", description: "Skip, I'll fix them later"
        - multiSelect: false
      </action>
      <branch condition="user selects Yes">
        <action>Fix each issue interactively</action>
      </branch>
    </branch>
  </step>

  <step name="final_review">
    <action>Read all generated engineering docs</action>
    <action>Update overview.md with links to created systems/patterns/conventions</action>
    <action>Verify all `references` and `uses` fields are accurate across docs</action>
    <action>Add any high-severity risks to relevant system docs</action>
  </step>


  <step name="output_result">
    <output>Engineering documentation mapped!</output>
    <output>
**Created:**
- {system_count} system docs
- {pattern_count} pattern docs
- {convention_count} convention docs
- {risk_count} risks documented

**Next: Start creating tasks**
```
/clear
/festina-create "Your task title"
```
    </output>
    {{> skill-complete}}
  </step>
</process>

<success_criteria>
- `.festinalente/engineering/` directory exists
- At least `overview.md` was created
- Each doc has valid frontmatter (id, type, title, tldr, summary, keywords, boundary, paths, updated)
- `.festinalente/glossary.yaml` updated with technical terms
- Validation phase completed without errors
- Next steps shown to user
</success_criteria>

<example>
User: `/festina-map-engineering`

```
Launching 4 parallel agents to analyze the codebase...

[Stack Analyzer] Reading package.json, analyzing dependencies...
[Architecture Mapper] Identifying systems and data flow...
[Convention Extractor] Finding patterns and conventions...
[Risk Identifier] Looking for technical debt and risks...

All agents complete. Synthesizing findings...

I analyzed the codebase and found the following:

**Tech Stack:**
- TypeScript 5.3, Node.js 20
- Express.js 4.18 (API framework)
- PostgreSQL 15 (database)
- Jest (testing)

**Systems:**
- auth: JWT authentication with refresh tokens
- api: REST API with versioning
- database: PostgreSQL with Prisma ORM
- cache: Redis for session storage

**Patterns:**
- Repository pattern for data access
- Middleware pattern for request processing
- Factory pattern for service creation

**Risks Identified:** 12 issues (2 high, 5 medium, 5 low)
- HIGH: SQL injection risk in search endpoint
- HIGH: No rate limiting on auth endpoints

Let me ask some questions to validate and expand on this understanding.
```

**After Q&A completes, creates:**
```
.festinalente/engineering/
├── overview.md
├── systems/
│   ├── auth/
│   │   └── _index.md
│   ├── api/
│   │   └── _index.md
│   └── database/
│       └── _index.md
├── patterns/
│   ├── repository.md
│   └── middleware.md
└── conventions/
    ├── file-naming.md
    └── error-handling.md
```

**Validation Report:**
```
Total docs created: 8
- Systems: 3
- Patterns: 2
- Conventions: 2

ISSUES FOUND: None

Risks documented: 12 (added to relevant system docs)
```
</example>

<note>
**Parallel Agent Benefits:**

1. **Comprehensive analysis** - Each agent specializes in one aspect
2. **Risk awareness** - Dedicated agent finds security and performance issues
3. **Pattern recognition** - Convention Extractor ensures consistency documentation
4. **Faster mapping** - 4 agents work simultaneously

**Engineering Doc Quality:**

- Always include code examples from the actual codebase
- Document the "why" not just the "what"
- Include boundaries (what the system/pattern does NOT do)
- Link risks to specific systems for traceability
</note>

<next_steps>
```
/clear
/festina-create "Your task title"
```
</next_steps>
