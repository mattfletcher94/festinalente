---
name: festina-complete-project
description: Complete a project by verifying all tasks are done and evaluating project-level acceptance criteria. Updates project status and runs directive compliance.
allowed-tools: Read, Write, Bash(node *, git add *, git commit *, git status, git branch *), Grep, Glob
argument-hint: "[project-id]"
disable-model-invocation: true
---

# Complete Festina Lente Project

<purpose>
Complete a project by verifying all child tasks are done, evaluating project-level acceptance criteria against the implemented state, and updating project status. Provides directive hook point for project completion workflows.
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





<command description="Get current date/time (returns JSON with iso and date formats)">node .festinalente/scripts/festinalente.cjs get-date-time</command>

<command description="Get skill configuration (returns JSON with directives)">node .festinalente/scripts/festinalente.cjs get-skill-config {skill}</command>
<example_code lang="json">
{
  "skill": "festina-check",
  "directives": [
    { "name": "code-review", "path": ".festinalente/directives/code-review.xml", "exists": true }
  ]
}
</example_code>




<command description="Find project by ID (returns JSON with path, id, title, status, taskCount)">node .festinalente/scripts/festinalente.cjs find-project {id}</command>

<command description="List all projects (returns JSON with count and projects array)">node .festinalente/scripts/festinalente.cjs list-projects</command>
<command description="List projects filtered by status">node .festinalente/scripts/festinalente.cjs list-projects --status=open</command>

<command description="Get all tasks belonging to a project (returns JSON with count and tasks array)">node .festinalente/scripts/festinalente.cjs get-project-tasks {project-id}</command>

<command description="Get task progress counts by status for a project">node .festinalente/scripts/festinalente.cjs get-project-progress {project-id}</command>


<note>Column transition: open → done</note>
<note>See `.festinalente/workflow.yaml` for column definitions and valid transitions</note>
</context>

<prohibited>
- Do not mark a project as done if any tasks are incomplete (AC-G2)
- Do not skip acceptance criteria evaluation (AC-G3)
- Do not proceed without user confirmation of evaluation results
</prohibited>

<process>
  <step name="load_workflow">
    <action>Read `.festinalente/workflow.yaml` for column definitions, labels, priorities, and transitions</action>
    <note>Use these values throughout this skill</note>
  </step>

  <step name="load_directives">
    <command>node .festinalente/scripts/festinalente.cjs get-skill-config festina-complete-project</command>
    <action>Parse the JSON output</action>
    
    <branch condition="directives.length > 0">
      <warning>Directives are MANDATORY. You MUST follow them.</warning>
      <action>For EACH directive where `exists` is `true`:</action>
      <action>Read the directive XML file at `path`</action>
      <action>Parse and apply:</action>
      <action>- `<context>` principles: Maintain as ongoing mindset</action>
      <action>- `<process>` rules where phase contains "complete-project" (phase may be comma-separated, e.g. phase="plan,implement" applies to both): Follow as requirements</action>
      <action>- `<override>` sections where phase="complete-project": Apply step replacements</action>
      <action>- `<verification>` commands: Note for use in task `<verify>` elements</action>
    
      <branch condition="directive has <override> section for phase=complete-project">
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
    </branch>
    
    <example_code lang="json">
    {
      "skill": "festina-complete-project",
      "directives": [
        { "name": "architecture", "path": ".festinalente/directives/architecture.xml", "exists": true }
      ]
    }
    </example_code>
  </step>

  <step name="get_project_id" outputs="projectId">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as projectId</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <command>node .festinalente/scripts/festinalente.cjs list-projects --status=open</command>
      <action>Also check for in-progress projects:</action>
      <command>node .festinalente/scripts/festinalente.cjs list-projects --status=in-progress</command>
      <action>Use AskUserQuestion tool with:
        - header: "Project"
        - question: "Which project should be completed?"
        - options: Build from project list (up to 4 open/in-progress projects), each with:
          - label: "{projectId}: {short title}" (truncate title if needed)
          - description: "Status: {status} | {taskCount} tasks"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a project ID directly</note>
    </branch>
  </step>

  <step name="read_project" outputs="projectPath, title, requirements, acceptanceCriteria, taskRefs">
    <command>node .festinalente/scripts/festinalente.cjs find-project {projectId}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse XML</action>
    <action>Extract title, requirements, acceptance-criteria, tasks (task-ref entries)</action>
    <branch condition="project not found">
      <output>Error: Project not found</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="check_tasks" outputs="allTasksDone, incompleteTasks">
    <command>node .festinalente/scripts/festinalente.cjs get-project-progress {projectId}</command>
    <action>Parse progress counts from JSON output (AC-G1)</action>

    <branch condition="all tasks have status 'done' (done == total and total > 0)">
      <action>Set allTasksDone = true</action>
      <output>All {total} tasks are complete.</output>
    </branch>

    <branch condition="some tasks are not done (AC-G2)">
      <action>Set allTasksDone = false</action>
      <command>node .festinalente/scripts/festinalente.cjs get-project-tasks {projectId}</command>
      <action>List incomplete tasks with their current status</action>
      <output>
**Incomplete tasks:**
{for each non-done task:}
- {taskId}: {title} (status: {status})

These tasks must be completed before the project can be closed.
      </output>
      <action>Use AskUserQuestion tool with:
        - header: "Incomplete Tasks"
        - question: "This project has incomplete tasks. Complete them first, or force-complete the project?"
        - options:
          - label: "Exit (Recommended)", description: "Go complete the remaining tasks first"
          - label: "Force complete", description: "Mark project as done despite incomplete tasks"
        - multiSelect: false
      </action>
      <branch condition="user selects Exit">
        <output>
**Next: Complete the remaining tasks**
{for each incomplete task, suggest next skill based on status}
        </output>
        <action>Exit</action>
      </branch>
      <branch condition="user selects Force complete">
        <output>Proceeding with project completion despite incomplete tasks.</output>
      </branch>
    </branch>
  </step>

  <step name="evaluate_acceptance" outputs="criteriaResults, allCriteriaPassed">
    <note>Evaluate project-level acceptance criteria against implemented state (AC-G3)</note>
    <action>For each criterion in project's `<acceptance-criteria>`:</action>
    <action>Read relevant code, docs, and task acceptance criteria results to assess</action>
    <action>If needed, read implementation files referenced by tasks to verify criteria</action>

    <output>
**Project Acceptance Criteria Evaluation:**

{for each criterion:}
- Criterion {n}: {PASS|FAIL}
  {criterion text}
  Evidence: {explanation of how criterion was verified or why it failed}
    </output>

    <branch condition="all criteria pass (AC-G4)">
      <action>Set allCriteriaPassed = true</action>
      <output>All project acceptance criteria are satisfied.</output>
    </branch>

    <branch condition="any criteria fail (AC-G7)">
      <action>Set allCriteriaPassed = false</action>
      <output>
**Failed criteria:**
{for each failed criterion:}
- {criterion text}: {reason for failure}

**Suggested next steps:**
{for each failure, suggest what needs to be done}
      </output>
      <action>Use AskUserQuestion tool with:
        - header: "Criteria Failed"
        - question: "Some acceptance criteria are not met. How would you like to proceed?"
        - options:
          - label: "Exit (Recommended)", description: "Address the failures before completing"
          - label: "Complete anyway", description: "Mark project as done despite failures"
        - multiSelect: false
      </action>
      <branch condition="user selects Exit">
        <output>Project completion deferred. Address the failed criteria and re-run.</output>
        <action>Exit</action>
      </branch>
      <branch condition="user selects Complete anyway">
        <output>Proceeding with project completion despite failed criteria.</output>
      </branch>
    </branch>
  </step>

  <step name="update_project">
    <command>node .festinalente/scripts/festinalente.cjs get-date-time</command>
    <action>Update project.xml:
      - Change `status` attribute to `done`
      - Add `completed="{YYYY-MM-DD}"` attribute
      - Update `updated="{YYYY-MM-DD}"` attribute</action>
    <action>Write updated project.xml to disk</action>
    <validate>Confirm file was written successfully</validate>
  </step>

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
      <action>Check content against `<forbidden>` or `<required>` regex</action>
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

  <step name="output_result">
    <output>
**Project {projectId} completed**

- Title: {title}
- Status: done
- Completed: {YYYY-MM-DD}
- Tasks: {total} (all done)
- Acceptance Criteria: {passCount}/{totalCount} passed

**Next:**
```
/clear
/festina-overview
```
    </output>
    ## Final Validation
    
    Before completing, validate all task XML:
    
    <command description="Validate XML in task files">node .festinalente/scripts/festinalente.cjs validate-xml {taskId}</command>
    
    If validation fails, fix the reported errors before completing.
    
    <output>[FESTINA_COMPLETE]</output>
  </step>
</process>

<success_criteria>
- Project file exists at `.festinalente/projects/{projectId}/project.xml`
- Project XML has `status="done"`
- Project XML has `completed="{YYYY-MM-DD}"` attribute with current date
- Project XML has `updated="{YYYY-MM-DD}"` attribute with current date
- All child tasks verified as done (or user approved force-complete) (AC-G1, AC-G2)
- Project-level acceptance criteria evaluated (AC-G3)
- Directive compliance checks passed (AC-G5, AC-G6)
- Completion summary shown to user with next steps
</success_criteria>

<example label="Successful project completion">
User: `/festina-complete-project P001`

```
Loading project P001-user-authentication-system...

Title: User authentication system
Status: open

Checking task progress...
All 2 tasks are complete.

Project Acceptance Criteria Evaluation:

- Criterion 1: PASS
  Given a new user visits the application
  When they complete registration and login
  Then they have a persistent authenticated session
  Evidence: Registration flow implemented in task 004, session persistence verified in task 005

- Criterion 2: PASS
  And can log out to end the session
  Evidence: Logout with session invalidation implemented in task 005

All project acceptance criteria are satisfied.

Updating project status...
- status: open -> done
- completed: 2026-03-16
- updated: 2026-03-16

Directive compliance: all checks passed

**Project P001-user-authentication-system completed**

- Title: User authentication system
- Status: done
- Completed: 2026-03-16
- Tasks: 2 (all done)
- Acceptance Criteria: 2/2 passed

Next:
/clear
/festina-overview
```
</example>

<example label="Project with incomplete tasks">
User: `/festina-complete-project P002`

```
Loading project P002-notification-system...

Title: Notification system
Status: open

Checking task progress...

**Incomplete tasks:**
- 008-add-email-notifications: Add email notifications (status: in-progress)
- 009-add-push-notifications: Add push notifications (status: backlog)

These tasks must be completed before the project can be closed.

[User selects "Exit (Recommended)"]

**Next: Complete the remaining tasks**
- 008: Continue with /festina-implement 008-add-email-notifications
- 009: Start with /festina-scope 009-add-push-notifications
```
</example>

<example label="Project with failed acceptance criteria">
User: `/festina-complete-project P003`

```
Loading project P003-search-feature...

Title: Search feature
Status: open

Checking task progress...
All 3 tasks are complete.

Project Acceptance Criteria Evaluation:

- Criterion 1: PASS
  Given a user types a search query
  When they press enter
  Then relevant results are displayed within 200ms
  Evidence: Search implemented with indexed queries, performance within target

- Criterion 2: FAIL
  Given search results are displayed
  When the user applies filters
  Then results update without full page reload
  Evidence: Filter UI exists but triggers full page reload (missing client-side filtering)

**Failed criteria:**
- Filter results update without reload: Client-side filtering not implemented
**Suggested next steps:**
- Create a task to add client-side filter application to search results

[User selects "Exit (Recommended)"]

Project completion deferred. Address the failed criteria and re-run.
```
</example>

<next_steps>
View project overview:
```
/clear
/festina-overview
```
</next_steps>
</output>
