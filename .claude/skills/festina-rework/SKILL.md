---
name: festina-rework
description: Return task to In Progress with structured issue report. Works from Finalize or Awaiting Completion columns.
allowed-tools: Read, Write, Bash(node *)
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Rework Festina Lente Task

<purpose>
Return a task to In Progress when human review finds issues. Gather structured issue information to create an actionable rework report in the plan file.
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

<note>Column Transitions:
```
finalize → in-progress
awaiting-completion → in-progress
```
See `.festinalente/workflow.yaml` for column definitions and valid transitions.
</note>
</context>

<prohibited>
- Do not skip gathering issue details
</prohibited>

<process>
  <step name="load_workflow">
    <action>Read `.festinalente/workflow.yaml` for column definitions, labels, priorities, and transitions</action>
    <note>Use these values throughout this skill</note>
  </step>

  <step name="get_task_id" outputs="taskId">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as taskId</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <action>List tasks in `finalize` and `awaiting-completion` status from `.festinalente/tasks/`</action>
      <action>Use AskUserQuestion tool with:
        - header: "Task"
        - question: "Which task needs rework?"
        - options: Build from task list (up to 4 tasks in finalize or awaiting-completion status), each with:
          - label: "{taskId}: {short title}" (truncate title if needed)
          - description: "Status: {status} | Ready for rework"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a task ID directly</note>
    </branch>
  </step>

  <step name="read_task_file" outputs="taskPath, title, currentStatus, acceptanceCriteria">
    <command>node .festinalente/scripts/festinalente.cjs find-task {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse XML</action>
    <validate>Verify current status is `finalize` or `awaiting-completion`</validate>
    <branch condition="status is not finalize or awaiting-completion">
      <action>Use AskUserQuestion tool with:
        - header: "Continue?"
        - question: "Task is in {status} status. Expected: finalize or awaiting-completion. Continue with rework anyway?"
        - options:
          - label: "Yes", description: "Proceed with rework despite unexpected status"
          - label: "No", description: "Cancel and check task status first"
        - multiSelect: false
      </action>
    </branch>
    <action>Note title, status, and acceptance criteria for context</action>
    <branch condition="task not found">
      <output>Error: Task not found</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="read_plan_file" outputs="planPath, currentIteration">
    <action>Check for `.festinalente/tasks/{taskId}/plan.xml`</action>
    <branch condition="plan found">
      <action>Read plan content</action>
      <action>Get current iteration number from plan</action>
    </branch>
    <note>Plan will be updated with structured issue report</note>
  </step>

  <step name="load_directives">
    <command>node .festinalente/scripts/festinalente.cjs get-skill-config festina-rework</command>
    <action>Parse the JSON output</action>
    
    <branch condition="directives.length > 0">
      <warning>Directives are MANDATORY. You MUST follow them.</warning>
      <action>For EACH directive where `exists` is `true`:</action>
      <action>Read the directive XML file at `path`</action>
      <action>Parse and apply:</action>
      <action>- `<context>` principles: Maintain as ongoing mindset</action>
      <note>The `keywords` attribute on context principles is metadata for LLM relevance — use keywords to recognize when a principle applies to the current work.</note>
      <action>- `<process>` rules where the phase attribute, split on comma and trimmed, includes "rework" as an exact element (e.g. phase="plan,implement" matches "plan" and "implement" but NOT "plan-review"): Follow as requirements</action>
      <action>- `<override>` sections where the phase attribute, split on comma and trimmed, includes "rework" as an exact element: Apply step replacements</action>
      <action>- `<verification>` commands: Used by festina-plan to populate task &lt;verify&gt; elements and festina-implement to run step checks. Other skills can ignore this section.</action>
    
      <branch condition="directive has <override> section for phase=rework">
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
      "skill": "festina-rework",
      "directives": [
        { "name": "architecture", "path": ".festinalente/directives/architecture.xml", "exists": true }
      ]
    }
    </example_code>
  </step>

  <!-- ============================================ -->
  <!-- STRUCTURED ISSUE GATHERING                  -->
  <!-- ============================================ -->

  <step name="get_issue_type" outputs="issueType">
    <action>Use AskUserQuestion tool with:
      - header: "Type"
      - question: "What type of issue was found?"
      - options:
        - label: "Bug", description: "Something is broken or behaves incorrectly"
        - label: "Incomplete", description: "Missing functionality or acceptance criteria not met"
        - label: "Design change", description: "Works but needs a different approach"
        - label: "Performance", description: "Too slow or resource-intensive"
      - multiSelect: false
    </action>
  </step>

  <step name="get_severity" outputs="severity">
    <action>Use AskUserQuestion tool with:
      - header: "Severity"
      - question: "How severe is this issue?"
      - options:
        - label: "Blocker", description: "Cannot ship until fixed"
        - label: "Major", description: "Significant issue, high priority fix"
        - label: "Minor", description: "Small issue, can be fixed quickly"
      - multiSelect: false
    </action>
  </step>

  <step name="gather_issue_details" outputs="issueDetails">
    <note>Conversational gathering based on issue type</note>

    <output>
**Task:** {taskId} - {title}
**Issue type:** {issueType}
**Severity:** {severity}

Let me gather the details needed for a proper issue report.
    </output>

    <branch condition="issueType is Bug">
      <action>Ask: "What's happening? (the actual behavior)"</action>
      <action>Ask: "What should happen instead? (expected behavior)"</action>
      <action>Ask: "How do you reproduce it? (steps)"</action>
    </branch>

    <branch condition="issueType is Incomplete">
      <action>Ask: "What's missing from the implementation?"</action>
      <action>Ask: "Which acceptance criteria are not met?"</action>
    </branch>

    <branch condition="issueType is Design change">
      <action>Ask: "What's the current behavior?"</action>
      <action>Ask: "What should it be instead and why?"</action>
    </branch>

    <branch condition="issueType is Performance">
      <action>Ask: "What's slow or resource-intensive?"</action>
      <action>Ask: "What's the expected performance?"</action>
      <action>Ask: "How did you measure it?"</action>
    </branch>

    <note>User can provide all details at once or answer one at a time</note>
    <note>If user provides partial info, ask follow-up questions</note>
  </step>

  <step name="synthesize_and_confirm" outputs="confirmedIssue">
    <action>Parse gathered details into structured format</action>
    <action>Determine specific actions needed to address the issue</action>

    <output>
**Issue Report**

**Type:** {issueType}
**Severity:** {severity}

**Summary:** {one-line summary}

{If Bug:}
**Actual behavior:** {what's happening}
**Expected behavior:** {what should happen}
**Reproduction steps:**
1. {step 1}
2. {step 2}
3. {step 3}

{If Incomplete:}
**Missing:** {what's missing}
**Acceptance criteria not met:**
- {criteria 1}
- {criteria 2}

{If Design change:}
**Current:** {current behavior}
**Requested:** {new behavior}
**Reason:** {why the change}

{If Performance:}
**Issue:** {what's slow}
**Current:** {measured performance}
**Expected:** {target performance}

**Actions to address:**
- [ ] {action 1}
- [ ] {action 2}
- [ ] {action 3}

---
**Does this capture the issue correctly? Anything to add or change?**
    </output>

    <branch condition="user confirms">
      <action>Proceed to update plan</action>
    </branch>
    <branch condition="user has corrections">
      <action>Update issue report and confirm again</action>
    </branch>
    <branch condition="user adds more details">
      <action>Incorporate and confirm again</action>
    </branch>
  </step>

  <!-- ============================================ -->
  <!-- UPDATE PLAN WITH STRUCTURED ITERATION       -->
  <!-- ============================================ -->

  <step name="update_plan_with_iteration">
    <note>Following template at `.festinalente/templates/plan.xml`</note>
    <action>Increment `iteration` attribute in plan XML</action>
    <action>Set phase name dynamically: "Finalize" if task was in finalize status, "Awaiting Completion" if task was in awaiting-completion status</action>
    <action>Add to `<iterations>` section</action>

    <example_code lang="xml">
<iteration number="{n}" phase="finalize" result="failed" date="{YYYY-MM-DD}">
  <issue type="{issueType}" severity="{severity}">
    <summary>{one-line summary}</summary>
    <expected>{expected behavior or target}</expected>
    <actual>{actual behavior or current state}</actual>
    <reproduce>
{reproduction steps, if applicable}
    </reproduce>
  </issue>
  <actions>
    <action status="pending">{action 1}</action>
    <action status="pending">{action 2}</action>
    <action status="pending">{action 3}</action>
  </actions>
</iteration>
    </example_code>
  </step>

  <step name="move_to_in_progress">
    <action>Change current status (`finalize` or `awaiting-completion`) to `status: in-progress`</action>
    <action>Add `updated: {YYYY-MM-DD}`</action>
    <action>Write updated task file</action>
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
      <branch condition="user selects Fix now">
        <action>Attempt remediation for the violation</action>
        <action>Re-run the failed validation checks (only the ones that failed, not all checks)</action>
        <branch condition="checks now pass">
          <output>Violation resolved.</output>
        </branch>
        <branch condition="still failing after remediation">
          <output>Violation persists after fix attempt: {check id} - {reason}. Continuing.</output>
        </branch>
      </branch>
    </branch>
  </step>

  <step name="validate_xml">
    <command description="Validate XML in task files">node .festinalente/scripts/festinalente.cjs validate-xml {taskId}</command>
    <branch condition="validation fails">
      <output>Warning: XML validation failed. Fix errors before completing.</output>
    </branch>
  </step>

  <step name="output_result">
    <output>
**Task {taskId} returned to In Progress**

- Iteration: {n}
- Issue type: {issueType}
- Severity: {severity}
- Actions: {count} items to address

The issue report has been added to the plan file. When you resume implementation, you'll see exactly what needs to be fixed.

**Next: Fix the issues**
```
/clear
/festina-implement {taskId}
```

Then finalize:
```
/clear
/festina-finalize {taskId}
```
    </output>
    <output>[FESTINA_COMPLETE]</output>
  </step>
</process>

<success_criteria>
- Task file exists at `.festinalente/tasks/{taskId}/task.xml`
- Plan file exists at `.festinalente/tasks/{taskId}/plan.xml`
- Task XML has `status="in-progress"`
- Plan contains `<iterations>` section with structured issue entry
- Issue entry has type, severity, summary, expected, actual
- Issue entry has actionable items with status="pending"
- Next steps shown to user
</success_criteria>

<example label="Bug found during finalize">
User: `/festina-rework 007`

```
Task: 007 - Add user authentication
Status: finalize

What type of issue was found?
> Bug

How severe is this issue?
> Major

**Task:** 007 - Add user authentication
**Issue type:** Bug
**Severity:** Major

Let me gather the details needed for a proper issue report.

What's happening? (the actual behavior)
> When you enter a wrong password, nothing happens. The form just sits there.

What should happen instead?
> Should show an error message like "Invalid credentials"

How do you reproduce it?
> Go to login, enter a valid email but wrong password, click submit

**Issue Report**

**Type:** Bug
**Severity:** Major

**Summary:** Login fails silently on incorrect password

**Actual behavior:** Form does nothing when wrong password entered
**Expected behavior:** Show "Invalid credentials" error message
**Reproduction steps:**
1. Go to /login
2. Enter valid email with incorrect password
3. Click submit
4. Observe: no feedback, form remains unchanged

**Actions to address:**
- [ ] Add error state handling in login form
- [ ] Display API error response to user
- [ ] Add visual feedback (red border, error text)

---
Does this capture the issue correctly?
> Yes

**Task 007 returned to In Progress**

- Iteration: 2
- Issue type: Bug
- Severity: Major
- Actions: 3 items to address

Next:
/clear
/festina-implement 007
```
</example>

<example label="Incomplete from QA">
User: `/festina-rework 008`

```
Task: 008 - Add password reset flow
Status: finalize

What type of issue was found?
> Incomplete

How severe is this issue?
> Major

What's missing from the implementation?
> The email is sent but there's no actual reset page. Clicking the link 404s.

Which acceptance criteria are not met?
> "User can set a new password via the reset link" - the page doesn't exist

**Issue Report**

**Type:** Incomplete
**Severity:** Major

**Summary:** Password reset page not implemented

**Missing:** Reset password page at /reset-password
**Acceptance criteria not met:**
- User can set a new password via the reset link

**Actions to address:**
- [ ] Create /reset-password route
- [ ] Add ResetPasswordForm component
- [ ] Connect to password update API endpoint
- [ ] Add success/error feedback

---
Does this capture the issue correctly?
> Yes

**Task 008 returned to In Progress**

- Iteration: 2
- Issue type: Incomplete
- Severity: Major
- Actions: 4 items to address
```
</example>

<example label="Design change">
User: `/festina-rework 009`

```
Task: 009 - Add dark mode toggle
Status: finalize

What type of issue was found?
> Design change

How severe is this issue?
> Minor

What's the current behavior?
> Toggle is in the footer, hard to find

What should it be instead and why?
> Should be in the header nav. Users expect theme toggles to be easily accessible, not buried in footer.

**Issue Report**

**Type:** Design change
**Severity:** Minor

**Summary:** Move dark mode toggle from footer to header

**Current:** Toggle located in footer
**Requested:** Toggle in header navigation
**Reason:** Better discoverability, matches user expectations

**Actions to address:**
- [ ] Remove toggle from Footer component
- [ ] Add toggle to Header component
- [ ] Update header layout to accommodate toggle

---
Does this capture the issue correctly?
> Yes

**Task 009 returned to In Progress**

- Iteration: 2
- Issue type: Design change
- Severity: Minor
- Actions: 3 items to address
```
</example>

<example label="Rework from awaiting-completion">
User: `/festina-rework 010`

```
Task: 010 - Add export to CSV
Status: awaiting-completion

What type of issue was found?
> Bug

How severe is this issue?
> Blocker

What's happening? (the actual behavior)
> The CSV export drops special characters. Names with accents come out garbled.

What should happen instead?
> CSV should be UTF-8 encoded so special characters display correctly

How do you reproduce it?
> Export any dataset that includes names with accents or non-ASCII characters

**Issue Report**

**Type:** Bug
**Severity:** Blocker

**Summary:** CSV export corrupts non-ASCII characters

**Actual behavior:** Special characters (accents, umlauts) are garbled in exported CSV
**Expected behavior:** CSV is UTF-8 encoded, all characters display correctly
**Reproduction steps:**
1. Add data with non-ASCII characters (e.g., "José", "Müller")
2. Click Export to CSV
3. Open CSV file
4. Observe: characters are corrupted

**Actions to address:**
- [ ] Set UTF-8 BOM header in CSV output
- [ ] Ensure stream encoding is set to utf-8
- [ ] Add test with non-ASCII characters

---
Does this capture the issue correctly?
> Yes

**Task 010 returned to In Progress**

- Iteration: 3
- Issue type: Bug
- Severity: Blocker
- Actions: 3 items to address

Next:
/clear
/festina-implement 010
```
</example>

<next_steps>
Fix the issues (see plan's iterations section):
```
/clear
/festina-implement {id}
```

Then finalize:
```
/clear
/festina-finalize {id}
```
</next_steps>
