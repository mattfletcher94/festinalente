---
id: "008"
title: "Add kanban-discover skill for exploration and analysis"
status: "pr"
priority: "medium"
labels: [feature]
created: 2026-02-18
updated: 2026-02-18
completed:
spec: "tasks/008/spec.md"
plan: "tasks/008/plan.md"
affects: [cli/kanban-discover]
engineering: []
---

# Add kanban-discover skill for exploration and analysis

## Description
Create a new kanban-discover skill that allows users to explore and analyze questions before committing to task creation. The skill enables discovery workflows where the LLM uses Socratic questioning to understand the user's intent, performs research/analysis/audits, and can optionally convert findings into tasks via kanban-create.

## What problem are you trying to solve?
Users want to perform exploratory analysis or audits (e.g., find performance bottlenecks, research implementation approaches) before knowing what tasks to create. Currently there's no kanban workflow for this exploration phase - users must either create tasks upfront or do research outside the system.

## What value would it provide if solved?
Enables users to leverage the LLM for codebase audits and research questions, then seamlessly convert findings into actionable tasks via the existing kanban workflow. This bridges the gap between "I have a vague idea" and "I have concrete tasks to work on."

## Acceptance Criteria

Given the user runs /kanban-discover without arguments
When the skill starts
Then it asks what the user wants to explore via Socratic Q&A

Given the user runs /kanban-discover with a question argument
When the skill starts
Then it uses the provided question as the starting point
And asks clarifying questions to deeply understand the exploration intent

Given the user wants to audit the codebase
When the skill performs exploration
Then it analyzes relevant code and presents findings conversationally
And does not persist findings to files

Given the user wants to research an implementation approach
When the skill performs exploration
Then it uses web search and codebase analysis as needed
And presents findings conversationally

Given the skill has completed its exploration
When findings are presented to the user
Then it asks if the user wants to create tasks from the findings

Given the user wants to create tasks from findings
When each finding is reviewed
Then the skill asks if the user wants to create a task for that finding
And chains to /kanban-create if the user confirms
And proceeds to the next finding after task creation completes

Given the skill needs to invoke /kanban-create
When task creation is triggered
Then the skill successfully chains to /kanban-create
And this works regardless of the disable-model-invocation flag setting

## Notes
- Example use case: "Audit the codebase and find performance bottlenecks"
- Example use case: "Research how to implement OAuth2 with refresh tokens"
- Must verify skill invocation behavior with disable-model-invocation flag during implementation
- Reference existing skills (kanban-refine, kanban-create) for proper structure
