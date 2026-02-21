---
name: kanban-rework
description: Return task to In Progress for fixes. Works from QA or PR columns.
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *, git status, git branch *, gh pr *), AskUserQuestion
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Rework Kanban Task

<purpose>
Return a task to In Progress when human review finds issues. Works from both QA and PR columns.
</purpose>

<context>
{{> directory-reference}}

{{> helper-scripts show_find_task=true show_find_plan=true show_get_date_time=true show_get_skill_config=true}}

<note>Column Transitions:
```
qa → in-progress
pr → in-progress
```
See `.kanban/workflow.yaml` for column definitions and valid transitions.
</note>
</context>

<prohibited>
- Do not skip documenting issues in the plan file
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
      <action>List tasks in `qa` or `pr` status from `.kanban/tasks/`</action>
      <action>Use AskUserQuestion tool with:
        - header: "Task"
        - question: "Which task needs rework?"
        - options: Build from task list (up to 4 tasks in qa or pr status), each with:
          - label: "{taskId}: {short title}" (truncate title if needed)
          - description: "Status: {status} | Ready for rework"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a task ID directly</note>
    </branch>
  </step>

  <step name="read_task_file" outputs="taskPath, title, currentStatus">
    <command>node .kanban/scripts/find-task.cjs {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse XML</action>
    <validate>Verify current status is `qa` or `pr`</validate>
    <branch condition="status is not qa or pr">
      <action>Use AskUserQuestion tool with:
        - header: "Continue?"
        - question: "Task is in {status} status. Expected: qa or pr. Continue with rework anyway?"
        - options:
          - label: "Yes", description: "Proceed with rework despite unexpected status"
          - label: "No", description: "Cancel and check task status first"
        - multiSelect: false
      </action>
    </branch>
    <action>Note current title, status, and acceptance criteria</action>
    <branch condition="task not found">
      <output>Error: Task not found</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="verify_branch">
    {{> branch-verify-task}}
  </step>

  <step name="read_plan_file" outputs="planPath">
    <action>Check for `.kanban/tasks/{taskId}/plan.xml`</action>
    <branch condition="plan found">
      <action>Read plan content</action>
    </branch>
    <note>Plan will be updated with issues to address</note>
  </step>

  <step name="load_directives">
    {{> load-directives skill="rework"}}
  </step>

  <step name="close_pr" when="status was `pr`">
    <command>gh pr close</command>
    <output>PR closed</output>
  </step>

  <step name="prompt_for_issues" outputs="issues">
    <prompt>What issues need to be fixed?</prompt>
    <action>Collect detailed description of problems</action>
    <action>Parse into individual issues if multiple provided</action>
  </step>

  <step name="update_plan_with_iteration">
    <note>Following template at `.kanban/templates/plan.xml`</note>
    <action>Increment `iteration` attribute in plan XML</action>
    <action>Determine phase name based on original status:
- `qa` → "QA Failed"
- `pr` → "PR Rejected"</action>
    <action>Add to `## Iterations` section (create if doesn't exist)</action>
    <example_code lang="markdown">
## Iterations

### Attempt {n} — {phase name} ({YYYY-MM-DD})
**Phase:** {qa|pr}
**Result:** failed

**Issues:**
- [ ] {issue 1}
- [ ] {issue 2}
- [ ] {issue 3}

**Action:** Address issues above, then re-verify

---
    </example_code>
  </step>

  <step name="move_to_in_progress">
    <action>Change `status: {qa|pr}` to `status: in-progress`</action>
    <action>Add `updated: {YYYY-MM-DD}`</action>
    <action>Write updated task file</action>
  </step>

  <step name="commit">
    <note>Format: `docs({taskId}): rework - {title}`</note>
    <command>git add .kanban/tasks/{taskId}/task.xml</command>
    <command>git add .kanban/tasks/{taskId}/plan.xml</command>
    <command>git commit -m "docs({taskId}): rework - {title}"</command>
  </step>

  {{> directive-compliance}}

  <step name="output_result">
    <output>Print commit hash</output>
    <output>Print: "Task {taskId} returned to In Progress for rework"</output>
    <output>Print iteration number</output>
    <output>Print number of issues to address</output>
    <output>**Next: Fix the issues, then re-verify**</output>
    <output>
```
/clear
/kanban-implement {taskId}
```
Then re-verify:
```
/clear
/kanban-codecheck {taskId}
```
    </output>
    {{> skill-complete}}
  </step>
</process>

<success_criteria>
- Task file exists at `.kanban/tasks/{taskId}/task.xml`
- Plan file exists at `.kanban/tasks/{taskId}/plan.xml`
- Task XML has `status="in-progress"`
- Plan contains `## Iterations` section with rework entry
- Git log shows `docs({taskId}): rework -`
- If was in PR: PR is closed (verify with `gh pr view --json state`)
- Next steps shown to user
</success_criteria>

<example>
User: `/kanban-rework 001`

```
Handling rework for task 001 "Add user authentication"...

Task: 001 - Add user authentication
Status: qa

What issues need to be fixed?
> 1. Password validation is missing minimum length check
> 2. JWT token expiry is not being checked
> 3. Error messages expose internal details

Updating plan with iteration...

Commit: g7h8i9j docs(001): rework - Add user authentication

Task 001 returned to In Progress for rework.
- Iteration: 2
- Status: in-progress
- Issues to address: 3

Next:
/clear
/kanban-implement 001

Then re-verify: /kanban-codecheck 001
```
</example>

<next_steps>
Fix the issues (see plan's Iterations for checkboxes):
```
/clear
/kanban-implement {id}
```

Then re-verify:
```
/clear
/kanban-codecheck {id}
```
</next_steps>
