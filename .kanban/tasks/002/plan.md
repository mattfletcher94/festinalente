---
task: "002"
spec: "tasks/002/spec.md"
status: approved
created: 2026-02-17
generated_by: claude
model: claude-opus-4-5-20251101
version: 1
iteration: 1
complexity: complex
---

# Plan: Inconsistent keyboard navigation for Q&A prompts in kanban skills

## Overview

Convert all `<prompt>` tags with predefined options to explicit `AskUserQuestion` tool instructions across 19 kanban skill files. Each skill that presents options will include XML instructions specifying the exact `AskUserQuestion` parameters (header, question, options with labels and descriptions). The `allowed-tools` frontmatter will be updated to include `AskUserQuestion` where needed.

See full specification: tasks/002/spec.md

## Technical Approach

**Why this approach:** Claude Code interprets `<prompt>Which option?</prompt>` as "output text and wait for typed input" rather than presenting navigable options. The fix is to add explicit `<action>Use AskUserQuestion tool...</action>` instructions within the skill XML that specify exactly how to structure the tool call.

**Pattern to follow:** Based on the `AskUserQuestion` tool schema from Claude Code:
- `questions` array with 1-4 questions
- Each question has: `question` (full text), `header` (≤12 chars), `options` (2-4 items), `multiSelect` (boolean)
- Each option has: `label` (1-5 words) and `description`
- Recommended option: add "(Recommended)" suffix, place first in list
- "Other" option is automatic - don't include manually

**No architecture constraints apply:** These are Markdown instruction files, not TypeScript code. The planning/architecture/vue-integration directives are not applicable to this task.

## Implementation Steps

### Phase 1: Yes/No Confirmation Prompts (8 skills)

#### Step 1.1: kanban-scope - Yes/No prompts
**Files:** `apps/kanban/src/content/skills/kanban-scope/SKILL.md`
**Requirements:** FR1, FR2, FR5

- [x] Add `AskUserQuestion` to `allowed-tools` frontmatter
- [x] Convert "Continue anyway? (y/n)" to AskUserQuestion instruction with Yes/No options
- [x] Convert "Proceed anyway? (Y/N)" to AskUserQuestion instruction with Yes/No options

**Verify:** Skill file has updated frontmatter and explicit AskUserQuestion instructions

#### Step 1.2: kanban-refine - Yes/No prompt
**Files:** `apps/kanban/src/content/skills/kanban-refine/SKILL.md`
**Requirements:** FR1, FR2, FR5

- [x] Add `AskUserQuestion` to `allowed-tools` frontmatter
- [x] Convert "Refine anyway? (y/n)" to AskUserQuestion instruction

**Verify:** Skill file has updated frontmatter and explicit AskUserQuestion instructions

#### Step 1.3: kanban-plan - Yes/No and Overwrite prompts
**Files:** `apps/kanban/src/content/skills/kanban-plan/SKILL.md`
**Requirements:** FR1, FR2, FR5

- [x] Add `AskUserQuestion` to `allowed-tools` frontmatter
- [x] Convert "Continue anyway? (y/n)" to AskUserQuestion instruction
- [x] Convert "Overwrite or view existing?" to AskUserQuestion instruction with two options

**Verify:** Skill file has updated frontmatter and explicit AskUserQuestion instructions

#### Step 1.4: kanban-codecheck - Yes/No prompts
**Files:** `apps/kanban/src/content/skills/kanban-codecheck/SKILL.md`
**Requirements:** FR1, FR2, FR5

- [x] Add `AskUserQuestion` to `allowed-tools` frontmatter
- [x] Convert "Continue anyway? (y/n)" to AskUserQuestion instruction
- [x] Convert "Run checks anyway? (y/n)" to AskUserQuestion instruction

**Verify:** Skill file has updated frontmatter and explicit AskUserQuestion instructions

#### Step 1.5: kanban-rework - Yes/No prompt
**Files:** `apps/kanban/src/content/skills/kanban-rework/SKILL.md`
**Requirements:** FR1, FR2, FR5

- [x] Add `AskUserQuestion` to `allowed-tools` frontmatter
- [x] Convert "Continue anyway? (y/n)" to AskUserQuestion instruction

**Verify:** Skill file has updated frontmatter and explicit AskUserQuestion instructions

#### Step 1.6: kanban-approve - Yes/No prompts
**Files:** `apps/kanban/src/content/skills/kanban-approve/SKILL.md`
**Requirements:** FR1, FR2, FR5

- [x] Add `AskUserQuestion` to `allowed-tools` frontmatter
- [x] Convert "[Y/n]" prompts to AskUserQuestion instruction
- [x] Convert "Proceed anyway?" to AskUserQuestion instruction

**Verify:** Skill file has updated frontmatter and explicit AskUserQuestion instructions

#### Step 1.7: kanban-docs - Yes/No prompts
**Files:** `apps/kanban/src/content/skills/kanban-docs/SKILL.md`
**Requirements:** FR1, FR2, FR5

- [x] Add `AskUserQuestion` to `allowed-tools` frontmatter
- [x] Convert "[Y/n]" prompts to AskUserQuestion instruction

**Verify:** Skill file has updated frontmatter and explicit AskUserQuestion instructions

#### Step 1.8: kanban-merge - Yes/No prompt
**Files:** `apps/kanban/src/content/skills/kanban-merge/SKILL.md`
**Requirements:** FR1, FR2, FR5

- [x] Add `AskUserQuestion` to `allowed-tools` frontmatter
- [x] Convert "[Y/n]" prompt to AskUserQuestion instruction

**Verify:** Skill file has updated frontmatter and explicit AskUserQuestion instructions

### Phase 2: Multi-Choice Prompts (2 skills)

#### Step 2.1: kanban-view - View preset and custom settings
**Files:** `apps/kanban/src/content/skills/kanban-view/SKILL.md`
**Requirements:** FR1, FR3, FR5

- [x] Add `AskUserQuestion` to `allowed-tools` frontmatter
- [x] Convert "Which view?" (Quick/Full/Custom) to AskUserQuestion instruction with 3 options
- [x] Convert "Show empty columns?" to AskUserQuestion instruction with Yes/No options
- [x] Convert "How to display Done tasks?" to AskUserQuestion instruction with 3 options

**Verify:** Skill file has updated frontmatter and explicit AskUserQuestion instructions for all prompts

#### Step 2.2: kanban-create - Priority and label selection
**Files:** `apps/kanban/src/content/skills/kanban-create/SKILL.md`
**Requirements:** FR1, FR3, FR4, FR5

- [x] Add `AskUserQuestion` to `allowed-tools` frontmatter
- [x] Convert priority selection to AskUserQuestion instruction with High/Medium/Low options
- [x] Convert label confirmation to AskUserQuestion instruction
- [x] Add instruction for dynamic domain selection from available product areas

**Verify:** Skill file has updated frontmatter and explicit AskUserQuestion instructions

### Phase 3: Task Selection Prompts (10 skills)

#### Step 3.1: kanban-scope - Task selection
**Files:** `apps/kanban/src/content/skills/kanban-scope/SKILL.md`
**Requirements:** FR1, FR4

- [x] Convert "Which task to scope?" to AskUserQuestion instruction with dynamic options populated from task list

**Verify:** Skill includes instruction to dynamically build options from available tasks

#### Step 3.2: kanban-refine - Task selection
**Files:** `apps/kanban/src/content/skills/kanban-refine/SKILL.md`
**Requirements:** FR1, FR4

- [x] Convert "Which task to refine?" to AskUserQuestion instruction with dynamic options

**Verify:** Skill includes instruction to dynamically build options from available tasks

#### Step 3.3: kanban-plan - Task selection
**Files:** `apps/kanban/src/content/skills/kanban-plan/SKILL.md`
**Requirements:** FR1, FR4

- [x] Convert "Which task to plan?" to AskUserQuestion instruction with dynamic options

**Verify:** Skill includes instruction to dynamically build options from available tasks

#### Step 3.4: kanban-implement - Task selection
**Files:** `apps/kanban/src/content/skills/kanban-implement/SKILL.md`
**Requirements:** FR1, FR4, FR5

- [x] Add `AskUserQuestion` to `allowed-tools` frontmatter
- [x] Convert "Which task to implement?" to AskUserQuestion instruction with dynamic options

**Verify:** Skill file has updated frontmatter and explicit AskUserQuestion instructions

#### Step 3.5: kanban-save - Task selection
**Files:** `apps/kanban/src/content/skills/kanban-save/SKILL.md`
**Requirements:** FR1, FR4, FR5

- [x] Add `AskUserQuestion` to `allowed-tools` frontmatter
- [x] Convert "Which task to commit WIP for?" to AskUserQuestion instruction with dynamic options

**Verify:** Skill file has updated frontmatter and explicit AskUserQuestion instructions

#### Step 3.6: kanban-codecheck - Task selection
**Files:** `apps/kanban/src/content/skills/kanban-codecheck/SKILL.md`
**Requirements:** FR1, FR4

- [x] Convert "Which task to check?" to AskUserQuestion instruction with dynamic options

**Verify:** Skill includes instruction to dynamically build options from available tasks

#### Step 3.7: kanban-approve - Task selection
**Files:** `apps/kanban/src/content/skills/kanban-approve/SKILL.md`
**Requirements:** FR1, FR4

- [x] Convert "Which task to approve?" to AskUserQuestion instruction with dynamic options

**Verify:** Skill includes instruction to dynamically build options from available tasks

#### Step 3.8: kanban-rework - Task selection
**Files:** `apps/kanban/src/content/skills/kanban-rework/SKILL.md`
**Requirements:** FR1, FR4

- [x] Convert "Which task needs rework?" to AskUserQuestion instruction with dynamic options

**Verify:** Skill includes instruction to dynamically build options from available tasks

#### Step 3.9: kanban-docs - Task selection
**Files:** `apps/kanban/src/content/skills/kanban-docs/SKILL.md`
**Requirements:** FR1, FR4

- [x] Convert "Which task needs documentation?" to AskUserQuestion instruction with dynamic options

**Verify:** Skill includes instruction to dynamically build options from available tasks

#### Step 3.10: kanban-merge - Task selection
**Files:** `apps/kanban/src/content/skills/kanban-merge/SKILL.md`
**Requirements:** FR1, FR4

- [x] Convert "Which task to merge?" to AskUserQuestion instruction with dynamic options

**Verify:** Skill includes instruction to dynamically build options from available tasks

### Phase 4: Review Conversational Skills (6 skills)

#### Step 4.1: Review conversational Q&A skills
**Files:**
- `apps/kanban/src/content/skills/kanban-map-product/SKILL.md`
- `apps/kanban/src/content/skills/kanban-map-engineering/SKILL.md`
- `apps/kanban/src/content/skills/kanban-define-product/SKILL.md`
- `apps/kanban/src/content/skills/kanban-report-task/SKILL.md`
- `apps/kanban/src/content/skills/kanban-report-user/SKILL.md`
- `apps/kanban/src/content/skills/kanban-report-label/SKILL.md`

- [x] Review each skill for any prompts with predefined options
- [x] If prompts are truly open-ended/exploratory, leave as plain text
- [x] If any prompts have predefined options, convert to AskUserQuestion

**Verify:** Each skill reviewed, documentation added if left unchanged explaining why

### Phase 5: Final Verification

#### Step 5.1: Build and test
**Requirements:** All FRs

- [x] Run skill build process to compile updated skills to `.claude/skills/`
- [x] Test at least one skill from each category (Yes/No, Multi-choice, Task selection)
- [x] Verify keyboard navigation appears for all converted prompts
- [x] Verify no regressions in skill functionality

**Verify:** All acceptance criteria from task met

## Testing Strategy

- **Automated:** None required - these are instruction files, no unit tests applicable
- **Manual:**
  - Run `/kanban-view` and verify view preset uses keyboard navigation
  - Run `/kanban-create` and verify priority/label selection uses keyboard navigation
  - Run `/kanban-scope` without ID and verify task selection uses keyboard navigation
  - Run `/kanban-approve` and verify Yes/No confirmation uses keyboard navigation
- **Regression:** Verify skills still complete their workflows correctly after changes

## Edge Cases

- AskUserQuestion has 2-4 option limit — for task selection with >4 tasks, instruction must tell Claude to show most relevant 4 options with "Other" allowing typed input
- Header field limited to 12 chars — use abbreviated headers like "View type", "Priority", "Task"
- Dynamic option building — instruction must specify exactly how to populate options from data source (task list, labels, etc.)

## Potential Pitfalls

- Changing existing `<prompt>` tags may break skill parsing — keep `<prompt>` tag but add sibling `<action>` tag with AskUserQuestion instructions
- Skills without `AskUserQuestion` in allowed-tools will fail — verify frontmatter updated before converting prompts
- Over-converting — some prompts genuinely need free text (e.g., "What is the task title?"), keep these as plain text
