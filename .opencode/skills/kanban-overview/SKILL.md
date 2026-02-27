---
name: kanban-overview
description: Show board overview, current status, visual board, or task details. The main command for understanding current state.
tools:
  read: true
  glob: true
  grep: true
  bash: "git log *"
  question: true
disable-model-invocation: true
---

# Kanban Overview

<purpose>
Show the current state of the board or specific tasks. Starts by asking what the user wants to see, then delivers just that. The main entry point for understanding where things are.
</purpose>

<context>
<note>Use these scripts to reliably find files:</note>

<command description="Find task by ID (returns JSON with path and metadata)">node .kanban/scripts/find-task.cjs {id}</command>


<command description="Find plan by ID (returns JSON with path)">node .kanban/scripts/find-plan.cjs {id}</command>

<command description="List all tasks (returns JSON with count and tasks array)">node .kanban/scripts/list-tasks.cjs</command>
<command description="List tasks filtered by status">node .kanban/scripts/list-tasks.cjs --status=in-progress</command>
<command description="List tasks excluding a status">node .kanban/scripts/list-tasks.cjs --exclude-status=done</command>





</context>

<prohibited>
- Do not show data before asking what the user wants
- Do not suggest commands inappropriate for a task's current status
- Do not make up information not found in task files or git history
</prohibited>

<process>
  <step name="load_tasks" outputs="tasks">
    <command>node .kanban/scripts/list-tasks.cjs</command>
    <action>Read each task file to get id, title, status, labels, priority</action>
    <branch condition="count is 0">
      <output>
No tasks found.

**Create your first task:**
```
/kanban-create "Your task title"
```
      </output>
      ## Final Validation
      
      Before completing, validate all task XML:
      
      <command description="Validate XML in task files">node .kanban/scripts/validate-xml.cjs {taskId}</command>
      
      If validation fails, fix the reported errors before completing.
      
      <output>[KANBAN_COMPLETE]</output>
    </branch>
  </step>

  <step name="ask_what_to_show">
    <action>Use AskUserQuestion tool with:
      - header: "View"
      - question: "What would you like to see?"
      - options:
        - label: "Current status", description: "In-progress tasks and what to do next"
        - label: "Board overview", description: "All tasks grouped by column"
        - label: "Visual board", description: "ASCII box view of the board"
      - multiSelect: false
    </action>
    <note>User can select "Other" to type anything: a task ID, a query like "show bugs", etc.</note>
  </step>

  <!-- ============================================ -->
  <!-- CURRENT STATUS                              -->
  <!-- ============================================ -->

  <step name="show_current_status" when="user selected 'Current status'">
    <action>Find tasks in active states: in-progress, check, update-docs, pr</action>
    <action>For in-progress tasks, read plan.xml and count progress</action>

    <branch condition="no active tasks">
      <action>Find highest priority task in planned, scoped, or backlog</action>
      <output>
## Current Status

No tasks in progress.

**Ready to start:**
- {id}: {title} ({status})

**Next:** `/kanban-implement {id}`
      </output>
      ## Final Validation
      
      Before completing, validate all task XML:
      
      <command description="Validate XML in task files">node .kanban/scripts/validate-xml.cjs {taskId}</command>
      
      If validation fails, fix the reported errors before completing.
      
      <output>[KANBAN_COMPLETE]</output>
    </branch>

    <output>
## Current Status

{For each active task, ordered by workflow stage:}
**{id}: {title}**
- Status: {status}
- Progress: {completed}/{total} steps (if in-progress with plan)
- Next: {appropriate command for status}

    </output>
    ## Final Validation
    
    Before completing, validate all task XML:
    
    <command description="Validate XML in task files">node .kanban/scripts/validate-xml.cjs {taskId}</command>
    
    If validation fails, fix the reported errors before completing.
    
    <output>[KANBAN_COMPLETE]</output>
  </step>

  <!-- ============================================ -->
  <!-- BOARD OVERVIEW                              -->
  <!-- ============================================ -->

  <step name="show_board_overview" when="user selected 'Board overview'">
    <action>Group tasks by status</action>
    <action>For in-progress tasks, read plan and count progress</action>
    <note>Order columns by workflow: in-progress, check, update-docs, pr, planned, scoped, backlog, done</note>
    <note>Only show columns that have tasks</note>

    <output>
## Board Overview

**In Progress ({count})**
- {id}: {title} — {completed}/{total} steps

**Check ({count})**
- {id}: {title}

**Update Docs ({count})**
- {id}: {title}

**PR ({count})**
- {id}: {title}

**Planned ({count})**
- {id}: {title}

**Scoped ({count})**
- {id}: {title}

**Backlog ({count})**
- {id}: {title}

**Done ({count})**
- {id}: {title}
    </output>
    ## Final Validation
    
    Before completing, validate all task XML:
    
    <command description="Validate XML in task files">node .kanban/scripts/validate-xml.cjs {taskId}</command>
    
    If validation fails, fix the reported errors before completing.
    
    <output>[KANBAN_COMPLETE]</output>
  </step>

  <!-- ============================================ -->
  <!-- VISUAL BOARD                                -->
  <!-- ============================================ -->

  <step name="show_visual_board" when="user selected 'Visual board'">
    <action>Group tasks by status</action>

    <note>Column order (workflow order):
1. `backlog` → "BACKLOG"
2. `scoped` → "SCOPED"
3. `planned` → "PLANNED"
4. `in-progress` → "IN PROGRESS"
5. `check` → "CHECK"
6. `update-docs` → "UPDATE DOCS"
7. `pr` → "PR"
8. `done` → "DONE"</note>

    <note>Box format:
```
┌─ {COLUMN NAME} ({count}) ─────────────┐
│ {id}: {title} [{label}]               │
└───────────────────────────────────────┘
```</note>

    <note>Rendering rules:
- Box width: 45 characters (adjust based on longest task line, min 40, max 60)
- Truncate titles with `...` if task line exceeds box width minus padding
- Show label only if task has one (first label if multiple)
- Skip columns with zero tasks
- For Done column: show `Done (N tasks)` without a box
- Use consistent box width for all columns</note>

    <output>
{Rendered visual board with ASCII boxes}

Done ({count} tasks)
    </output>
    ## Final Validation
    
    Before completing, validate all task XML:
    
    <command description="Validate XML in task files">node .kanban/scripts/validate-xml.cjs {taskId}</command>
    
    If validation fails, fix the reported errors before completing.
    
    <output>[KANBAN_COMPLETE]</output>
  </step>

  <!-- ============================================ -->
  <!-- OTHER (free text input)                     -->
  <!-- ============================================ -->

  <step name="handle_other_input" when="user selected 'Other'">
    <action>Parse user input to determine intent</action>

    <branch condition="input looks like a task ID (e.g. '007', '12', 'task 5')">
      <action>Extract task ID and proceed to show_task_details</action>
    </branch>

    <branch condition="input mentions a label (e.g. 'show bugs', 'feature tasks')">
      <action>Filter tasks by that label</action>
      <output>
## Tasks labeled "{label}"

{For each matching task:}
- **{id}**: {title}
  - Status: {status}
  - Priority: {priority}

**Total:** {count} tasks
      </output>
      ## Final Validation
      
      Before completing, validate all task XML:
      
      <command description="Validate XML in task files">node .kanban/scripts/validate-xml.cjs {taskId}</command>
      
      If validation fails, fix the reported errors before completing.
      
      <output>[KANBAN_COMPLETE]</output>
    </branch>

    <branch condition="input mentions priority (e.g. 'high priority', 'urgent')">
      <action>Filter tasks by priority</action>
      <output>
## {priority} Priority Tasks

{For each matching task:}
- **{id}**: {title}
  - Status: {status}
  - Labels: {labels}

**Total:** {count} tasks
      </output>
      ## Final Validation
      
      Before completing, validate all task XML:
      
      <command description="Validate XML in task files">node .kanban/scripts/validate-xml.cjs {taskId}</command>
      
      If validation fails, fix the reported errors before completing.
      
      <output>[KANBAN_COMPLETE]</output>
    </branch>

    <branch condition="input asks about git history">
      <command>git log --oneline --all -20</command>
      <output>
## Recent Git Activity

| Commit | Message |
|--------|---------|
{For each commit: | {hash} | {message} |}
      </output>
      ## Final Validation
      
      Before completing, validate all task XML:
      
      <command description="Validate XML in task files">node .kanban/scripts/validate-xml.cjs {taskId}</command>
      
      If validation fails, fix the reported errors before completing.
      
      <output>[KANBAN_COMPLETE]</output>
    </branch>

    <branch condition="cannot determine intent">
      <output>
I didn't understand "{input}". You can:
- Enter a task ID (e.g. "007")
- Ask about labels (e.g. "show bugs")
- Ask about priority (e.g. "high priority tasks")
      </output>
      ## Final Validation
      
      Before completing, validate all task XML:
      
      <command description="Validate XML in task files">node .kanban/scripts/validate-xml.cjs {taskId}</command>
      
      If validation fails, fix the reported errors before completing.
      
      <output>[KANBAN_COMPLETE]</output>
    </branch>
  </step>

  <!-- ============================================ -->
  <!-- TASK DETAILS                                -->
  <!-- ============================================ -->

  <step name="show_task_details" when="showing specific task" outputs="taskId">
    <command>node .kanban/scripts/find-task.cjs {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>

    <branch condition="task not found">
      <output>Task {taskId} not found.</output>
      ## Final Validation
      
      Before completing, validate all task XML:
      
      <command description="Validate XML in task files">node .kanban/scripts/validate-xml.cjs {taskId}</command>
      
      If validation fails, fix the reported errors before completing.
      
      <output>[KANBAN_COMPLETE]</output>
    </branch>

    <action>Extract title, status, labels, priority from task XML</action>
    <action>Read plan.xml if exists, count checkboxes</action>
    <action>Check for WIP Notes and Iterations sections</action>

    <output>
## Task {taskId}: {title}

**Status:** {status}
**Labels:** {labels}
**Priority:** {priority}

{If plan exists:}
**Progress:** {completed}/{total} steps complete

**Remaining steps:**
{List unchecked items}

{If WIP Notes exist:}
**WIP Notes:**
{notes}

{If Iterations exist:}
**Previous attempt failed:** {last failure summary}

    </output>

    <action>Suggest next command based on status:</action>
    <branch condition="status is backlog">
      <output>**Next:** `/kanban-scope {taskId}`</output>
    </branch>
    <branch condition="status is scoped">
      <output>**Next:** `/kanban-plan {taskId}`</output>
    </branch>
    <branch condition="status is planned">
      <output>**Next:** `/kanban-implement {taskId}`</output>
    </branch>
    <branch condition="status is in-progress">
      <output>**Next:** `/kanban-implement {taskId}` (resume)</output>
    </branch>
    <branch condition="status is check">
      <output>**Next:** `/kanban-check {taskId}` or `/kanban-rework {taskId}`</output>
    </branch>
    <branch condition="status is update-docs">
      <output>**Next:** `/kanban-docs {taskId}`</output>
    </branch>
    <branch condition="status is pr">
      <output>**Next:** `/kanban-merge {taskId}` or `/kanban-rework {taskId}`</output>
    </branch>
    <branch condition="status is done">
      <output>Task complete.</output>
    </branch>

    ## Final Validation
    
    Before completing, validate all task XML:
    
    <command description="Validate XML in task files">node .kanban/scripts/validate-xml.cjs {taskId}</command>
    
    If validation fails, fix the reported errors before completing.
    
    <output>[KANBAN_COMPLETE]</output>
  </step>
</process>

<success_criteria>
- User is asked what they want to see first
- Only the requested view is shown
- Task details include next command suggestion
- Free text input is handled flexibly
</success_criteria>

<example label="Current Status">
User: `/kanban-overview`
> Current status

```
## Current Status

**007: Add user authentication**
- Status: in-progress
- Progress: 4/8 steps
- Next: `/kanban-implement 007`

**005: Fix login redirect**
- Status: check
- Next: `/kanban-check 005` or `/kanban-rework 005`
```
</example>

<example label="Board Overview">
User: `/kanban-overview`
> Board overview

```
## Board Overview

**In Progress (1)**
- 007: Add user authentication — 4/8 steps

**Check (1)**
- 005: Fix login redirect

**Planned (2)**
- 008: Add password reset
- 009: Email notifications

**Backlog (3)**
- 010: Dark mode support
- 011: Performance improvements
- 012: Mobile responsive

**Done (2)**
- 001: Initial setup
- 002: Basic routing
```
</example>

<example label="Visual Board">
User: `/kanban-overview`
> Visual board

```
┌─ IN PROGRESS (1) ─────────────────────┐
│ 007: Add user authentication [feature]│
└───────────────────────────────────────┘
┌─ CHECK (1) ───────────────────────────┐
│ 005: Fix login redirect [bug]         │
└───────────────────────────────────────┘
┌─ PLANNED (2) ─────────────────────────┐
│ 008: Add password reset               │
│ 009: Email notifications              │
└───────────────────────────────────────┘
┌─ BACKLOG (3) ─────────────────────────┐
│ 010: Dark mode support                │
│ 011: Performance improvements         │
│ 012: Mobile responsive                │
└───────────────────────────────────────┘

Done (2 tasks)
```
</example>

<example label="Other - Task ID">
User: `/kanban-overview`
> Other: 007

```
## Task 007: Add user authentication

**Status:** in-progress
**Labels:** [feature]
**Priority:** high

**Progress:** 4/8 steps complete

**Remaining steps:**
- [ ] Add session management
- [ ] Add logout endpoint
- [ ] Add password hashing
- [ ] Write tests

**Next:** `/kanban-implement 007` (resume)
```
</example>

<example label="Other - Label Query">
User: `/kanban-overview`
> Other: show bugs

```
## Tasks labeled "bug"

- **005**: Fix login redirect
  - Status: check
  - Priority: high

- **003**: Memory leak in dashboard
  - Status: backlog
  - Priority: medium

**Total:** 2 tasks
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
