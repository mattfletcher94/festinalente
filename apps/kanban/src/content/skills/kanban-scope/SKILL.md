---
name: kanban-scope
description: Research codebase and create functional specification through conversational Q&A. Focuses on engineering analysis - HOW to build it technically.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *, git checkout *), Glob, Grep, AskUserQuestion, WebSearch, WebFetch
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Scope Kanban Task

<purpose>
Create a functional specification through iterative conversational Q&A focused on technical decisions, then move to Scoped and commit. Accepts tasks from either Backlog or Refined status.
</purpose>

<context>
{{> directory-reference}}

{{> helper-scripts show_find_task=true show_get_date_time=true}}

{{> engineering-docs-scripts show_search_engineering=true}}

{{> column-transition from="backlog OR refined" to="scoped"}}
</context>

<prohibited>
- Do not skip codebase research before the Q&A dialogue
- Do not create a spec without understanding existing patterns
- Do not skip the commit step
- Do not forget to create the task branch
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="verify_branch">
    {{> branch-verify-main reason="to create the task branch"}}
  </step>

  <step name="get_task_id" outputs="taskId">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as taskId</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <action>List tasks in `backlog` or `refined` status from `.kanban/tasks/`</action>
      <output>Show task IDs, titles, and status</output>
      <prompt>Which task to scope?</prompt>
    </branch>
  </step>

  <step name="read_task_file" outputs="taskPath, title, acceptanceCriteria, status">
    <command>node .kanban/scripts/find-task.cjs {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse YAML frontmatter</action>
    <validate>Verify status is `backlog` or `refined`</validate>
    <branch condition="status is not backlog and not refined">
      <output>Task is in {status} status. Expected: backlog or refined.</output>
      <prompt>Continue anyway? (y/n)</prompt>
    </branch>
    <action>Extract problem, value, and acceptance criteria for reference</action>
    <branch condition="task not found">
      <output>Error: Task not found</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="check_readiness" when="status is backlog">
    <note>Tasks coming directly from backlog (skipping refinement) need a readiness check</note>
    <validate>Check if `## Description` section has content (not empty/placeholder)</validate>
    <validate>Check if `## What problem are you trying to solve?` has content OR description provides clear context</validate>

    <branch condition="criteria met">
      <action>Proceed to scoping</action>
    </branch>

    <branch condition="criteria NOT met">
      <output>This task is not well refined. I recommend running `/kanban-refine {taskId}` first.</output>
      <prompt>Proceed anyway? (Y/N)</prompt>
      <branch condition="user says Y">
        <action>Proceed to scoping (user accepts risk of incomplete requirements)</action>
      </branch>
      <branch condition="user says N">
        <output>Run `/kanban-refine {taskId}` to clarify the task requirements first.</output>
        <action>Exit</action>
      </branch>
    </branch>

    <note>Tasks in `refined` status skip this check - they've already been through refinement</note>
  </step>

  <step name="load_hook_config">
    {{> hook-config command="scope"}}
  </step>

  <step name="initial_codebase_research">
    <note>Read product context first:</note>
    <branch condition="task has `affects` field">
      <action>For each ID: Read `.kanban/product/{id}.md`</action>
      <action>Note: current behavior, constraints, interactions</action>
      <note>This informs WHERE to look in codebase</note>
    </branch>

    <note>Read engineering context:</note>
    <branch condition="task has `engineering` field">
      <action>For each ID: Read engineering doc (overview, system, pattern, or convention)</action>
      <action>Note: patterns to follow, existing implementations, constraints</action>
      <note>This informs HOW to implement and WHERE to look</note>
    </branch>
    <branch condition="no engineering field">
      <command>node .kanban/scripts/search-engineering.cjs {keywords from title/description}</command>
      <branch condition="relevant patterns/systems found">
        <action>Read and note relevant patterns</action>
        <action>Suggest adding to `engineering` field</action>
      </branch>
    </branch>

    <note>Then proceed with codebase research:</note>
    <action>Based on task description and acceptance criteria, do preliminary research</action>
    <action>Use Glob to find potentially affected files</action>
    <action>Use Grep to search for relevant patterns, functions, or components</action>
    <action>Read key files to understand existing patterns</action>
    <action>Identify dependencies and libraries involved</action>
    <action>Look for similar implementations that can serve as references</action>

    <note>Pattern search strategy:
- Search for similar functionality: "How is X done elsewhere?"
- Search for related types/interfaces: "What types are involved?"
- Search for integration points: "What connects to this?"</note>
  </step>

  <step name="conduct_qa_dialogue">
    <note>This is a **conversational session** focused on **technical decisions**:
- Architecture and approach
- Existing patterns to follow
- Dependencies and libraries
- Technical constraints
- Files to modify/create</note>

    <note>How the dialogue works:</note>

    <action>Share initial findings and ask questions</action>
    <note>Present what you found in the codebase</note>
    <note>Ask about technical approach, preferences, constraints</note>
    <note>Don't follow a rigid script - adapt to the conversation</note>

    <note>User can volunteer information at any time:
- User may provide technology directives (e.g., "use Zustand", "use React Query")
- User may request research (e.g., "research reactive localStorage packages for React")
- User may share architectural preferences or constraints</note>

    <note>Perform research when requested or beneficial:</note>

    <note>**Local codebase research:**</note>
    <action>Use Glob/Grep to find patterns as topics arise</action>
    <action>Read files to understand existing implementations</action>

    <note>**Web research:**</note>
    <branch condition="user asks to research packages/libraries">
      <action>Use WebSearch to research npm packages, documentation, best practices</action>
      <action>Compare options and present findings</action>
      <prompt>Ask if findings influence the approach</prompt>
    </branch>

    <action>Continue until you have enough information to write a complete functional spec</action>

    <output>
**"I think I have enough information to write the functional spec. Here's what I understand:**

- **Approach:** {summary}
- **Key files:** {list}
- **Dependencies:** {list}
- **Patterns to follow:** {summary}

**Is there anything else you'd like to discuss before I write the spec?"**
    </output>

    <branch condition="user says 'that's good' / 'go ahead' / similar">
      <action>Proceed to writing spec</action>
    </branch>
    <branch condition="user adds more context">
      <action>Incorporate and ask if anything else</action>
    </branch>
    <branch condition="user has corrections">
      <action>Update understanding and confirm again</action>
    </branch>

    <note>Key principles:
- Focus on TECHNICAL decisions, not product requirements (those are in the task)
- Research as topics arise, not just at the beginning
- Let the conversation flow naturally
- Don't rush - thoroughness now saves time during implementation</note>
  </step>

  <step name="create_spec_file" outputs="specPath">
    <action>Create at `.kanban/tasks/{taskId}/spec.md`</action>
    <action>Follow template at `.kanban/templates/spec.md`</action>
    <action>Link to spec in frontmatter</action>
    <action>Fill ALL sections</action>

    <example_code lang="markdown">
---
task: "{taskId}"
created: {YYYY-MM-DD}
updated: {YYYY-MM-DD}
---

# Functional Specification: {title}

## Context
{Pull from task's problem and value sections}

## Scope
### In Scope
- {What this spec covers}

### Out of Scope
- {Explicit boundaries}

## Functional Requirements
- FR1: The system shall...
- FR2: The system shall...

## Affected Files
- `path/to/file.ts` (modify) - {reason}
- `path/to/new.ts` (create) - {reason}

## Existing Patterns
- **Pattern:** {description}
  - Reference: `path/to/example.ts:42`

## Technical Constraints
- {Constraints discovered during research}

## Dependencies
### External
- {Libraries/APIs - include any researched/chosen packages}

### Internal
- {Other features/tasks}

## Research Findings
{If web research was conducted, summarize findings and decisions}
- **Topic:** {what was researched}
- **Options considered:** {list}
- **Decision:** {what was chosen and why}

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| ... | ... | ... |

## Open Questions
- [ ] {Unresolved items}
    </example_code>
  </step>

  <step name="update_task_frontmatter">
    <action>Change status to `scoped` (from either `backlog` or `refined`)</action>
    <action>Add `spec: "tasks/{taskId}/spec.md"` to frontmatter</action>
    <action>Update `updated: {YYYY-MM-DD}`</action>
  </step>

  <step name="write_files">
    <action>Write spec file at `.kanban/tasks/{taskId}/spec.md`</action>
    <action>Write updated task file</action>
  </step>

  <step name="create_task_branch">
    <command>git checkout -b task/{taskId}</command>
    <output>Confirm: "Created branch task/{taskId}"</output>
  </step>

  <step name="commit">
    <note>Format: `docs({taskId}): scope - {title}`</note>
    <command>git add .kanban/tasks/{taskId}/spec.md .kanban/tasks/{taskId}/task.md</command>
    <command>git commit -m "docs({taskId}): scope - {title}"</command>
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
/kanban-plan {taskId}
```
    </output>
    {{> skill-complete}}
  </step>
</process>

<success_criteria>
- Task file exists at `.kanban/tasks/{taskId}/task.md`
- Spec file exists at `.kanban/tasks/{taskId}/spec.md`
- Task frontmatter contains `status: scoped`
- Task frontmatter contains `spec: "tasks/{taskId}/spec.md"`
- Spec file contains `## Functional Requirements` section
- Spec file contains `## Affected Files` section
- Spec file contains `## Existing Patterns` section
- Git log shows `docs({taskId}): scope -`
- Current branch is `task/{taskId}` after completion
- Next steps shown to user
</success_criteria>

<example>
User: `/kanban-scope 001`

```
Scoping task 001 "Add localStorage persistence for app state"...

Reading task details...
- Problem: App state is lost on page refresh
- Value: Better UX, users don't lose work
- Acceptance: State persists across refreshes, loads on startup

Let me search the codebase for existing patterns...

Found:
- State management in src/store/index.ts (using Zustand)
- No existing persistence layer
- Config loading pattern in src/utils/config.ts

I see you're using Zustand for state management. There are a few approaches
for adding persistence:

1. Zustand's built-in persist middleware
2. A separate localStorage abstraction
3. A reactive localStorage hook

Do you have a preference, or should I research options?
> Research reactive localStorage packages for React, I want something that
> handles sync across tabs.

Let me research that...

[Searches for reactive localStorage React packages]

Found several options:

| Package | Weekly Downloads | Last Update | Tab Sync |
|---------|-----------------|-------------|----------|
| use-local-storage-state | 150k | 2 months ago | Yes |
| @rehooks/local-storage | 80k | 1 year ago | Yes |
| zustand persist | (built-in) | Active | No |

**use-local-storage-state** looks promising:
- Active maintenance
- Built-in tab sync via storage events
- SSR safe
- TypeScript support

Would you like to go with this, or should I look into others?
> That looks good. How would it integrate with our Zustand store?

Good question. We have two options:

1. **Replace Zustand with the hook directly** - simpler but loses Zustand benefits
2. **Use alongside Zustand** - hook for persistence, Zustand for state logic

Looking at your store... you have computed values and actions. I'd recommend
option 2 - use the hook to persist, sync to Zustand on load/change.

Let me check if there are existing hydration patterns in the codebase...

[Searches for hydration patterns]

Found a pattern in src/store/settings.ts that loads from config on mount.
We could follow that pattern.

> Sounds good. Any other technical considerations?

A few things:
- Storage key naming convention (found "app_" prefix in config.ts)
- Error handling for localStorage quota exceeded
- Migration strategy if storage schema changes

Should we address migration now or defer?
> Defer migration for now, just note it as a risk.

I think I have enough information to write the functional spec. Here's what I understand:

- **Approach:** use-local-storage-state for persistence with tab sync, hydrate Zustand on mount
- **Key files:** src/store/index.ts (modify), src/hooks/usePersistedState.ts (create)
- **Dependencies:** use-local-storage-state (new)
- **Patterns to follow:** Hydration pattern from src/store/settings.ts, "app_" key prefix

Is there anything else you'd like to discuss before I write the spec?
> No, that's good.

Writing functional specification...

Spec created: .kanban/tasks/001/spec.md
- 4 functional requirements
- 2 files to modify, 1 new file
- 1 external dependency (use-local-storage-state)
- 1 existing pattern referenced
- 1 risk flagged (migration strategy deferred)

Task 001 scoped.
- Status: scoped
- Spec: tasks/001/spec.md
Commit: d4e5f6g docs(001): scope - Add localStorage persistence for app state

Next:
/clear
/kanban-plan 001
```
</example>

<next_steps>
```
/clear
/kanban-plan {id}
```
</next_steps>
