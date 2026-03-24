---
name: festina-overview
description: Show board overview, current status, visual board, or task details. The main command for understanding current state.
allowed-tools: Read, Glob, Grep, Bash(node *, git log *)
disable-model-invocation: true
---

# Festina Lente Overview

<purpose>
Show the current state of the board or specific tasks. Starts by asking what the user wants to see, then delivers just that. The main entry point for understanding where things are.
</purpose>

<context>
<note>
- **`.claude/skills/festina-*/`** — Installed festina skills — READ ONLY
- **`.festinalente/`** — Project data and config — READ/WRITE
- **`.festinalente/tasks/{id}/`** — Task folder containing `task.xml`, `spec.xml`, `plan.xml`
- **`.festinalente/quick/{id}/`** — Quick task folder containing `quick.xml` (for /festina-quick)
- **`.festinalente/scripts/`** — Helper scripts for festina operations
- **`.festinalente/templates/`** — Document templates
- **`.festinalente/workflow.yaml`** — Workflow config (columns, labels, transitions)
- **`.festinalente/directives/`** — User-defined directives (custom instructions for skills)
</note>

<note>Use these scripts to reliably find files:</note>

<command description="Find task by ID (returns JSON with path and metadata)">node .festinalente/scripts/festinalente.cjs find-task {id}</command>


<command description="Find plan by ID (returns JSON with path)">node .festinalente/scripts/festinalente.cjs find-plan {id}</command>

<command description="List all tasks (returns JSON with count and tasks array)">node .festinalente/scripts/festinalente.cjs list-tasks</command>
<command description="List tasks filtered by status">node .festinalente/scripts/festinalente.cjs list-tasks --status=in-progress</command>
<command description="List tasks excluding a status">node .festinalente/scripts/festinalente.cjs list-tasks --exclude-status=done</command>








<command description="List all projects (returns JSON with count and projects array)">node .festinalente/scripts/festinalente.cjs list-projects</command>
<command description="List projects filtered by status">node .festinalente/scripts/festinalente.cjs list-projects --status=open</command>

<command description="Get all tasks belonging to a project (returns JSON with count and tasks array)">node .festinalente/scripts/festinalente.cjs get-project-tasks {project-id}</command>

<command description="Get task progress counts by status for a project">node .festinalente/scripts/festinalente.cjs get-project-progress {project-id}</command>


<note>Use these scripts to work with product documentation:</note>


<command description="Search product docs by keywords (returns JSON sorted by relevance)">node .festinalente/scripts/festinalente.cjs search-product keyword1 keyword2 ...</command>
<command description="With minimum score threshold">node .festinalente/scripts/festinalente.cjs search-product password reset --min-score=0.3</command>
<note>Score interpretation: ≥0.5 = strong match | 0.3-0.5 = possible match | &lt;0.3 = weak match | No results = likely new feature</note>


<note>Path rule: ID `auth/login` → Path `.festinalente/product/auth/login.md`</note>

<note>Use these scripts to work with engineering documentation:</note>


<command description="Search engineering docs by keywords (returns JSON sorted by relevance)">node .festinalente/scripts/festinalente.cjs search-engineering keyword1 keyword2 ...</command>
<command description="With minimum score threshold">node .festinalente/scripts/festinalente.cjs search-engineering middleware pattern --min-score=0.3</command>
<note>Score interpretation: ≥0.5 = strong match | 0.3-0.5 = possible match | &lt;0.3 = weak match | No results = likely new pattern/system</note>


<note>Path rules:
- `overview` → `.festinalente/engineering/overview.md`
- `systems/auth` → `.festinalente/engineering/systems/auth/_index.md`
- `systems/auth/validator` → `.festinalente/engineering/systems/auth/validator.md`
- `patterns/acyclic-arch` → `.festinalente/engineering/patterns/acyclic-arch.md`
- `conventions/file-naming` → `.festinalente/engineering/conventions/file-naming.md`
</note>
</context>

<prohibited>
- Do not show data before determining the view
- Do not suggest commands inappropriate for a task's current status
- Do not make up information not found in task files
</prohibited>

<process>
  <step name="load_tasks" outputs="tasks">
    <command>node .festinalente/scripts/festinalente.cjs list-tasks</command>
    <action>Read each task file to get id, title, status, labels, priority</action>
    <branch condition="count is 0">
      <output>
No tasks found.

**Create your first task:**
```
/festina-create "Your task title"
```
      </output>
      <output>[FESTINA_COMPLETE]</output>
    </branch>
  </step>

  <step name="load_directives">
    <command>node .festinalente/scripts/festinalente.cjs get-skill-config festina-overview</command>
    <action>Parse the JSON output</action>
    
    <branch condition="directives.length > 0">
      <warning>Directives are MANDATORY. You MUST follow them.</warning>
      <action>For EACH directive where `exists` is `true`:</action>
      <action>Read the directive XML file at `path`</action>
      <action>Parse and apply:</action>
      <action>- `<context>` principles: Maintain as ongoing mindset</action>
      <note>The `keywords` attribute on context principles is metadata for LLM relevance — use keywords to recognize when a principle applies to the current work.</note>
      <action>- `<process>` rules where the phase attribute, split on comma and trimmed, includes "overview" as an exact element (e.g. phase="plan,implement" matches "plan" and "implement" but NOT "plan-review"): Follow as requirements</action>
      <action>- `<override>` sections where the phase attribute, split on comma and trimmed, includes "overview" as an exact element: Apply step replacements</action>
      <action>- `<verification>` commands: Used by festina-plan to populate task &lt;verify&gt; elements and festina-implement to run step checks. Other skills can ignore this section.</action>
    
      <branch condition="directive has <override> section for phase=overview">
        <output>
    **DIRECTIVE OVERRIDE ACTIVE: {directive.name}**
    
    The following skill steps are REPLACED by this directive:
    
    {For each &lt;skip&gt; element:}
    **SKIP STEP: `{step}`** - Do NOT execute this step when you reach it in the skill process.
    
    **REPLACEMENT:** Execute directive rules {override.instead.rules} instead.
    
    **Reason:** {override.reason}
    
    **CRITICAL:** When you encounter any skipped step in the skill's &lt;process&gt;,
    you MUST skip it entirely and follow the directive's replacement rules instead.
        </output>
      </branch>
      <note>`<validation>` checks will run in directive_compliance step</note>
      <note>`<examples>` will be shown if violations are found</note>
      <note>Directives are loaded in config.yaml array order. All matching phase rules from all loaded directives apply additively. Avoid mapping two directives that both override the same phase.</note>
    </branch>
    
    <example_code lang="json">
    {
      "skill": "festina-overview",
      "directives": [
        { "name": "architecture", "path": ".festinalente/directives/architecture.xml", "exists": true }
      ]
    }
    </example_code>
  </step>

  <step name="load_projects" outputs="projects">
    <note>AC-F4: If no projects exist, skip entirely and behave exactly as before.</note>
    <command>node .festinalente/scripts/festinalente.cjs list-projects</command>
    <branch condition="count is 0">
      <action>Skip — no projects exist, proceed without project data (AC-F4)</action>
    </branch>
    <branch condition="projects exist (count > 0)">
      <action>For each project, call: node .festinalente/scripts/festinalente.cjs get-project-progress {project-id}</action>
      <action>Store project list with progress data for display in views</action>
    </branch>
  </step>

  <step name="determine_view">
    <branch condition="$ARGUMENTS provided">
      <action>Parse $ARGUMENTS to determine view (e.g., "board", "visual", task ID, query)</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <action>Set view = "current-status"</action>
      <output>Showing current status (use arguments for other views: "board", "visual", or a task ID).</output>
    </branch>
  </step>

  <!-- ============================================ -->
  <!-- CURRENT STATUS                              -->
  <!-- ============================================ -->

  <step name="show_current_status" when="view is 'current-status'">
    <action>Find tasks in active states: in-progress, finalize</action>
    <action>For in-progress tasks, read plan.xml and count progress</action>

    <branch condition="no active tasks">
      <action>Find highest priority task in planned, scoped, or backlog</action>
      <output>
## Current Status

No tasks in progress.

**Ready to start:**
- {id}: {title} ({status})

**Next:** `/festina-implement {id}`
      </output>
      <output>[FESTINA_COMPLETE]</output>
    </branch>

    <output>
## Current Status

{For each active task, ordered by workflow stage:}
**{id}: {title}**
- Status: {status}
- Progress: {completed}/{total} steps (if in-progress with plan)
- Next: {appropriate command for status}

    </output>

    <branch condition="projects were loaded (count > 0)">
      <note>AC-F3: Show Projects section. Order: in-progress first, then open, then done.</note>
      <output>
## Projects

{For each project, ordered: in-progress first, then open, then done (AC-F3):}
**{project-id}: {project-title}** ({status})
- Progress: {done}/{total} tasks complete
- Tasks: {comma-separated child task IDs}
      </output>
    </branch>

    <output>[FESTINA_COMPLETE]</output>
  </step>

  <!-- ============================================ -->
  <!-- BOARD OVERVIEW                              -->
  <!-- ============================================ -->

  <step name="show_board_overview" when="view is 'board-overview'">
    <action>Group tasks by status</action>
    <action>For in-progress tasks, read plan and count progress</action>
    <note>Order columns by workflow: in-progress, finalize, planned, scoped, backlog, done</note>
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

    <branch condition="projects were loaded (count > 0)">
      <note>AC-F3: Show Projects section. Order: in-progress first, then open, then done.</note>
      <output>
## Projects

{For each project, ordered: in-progress first, then open, then done (AC-F3):}
**{project-id}: {project-title}** ({status})
- Progress: {done}/{total} tasks complete
- Tasks: {comma-separated child task IDs}
      </output>
    </branch>

    <output>[FESTINA_COMPLETE]</output>
  </step>

  <!-- ============================================ -->
  <!-- VISUAL BOARD                                -->
  <!-- ============================================ -->

  <step name="show_visual_board" when="view is 'visual-board'">
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

    <branch condition="projects were loaded (count > 0)">
      <note>AC-F3: Show Projects section below the board. Order: in-progress first, then open, then done.</note>
      <output>
## Projects

{For each project, ordered: in-progress first, then open, then done (AC-F3):}
**{project-id}: {project-title}** ({status}) — {done}/{total} tasks complete
  Tasks: {comma-separated child task IDs}
      </output>
    </branch>

    <output>[FESTINA_COMPLETE]</output>
  </step>

  <!-- ============================================ -->
  <!-- OTHER (free text input)                     -->
  <!-- ============================================ -->

  <step name="handle_other_input" when="view is 'other'">
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
      <output>[FESTINA_COMPLETE]</output>
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
      <output>[FESTINA_COMPLETE]</output>
    </branch>

    <branch condition="input asks about recent activity">
      <output>Recent activity is tracked in task files. Use `/festina-overview` with a task ID to see details.</output>
      <output>[FESTINA_COMPLETE]</output>
    </branch>

    <branch condition="cannot determine intent">
      <output>
I didn't understand "{input}". You can:
- Enter a task ID (e.g. "007")
- Ask about labels (e.g. "show bugs")
- Ask about priority (e.g. "high priority tasks")
      </output>
      <output>[FESTINA_COMPLETE]</output>
    </branch>
  </step>

  <!-- ============================================ -->
  <!-- TASK DETAILS                                -->
  <!-- ============================================ -->

  <step name="show_task_details" when="showing specific task" outputs="taskId">
    <command>node .festinalente/scripts/festinalente.cjs find-task {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>

    <branch condition="task not found">
      <output>Task {taskId} not found.</output>
      <output>[FESTINA_COMPLETE]</output>
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
      <output>**Next:** `/festina-scope {taskId}`</output>
    </branch>
    <branch condition="status is scoped">
      <output>**Next:** `/festina-plan {taskId}`</output>
    </branch>
    <branch condition="status is planned">
      <output>**Next:** `/festina-implement {taskId}`</output>
    </branch>
    <branch condition="status is in-progress">
      <output>**Next:** `/festina-implement {taskId}` (resume)</output>
    </branch>
    <branch condition="status is finalize">
      <output>**Next:** `/festina-finalize {taskId}` or `/festina-rework {taskId}`</output>
    </branch>
    <branch condition="status is awaiting-completion">
      <output>**Next:** `/festina-complete {taskId}`</output>
    </branch>
    <branch condition="status is update-docs">
      <output>**Next:** `/festina-docs {taskId}`</output>
    </branch>
    <branch condition="status is pr">
      <output>**Next:** `/festina-merge {taskId}` or `/festina-rework {taskId}`</output>
    </branch>
    <branch condition="status is done">
      <output>Task complete.</output>
    </branch>

    <step name="directive_compliance">
      <note>Verify compliance with all loaded directives</note>
    
      <action>For each directive loaded in load_directives step:</action>
      <action>Re-read the directive XML file</action>
    
      <action>Run each `<validation>` check:</action>
    
      <branch condition="check type=command">
        <command>{content of <run> element}</command>
        <validate>{content of <expect> element}</validate>
      </branch>
    
      <branch condition="check type=pattern">
        <action>For each file matching `files` glob that was modified:</action>
        <action>Check content against `<forbidden>` regex</action>
      </branch>
    
      <branch condition="check type=checklist">
        <action>Self-assess each `<item>` as Y/N</action>
      </branch>
    
      <branch condition="any check fails">
        <output>Directive violation: {check id} - {reason}</output>
        <action>Find `<example>` elements where ref matches failed check</action>
        <action>Show violation examples to illustrate the problem</action>
        <action>Show correct examples to illustrate the fix</action>
        <action>Use AskUserQuestion tool with:
          - header: "Violation"
          - question: "Directive check failed. How would you like to proceed?"
          - options:
            - label: "Fix now", description: "Address the violation before continuing"
            - label: "Continue anyway", description: "Acknowledge and proceed despite violation"
          - multiSelect: false
        </action>
      </branch>
    </step>

    <output>[FESTINA_COMPLETE]</output>
  </step>
</process>

<success_criteria>
- Defaults to current status when no arguments provided
- Only the determined view is shown
- Task details include next command suggestion
- Free text input is handled flexibly
- Appropriate next commands suggested based on board state
</success_criteria>

<example label="Current Status (default)">
User: `/festina-overview`

```
## Current Status

**007: Add user authentication**
- Status: in-progress
- Progress: 4/8 steps
- Next: `/festina-implement 007`

**005: Fix login redirect**
- Status: check
- Next: `/festina-finalize 005` or `/festina-rework 005`
```
</example>

<example label="Board Overview">
User: `/festina-overview board`

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
User: `/festina-overview visual`

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
User: `/festina-overview 007`

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

**Next:** `/festina-implement 007` (resume)
```
</example>

<example label="Other - Label Query">
User: `/festina-overview show bugs`

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

<next_steps>
Start a new task:
```
/festina-create
```

Work on a task (based on board state):
```
/festina-scope {id}
/festina-plan {id}
/festina-implement {id}
/festina-finalize {id}
```
</next_steps>
