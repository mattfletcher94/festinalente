# Plan: Improving UI/UX Design Quality in the Kanban Meta-Prompting System

## Status: Ready for Implementation

---

## Problem Statement

The kanban meta-prompting system produces well-structured code but "amateurish" UI/UX output.

**Key insight:** "If Claude can code like a senior engineer, why can't it design like a senior designer?"

**Root cause:** The skills teach Claude to think like a senior *engineer* but not a senior *designer*.

---

## Solution

**Add design thinking context to 3 existing skills.**

No new tools, no complex workflows - just teaching Claude to think like a senior designer within the existing skill structure.

---

## How a Senior Designer Works

A senior designer doesn't interrogate the client. They:
1. **Infer** most decisions from context
2. **Propose** solutions with reasoning
3. **Only ask** when there's genuine ambiguity

**Bad:** "What emotional quality should this convey?"
**Good:** "I'd place delete in a dropdown - it's destructive and rarely needed. Sound right?"

---

## File Locations

All source files are in the kanban package:

| Skill | Source Path |
|-------|-------------|
| kanban-scope | `apps/kanban/src/content/skills/kanban-scope/SKILL.md` |
| kanban-plan | `apps/kanban/src/content/skills/kanban-plan/SKILL.md` |
| kanban-implement | `apps/kanban/src/content/skills/kanban-implement/SKILL.md` |

**Note:** Changes must be made to source files in `apps/kanban/src/`, NOT the built/installed files in `.claude/skills/`.

---

## Changes

### 1. `kanban-scope` - Add design thinking to research phase

**File:** `apps/kanban/src/content/skills/kanban-scope/SKILL.md`

**Location:** Add a new `<substep>` inside the `<step name="structured_research">` section, after line 133 (after `</substep>` of `research_pitfalls`) and before line 134 (`</step>`).

**Add this substep:**

```xml
    <substep name="research_ui_patterns" condition="task affects user-facing output">
      <note>When the task affects UI/UX, explore existing visual patterns.</note>
      <action>Use Glob to find existing components in affected areas</action>
      <action>Read key UI files to understand existing patterns:
        - Spacing and layout conventions
        - Color usage and theming approach
        - Typography patterns
        - Component structure and composition
        - State handling (loading, error, empty states)</action>
      <action>Note any design tokens, CSS variables, or style conventions used</action>
      <output_variable>uiPatternFindings: list of {pattern, reference, notes}</output_variable>
    </substep>
```

**Location:** Add design thinking guidance to the `<step name="conduct_qa_dialogue">` section, after the existing `<note>` about "This is a **conversational session**" (around line 177).

**Add this note:**

```xml
    <note>**Design Thinking (for UI tasks):**
When the task affects user-facing output, think like a senior designer:
- INFER user needs and context from the task description and acceptance criteria
- INFER information hierarchy (what users should notice first, second, third)
- IDENTIFY states to handle (empty, loading, error, success) without asking
- EXPLORE existing UI patterns in the codebase before proposing new ones
- PROPOSE solutions with reasoning: "I'd place X here because Y. Does that work?"
- Only ASK when there's genuine ambiguity the context doesn't resolve
Do NOT interrogate the user with generic UX questions.</note>
```

---

### 2. `kanban-plan` - Add design considerations to planning

**File:** `apps/kanban/src/content/skills/kanban-plan/SKILL.md`

**Location:** Add to the `<step name="derive_plan_sections">` section, after the existing `<action name="pitfalls">` (around line 224).

**Add this action:**

```xml
    <action name="ui_considerations" condition="task affects user-facing output">
      <note>For UI tasks, ensure the plan addresses:</note>
      - **States:** Identify which states need handling (empty, loading, error, success, partial)
        - Only include states relevant to this specific feature
        - Each state should have a task or be noted in an existing task
      - **Information hierarchy:** What should users notice first? Second? Third?
        - Primary actions should be visually prominent
        - Secondary elements should support, not compete
      - **Consistency:** Note which existing components/patterns to reuse
        - Reference specific files where patterns exist
        - Flag if new patterns are being introduced
      - **Edge cases:** Consider UI-specific edge cases
        - Overflow/truncation for long content
        - Responsive behavior if relevant
        - Accessibility considerations
    </action>
```

**Location:** Line 371 in `<step name="create_plan_file">` - add to the existing task creation guidelines note.

**Change this:**
```xml
6. SELF-CONTAINED: `<action>` has enough detail to implement without re-reading spec</note>
```

**To this:**
```xml
6. SELF-CONTAINED: `<action>` has enough detail to implement without re-reading spec
7. UI-AWARE: For UI tasks, include state handling and note which existing visual patterns to follow</note>
```

---

### 3. `kanban-implement` - Add design principles context

**File:** `apps/kanban/src/content/skills/kanban-implement/SKILL.md`

**Location:** Add a new `<step>` after `<step name="load_directives">` (around line 159).

**Add this step:**

```xml
  <step name="apply_design_thinking" condition="task affects user-facing output">
    <note>**Design Principles for UI Implementation:**</note>

    <note>**HIERARCHY** - Visual weight must match importance
- Primary actions should be obvious and easy to find
- Secondary elements should support, not compete for attention
- Use size, color, contrast, and position to communicate importance</note>

    <note>**CONSISTENCY** - Match existing patterns
- Reuse existing components before creating new ones
- Match spacing, colors, typography from existing UI
- If introducing new patterns, ensure they complement existing ones
- Check for design tokens or CSS variables to use</note>

    <note>**STATES** - Every state is a design opportunity
- Empty states: Guide users on what to do next
- Loading states: Indicate progress when possible
- Error states: Help users understand and recover
- Success states: Confirm the action completed</note>

    <note>**AVOID DEFAULTS** - Don't fall back to generic patterns
- Check project conventions before using common patterns
- Don't hardcode colors/spacing - use existing variables
- Consider the specific context, not just "what's common"</note>

    <note>**PROPOSE, DON'T ASSUME** - When uncertain about design choices
- State your reasoning: "I'd do X because Y"
- Ask for confirmation on significant visual decisions
- But don't ask obvious questions the context already answers</note>
  </step>
```

---

## Summary of Changes

| File | Location | Change |
|------|----------|--------|
| `apps/kanban/src/content/skills/kanban-scope/SKILL.md` | After line 133 (end of `research_pitfalls`) | Add `research_ui_patterns` substep |
| `apps/kanban/src/content/skills/kanban-scope/SKILL.md` | After line 177 (in `conduct_qa_dialogue` step) | Add design thinking note |
| `apps/kanban/src/content/skills/kanban-plan/SKILL.md` | After line 212 (`pitfalls` action) | Add `ui_considerations` action |
| `apps/kanban/src/content/skills/kanban-plan/SKILL.md` | Line 371 (add item 7 to guidelines) | Add UI-aware guideline |
| `apps/kanban/src/content/skills/kanban-implement/SKILL.md` | After line 158 (`load_directives` step) | Add `apply_design_thinking` step |

---

## Verification

After making changes to source files:

1. Build the kanban package:
   ```bash
   cd apps/kanban && pnpm build
   ```
   This compiles `src/content/skills/` → `dist/skills/`

---

## What This Achieves

1. **Senior Designer Mindset** - Claude infers and proposes, doesn't interrogate
2. **Universal** - Only activates when task affects user-facing output
3. **State Awareness** - Plans explicitly consider empty, loading, error, success states
4. **Consistency Focus** - Emphasizes matching existing patterns in the codebase
5. **Proposal-Based** - "I'd do X because Y. Sound right?"

---

## References

- [Anthropic: Improving Frontend Design Through Skills](https://claude.com/blog/improving-frontend-design-through-skills)
- [Anthropic Official frontend-design Skill](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md)
- [Interface Design Skill](https://github.com/Dammyjay93/interface-design)
- [UI UX Pro Max Skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
- [claude-designer-skill](https://github.com/joeseesun/claude-designer-skill)
