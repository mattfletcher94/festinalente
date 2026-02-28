---
name: festina-explore
description: Explore questions and ideas through Socratic dialogue, research codebase and docs, determine if something is worth pursuing, and optionally invoke festina-create.
allowed-tools: Read, Glob, Grep, WebSearch, WebFetch, AskUserQuestion, Bash(node *), Task, Skill
argument-hint: "[question or topic to explore]"
disable-model-invocation: true
---

# Explore Question or Idea

<purpose>
Explore a question, idea, or topic through Socratic dialogue. Research the codebase, docs, and web as needed. Determine if it's worth creating a task. Output a ticket description ready to copy into /festina-create.
</purpose>

<context>
{{> directory-reference}}

{{> helper-scripts show_list_tasks=true show_get_skill_config=true}}

{{> product-docs-scripts show_search_product=true}}

{{> engineering-docs-scripts show_search_engineering=true}}
</context>

<prohibited>
- Do not automatically create tasks - output ticket description for user to copy
- Do not skip checking existing context (docs, tasks)
- Do not skip the Socratic dialogue - ask clarifying questions
- Do not spawn agents without asking user first
</prohibited>

<process>
  <step name="load_directives">
    {{> load-directives skill="explore"}}
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

  {{> directive-compliance}}

  <step name="complete">
    {{> skill-complete}}
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
