---
id: "008"
title: "Add kanban-discover skill for exploration and analysis"
status: "backlog"
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

Key requirements:
- Accept open-ended questions or exploration requests from users
- Use Socratic Q&A to clarify user intent
- Perform research, analysis, or audits as needed
- Present findings and optionally create tasks from results
- Investigate disable-model-invocation flag impact on chaining to kanban-create
- Research Claude Code skill docs to ensure direct command invocation ('/kanban-create') works even with the flag
- Reference existing skills for proper structure

## What problem are you trying to solve?
{Filled during refine phase via Q&A - user may skip or have LLM fill in}

## What value would it provide if solved?
{Filled during refine phase via Q&A - user may skip or have LLM fill in}

## Acceptance Criteria

<!-- Use Gherkin format (Given/When/Then) -->

Given {precondition}
When {action}
Then {expected outcome}
And {additional outcome}

## Notes
- Example use case: "Audit the codebase and find performance bottlenecks"
- Should be able to chain to kanban-create for task creation from findings
- Need to verify skill invocation behavior with disable-model-invocation flag
