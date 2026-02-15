---
name: kanban-view
description: Visualize the Kanban board in the terminal with box-drawing characters
allowed-tools: Read, Glob, Grep
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Kanban Board View

Display the Kanban board as a visual terminal output.

{{> helper-scripts show_list_tasks=true show_find_task=true show_find_plan=true}}

## Steps

### 1. Check for `.kanban/` directory

- If `.kanban/tasks/` doesn't exist, output error:
  ```
  No Kanban board found. Run `/kanban-init` to initialize.
  ```

### 2. Ask user for view preset

Ask the user:

**"Which view?"**
- **Quick** — Hide empty columns, Done as count only (recommended for daily use)
- **Full** — Show all 10 columns, all tasks
- **Custom** — Choose your own settings

### 3. If Custom selected, ask follow-up questions

**"Show empty columns?"**
- Yes — Show all 10 columns even if empty
- No — Only show columns with tasks

**"How to display Done tasks?"**
- All — Show every completed task
- Count only — Just show `Done (N tasks)`
- Recent 3 — Show count plus last 3 completed

### 4. Read all task files

- Run `node .claude/scripts/list-tasks.cjs` to get all tasks with metadata
- The JSON output includes `id`, `title`, `status`, `labels` for each task
- Group tasks by `status`

### 5. For tasks with plans, get progress

For tasks with status `planned`, `in-progress`, `verify`, or `review`:
- Read `.kanban/plans/{id}-{slug}.plan.md` if it exists
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
9. `awaiting-merge` → "AWAITING MERGE"
10. `done` → "DONE"

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
/kanban-create "Your first task"
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
┌─ AWAITING MERGE (0) ──────────────────┐
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

{{> validation-intro}}

- [ ] Asked user for view preset before rendering
- [ ] Board shows tasks grouped by status column
- [ ] Column order follows workflow (Backlog → Done)
- [ ] Tasks show ID, title, label (if present), progress (if has plan)
- [ ] Empty columns handled per preset (hidden or shown)
- [ ] Done column handled per preset (all, count, or recent)
- [ ] Box-drawing characters render correctly
