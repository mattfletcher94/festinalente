---
name: festina-explore
description: Explore questions and ideas through Socratic dialogue, research codebase and docs, determine if something is worth pursuing, and optionally invoke festina-create.
tools:
  read: true
  glob: true
  grep: true
  websearch: true
  webfetch: true
  question: true
  bash: "node *"
  task: true
  skill: true
argument-hint: "[question or topic to explore]"
disable-model-invocation: true
---

# Explore Question or Idea

<purpose>
Explore a question, idea, or topic through Socratic dialogue. Research the codebase, docs, and web as needed. Determine if it's worth creating a task. Output a ticket description ready to copy into /festina-create.
</purpose>

<context>
<note>
- **`.opencode/skills/festina-*/`** — Installed festina skills — READ ONLY
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
</context>

<prohibited>
- Do not automatically create tasks - output ticket description for user to copy
- Do not skip checking existing context (docs, tasks)
- Do not skip the Socratic dialogue - ask clarifying questions
- Do not spawn agents without asking user first
</prohibited>

<process>
  <step name="load_directives">
    <command>node .festinalente/scripts/festinalente.cjs get-skill-config festina-explore</command>
    <action>Parse the JSON output</action>
    
    <branch condition="directives.length > 0">
      <warning>Directives are MANDATORY. You MUST follow them.</warning>
      <action>For EACH directive where `exists` is `true`:</action>
      <action>Read the directive XML file at `path`</action>
      <action>Parse and apply:</action>
      <action>- `<context>` principles: Maintain as ongoing mindset</action>
      <action>- `<process>` rules where phase="explore": Follow as requirements</action>
      <action>- `<override>` sections where phase="explore": Apply step replacements</action>
      <action>- `<verification>` commands: Note for use in task `<verify>` elements</action>
    
      <branch condition="directive has <override> section for phase=explore">
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
      "skill": "festina-explore",
      "directives": [
        { "name": "architecture", "path": ".festinalente/directives/architecture.xml", "exists": true }
      ]
    }
    </example_code>
  </step>

  <step name="understand_question" outputs="question, intent">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as the question</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <action>Use AskUserQuestion tool with:
        - header: "Question"
        - question: "What would you like to explore?"
        - options:
          - label: "Feasibility", description: "Is this idea worth pursuing?"
          - label: "Patterns", description: "What patterns exist in the codebase?"
          - label: "Best practices", description: "What's the recommended approach?"
          - label: "Comparison", description: "How does X compare to Y?"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type their question</note>
    </branch>
    <action>Clarify scope if needed: "What specifically are you trying to learn?"</action>
  </step>

  <step name="check_existing_context" outputs="relatedProductDocs, relatedEngineeringDocs, relatedTasks">
    <action>Extract keywords from question</action>
    <command>node .festinalente/scripts/festinalente.cjs search-product {keywords}</command>
    <command>node .festinalente/scripts/festinalente.cjs search-engineering {keywords}</command>
    <command>node .festinalente/scripts/festinalente.cjs list-tasks</command>

    <branch condition="related docs or tasks found">
      <output>
Found related context:
- Product docs: {ids with scores}
- Engineering docs: {ids with scores}
- Existing tasks: {ids if relevant}

Let me review these before exploring further.
      </output>
      <action>Read relevant docs/tasks to understand existing state</action>
    </branch>

    <branch condition="no related context">
      <output>No existing docs or tasks found related to this topic.</output>
    </branch>
  </step>

  <step name="explore" outputs="findings">
    <note>Start conversational. Escalate to agents if scope expands.</note>

    <action>Begin focused exploration based on question type:</action>

    <branch condition="codebase pattern question">
      <action>Use Grep/Glob to find relevant code</action>
      <action>Read key files to understand patterns</action>
    </branch>

    <branch condition="feasibility question">
      <action>Search codebase for related functionality</action>
      <action>Assess complexity and dependencies</action>
    </branch>

    <branch condition="best practices question">
      <action>Use WebSearch to research approaches</action>
      <action>Compare to codebase current state</action>
    </branch>

    <action>Throughout: Ask clarifying questions as needed</action>
    <note>This is Socratic dialogue - probe assumptions, surface unknowns</note>

    <branch condition="scope expands beyond focused exploration">
      <note>Triggers: multiple unrelated areas, broad "all/every" scope,
      cross-cutting concerns, would exceed context limits</note>

      <action>Use AskUserQuestion tool with:
        - header: "Scope"
        - question: "This looks broader than expected. Want me to spawn agents for a deeper exploration?"
        - options:
          - label: "Go deep", description: "Spawn parallel agents for thorough exploration"
          - label: "Stay focused", description: "Keep it narrow, I'll ask follow-ups"
        - multiSelect: false
      </action>

      <branch condition="user selects Go deep">
        <action>Spawn appropriate agents via Task tool (in parallel):</action>
        <parallel>
          <agent name="Codebase Explorer" subagent_type="Explore" when="code exploration needed">
            <prompt>Explore codebase for: {specific aspect}

Find relevant files, patterns, implementations. Report with file:line references.</prompt>
          </agent>
          <agent name="Doc Researcher" subagent_type="Explore" when="doc analysis needed">
            <prompt>Analyze documentation for: {specific aspect}

Search product and engineering docs. Report key findings.</prompt>
          </agent>
          <agent name="Web Researcher" subagent_type="Explore" when="external research needed">
            <prompt>Research best practices for: {specific aspect}

Use WebSearch to find approaches, patterns, recommendations. Report findings with sources.</prompt>
          </agent>
        </parallel>
        <action>Wait for agents, synthesize results</action>
      </branch>

      <branch condition="user selects Stay focused">
        <action>Continue conversational exploration with narrower scope</action>
      </branch>
    </branch>
  </step>

  <step name="synthesize" outputs="conclusion, worthDoing">
    <action>Connect findings into coherent picture</action>
    <action>Identify: What would this actually involve?</action>
    <action>Assess: Is this worth doing? Why or why not?</action>

    <branch condition="clearly worth doing">
      <action>Set worthDoing = true</action>
    </branch>
    <branch condition="clearly not worth doing">
      <action>Set worthDoing = false</action>
      <action>Document reasons with evidence</action>
    </branch>
    <branch condition="uncertain">
      <action>Present trade-offs and let user decide</action>
    </branch>
  </step>

  <step name="conclude">
    <branch condition="worthDoing = true">
      <output>
## Ticket: {suggested title}

**Problem:** {what problem this would solve}

**Value:** {why it's worth solving}

**Context:** {what the exploration found}
- {finding 1}
- {finding 2}

**Acceptance Criteria (suggested):**
- Given {precondition}, when {action}, then {outcome}

**Related:**
- Product docs: {ids}
- Engineering docs: {ids}
- Existing tasks: {ids}
      </output>

      <action>Use AskUserQuestion tool with:
        - header: "Next"
        - question: "What would you like to do?"
        - options:
          - label: "Create task", description: "Invoke /festina-create with this ticket"
          - label: "Keep exploring", description: "Continue discussing, ask more questions"
        - multiSelect: false
      </action>
      <note>User can also select "Other" to type something custom</note>

      <branch condition="user selects 'Create task'">
        <action>Invoke Skill tool: skill="festina-create", args="{suggested title}"</action>
        <note>Conversation context (problem, value, criteria) carries forward to festina-create</note>
      </branch>

      <branch condition="user selects 'Keep exploring'">
        <action>Ask: "What else would you like to explore about this?"</action>
        <action>Continue Socratic dialogue</action>
        <action>Return to synthesize step when ready</action>
      </branch>

      <branch condition="user types custom response">
        <action>Respond to their input</action>
        <action>Continue exploration or adjust ticket as needed</action>
      </branch>
    </branch>

    <branch condition="worthDoing = false">
      <output>
## Exploration Conclusion

**Question:** {original question}

**Finding:** This doesn't warrant a task because:
- {reason}

**What was checked:**
- {summary}
      </output>
    </branch>

    <branch condition="uncertain">
      <output>
## Exploration Summary

**Question:** {original question}

**Findings:**
- {finding 1}
- {finding 2}

**Options:**
1. {option 1}: {trade-offs}
2. {option 2}: {trade-offs}

What would you like to do?
      </output>
      <action>Wait for user decision, then conclude appropriately</action>
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
    ## Final Validation
    
    Before completing, validate all task XML:
    
    <command description="Validate XML in task files">node .festinalente/scripts/festinalente.cjs validate-xml {taskId}</command>
    
    If validation fails, fix the reported errors before completing.
    
    <output>[FESTINA_COMPLETE]</output>
  </step>
</process>

<success_criteria>
- Question understood and scope clarified
- Existing context checked (product docs, engineering docs, tasks)
- Codebase explored as needed
- Findings synthesized into coherent conclusion
- Clear outcome: ticket description OR explanation why not worth pursuing
- If worth doing: output format matches festina-create input expectations
</success_criteria>

<example label="Focused Exploration">
User: `/festina-explore Is our error handling consistent across the codebase?`

```
Exploring: Error handling consistency

Let me check existing context first...

[Runs search-engineering.cjs "error handling"]
Related engineering docs: patterns/error-handling (score: 0.8)

[Reads patterns/error-handling.md]

I see we have a documented pattern. Let me check if it's followed...

[Grep for try/catch patterns, error classes]

Found inconsistencies:
- apps/festinalente/src/scripts/ uses try/catch with console.error
- apps/vscode/src/ uses custom ErrorHandler class
- Some files throw raw strings, others use Error objects

This seems worth standardizing. Is there anything specific you want me to dig into?

> That's enough for now

---

## Ticket: Standardize error handling across codebase

**Problem:** Error handling is inconsistent - some code uses console.error,
some uses ErrorHandler class, some throws raw strings.

**Value:** Easier debugging, consistent error messages, follows our
documented pattern.

**Context:**
- We have patterns/error-handling.md but it's not consistently followed
- apps/vscode uses ErrorHandler class (good)
- apps/festinalente/scripts use console.error (inconsistent)
- Some throw raw strings instead of Error objects

**Acceptance Criteria (suggested):**
- Given any error in the codebase
- When it's thrown or logged
- Then it uses the ErrorHandler pattern from engineering docs

**Related:**
- Engineering docs: patterns/error-handling
- Existing tasks: none found

---
Copy the above into:
/festina-create Standardize error handling across codebase
```
</example>

<example label="Not Worth Doing">
User: `/festina-explore Should we add TypeScript strict mode?`

```
Exploring: TypeScript strict mode

Let me check current config...

[Reads tsconfig.json files]

Strict mode is already enabled:
- strict: true
- noImplicitAny: true
- strictNullChecks: true

---

## Exploration Conclusion

**Question:** Should we add TypeScript strict mode?

**Finding:** This doesn't warrant a task because:
- Strict mode is already enabled in tsconfig.json
- All strict flags are active

**What was checked:**
- apps/festinalente/tsconfig.json
- apps/vscode/tsconfig.json
```
</example>

<next_steps>
If exploration found something worth doing:
```
/festina-create {suggested title}
```

Then paste the ticket description when prompted.
</next_steps>
