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
{{> directory-reference}}

{{> helper-scripts show_find_task=true show_get_date_time=true show_get_skill_config=true show_find_project=true show_list_projects=true show_get_project_tasks=true show_get_project_progress=true}}

{{> column-transition from="open" to="done"}}
</context>

<prohibited>
- Do not mark a project as done if any tasks are incomplete (AC-G2)
- Do not skip acceptance criteria evaluation (AC-G3)
- Do not proceed without user confirmation of evaluation results
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="load_directives">
    {{> load-directives skill="complete-project"}}
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

  {{> directive-compliance}}

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
    {{> skill-complete}}
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
