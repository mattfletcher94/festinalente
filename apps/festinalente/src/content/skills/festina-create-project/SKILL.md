---
name: festina-create-project
description: Create a project through conversational Q&A, capture requirements, then auto-decompose into vertically-sliced tasks with requirement traceability.
allowed-tools: Read, Write, Bash(node *, git add *, git commit *, git status, git branch *), Grep, Glob, WebSearch, WebFetch
argument-hint: "[project title]"
disable-model-invocation: false
---

# Create Festina Lente Project

<purpose>
Create a project through conversational Q&A, capturing problem, value, scope, numbered requirements, and acceptance criteria. Then auto-decompose into 2-5 vertically-sliced tasks with full requirement traceability.
</purpose>

<context>
{{> directory-reference}}

{{> helper-scripts show_next_id=true show_get_date_time=true show_next_project_id=true}}

{{> product-docs-scripts show_search_product=true}}

{{> engineering-docs-scripts show_search_engineering=true}}

<note>**Project template:** `.festinalente/templates/project.xml` - Template for project files</note>

<note>**Task template:** `.festinalente/templates/task.xml` - Template for task files</note>

{{> column-transition from="[New Project]" to="open"}}
</context>

<prohibited>
- Do not use `Search()` or `Glob()` to find files manually
- Do not read `.festinalente/config.yaml` directly
- Do not run `ls` commands to explore directories
- Do not guess filenames or IDs — always use the helper scripts
- Do not create tasks without user confirmation of the decomposition
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="verify_festina_exists">
    <validate>Check that `.festinalente/projects/` directory exists (create if needed)</validate>
    <validate>Check that `.festinalente/tasks/` directory exists</validate>
    <branch condition="directories don't exist">
      <output>Error: Festina Lente not initialized. Run `npx festinalente init` first.</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="load_directives">
    {{> load-directives skill="create-project"}}
  </step>

  <step name="get_project_title" outputs="title">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as title</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <action>Use AskUserQuestion tool with:
        - header: "Project Title"
        - question: "What is the project title? Describe the outcome this project delivers."
        - options:
          - label: "Skip", description: "I'll provide the title"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type the project title</note>
    </branch>
    <action>Ensure title follows best practices (suggest improvements if needed)</action>
  </step>

  <step name="socratic_qa" outputs="problem, value, inScope, outOfScope, requirements, acceptanceCriteria">
    <note>Use AskUserQuestion tool for **one question at a time**.</note>

    <note>This is a **conversational session** focused on **product/business concerns**:
- What problem does this project solve?
- What does success look like?
- What's in scope and what's explicitly NOT in scope?
- What are the numbered requirements?
- What are the project-level acceptance criteria?</note>

    <note>How the dialogue works: **Propose first, then validate.**
- Analyze the user's initial input to form an understanding
- Propose your understanding and ask user to validate
- User confirms, corrects, or says "You decide" for LLM inference</note>

    <questions name="problem_validation">
      <action>Use AskUserQuestion tool with:
        - header: "Problem"
        - question: "I understand the problem as: {proposed problem based on user input}. Is this accurate?"
        - options:
          - label: "Yes", description: "Understanding is correct"
          - label: "Partly", description: "Needs some adjustment"
          - label: "No", description: "This is incorrect"
          - label: "You decide", description: "Use your judgment"
        - multiSelect: false
      </action>
      <note>User can select "Other" to provide corrections</note>

      <branch condition="user selects 'You decide'">
        <action>Use judgment to fill gaps - research if helpful, infer from context</action>
        <note>Document what was inferred vs confirmed</note>
      </branch>
    </questions>

    <questions name="value_validation">
      <action>Use AskUserQuestion tool with:
        - header: "Value"
        - question: "The value I see is: {proposed value}. Does this capture it?"
        - options:
          - label: "Yes", description: "Value is correct"
          - label: "Partly", description: "Needs adjustment"
          - label: "No", description: "This is incorrect"
          - label: "You decide", description: "Use your judgment"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe the value</note>

      <branch condition="user selects 'You decide'">
        <action>Use judgment to fill gaps - research if helpful, infer from context</action>
        <note>Document what was inferred vs confirmed</note>
      </branch>
    </questions>

    <questions name="scope_validation">
      <action>Use AskUserQuestion tool with:
        - header: "Scope"
        - question: "Here's what I think is in scope: {proposed in-scope items}. What's explicitly OUT of scope or non-goals for this project?"
        - options:
          - label: "Looks good", description: "Scope is correct as proposed"
          - label: "Adjust", description: "Needs changes"
          - label: "You decide", description: "Use your judgment"
        - multiSelect: false
      </action>
      <note>User can select "Other" to define scope boundaries</note>
      <note>IMPORTANT: Explicitly ask about non-goals to prevent scope creep (AC-B14)</note>
    </questions>

    <questions name="requirements_validation">
      <note>Requirements are numbered R1-Rn. Each must be independently testable, user-facing, and specific (AC-B15).</note>
      <action>Use AskUserQuestion tool with:
        - header: "Requirements"
        - question: "Based on our discussion, here are the proposed requirements:
{R1: requirement text}
{R2: requirement text}
...
Each is independently testable and user-facing. Are these correct?"
        - options:
          - label: "Yes", description: "Requirements are correct"
          - label: "Add more", description: "Need additional requirements"
          - label: "Adjust", description: "Some requirements need changes"
          - label: "You decide", description: "Use your judgment"
        - multiSelect: false
      </action>
      <note>User can select "Other" to provide requirement details</note>
    </questions>

    <questions name="acceptance_criteria_validation">
      <action>Use AskUserQuestion tool with:
        - header: "Acceptance Criteria"
        - question: "For project-level acceptance criteria (Gherkin format), I'd propose:
{Given ... When ... Then ...}
These define when the WHOLE PROJECT is complete. Correct?"
        - options:
          - label: "Yes", description: "Criteria are correct"
          - label: "Adjust", description: "Needs changes"
          - label: "You decide", description: "Use your judgment"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe acceptance criteria</note>
    </questions>

    <branch condition="user requests research">
      <action>Use WebSearch/WebFetch to research domain topics, best practices</action>
      <action>Use AskUserQuestion tool with:
        - header: "Findings"
        - question: "I found: {findings summary}. Does this influence the requirements?"
        - options:
          - label: "Yes", description: "Adjust based on findings"
          - label: "No", description: "Keep original approach"
        - multiSelect: false
      </action>
    </branch>

    <action>Continue until you have: problem, value, in-scope, out-of-scope, numbered requirements (R1-Rn), acceptance criteria</action>
  </step>

  <step name="search_product_docs" when="`.festinalente/product/` directory exists and is not empty" outputs="affectedDocs">
    <action>Extract keywords from the established title, problem, and requirements</action>
    <command>node .festinalente/scripts/festinalente.cjs search-product {keyword1} {keyword2} ...</command>
    <note>Search results include `relatedDocs` with tldr previews of connected docs.
Only read full content of related docs if their tldr suggests relevance.
Avoid loading more than 2-3 related docs to preserve context window.</note>

    <branch condition="docs with score >= 0.5 found">
      <note>These docs describe existing features this project relates to</note>
      <action>Note matched doc IDs for project affects field</action>
    </branch>

    <branch condition="`.festinalente/product/` is empty or doesn't exist">
      <action>Skip this step</action>
    </branch>
  </step>

  <step name="search_engineering_docs" when="`.festinalente/engineering/` directory exists and is not empty" outputs="engineeringDocs">
    <action>Extract technical keywords from requirements and problem statement</action>
    <command>node .festinalente/scripts/festinalente.cjs search-engineering {keyword1} {keyword2} ...</command>

    <branch condition="docs with score >= 0.5 found">
      <action>Note matched doc IDs for project engineering field</action>
    </branch>

    <branch condition="`.festinalente/engineering/` is empty or doesn't exist">
      <action>Skip this step</action>
    </branch>
  </step>

  <step name="validate_requirements">
    <note>Ensure each requirement R1-Rn meets quality criteria (AC-B15):</note>
    <action>For each requirement, verify:
      - Independently testable: Can be verified without checking other requirements
      - User-facing: Describes something the user can observe or interact with
      - Specific: Clear enough that two people would agree on whether it's met</action>
    <branch condition="any requirement fails validation">
      <action>Refine the requirement and re-confirm with user</action>
    </branch>
  </step>

  <step name="generate_project_id" outputs="projectId">
    <command>node .festinalente/scripts/festinalente.cjs next-project-id --title="{title}"</command>
    <action>Use `nextId` from JSON output (format: P001-slug)</action>
  </step>

  <step name="write_project_xml">
    <action>Read template from `.festinalente/templates/project.xml`</action>
    <command description="Get current date">node .festinalente/scripts/festinalente.cjs get-date-time</command>
    <action>Create folder `.festinalente/projects/{projectId}/`</action>
    <action>Create file at `.festinalente/projects/{projectId}/project.xml`</action>
    <action>Fill XML attributes: `id="{projectId}"`, `status="open"`, `created="{date}"`, `updated="{date}"`</action>
    <action>Fill `<title>` with project title</action>
    <action>Fill `<description>` with project description</action>
    <action>Fill `<problem>` with problem statement from Q&A</action>
    <action>Fill `<value>` with value statement from Q&A</action>
    <action>Fill `<scope>` with in-scope and out-of-scope items</action>
    <action>Fill `<requirements>` with numbered R1-Rn requirements</action>
    <action>Fill `<acceptance-criteria>` with Gherkin-format project-level criteria</action>
    <action>Leave `<tasks>` empty (filled during decompose step)</action>
    <action>Fill `<affects>` with matched product doc IDs (if any)</action>
    <action>Fill `<engineering>` with matched engineering doc IDs (if any)</action>
  </step>

  <step name="decompose_tasks" outputs="taskDecomposition">
    <note>Auto-decompose the project into 2-5 vertically-sliced tasks.</note>
    <note>CRITICAL: Reason about the FULL SET of tasks simultaneously to guarantee no overlap (AC-B9).</note>

    <action>Analyze requirements R1-Rn and determine the optimal task breakdown:</action>
    <action>For each proposed task, define:
      - Title: Clear, action-oriented
      - Description: What this task does, with sibling context explaining how it fits into the project (AC-B18)
      - Problem: Task-specific problem statement
      - Value: Task-specific value statement
      - Acceptance criteria: Gherkin format, scoped to THIS task only (AC-C6)
      - Requirements covered: Which R1-Rn this task addresses (AC-B7)
      - Boundary notes: What this task does NOT cover (handled by sibling tasks)</action>

    <validate>Every requirement R1-Rn must map to at least one task (AC-B8)</validate>

    <branch condition="6+ tasks would be needed (AC-B20)">
      <action>Use AskUserQuestion tool with:
        - header: "Warning"
        - question: "This project would need {count} tasks, which exceeds the recommended 2-5. This may indicate the project scope is too broad. Options:"
        - options:
          - label: "Proceed", description: "Create all {count} tasks anyway"
          - label: "Split project", description: "Break this into multiple smaller projects"
          - label: "Reduce scope", description: "Remove some requirements to reduce task count"
        - multiSelect: false
      </action>
    </branch>
  </step>

  <step name="confirm_decomposition">
    <action>Show summary table to user:</action>
    <output>
| # | Task Title | Requirements | Dependencies |
|---|-----------|-------------|-------------|
| 1 | {title}   | R1, R3      | None        |
| 2 | {title}   | R2, R4      | After #1    |
...

**Requirement Coverage:**
- R1: Task #1
- R2: Task #2
...
    </output>

    <action>Use AskUserQuestion tool with:
      - header: "Decomposition"
      - question: "Does this task breakdown look correct?"
      - options:
        - label: "Yes, create tasks", description: "Create all tasks as shown"
        - label: "Adjust", description: "I want to change the breakdown"
        - label: "Re-decompose", description: "Start the decomposition over with guidance"
      - multiSelect: false
    </action>
    <note>User can select "Other" to provide specific guidance (AC-B16, AC-B17)</note>

    <branch condition="user says 'Adjust'">
      <action>Incorporate user feedback and show updated table</action>
    </branch>
    <branch condition="user says 'Re-decompose'">
      <action>Ask user for decomposition guidance, then redo decompose_tasks step</action>
    </branch>
  </step>

  <step name="write_tasks" outputs="taskIds">
    <note>Create each task with project context embedded.</note>
    <action>For each task in the confirmed decomposition:</action>

    <action>Generate task ID:</action>
    <command>node .festinalente/scripts/festinalente.cjs next-id --title="{task title}"</command>

    <action>Read template from `.festinalente/templates/task.xml`</action>
    <command description="Get current date">node .festinalente/scripts/festinalente.cjs get-date-time</command>
    <action>Create folder `.festinalente/tasks/{taskId}/`</action>
    <action>Create file at `.festinalente/tasks/{taskId}/task.xml` with:
      - id="{taskId}", status="backlog", priority="medium"
      - project-id="{projectId}" attribute on task element
      - project-requirements="{comma-separated R-ids this task covers}" attribute (AC-B7)
      - title, description (including sibling context and boundary notes)
      - problem, value, acceptance-criteria (scoped to this task)
      - affects and engineering inherited from project where relevant</action>

    <action>Update project.xml `<tasks>` element with task reference:</action>
    <example_code lang="xml">
<tasks>
  <task-ref id="{taskId}" requirements="{R1,R3}" />
  <task-ref id="{taskId2}" requirements="{R2,R4}" />
</tasks>
    </example_code>
    <note>Update project.xml after ALL tasks are created (AC-B19)</note>
  </step>

  <step name="create_stubs" when="new product or engineering docs needed (AC-B21)">
    <note>Create stub product/engineering docs if the project introduces new features not yet documented</note>
    <command description="Get current date">node .festinalente/scripts/festinalente.cjs get-date-time</command>

    <branch condition="new product feature detected (no matching product docs)">
      <action>Use AskUserQuestion tool with:
        - header: "Domain"
        - question: "This project introduces a new feature. What domain should it belong to?"
        - options: Build from existing domain folders (up to 4), each with:
          - label: "{domain}", description: "Group with other {domain} features"
        - multiSelect: false
      </action>
      <action>Create stub doc at `.festinalente/product/{domain}/{slug}.md` with `stub: true`</action>
      <action>Add doc ID to project affects and all relevant task affects</action>
    </branch>

    <branch condition="new engineering pattern detected">
      <action>Use AskUserQuestion tool with:
        - header: "Eng type"
        - question: "This project may introduce new technical patterns. What type?"
        - options:
          - label: "System", description: "New subsystem or service"
          - label: "Pattern", description: "Recurring solution"
          - label: "Convention", description: "Team standard"
          - label: "None needed", description: "No new engineering documentation required"
        - multiSelect: false
      </action>
      <branch condition="user selects type (not 'None needed')">
        <action>Create stub doc at `.festinalente/engineering/{type}s/{slug}.md` with `stub: true`</action>
        <action>Add doc ID to project engineering and all relevant task engineering</action>
      </branch>
    </branch>
  </step>

  {{> directive-compliance}}

  <step name="validate_xml">
    <command description="Validate project XML">node .festinalente/scripts/festinalente.cjs validate-xml projects/{projectId}</command>
    <action>For each task-ref in taskIds:</action>
    <command description="Validate task XML">node .festinalente/scripts/festinalente.cjs validate-xml {taskId}</command>
    <branch condition="validation fails">
      <output>Warning: XML validation failed. Fix errors before completing.</output>
    </branch>
  </step>

  <step name="output_result">
    <output>
**Project {projectId} created**

- Title: {title}
- Status: open
- Tasks: {taskCount}
- Requirements: {requirementCount} (R1-R{n})

**Requirement Coverage Matrix:**
| Requirement | Task(s) |
|-------------|---------|
| R1: {text}  | {taskId} |
| R2: {text}  | {taskId} |
...

**Created files:**
- `.festinalente/projects/{projectId}/project.xml`
{for each task:}
- `.festinalente/tasks/{taskId}/task.xml`
{if stubs:}
- `.festinalente/product/{domain}/{slug}.md` (stub)
- `.festinalente/engineering/{type}s/{slug}.md` (stub)

**Next: Scope the first task**
```
/clear
/festina-scope {firstTaskId}
```
    </output>
    {{> skill-complete}}
  </step>
</process>

<success_criteria>
- Project folder exists at `.festinalente/projects/{projectId}/`
- Project file exists at `.festinalente/projects/{projectId}/project.xml`
- Project XML has `id="{projectId}"` and `status="open"`
- Project XML has `<problem>` section filled
- Project XML has `<value>` section filled
- Project XML has `<scope>` with both in-scope and out-of-scope items
- Project XML has `<requirements>` with numbered R1-Rn entries
- Project XML has `<acceptance-criteria>` in Gherkin format
- Project XML has `<tasks>` with task-ref entries for all created tasks (AC-B19)
- 2-5 task files created (or user-approved count if 6+)
- Each task has project-id and project-requirements attributes (AC-B7)
- Each task has sibling context in description (AC-B18)
- Each task has boundary notes explaining what it does NOT cover
- Each task has acceptance criteria scoped to that task only (AC-C6)
- Every requirement R1-Rn maps to at least one task (AC-B8)
- No overlapping task scope (AC-B9)
- If new feature: stub doc exists with `stub: true` (AC-B21)
- Directive compliance checks passed
- Next steps point to `/festina-scope`
</success_criteria>

<example>
**Creating a project:**

User: `/festina-create-project User authentication system`

```
Creating project...

Title: User authentication system

I understand the problem as: The application currently has no way to identify
or authenticate users, meaning all access is anonymous and uncontrolled.
Is this accurate? [Yes / Partly / No / You decide] > Yes

The value I see is: Users can securely identify themselves, enabling
personalized experiences and access control.
Does this capture it? [Yes / Partly / No / You decide] > Yes

Here's what I think is in scope:
- Login/logout flows
- Password-based authentication
- Session management
What's explicitly OUT of scope? > Social login, 2FA, password recovery

Requirements:
R1: Users can register with email and password
R2: Users can log in with valid credentials
R3: Users can log out and have their session invalidated
R4: Invalid credentials show a clear error message
R5: Sessions persist across browser refreshes

Each is independently testable and user-facing. Correct? > Yes

Project-level acceptance criteria:
Given a new user visits the application
When they complete registration and login
Then they have a persistent authenticated session
And can log out to end the session
Correct? > Yes

Searching product docs... Related: auth/overview (score: 0.68)
Searching engineering docs... No matches.

Decomposing into tasks...

| # | Task Title                        | Requirements | Dependencies |
|---|----------------------------------|-------------|-------------|
| 1 | Add user registration flow       | R1, R4       | None         |
| 2 | Add login and session management | R2, R3, R5   | After #1     |

Requirement Coverage:
- R1: Task #1
- R2: Task #2
- R3: Task #2
- R4: Task #1
- R5: Task #2

Does this look correct? > Yes, create tasks

Creating tasks...
- 004-add-user-registration-flow (R1, R4)
- 005-add-login-and-session-management (R2, R3, R5)

Project P001-user-authentication-system created
- Status: open
- Tasks: 2
- Requirements: 5 (R1-R5)

Next:
/clear
/festina-scope 004-add-user-registration-flow
```
</example>

<next_steps>
```
/clear
/festina-scope {firstTaskId}
```
</next_steps>
</output>
