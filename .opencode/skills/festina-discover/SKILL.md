---
name: festina-discover
description: Investigate problems through structured exploration and create tasks for findings
tools:
  read: true
  glob: true
  grep: true
  websearch: true
  webfetch: true
  question: true
  skill: true
  task: true
argument-hint: "[problem to investigate]"
---

# Discover and Investigate

<purpose>
Investigate a problem in the codebase through structured exploration, produce concrete findings with locations, and create tasks for each finding via festina-create.
</purpose>

<context>
<note>
- **`.opencode/skills/festina-*/`** — Installed kanban skills — READ ONLY
- **`.festinalente/`** — Project data and config — READ/WRITE
- **`.festinalente/tasks/{id}/`** — Task folder containing `task.xml`, `spec.xml`, `plan.xml`
- **`.festinalente/quick/{id}/`** — Quick task folder containing `quick.xml` (for /festina-quick)
- **`.festinalente/scripts/`** — Helper scripts for kanban operations
- **`.festinalente/templates/`** — Document templates
- **`.festinalente/workflow.yaml`** — Workflow config (columns, labels, transitions)
- **`.festinalente/directives/`** — User-defined directives (custom instructions for skills)
</note>

<note>**Exploration Types:**</note>
- **Audit:** Find issues, inconsistencies, or gaps (docs, code quality, security, etc.)
- **Investigate:** Trace a specific problem, understand how something works
- **Research:** Find best practices, compare approaches, gather external information

<note>**Key Principle:** Every finding becomes a task offer. This skill DISCOVERS work, it doesn't DO work.</note>
</context>

<prohibited>
- Do not skip the problem validation step
- Do not skip the structured exploration phase
- Do not present findings without offering task creation
</prohibited>

<process>
  <step name="get_problem" outputs="problem">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as the problem statement</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <action>Use AskUserQuestion tool with:
        - header: "Investigate"
        - question: "What problem would you like to investigate?"
        - options:
          - label: "Audit codebase", description: "Find issues, gaps, or inconsistencies"
          - label: "Investigate issue", description: "Trace a specific problem"
          - label: "Research approach", description: "Find best practices or compare approaches"
        - multiSelect: false
      </action>
      <action>Ask follow-up: "What specifically should I look for?"</action>
    </branch>
  </step>

  <step name="validate_problem">
    <note>Ensure this is a concrete problem, not a meta-question</note>

    <branch condition="user asks about kanban workflow or skill selection">
      <output>
I investigate problems in your codebase - I don't advise on kanban workflow.

What outcome are you trying to achieve? I can investigate that and create tasks for any work needed.
      </output>
      <action>Wait for user to provide concrete problem</action>
    </branch>

    <branch condition="problem is concrete">
      <output>
**Investigating:** {problem}

Let me explore this and find concrete issues.
      </output>
    </branch>
  </step>

  <step name="classify_and_explore" outputs="findings">
    <note>Select exploration strategy based on problem type and spawn agents in parallel using Task tool</note>

    <branch condition="audit type (docs, code quality, security, etc.)">
      <parallel>
        <agent name="Issue Scanner" subagent_type="Explore">
          <prompt>
Find issues related to: {problem}

For each issue found, provide:
- title: Short description
- location: File path and line (if applicable)
- description: What the issue is
- impact: Why it matters
- suggested_task: What task would fix this

Be specific. Include file paths and line numbers.
          </prompt>
        </agent>
        <agent name="Gap Finder" subagent_type="Explore">
          <prompt>
Find gaps or missing elements related to: {problem}

For each gap found, provide:
- title: What's missing
- location: Where it should be (if applicable)
- description: What should exist
- impact: Why it matters
- suggested_task: What task would address this

Be specific. Reference existing patterns to compare against.
          </prompt>
        </agent>
      </parallel>
    </branch>

    <branch condition="investigate type (trace problem, understand system)">
      <parallel>
        <agent name="Tracer" subagent_type="Explore">
          <prompt>
Trace this problem: {problem}

Map:
- Entry points: Where does this start?
- Flow: How does data/control flow through?
- Dependencies: What does it depend on?
- Exit points: Where does it end?

For each issue or complexity found, provide:
- title: Short description
- location: File path and line
- description: What you found
- suggested_task: What task would address this
          </prompt>
        </agent>
        <agent name="Impact Analyzer" subagent_type="Explore">
          <prompt>
Analyze impact of: {problem}

Find:
- What depends on this?
- What would break if this changes?
- What else is affected?

For each finding, provide:
- title: Short description
- location: File paths involved
- description: The relationship/impact
- suggested_task: What task would address this (if needed)
          </prompt>
        </agent>
      </parallel>
    </branch>

    <branch condition="research type (best practices, approaches)">
      <parallel>
        <agent name="Web Researcher" subagent_type="Explore">
          <prompt>
Research best practices for: {problem}

Use WebSearch and WebFetch to find:
- How do other projects solve this?
- What are the recommended approaches?
- What are the trade-offs?

For each recommendation, provide:
- title: The approach/practice
- source: Where you found it
- description: How it works
- applicability: How it applies to this codebase
- suggested_task: What task would implement this
          </prompt>
        </agent>
        <agent name="Codebase Comparator" subagent_type="Explore">
          <prompt>
Compare current implementation to best practices for: {problem}

Find:
- What does the codebase currently do?
- How does it differ from best practices?
- What gaps exist?

For each gap, provide:
- title: The gap
- location: Current implementation location
- description: Current vs recommended
- suggested_task: What task would address this
          </prompt>
        </agent>
      </parallel>
    </branch>

    <action>Wait for all agents to complete</action>
    <action>Combine and deduplicate findings</action>
  </step>

  <step name="present_findings">
    <branch condition="no findings">
      <output>
**Investigation Complete**

I explored {problem} but didn't find significant issues.

What was checked:
{summary of exploration}

Would you like me to investigate a different angle?
      </output>
      <action>Offer to explore differently or exit</action>
    </branch>

    <branch condition="findings exist">
      <output>
**Investigation Complete**

I found {count} items related to: {problem}

{For each finding:}
**{n}. {title}**
- Location: {location}
- {description}
- Impact: {impact}

---
      </output>
    </branch>
  </step>

  <step name="create_tasks">
    <note>This is THE POINT of the skill - not optional</note>

    <output>Let's create tasks for these findings.</output>

    <action>For each finding:</action>

    <output>
**{n}. {title}**
{brief description}
    </output>

    <action>Use AskUserQuestion tool with:
      - header: "Task"
      - question: "Create task: {suggested_task}?"
      - options:
        - label: "Yes", description: "Create this task"
        - label: "Skip", description: "Don't create task for this"
        - label: "Modify", description: "Create with different title"
      - multiSelect: false
    </action>

    <branch condition="Yes or Modify">
      <action>Invoke /festina-create using Skill tool</action>
      <action>Pass title as argument</action>
    </branch>

    <branch condition="Skip">
      <output>Skipped.</output>
    </branch>

    <action>Continue to next finding</action>
  </step>

  <step name="output_summary">
    <output>
**Investigation Summary**

- Problem: {original problem}
- Findings: {total}
- Tasks created: {count}

{If tasks created:}
Next steps:
```
/festina-scope {task-id}
```
    </output>
    ## Final Validation
    
    Before completing, validate all task XML:
    
    <command description="Validate XML in task files">node .festinalente/scripts/validate-xml.cjs {taskId}</command>
    
    If validation fails, fix the reported errors before completing.
    
    <output>[KANBAN_COMPLETE]</output>
  </step>
</process>

<success_criteria>
- Problem validated as concrete (not meta-question)
- Structured exploration completed with bounded agents
- Findings presented with locations and details
- Task creation offered for each finding
- Summary shows tasks created
</success_criteria>

<example>
User: `/festina-discover audit the documentation for inconsistencies`

```
**Investigating:** audit the documentation for inconsistencies

Let me explore this and find concrete issues.

[Spawns Issue Scanner and Gap Finder agents in parallel]

**Investigation Complete**

I found 4 items related to: documentation inconsistencies

**1. Outdated verified date**
- Location: .festinalente/product/auth/login.md
- The verified date is 2025-08-15, but the file was modified 2026-01-20
- Impact: Documentation may not reflect current implementation

**2. Missing Overview section**
- Location: .festinalente/product/tasks/assignment.md
- This doc has no Overview section (required by quality standards)
- Impact: AI discovery may not understand the feature

**3. Inconsistent keyword usage**
- Location: .festinalente/product/auth/*.md
- "authentication" vs "auth" used inconsistently across docs
- Impact: Search may miss related docs

**4. Broken related link**
- Location: .festinalente/product/notifications/email.md
- References "users/preferences" but that doc doesn't exist
- Impact: Navigation broken

---

Let's create tasks for these findings.

**1. Outdated verified date**
Create task: Update auth/login documentation to match implementation?
> Yes

[Invokes /festina-create "Update auth/login documentation"]
Task 011 created.

**2. Missing Overview section**
Create task: Add Overview section to tasks/assignment.md?
> Yes

[Invokes /festina-create "Add Overview section to tasks/assignment"]
Task 012 created.

**3. Inconsistent keyword usage**
Create task: Standardize authentication keywords across auth docs?
> Skip

Skipped.

**4. Broken related link**
Create task: Fix broken link in notifications/email.md?
> Yes

[Invokes /festina-create "Fix broken related link in notifications/email"]
Task 013 created.

---

**Investigation Summary**

- Problem: audit the documentation for inconsistencies
- Findings: 4
- Tasks created: 3

Next steps:
/festina-scope 011
```
</example>

<example name="meta_question_redirect">
User: `/festina-discover which skill should I use for documentation?`

```
I investigate problems in your codebase - I don't advise on kanban workflow.

What outcome are you trying to achieve? I can investigate that and create tasks for any work needed.

> I want to make sure the docs are up to date

**Investigating:** ensure documentation is up to date

Let me explore this and find concrete issues.

[Proceeds with structured exploration...]
```
</example>

<next_steps>
```
/festina-scope {task-id}
```
</next_steps>
