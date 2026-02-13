# Implementation Plan: `kanban:view` Command

## Overview

Add a new command `kanban:view` that displays the Kanban board as a visual terminal output using box-drawing characters. The command asks the user which view preset they want, then renders the board accordingly.

## Files to Create

1. `.claudeban/commands/kanban/view.md` — Command definition
2. `.claudeban/skills/kanban-view/SKILL.md` — Skill implementation

## Output Format

The board renders as vertical boxes grouped by workflow column, using Unicode box-drawing characters:

```
┌─ IN PROGRESS (1) ─────────────────────┐
│ 001: Add dark mode [feature] 3/7      │
└───────────────────────────────────────┘
┌─ REVIEW (1) ──────────────────────────┐
│ 002: Fix login bug [bug]              │
└───────────────────────────────────────┘
┌─ BACKLOG (2) ─────────────────────────┐
│ 003: Add email notifications          │
│ 004: Improve search performance       │
└───────────────────────────────────────┘
```

### Task Line Format

Each task line shows:
- **ID** — Always shown (e.g., `001`)
- **Title** — Always shown, truncated if needed
- **Label** — Shown if present (e.g., `[feature]`, `[bug]`)
- **Progress** — Shown if task has a plan (e.g., `3/7`)

Format: `{id}: {title} [{label}] {progress}`

## User Interaction Flow

1. User runs `/kanban:view`
2. LLM asks: "Which view?"
   - **Quick** — Hide empty columns, show Done as count only
   - **Full** — Show all columns, show all tasks
   - **Custom** — Ask follow-up questions
3. If Custom selected, ask:
   - "Show empty columns?" → Yes / No
   - "How to display Done tasks?" → All / Count only / Recent 3
4. LLM renders the board

## Column Order

Always workflow order (top to bottom):
1. Backlog
2. Refined
3. Scoped
4. Planned
5. In Progress
6. Verify
7. Review
8. Update Docs
9. Done

## Preset Behaviors

| Preset | Empty Columns | Done Column |
|--------|---------------|-------------|
| Quick  | Hide          | Count only: `Done (5 tasks)` |
| Full   | Show all      | Show all tasks |
| Custom | Ask user      | Ask user |

## Edge Cases

- **No tasks exist**: Show message "No tasks on the board" and suggest `/kanban:define-task`
- **No `.kanban/` directory**: Error message suggesting `/kanban:init`
- **Long titles**: Truncate with `...` to fit box width (aim for ~50 char box width)

---

## File 1: `.claudeban/commands/kanban/view.md`

```markdown
---
name: view
description: Visualize the Kanban board in the terminal
allowed-tools: Read, Glob, Grep
---

# Kanban Board View

Display the Kanban board as a visual terminal output with box-drawing characters.

## Usage

`/kanban:view` - Show visual board (asks for view preset)

## Workflow

1. Invoke the **kanban-view** skill
2. Skill asks user for view preset (Quick/Full/Custom)
3. Skill reads task files and renders the board

## Example

`/kanban:view`

Displays the board grouped by column with box borders.
```

---

## File 2: `.claudeban/skills/kanban-view/SKILL.md`

```markdown
---
name: kanban-view
description: Visualize the Kanban board in the terminal with box-drawing characters
allowed-tools: Read, Glob, Grep
---

# Kanban Board View

Display the Kanban board as a visual terminal output.

## Steps

### 1. Check for `.kanban/` directory

- If `.kanban/tasks/` doesn't exist, output error:
  ```
  No Kanban board found. Run `/kanban:init` to initialize.
  ```

### 2. Ask user for view preset

Ask the user:

**"Which view?"**
- **Quick** — Hide empty columns, Done as count only (recommended for daily use)
- **Full** — Show all 9 columns, all tasks
- **Custom** — Choose your own settings

### 3. If Custom selected, ask follow-up questions

**"Show empty columns?"**
- Yes — Show all 9 columns even if empty
- No — Only show columns with tasks

**"How to display Done tasks?"**
- All — Show every completed task
- Count only — Just show `Done (N tasks)`
- Recent 3 — Show count plus last 3 completed

### 4. Read all task files

- Glob for `.kanban/tasks/*.md`
- Parse YAML frontmatter from each: `id`, `title`, `status`, `labels`
- Group tasks by `status`

### 5. For tasks with plans, get progress

For tasks with status `planned`, `in-progress`, `verify`, or `review`:
- Read `.kanban/plans/{id}.plan.md` if it exists
- Count checkboxes: `- [ ]` (incomplete) and `- [x]` (complete)
- Calculate progress as `{complete}/{total}`

### 6. Render the board

Use this column order (workflow order):
1. `backlog` → "BACKLOG"
2. `refined` → "REFINED"
3. `scoped` → "SCOPED"
4. `planned` → "PLANNED"
5. `in-progress` → "IN PROGRESS"
6. `verify` → "VERIFY"
7. `review` → "REVIEW"
8. `update-docs` → "UPDATE DOCS"
9. `done` → "DONE"

**Box format:**
```
┌─ {COLUMN NAME} ({count}) ─────────────┐
│ {id}: {title} [{label}] {progress}    │
│ {id}: {title} [{label}]               │
└───────────────────────────────────────┘
```

**Rendering rules:**
- Box width: 45 characters (adjust based on longest task line, min 40, max 60)
- Truncate titles with `...` if task line exceeds box width minus padding
- Show label only if task has one (first label if multiple)
- Show progress only if plan exists
- Use consistent box width for all columns

**If Quick preset:**
- Skip columns with zero tasks
- For Done column, show: `Done (N tasks)` without a box

**If Full preset:**
- Show all columns, even empty ones: `┌─ VERIFY (0) ─┐ └──────────────┘`
- Show all Done tasks in box

### 7. Handle edge cases

**No tasks:**
```
No tasks on the board.

**Next:**
/kanban:define-task "Your first task"
```

**Done count only (Quick preset):**
```
Done (5 tasks)
```

**Done recent 3 (Custom):**
```
Done (5 tasks) — recent: 005, 004, 003
```

## Output Example: Quick View

```
┌─ IN PROGRESS (1) ─────────────────────┐
│ 001: Add dark mode support [feature]  │
│      3/7                              │
└───────────────────────────────────────┘
┌─ BACKLOG (2) ─────────────────────────┐
│ 003: Add email notifications          │
│ 004: Improve search performance       │
└───────────────────────────────────────┘

Done (2 tasks)
```

## Output Example: Full View

```
┌─ BACKLOG (2) ─────────────────────────┐
│ 003: Add email notifications          │
│ 004: Improve search performance       │
└───────────────────────────────────────┘
┌─ REFINED (0) ─────────────────────────┐
│                                       │
└───────────────────────────────────────┘
┌─ SCOPED (0) ──────────────────────────┐
│                                       │
└───────────────────────────────────────┘
┌─ PLANNED (0) ─────────────────────────┐
│                                       │
└───────────────────────────────────────┘
┌─ IN PROGRESS (1) ─────────────────────┐
│ 001: Add dark mode support [feature]  │
│      3/7                              │
└───────────────────────────────────────┘
┌─ VERIFY (0) ──────────────────────────┐
│                                       │
└───────────────────────────────────────┘
┌─ REVIEW (0) ──────────────────────────┐
│                                       │
└───────────────────────────────────────┘
┌─ UPDATE DOCS (0) ─────────────────────┐
│                                       │
└───────────────────────────────────────┘
┌─ DONE (2) ────────────────────────────┐
│ 000: Initial setup                    │
│ 002: Fix login bug [bug]              │
└───────────────────────────────────────┘
```

## Box-Drawing Characters Reference

```
┌ ─ ┐   Top-left corner, horizontal, top-right corner
│   │   Vertical sides
└ ─ ┘   Bottom-left corner, horizontal, bottom-right corner
```

## Validation

- [ ] Asked user for view preset before rendering
- [ ] Board shows tasks grouped by status column
- [ ] Column order follows workflow (Backlog → Done)
- [ ] Tasks show ID, title, label (if present), progress (if has plan)
- [ ] Empty columns handled per preset (hidden or shown)
- [ ] Done column handled per preset (all, count, or recent)
- [ ] Box-drawing characters render correctly
```

---

## Implementation Checklist

- [ ] Create `.claudeban/commands/kanban/view.md` with command definition
- [ ] Create `.claudeban/skills/kanban-view/SKILL.md` with full skill implementation
- [ ] Test with empty board (no tasks)
- [ ] Test with tasks in various columns
- [ ] Test Quick, Full, and Custom presets
- [ ] Verify box-drawing characters render in terminal
