---
task: "002"
created: 2026-02-17
updated: 2026-02-17
---

# Functional Specification: Inconsistent keyboard navigation for Q&A prompts in kanban skills

## Context

Kanban skill Q&A flows currently have inconsistent user experience. Some prompts present as plain text requiring typed responses, while the Claude Code `AskUserQuestion` tool supports structured options with keyboard navigation (arrow keys to select, Enter to confirm).

The root cause: skill files use `<prompt>` tags with plain text, but don't explicitly instruct Claude to use the `AskUserQuestion` tool with structured options. Claude interprets `<prompt>Which task?</prompt>` as "output this text and wait for typed input" rather than presenting navigable options.

Fixing this provides faster, less error-prone interactions. Users can develop muscle memory and move through workflows efficiently.

## Scope

### In Scope
- All 22 kanban skill SKILL.md files in `apps/kanban/src/content/skills/`
- Converting prompts with predefined options to use explicit `AskUserQuestion` instructions
- Defining a consistent pattern for how skills should instruct Claude to present options

### Out of Scope
- Prompts that genuinely require free-text input (e.g., "What is the task title?")
- Changes to Claude Code itself or the AskUserQuestion tool
- Creating new UI components or custom TUI elements
- Partials/templates (only SKILL.md files)

## Functional Requirements

- FR1: All prompts with predefined options (Yes/No, multiple choice, selection from list) shall include explicit instructions for Claude to use `AskUserQuestion` with structured `questions` array containing `header`, `question`, `options` (with `label` and `description`), and `multiSelect` where appropriate.

- FR2: Yes/No confirmation prompts (currently `[Y/n]`, `(y/n)`) shall be converted to `AskUserQuestion` with two options: "Yes" and "No", with the default/recommended option listed first.

- FR3: Multi-choice prompts (e.g., Quick/Full/Custom view selection) shall be converted to `AskUserQuestion` with 2-4 options, each having a label and description.

- FR4: Task/item selection prompts shall include instructions for Claude to dynamically populate options from the relevant data source (e.g., task list, available labels).

- FR5: The skill's `allowed-tools` frontmatter shall include `AskUserQuestion` for any skill that presents structured prompts.

## Affected Files

### Skills with Yes/No Prompts (modify)
- `apps/kanban/src/content/skills/kanban-scope/SKILL.md` - "Continue anyway? (y/n)", "Proceed anyway? (Y/N)"
- `apps/kanban/src/content/skills/kanban-refine/SKILL.md` - "Refine anyway? (y/n)"
- `apps/kanban/src/content/skills/kanban-plan/SKILL.md` - "Continue anyway? (y/n)", "Overwrite or view existing?"
- `apps/kanban/src/content/skills/kanban-codecheck/SKILL.md` - "Continue anyway? (y/n)", "Run checks anyway? (y/n)"
- `apps/kanban/src/content/skills/kanban-rework/SKILL.md` - "Continue anyway? (y/n)"
- `apps/kanban/src/content/skills/kanban-approve/SKILL.md` - "[Y/n]", "Proceed anyway?"
- `apps/kanban/src/content/skills/kanban-docs/SKILL.md` - "[Y/n]" prompts
- `apps/kanban/src/content/skills/kanban-merge/SKILL.md` - "[Y/n]"

### Skills with Multi-Choice Prompts (modify)
- `apps/kanban/src/content/skills/kanban-view/SKILL.md` - "Which view?" (Quick/Full/Custom), show empty columns, Done display
- `apps/kanban/src/content/skills/kanban-create/SKILL.md` - Priority selection, label confirmation, domain selection

### Skills with Task Selection Prompts (modify)
- `apps/kanban/src/content/skills/kanban-scope/SKILL.md` - "Which task to scope?"
- `apps/kanban/src/content/skills/kanban-refine/SKILL.md` - "Which task to refine?"
- `apps/kanban/src/content/skills/kanban-plan/SKILL.md` - "Which task to plan?"
- `apps/kanban/src/content/skills/kanban-implement/SKILL.md` - "Which task to implement?"
- `apps/kanban/src/content/skills/kanban-save/SKILL.md` - "Which task to commit WIP for?"
- `apps/kanban/src/content/skills/kanban-codecheck/SKILL.md` - "Which task to check?"
- `apps/kanban/src/content/skills/kanban-approve/SKILL.md` - "Which task to approve?"
- `apps/kanban/src/content/skills/kanban-rework/SKILL.md` - "Which task needs rework?"
- `apps/kanban/src/content/skills/kanban-docs/SKILL.md` - "Which task needs documentation?"
- `apps/kanban/src/content/skills/kanban-merge/SKILL.md` - "Which task to merge?"

### Skills with Conversational Q&A (review - may not need changes)
- `apps/kanban/src/content/skills/kanban-map-product/SKILL.md` - Multiple discovery prompts
- `apps/kanban/src/content/skills/kanban-map-engineering/SKILL.md` - Multiple discovery prompts
- `apps/kanban/src/content/skills/kanban-define-product/SKILL.md` - Multiple definition prompts
- `apps/kanban/src/content/skills/kanban-report-task/SKILL.md` - "What would you like to know?"
- `apps/kanban/src/content/skills/kanban-report-user/SKILL.md` - "What would you like to know?"
- `apps/kanban/src/content/skills/kanban-report-label/SKILL.md` - "What would you like to know?"

### Skills with No Prompts (no changes needed)
- `apps/kanban/src/content/skills/kanban-status/SKILL.md` - Display only

## Existing Patterns

- **Pattern:** AskUserQuestion tool schema
  - Reference: Claude Code tool definition
  - Structure: `questions` array with `question`, `header` (max 12 chars), `options` (2-4 items with `label` and `description`), `multiSelect`

- **Pattern:** Recommended option marking
  - Reference: AskUserQuestion usage notes
  - Convention: Add "(Recommended)" suffix to preferred option label, place first in list

- **Pattern:** Current prompt tag usage
  - Reference: `apps/kanban/src/content/skills/kanban-view/SKILL.md:34-47`
  - Shows inline options as markdown list within `<prompt>` tag

## Technical Constraints

- Must use `AskUserQuestion` tool parameters exactly as defined (1-4 questions, 2-4 options per question)
- Header field limited to 12 characters
- Options must have both `label` (1-5 words) and `description` fields
- "Other" option is automatically provided by Claude Code - do not include manually
- Skills must have `AskUserQuestion` in `allowed-tools` frontmatter to use the tool

## Dependencies

### External
- None - relies on existing Claude Code `AskUserQuestion` tool

### Internal
- None - changes are isolated to skill instruction files

## Research Findings

- **Topic:** How Claude Code's AskUserQuestion creates keyboard navigation
- **Finding:** The tool presents options as an interactive selection UI when called with structured `questions` array. Plain text prompts in skills don't trigger this - explicit tool usage instructions are required.
- **Decision:** Add explicit `<action>Use AskUserQuestion tool with...</action>` instructions in skills

- **Topic:** AskUserQuestion schema structure
- **Finding:** Each question needs: `question` (full text), `header` (short label ≤12 chars), `options` (2-4 items with `label` and `description`), `multiSelect` (boolean)
- **Decision:** Define a consistent XML pattern for specifying these in skill files

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Some prompts may be context-dependent and hard to pre-define | Medium | For dynamic prompts (task selection), instruct Claude to build options from data; for truly open-ended prompts, keep as plain text |
| Changes may break existing skill behavior | Medium | Test each modified skill through its workflow before committing |
| AskUserQuestion has 60-second timeout | Low | Document that users can click "Type something else..." to pause timer |

## Open Questions

- [x] Should conversational Q&A skills (map-product, define-product, etc.) also use structured prompts? — Review during implementation; likely keep as conversational since they're exploratory
