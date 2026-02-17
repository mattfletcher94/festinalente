---
name: kanban-view
description: Visualize the Kanban board in the terminal with box-drawing characters
allowed-tools: Read, Glob, Grep, AskUserQuestion
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Kanban Board View

<purpose>
Display the Kanban board as a visual terminal output with box-drawing characters.
</purpose>

<context>
{{> helper-scripts show_list_tasks=true show_find_task=true show_find_plan=true}}
</context>

<prohibited>
- Do not render without asking for view preset first
- Do not show stale or cached data — always read fresh from files
</prohibited>

<process>
  <step name="check_kanban_exists">
    <validate>Check if `.kanban/tasks/` directory exists</validate>
    <branch condition="directory doesn't exist">
      <output>No Kanban board found. Run `npx claude-kanban` to install.</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="ask_view_preset" outputs="preset">
    <action>Use AskUserQuestion tool with:
      - header: "View type"
      - question: "Which view would you like?"
      - options:
        - label: "Quick (Recommended)", description: "Hide empty columns, Done as count only"
        - label: "Full", description: "Show all 10 columns, all tasks"
        - label: "Custom", description: "Choose your own display settings"
      - multiSelect: false
    </action>
  </step>

  <step name="ask_custom_settings" when="Custom selected">
    <action>Use AskUserQuestion tool with:
      - header: "Empty cols"
      - question: "Show empty columns?"
      - options:
        - label: "Yes", description: "Show all 10 columns even if empty"
        - label: "No", description: "Only show columns with tasks"
      - multiSelect: false
    </action>
    <action>Use AskUserQuestion tool with:
      - header: "Done tasks"
      - question: "How to display Done tasks?"
      - options:
        - label: "Count only", description: "Just show 'Done (N tasks)'"
        - label: "Recent 3", description: "Show count plus last 3 completed"
        - label: "All", description: "Show every completed task"
      - multiSelect: false
    </action>
  </step>

  <step name="read_all_tasks" outputs="tasks">
    <command>node .kanban/scripts/list-tasks.cjs</command>
    <note>The JSON output includes `id`, `title`, `status`, `labels` for each task</note>
    <action>Group tasks by `status`</action>
  </step>

  <step name="get_plan_progress" when="tasks have status `planned`, `in-progress`, `verify`, or `review`">
    <note>For tasks with status `planned`, `in-progress`, `verify`, or `review`:</note>
    <action>Read `.kanban/tasks/{id}/plan.md` if it exists</action>
    <action>Count checkboxes: `- [ ]` (incomplete) and `- [x]` (complete)</action>
    <action>Calculate progress as `{complete}/{total}`</action>
  </step>

  <step name="render_board">
    <note>Use this column order (workflow order):
1. `backlog` → "BACKLOG"
2. `refined` → "REFINED"
3. `scoped` → "SCOPED"
4. `planned` → "PLANNED"
5. `in-progress` → "IN PROGRESS"
6. `verify` → "VERIFY"
7. `review` → "REVIEW"
8. `update-docs` → "UPDATE DOCS"
9. `awaiting-merge` → "AWAITING MERGE"
10. `done` → "DONE"</note>

    <note>Box format:
```
┌─ {COLUMN NAME} ({count}) ─────────────┐
│ {id}: {title} [{label}] {progress}    │
│ {id}: {title} [{label}]               │
└───────────────────────────────────────┘
```</note>

    <note>Rendering rules:
- Box width: 45 characters (adjust based on longest task line, min 40, max 60)
- Truncate titles with `...` if task line exceeds box width minus padding
- Show label only if task has one (first label if multiple)
- Show progress only if plan exists
- Use consistent box width for all columns</note>

    <branch condition="Quick preset">
      <action>Skip columns with zero tasks</action>
      <action>For Done column, show: `Done (N tasks)` without a box</action>
    </branch>

    <branch condition="Full preset">
      <action>Show all columns, even empty ones: `┌─ VERIFY (0) ─┐ └──────────────┘`</action>
      <action>Show all Done tasks in box</action>
    </branch>
  </step>

  <step name="output_result">
    <branch condition="no tasks">
      <output>
No tasks on the board.

**Next:**
/kanban-create "Your first task"
      </output>
    </branch>

    <branch condition="Done count only (Quick preset)">
      <output>Done (5 tasks)</output>
    </branch>

    <branch condition="Done recent 3 (Custom)">
      <output>Done (5 tasks) — recent: 005, 004, 003</output>
    </branch>
    {{> skill-complete}}
  </step>
</process>

<success_criteria>
- Asked user for view preset before rendering
- Board shows tasks grouped by status column
- Column order follows workflow (Backlog → Done)
- Tasks show ID, title, label (if present), progress (if has plan)
- Empty columns handled per preset (hidden or shown)
- Done column handled per preset (all, count, or recent)
- Box-drawing characters render correctly
- Next steps shown to user
</success_criteria>

<example>
**Quick View:**

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

**Full View:**

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
</example>

<note>
**Box-Drawing Characters Reference:**
```
┌ ─ ┐   Top-left corner, horizontal, top-right corner
│   │   Vertical sides
└ ─ ┘   Bottom-left corner, horizontal, bottom-right corner
```
</note>

<next_steps>
To see task details:
```
/clear
/kanban-status {id}
```
</next_steps>
