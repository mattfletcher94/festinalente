---
name: festina-rework
description: Return task to In Progress with structured issue report. Works from Finalize column.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *, gh pr *), AskUserQuestion
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Rework Festina Lente Task

<purpose>
Return a task to In Progress when human review finds issues. Gather structured issue information to create an actionable rework report in the plan file.
</purpose>

<context>
{{> directory-reference}}

{{> helper-scripts show_find_task=true show_find_plan=true show_get_date_time=true show_get_skill_config=true}}

<note>Column Transitions:
```
finalize → in-progress
```
See `.festinalente/workflow.yaml` for column definitions and valid transitions.
</note>
</context>

<prohibited>
- Do not skip gathering issue details
- Do not forget to close PR if task was in PR column
- Do not skip the commit step
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="get_task_id" outputs="taskId">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as taskId</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <action>List tasks in `finalize` status from `.festinalente/tasks/`</action>
      <action>Use AskUserQuestion tool with:
        - header: "Task"
        - question: "Which task needs rework?"
        - options: Build from task list (up to 4 tasks in finalize status), each with:
          - label: "{taskId}: {short title}" (truncate title if needed)
          - description: "Status: finalize | Ready for rework"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a task ID directly</note>
    </branch>
  </step>

  <step name="read_task_file" outputs="taskPath, title, currentStatus, acceptanceCriteria">
    <command>node .festinalente/scripts/festinalente.cjs find-task {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse XML</action>
    <validate>Verify current status is `finalize`</validate>
    <branch condition="status is not finalize">
      <action>Use AskUserQuestion tool with:
        - header: "Continue?"
        - question: "Task is in {status} status. Expected: finalize. Continue with rework anyway?"
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

  <step name="verify_branch">
    {{> branch-verify-task}}
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
    {{> load-directives skill="rework"}}
  </step>

  <step name="close_pr" when="PR exists for this branch">
    <note>Check if a PR was created (via github directive) and close it if needed</note>
    <command>gh pr view task/{taskId} --json state 2>/dev/null || echo "no-pr"</command>
    <branch condition="PR exists and is open">
      <command>gh pr close</command>
      <output>PR closed</output>
    </branch>
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
    <action>Set phase name to "Finalize"</action>
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
    <action>Change `status: finalize` to `status: in-progress`</action>
    <action>Add `updated: {YYYY-MM-DD}`</action>
    <action>Write updated task file</action>
  </step>

  <step name="commit">
    <note>Format: `docs({taskId}): rework - {title}`</note>
    <command>git add .festinalente/tasks/{taskId}/task.xml</command>
    <command>git add .festinalente/tasks/{taskId}/plan.xml</command>
    <command>git commit -m "docs({taskId}): rework - {title}"</command>
  </step>

  {{> directive-compliance}}

  <step name="output_result">
    <output>Print commit hash</output>
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
    {{> skill-complete}}
  </step>
</process>

<success_criteria>
- Task file exists at `.festinalente/tasks/{taskId}/task.xml`
- Plan file exists at `.festinalente/tasks/{taskId}/plan.xml`
- Task XML has `status="in-progress"`
- Plan contains `<iterations>` section with structured issue entry
- Issue entry has type, severity, summary, expected, actual
- Issue entry has actionable items with status="pending"
- Git log shows `docs({taskId}): rework -`
- If was in PR: PR is closed
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

Commit: h8i9j0k docs(007): rework - Add user authentication

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

Commit: i9j0k1l docs(008): rework - Add password reset flow

**Task 008 returned to In Progress**

- Iteration: 2
- Issue type: Incomplete
- Severity: Major
- Actions: 4 items to address
```
</example>

<example label="Design change from PR">
User: `/festina-rework 009`

```
Task: 009 - Add dark mode toggle
Status: pr

Closing PR...
PR closed.

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

Commit: j0k1l2m docs(009): rework - Add dark mode toggle

**Task 009 returned to In Progress**

- Iteration: 2
- Issue type: Design change
- Severity: Minor
- Actions: 3 items to address
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
