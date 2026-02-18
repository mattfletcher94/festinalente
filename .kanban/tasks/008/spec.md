---
task: "008"
created: 2026-02-18
updated: 2026-02-18
---

# Functional Specification: Add kanban-discover skill for exploration and analysis

## Context
Users want to perform exploratory analysis or audits (e.g., find performance bottlenecks, research implementation approaches) before knowing what tasks to create. Currently there's no kanban workflow for this exploration phase - users must either create tasks upfront or do research outside the system.

This skill bridges the gap between "I have a vague idea" and "I have concrete tasks to work on" by enabling users to leverage the LLM for codebase audits and research questions, then seamlessly convert findings into actionable tasks via the existing kanban workflow.

## Scope

### In Scope
- Conversational exploration via Socratic Q&A
- Codebase analysis (using Glob, Grep, Read tools)
- Web research (using WebSearch, WebFetch tools)
- Presenting findings conversationally (not persisted to files)
- Iterative task creation from findings via Skill tool invocation of `/kanban-create`
- Pre-filling task context when chaining to kanban-create

### Out of Scope
- Persisting exploration findings to files
- Integration with other kanban phases (this is a pre-task discovery phase)
- Creating tasks for findings the user doesn't confirm
- Modifying existing task files

## Functional Requirements

- FR1: The skill shall accept an optional argument containing a full exploration question/topic
- FR2: When invoked without arguments, the skill shall use Socratic Q&A to discover what the user wants to explore
- FR3: When invoked with arguments, the skill shall use the provided question as the starting point and ask clarifying questions to deeply understand the exploration intent
- FR4: The skill shall support codebase exploration using Glob, Grep, and Read tools
- FR5: The skill shall support web research using WebSearch and WebFetch tools
- FR6: The skill shall present findings conversationally without persisting to files
- FR7: After completing exploration, the skill shall present findings and ask if the user wants to create tasks
- FR8: For each finding, the skill shall ask the user if they want to create a task for that finding
- FR9: When the user confirms task creation, the skill shall invoke `/kanban-create` via the Skill tool with pre-filled context (suggested title and description from the finding)
- FR10: After task creation completes (or is skipped), the skill shall proceed to the next finding
- FR11: The skill shall continue iterating through findings until all are processed

## Affected Files
- `.claude/skills/kanban-discover/SKILL.md` (create) - main skill definition following existing skill patterns

## Existing Patterns
- **Skill frontmatter structure:** Follows pattern from `kanban-create` and `kanban-refine`
  - Reference: `.claude/skills/kanban-create/SKILL.md:1-7`
  - Fields: `name`, `description`, `allowed-tools`, `argument-hint`, `disable-model-invocation`

- **Conversational Q&A pattern:** Follows `kanban-refine` pattern for iterative dialogue
  - Reference: `.claude/skills/kanban-refine/SKILL.md:201-251`
  - Pattern: Present understanding, ask questions, adapt to conversation, confirm before proceeding

- **Skill invocation for chaining:** Use Skill tool to invoke `/kanban-create`
  - The Skill tool is a Claude Code built-in for invoking other skills

- **XML-based skill structure:** Uses `<purpose>`, `<context>`, `<prohibited>`, `<process>`, `<success_criteria>`, `<example>`, `<next_steps>` sections

## Technical Constraints
- Must follow existing skill XML/markdown structure patterns
- Must use `allowed-tools` frontmatter to declare required tools
- Skill tool must be included in `allowed-tools` for chaining to `/kanban-create`
- `disable-model-invocation: false` (or omit) to allow skill invocation via Skill tool
- No files created or modified during exploration - purely conversational

## Dependencies

### External
- None - uses standard Claude Code tools

### Internal
- `kanban-create` skill - invoked via Skill tool for task creation
- Claude Code Skill tool - for invoking `/kanban-create`

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Skill tool invocation may not work with `disable-model-invocation: true` on target skill | High | Verify behavior during implementation; kanban-create has this flag set |
| Exploration scope too broad leading to unfocused sessions | Medium | Use Socratic Q&A to narrow focus before exploration begins |
| Pre-filled task context may not match kanban-create expectations | Low | Review kanban-create argument handling; use simple title format |

## Open Questions
- [ ] Verify Skill tool can invoke skills that have `disable-model-invocation: true` (kanban-create has this flag)
- [ ] Determine exact format for pre-filling task context when invoking kanban-create (title only, or additional context?)
