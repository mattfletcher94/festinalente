---
task: "008"
spec: "tasks/008/spec.md"
status: approved
created: 2026-02-18
generated_by: claude
model: claude-opus-4-5-20251101
version: 1
iteration: 1
complexity: simple
---

# Plan: Add kanban-discover skill for exploration and analysis

## Overview

Create a new skill source file at `apps/kanban/src/content/skills/kanban-discover/SKILL.md` that enables exploratory analysis and codebase audits via conversational Socratic Q&A, with optional task creation from findings. The skill follows existing skill patterns (kanban-create, kanban-refine) using Handlebars partials for shared content and XML-based process definition.

This is a markdown skill definition (not TypeScript source code), so the acyclic architecture and Vue integration directives do not apply.

See full specification: tasks/008/spec.md

## Technical Approach

**Pattern being followed:** XML-based skill structure with Handlebars partials
- Frontmatter: `kanban-create/SKILL.md:1-7` - name, description, allowed-tools, argument-hint, disable-model-invocation
- Handlebars partials: `{{> directory-reference}}`, `{{> helper-scripts ...}}` for shared context
- Conversational Q&A: `kanban-refine/SKILL.md:125-175` - iterative dialogue pattern
- Skill invocation for chaining: Use Skill tool to invoke `/kanban-create`

**Key design decisions from spec:**
- `disable-model-invocation: false` (or omit) to allow Skill tool chaining to work
- No files created during exploration - purely conversational output
- Findings presented conversationally, then iteratively offered for task creation
- Pre-fill task context when invoking kanban-create via args parameter

## Implementation Steps

- [ ] Step 1: Create skill directory `apps/kanban/src/content/skills/kanban-discover/` (FR1)
- [ ] Step 2: Write `SKILL.md` frontmatter following kanban-create pattern (FR1)
  - name: kanban-discover
  - description: Explore questions and analyze codebases through Socratic Q&A before creating tasks
  - allowed-tools: Read, Glob, Grep, WebSearch, WebFetch, AskUserQuestion, Skill
  - argument-hint: "[exploration question]"
  - disable-model-invocation: false (or omit - default is false)
- [ ] Step 3: Write `<purpose>` section describing the discovery/exploration workflow (FR2-FR3)
- [ ] Step 4: Write `<context>` section using Handlebars partials (FR4-FR5)
  - `{{> directory-reference}}`
  - Note about exploration types: codebase audit, research, analysis
- [ ] Step 5: Write `<prohibited>` section (FR6)
  - No file persistence during exploration
  - No task creation without user confirmation
  - No skipping the clarification phase
- [ ] Step 6: Write `<process>` with steps (FR1-FR11):
  - get_question: Handle optional argument or prompt for question (FR1-FR3)
  - clarify_intent: Socratic Q&A to understand exploration scope (FR2-FR3)
  - perform_exploration: Use Glob/Grep/Read for codebase, WebSearch/WebFetch for research (FR4-FR5)
  - present_findings: Conversational output of findings (FR6-FR7)
  - offer_task_creation: Ask if user wants tasks from findings (FR7-FR8)
  - iterate_findings: For each finding, offer task creation via Skill tool (FR8-FR11)
- [ ] Step 7: Write `<success_criteria>` section
- [ ] Step 8: Write `<example>` section showing codebase audit flow with task creation
- [ ] Step 9: Write `<next_steps>` section (suggest /kanban-refine for created tasks)
- [ ] Step 10: Verify skill file follows existing patterns and is well-formed

**Verify:** Build kanban package and confirm skill appears in installed skills

## Testing Strategy

- **Automated:** None required (skill definition file, not executable code)
- **Manual:**
  - Invoke `/kanban-discover` without arguments - should prompt for exploration question
  - Invoke `/kanban-discover "audit performance bottlenecks"` - should use as starting point
  - Complete exploration - should present findings conversationally (no files created)
  - Confirm task creation for a finding - should chain to `/kanban-create` with pre-filled title
  - Decline task creation - should skip and proceed to next finding
- **Regression:** Verify existing skills (kanban-create, kanban-refine) still work after build

## Edge Cases

- User provides no question and doesn't respond to prompts - gracefully exit with guidance
- Exploration finds no actionable findings - present summary and explain no tasks suggested
- User wants to create 0 tasks from findings - accept gracefully, complete skill normally
- Skill tool invocation fails for kanban-create - report error and suggest manual `/kanban-create`

## Potential Pitfalls

- `disable-model-invocation` must be `false` (or omitted) for this skill to chain to kanban-create via Skill tool - verify frontmatter setting
- Pre-filled task context format: use simple title string in args parameter matching kanban-create's argument-hint pattern
- Exploration scope too broad leads to unfocused findings - Socratic Q&A should narrow scope before exploration begins
