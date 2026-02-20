---
name: kanban-discover
description: Explore questions and analyze codebases through Socratic Q&A before creating tasks
allowed-tools: Read, Glob, Grep, WebSearch, WebFetch, AskUserQuestion, Skill
argument-hint: "[exploration question]"
---

# Discover and Explore

<purpose>
Explore questions and analyze codebases through conversational Socratic Q&A before committing to task creation. This enables discovery workflows where you understand the user's intent, perform research/analysis/audits, and optionally convert findings into actionable tasks via kanban-create.
</purpose>

<context>
<note>
- **`.claude/skills/kanban-*/`** — Installed kanban skills — READ ONLY
- **`.kanban/`** — Project data and config — READ/WRITE
- **`.kanban/tasks/{id}/`** — Task folder containing `task.xml`, `spec.xml`, `plan.xml`
- **`.kanban/scripts/`** — Helper scripts for kanban operations
- **`.kanban/templates/`** — Document templates
- **`.kanban/workflow.yaml`** — Workflow config (columns, labels, transitions)
- **`.kanban/directives/`** — User-defined directives (custom instructions for skills)
</note>

<note>Exploration types this skill supports:</note>
- **Codebase audit:** Find issues, patterns, bottlenecks, or opportunities in the code
- **Research:** Investigate implementation approaches, best practices, or how other systems solve problems
- **Analysis:** Understand how something works, trace data flow, or map dependencies

<note>Key principle: No files are created during exploration. All findings are conversational.</note>
</context>

<prohibited>
- Do not persist exploration findings to files (output is conversational only)
- Do not create tasks without explicit user confirmation for each finding
- Do not skip the clarification phase - always ensure you deeply understand what the user wants to explore
- Do not make assumptions about the exploration scope without validating with the user
</prohibited>

<process>
  <step name="get_question" outputs="question">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as the starting exploration question</action>
      <output>Starting exploration: "{question}"</output>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <action>Use AskUserQuestion tool with:
        - header: "Explore"
        - question: "What would you like to explore or analyze?"
        - options:
          - label: "Audit codebase", description: "Find issues, patterns, or opportunities in the code"
          - label: "Research approach", description: "Investigate how to implement something"
          - label: "Analyze system", description: "Understand how something works"
        - multiSelect: false
      </action>
      <branch condition="user selects an option">
        <action>Ask follow-up: "What specifically would you like to {explore/audit/analyze}?"</action>
      </branch>
      <branch condition="user selects Other">
        <action>Use their custom input as the starting question</action>
      </branch>
    </branch>
  </step>

  <step name="clarify_intent" outputs="scope, explorationPlan">
    <note>Use Socratic questioning to deeply understand what the user wants</note>

    <action>Based on the initial question, ask clarifying questions to understand:</action>
    <note>- What specifically are they looking for?</note>
    <note>- What areas of the codebase or topics are relevant?</note>
    <note>- What would a successful exploration outcome look like?</note>
    <note>- Are there any constraints or focus areas?</note>

    <action>Ask 1-3 focused clarifying questions using AskUserQuestion or conversational prompts</action>
    <note>Don't ask too many questions - just enough to focus the exploration</note>

    <branch condition="user provides clear scope">
      <action>Summarize understanding and confirm before proceeding</action>
      <output>
**Here's what I understand you want to explore:**
- {scope summary}
- {focus areas}
- {success criteria}

**Is this correct, or would you like to adjust the focus?**
      </output>
    </branch>

    <branch condition="user wants broad exploration">
      <action>Suggest narrowing the scope for more useful findings</action>
      <action>Offer 2-3 specific angles to choose from</action>
    </branch>
  </step>

  <step name="perform_exploration">
    <note>Execute the exploration based on the clarified scope</note>

    <branch condition="codebase audit/analysis">
      <action>Use Glob to find relevant files matching patterns</action>
      <action>Use Grep to search for specific patterns, keywords, or code constructs</action>
      <action>Use Read to examine file contents in detail</action>
      <note>Look for: patterns, inconsistencies, potential issues, opportunities</note>
    </branch>

    <branch condition="research/investigation">
      <action>Use WebSearch to find relevant articles, documentation, best practices</action>
      <action>Use WebFetch to retrieve and analyze specific resources</action>
      <action>Use codebase tools to compare with existing implementation</action>
      <note>Synthesize findings from multiple sources</note>
    </branch>

    <branch condition="mixed exploration">
      <action>Combine codebase analysis with web research as needed</action>
    </branch>

    <action>As you explore, note key findings</action>
    <note>Findings should be concrete and actionable when possible</note>
  </step>

  <step name="present_findings">
    <note>Present findings conversationally - do not create files</note>

    <output>
**Exploration Complete**

Here's what I found:

{For each finding:}
**Finding {n}: {title}**
{Description of what was found}
{Why it matters / implications}
{Relevant file locations if applicable}

---
    </output>

    <branch condition="no actionable findings">
      <output>
I explored the {scope} but didn't find significant issues or opportunities.

{Explain what was checked and why nothing notable was found}

Would you like me to explore a different angle?
      </output>
      <action>Offer to explore a different aspect or conclude</action>
    </branch>
  </step>

  <step name="offer_task_creation">
    <action>After presenting findings, ask if the user wants to create tasks</action>

    <action>Use AskUserQuestion tool with:
      - header: "Tasks"
      - question: "Would you like to create tasks from any of these findings?"
      - options:
        - label: "Yes, review findings", description: "Go through findings and decide which become tasks"
        - label: "No, exploration complete", description: "End exploration without creating tasks"
      - multiSelect: false
    </action>

    <branch condition="user selects No">
      <output>
Exploration complete. No tasks created.

If you want to create tasks later, you can use:
```
/kanban-create {suggested title based on a finding}
```
      </output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="iterate_findings">
    <note>For each finding, offer task creation</note>

    <action>For each finding in order:</action>

    <output>
**Finding {n}: {title}**
{Brief reminder of the finding}
    </output>

    <action>Use AskUserQuestion tool with:
      - header: "Task?"
      - question: "Create a task for this finding?"
      - options:
        - label: "Yes", description: "Create task: {suggested title}"
        - label: "No", description: "Skip this finding"
      - multiSelect: false
    </action>

    <branch condition="user selects Yes">
      <action>Invoke /kanban-create using the Skill tool</action>
      <action>Pass suggested title as argument: skill: "kanban-create", args: "{suggested title}"</action>
      <output>Task creation started for: {title}</output>
      <note>After kanban-create completes, continue to next finding</note>
    </branch>

    <branch condition="user selects No">
      <output>Skipped.</output>
      <action>Continue to next finding</action>
    </branch>

    <action>Repeat until all findings are processed</action>
  </step>

  <step name="output_result">
    <output>
**Exploration Summary**

- Exploration topic: {original question}
- Findings reviewed: {total}
- Tasks created: {count}

{If tasks were created:}
The created tasks are in Backlog. Next step for each:
```
/kanban-refine {task-id}
```
    </output>
    ## Final Validation
    
    Before completing, validate all task XML:
    
    <command description="Validate XML in all task files">node .kanban/scripts/validate-xml.cjs</command>
    
    If validation fails, fix the reported errors before completing.
    
    <output>[KANBAN_COMPLETE]</output>
  </step>
</process>

<success_criteria>
- User's exploration intent is clearly understood before exploration begins
- Exploration uses appropriate tools (codebase tools or web research) based on intent
- Findings are presented conversationally (no files created during exploration)
- User is offered opportunity to create tasks from findings
- For each finding, user confirms before task creation
- Skill tool successfully chains to kanban-create when user confirms task creation
</success_criteria>

<example>
User: `/kanban-discover audit performance bottlenecks`

```
Starting exploration: "audit performance bottlenecks"

To focus this audit, I have a few questions:

Q: What area of the application are you most concerned about?
> The API response times have been slow lately, especially for list endpoints

Q: Are there specific endpoints or features you've noticed issues with?
> The task list endpoint and the search feature

Got it. I'll focus on:
- Task list API endpoint performance
- Search feature performance
- Common patterns that might cause slowdowns

Is this the right focus?
> Yes

Exploring...

[Uses Grep to find API endpoints]
[Uses Read to examine endpoint implementations]
[Looks for common performance issues: N+1 queries, missing indexes, large payloads]

---

**Exploration Complete**

Here's what I found:

**Finding 1: N+1 query pattern in task list**
The task list endpoint fetches tasks then separately fetches labels for each task in a loop.
Location: src/api/tasks.ts:45-60
Impact: Each additional task adds a database query

**Finding 2: Missing pagination on search results**
Search returns all matching results without pagination, causing large response payloads.
Location: src/api/search.ts:23
Impact: Slow responses and high memory usage for broad searches

**Finding 3: No caching on frequently-accessed reference data**
Label and status definitions are fetched from DB on every request.
Location: src/api/tasks.ts:12, src/api/search.ts:8
Impact: Unnecessary repeated queries

---

Would you like to create tasks from any of these findings?
> Yes, review findings

**Finding 1: N+1 query pattern in task list**
Create a task for this finding?
> Yes

[Invokes /kanban-create "Fix N+1 query pattern in task list endpoint"]

Task 009 created.

**Finding 2: Missing pagination on search results**
Create a task for this finding?
> Yes

[Invokes /kanban-create "Add pagination to search results"]

Task 010 created.

**Finding 3: No caching on frequently-accessed reference data**
Create a task for this finding?
> No

Skipped.

---

**Exploration Summary**

- Exploration topic: audit performance bottlenecks
- Findings reviewed: 3
- Tasks created: 2

The created tasks are in Backlog. Next step for each:
/kanban-refine 009
/kanban-refine 010
```
</example>

<next_steps>
If tasks were created:
```
/kanban-refine {task-id}
```

To explore a different topic:
```
/kanban-discover [new question]
```
</next_steps>
