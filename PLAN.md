# Plan: Merge kanban-codecheck and kanban-approve into kanban-check

## Status: Ready for Implementation

---

## Problem Statement

The current workflow has unnecessary ceremony between implementation completion and code commit:

```
implement → codecheck → [qa status] → approve → update-docs
             (directives)  (manual QA)   (commit)
```

Users must run two separate commands (`/kanban-codecheck` then `/kanban-approve`) with a context clear between them. The `qa` status exists only as a holding state.

### Current Pain Points

1. **Extra command**: Users run `/kanban-codecheck`, then must remember to run `/kanban-approve`
2. **Context loss**: `/clear` between commands loses conversation context
3. **Artificial separation**: Automated checks and manual QA are both "verification" - splitting them adds no value
4. **Extra status column**: `qa` status serves no purpose other than holding

---

## Proposed Solution

Merge into single `/kanban-check` skill:

```
implement → check → update-docs
            (directives → QA prompt → commit)
```

### Proposed Flow

1. Run all automated checks (directives from config.yaml)
2. If any fail → fix/retry loop (existing codecheck behavior)
3. **Only after ALL automated checks pass** → prompt for manual QA
4. If QA passes → commit and move to update-docs
5. If QA fails → suggest /kanban-rework

---

## Open Questions

### Q1: Skill Naming

**Current names being replaced:**
- `kanban-codecheck` - runs directive checks
- `kanban-approve` - confirms QA, commits

**Options for merged skill:**
- `kanban-check` - short, implies verification
- `kanban-verify` - explicit about verification
- `kanban-qa` - focuses on QA aspect (but automated checks aren't QA)
- `kanban-review` - implies code review

**Decision:** `kanban-check`

---

### Q2: Status Column Changes

**Current columns (before change):**
```
backlog → scoped → planned → in-progress → codecheck → qa → update-docs → pr → done
```

**Option A: Remove `qa` entirely, rename `codecheck` to `check`**
```
backlog → scoped → planned → in-progress → check → update-docs → pr → done
```
- Task goes directly from `check` to `update-docs` after QA passes
- Simpler, fewer states
- `check` status means "being verified (automated + manual)"

**Option B: Keep `qa` but make it internal**
```
backlog → scoped → planned → in-progress → codecheck → qa → update-docs → pr → done
```
- Same columns, but `/kanban-check` handles both transitions internally
- Task moves: codecheck → qa (after directives pass) → update-docs (after QA)
- More granular status tracking

**Option C: Rename to reflect merged meaning**
```
backlog → scoped → planned → in-progress → checking → update-docs → pr → done
```
- Rename `codecheck` to `checking` (covers both automated and manual)
- Remove `qa` column
- Cleaner semantics

**Decision:** Option A - Remove `qa` status entirely. Rename `codecheck` to `check` for consistency with skill name.

---

### Q3: What happens to `kanban-rework` references?

Current `kanban-rework` expects task in `qa` or `pr` status:
- From `qa`: returns to `in-progress`
- From `pr`: closes PR, returns to `in-progress`

If we remove `qa` status:
- `kanban-rework` would work from `check` or `pr` status
- Or we keep `qa` as internal state that `kanban-rework` can still reference

**Decision:** Update `kanban-rework` to accept `check` status instead of `qa`. Simple find/replace.

---

### Q4: Directive execution order

**Current order in kanban-codecheck:**
1. read_spec
2. verify_requirements_met (from recent changes)
3. load_check_directives
4. run_checks (directives)
5. advance_to_qa

**Proposed order options:**

**Option A: Requirements first, then directives**
```
1. Read spec
2. Verify requirements met (trace FRs to code)
3. Load and run directive checks
4. Prompt for manual QA
5. Commit
```

**Option B: Directives first, then requirements**
```
1. Load and run directive checks (fast fail on typecheck/lint)
2. Read spec
3. Verify requirements met
4. Prompt for manual QA
5. Commit
```

**Option C: Parallel/interleaved**
```
1. Run fast directive checks (typecheck, lint)
2. Verify requirements met
3. Run slower directive checks (tests, AI review)
4. Prompt for manual QA
5. Commit
```

**Decision:** Option B - Directives first, then requirements. Fast-fail on basic checks before tracing requirements.

---

### Q5: Manual QA prompt design

**Current kanban-approve prompt:**
```
"Have you tested the application and verified it meets acceptance criteria?"
- Yes → commit
- No → suggest /kanban-rework
```

**Enhanced options:**

**Option A: Simple yes/no (current)**
- Pros: Quick, minimal friction
- Cons: No guidance on what to test

**Option B: Show acceptance criteria checklist**
```
Please verify these acceptance criteria:
- [ ] Given X, when Y, then Z
- [ ] Given A, when B, then C

All criteria met?
- Yes → commit
- No → describe issues for rework
```
- Pros: Explicit about what to test
- Cons: More verbose

**Option C: Interactive checklist**
```
Check each criterion as you verify:
[ ] Given X, when Y, then Z
[ ] Given A, when B, then C
[Continue when all checked]
```
- Pros: Step-by-step verification
- Cons: May be overkill for simple tasks

**Decision:** Option B - Show acceptance criteria, then simple yes/no. Helpful reminder without added friction.

---

## Files to Modify

### New Files

| File | Description |
|------|-------------|
| `apps/kanban/src/content/skills/kanban-check/SKILL.md` | Merged skill combining codecheck + approve |

### Files to Delete

| File | Reason |
|------|--------|
| `apps/kanban/src/content/skills/kanban-codecheck/SKILL.md` | Merged into kanban-check |
| `apps/kanban/src/content/skills/kanban-approve/SKILL.md` | Merged into kanban-check |

### Files to Update

| File | Change |
|------|--------|
| `apps/kanban/src/content/workflow.yaml` | Remove `qa` column, rename `codecheck` → `check`, update transitions: `check: [update-docs, in-progress]` |
| `.kanban/workflow.yaml` | Same as above (runtime copy) |
| `.kanban/config.yaml` | Rename `kanban-codecheck` → `kanban-check`, remove `kanban-approve` |
| `apps/kanban/src/content/skills/kanban-rework/SKILL.md` | Change `qa` → `check` in status checks (lines 45, 62-66, 232, 256) |
| `apps/kanban/src/content/skills/kanban-implement/SKILL.md` | Change `codecheck` → `check` status, `/kanban-codecheck` → `/kanban-check` |
| `apps/kanban/src/content/skills/kanban-docs/SKILL.md` | Change `qa` → `check` and `/kanban-approve` → `/kanban-check` (lines 73-74) |
| `apps/kanban/src/content/skills/kanban-overview/SKILL.md` | Update `codecheck` → `check`, remove `qa` branch, update next step suggestions |
| `apps/kanban/src/content/skills/kanban-directive/SKILL.md` | Change `kanban-codecheck` → `kanban-check` (lines 415, 538, 544, 549, 557) |
| `apps/vscode/src/types/task-types.ts` | Remove `'qa'` from TaskStatus, rename `'codecheck'` → `'check'` |
| `apps/vscode/src/computers/task-grouping.computer.ts` | Remove `qa` column, rename `codecheck` → `check` |
| `apps/vscode/src/computers/task-actions.computer.ts` | Remove `qa` case, update `codecheck` case → `check` with `/kanban-check` command |
| `apps/vscode/src/capabilities/tasks-view.capability.ts` | Remove `qa` icon case, rename `codecheck` → `check` |

---

## Implementation Steps

### Step 1: Create kanban-check skill

Create `apps/kanban/src/content/skills/kanban-check/SKILL.md` with merged functionality:

**Frontmatter:**
```yaml
---
name: kanban-check
description: Run code checks, verify requirements, prompt for QA, and commit. Combines automated verification with human approval.
allowed-tools: Read, Write, Bash(*), AskUserQuestion
argument-hint: "[task-id]"
disable-model-invocation: true
---
```

**Process steps (in order):**

1. `load_workflow` - Load workflow.yaml
2. `get_task_id` - Get task ID from args or prompt (status: `check`)
3. `read_task_file` - Read task.xml, verify status is `check`
4. `verify_branch` - Verify on `task/{id}` branch
5. `read_plan_file` - Read plan.xml, verify all tasks completed
6. `load_check_directives` - Load directives from config.yaml (`directives.kanban-check`)
7. `run_checks` - Execute each directive (command/pattern/checklist), fix/retry loop
8. `read_spec` - Read spec.xml for requirements (moved from earlier position per Q4 decision)
9. `verify_requirements_met` - Trace FRs to implementation, check for gaps
10. `prompt_qa_confirmation` - **NEW: Only reached after all automated checks pass**
    - Show task title and acceptance criteria
    - Ask: "Have you tested the application and verified it meets acceptance criteria?"
    - Options: Yes (proceed to commit), No (suggest /kanban-rework)
11. `check_uncommitted_changes` - Verify there are changes to commit
12. `determine_commit_type` - Get commit type from task labels (feat/fix/refactor/docs)
13. `move_to_update_docs` - Update task.xml: `status: check` → `status: update-docs`
14. `stage_and_commit` - Stage all files, commit with `{type}({id}): {title}`
15. `directive_compliance` - Run any approval directives
16. `output_result` - Show commit hash, next steps (`/kanban-docs`)

**Key differences from original skills:**

| Aspect | kanban-codecheck (old) | kanban-approve (old) | kanban-check (new) |
|--------|------------------------|----------------------|-------------------|
| Entry status | `codecheck` | `qa` | `check` |
| Exit status | `qa` | `update-docs` | `update-docs` |
| Runs directives | Yes | No | Yes |
| QA prompt | No | Yes | Yes (after directives pass) |
| Commits code | No | Yes | Yes |

---

### Step 2: Update workflow.yaml files

**Both files need identical changes:**
- `apps/kanban/src/content/workflow.yaml`
- `.kanban/workflow.yaml`

**Rename codecheck column to check:**
```yaml
# BEFORE:
  - id: codecheck
    name: Code Check
    description: Implementation complete, ready for code checks

# AFTER:
  - id: check
    name: Check
    description: Verification phase - automated checks, requirements, and QA
```

**Remove qa column:**
```yaml
# DELETE these lines:
  - id: qa
    name: QA
    description: Human tests the application works as expected
```

**Update transitions:**
```yaml
# BEFORE:
  in-progress: [codecheck]
  codecheck: [qa]
  qa: [update-docs, in-progress]  # approve or rework

# AFTER:
  in-progress: [check]
  check: [update-docs, in-progress]  # check passes or rework
```

**Update update-docs description (optional):**
```yaml
  - id: update-docs
    name: Update Docs
    description: Checks passed, code committed, documentation needs updating
```

---

### Step 3: Update config.yaml

**File:** `.kanban/config.yaml`

```yaml
# BEFORE:
directives:
  kanban-codecheck:
    - check-kanban
    - check-vscode
    - code-review
  kanban-approve: []

# AFTER:
directives:
  kanban-check:
    - check-kanban
    - check-vscode
    - code-review
```

Remove `kanban-approve` and `kanban-codecheck` entries entirely. Add `kanban-check`.

---

### Step 4: Update kanban-rework skill

**File:** `apps/kanban/src/content/skills/kanban-rework/SKILL.md`

**Changes:**
1. Description (line 3): Change "QA or PR" to "Check or PR"
2. Context note (lines 20-25): Change `qa → in-progress` to `check → in-progress`
3. get_task_id step (line 45): Change `qa` to `check` in status list
4. read_task_file step (lines 62-66): Change `qa` to `check` in validation
5. update_plan_with_iteration (line 232): Change `qa` to `check` in phase mapping
6. move_to_in_progress (line 256): Change `qa` to `check`
7. output_result (line 291): Change `/kanban-codecheck` to `/kanban-check`
8. next_steps (line 491): Change `/kanban-codecheck` to `/kanban-check`

---

### Step 5: Update kanban-implement skill

**File:** `apps/kanban/src/content/skills/kanban-implement/SKILL.md`

**Changes:**
- All status references: `codecheck` → `check`
- All command references: `/kanban-codecheck` → `/kanban-check`
- Specific locations: check_completion step, output_result step, examples, next_steps

---

### Step 6: Update kanban-docs skill

**File:** `apps/kanban/src/content/skills/kanban-docs/SKILL.md`

**Changes:**
- Line 73: Change `status is qa` to `status is check`
- Line 74: Change `/kanban-approve` to `/kanban-check`

---

### Step 7: Update kanban-overview skill

**File:** `apps/kanban/src/content/skills/kanban-overview/SKILL.md`

**Changes:**
- Change all `codecheck` status references to `check`
- Change `/kanban-codecheck` to `/kanban-check`
- Remove the `qa` status branch entirely
- Change `/kanban-approve` to `/kanban-check` in examples

The `check` status now means "run /kanban-check to verify and commit".

---

### Step 8: Update kanban-directive skill

**File:** `apps/kanban/src/content/skills/kanban-directive/SKILL.md`

**Changes:**
- Line 415: Change `kanban-codecheck` label to `kanban-check`
- Line 538: Change `kanban-codecheck` to `kanban-check` in example
- Line 544: Change `kanban-codecheck` to `kanban-check` in example
- Line 549: Change `kanban-codecheck` to `kanban-check` in example
- Line 557: Change `/kanban-codecheck` to `/kanban-check` in example

---

### Step 9: Update VSCode extension

**File:** `apps/vscode/src/types/task-types.ts`

```typescript
// BEFORE:
export type TaskStatus =
  | 'backlog'
  | 'scoped'
  | 'planned'
  | 'in-progress'
  | 'codecheck'
  | 'qa'
  | 'update-docs'
  | 'pr'
  | 'done';

// AFTER:
export type TaskStatus =
  | 'backlog'
  | 'scoped'
  | 'planned'
  | 'in-progress'
  | 'check'
  | 'update-docs'
  | 'pr'
  | 'done';
```

**File:** `apps/vscode/src/computers/task-grouping.computer.ts`

```typescript
// BEFORE:
const COLUMNS: TaskColumn[] = [
  { id: 'in-progress', name: 'In Progress', open: true },
  { id: 'codecheck', name: 'Code Check', open: true },
  { id: 'qa', name: 'QA', open: true },
  // ...
];

// AFTER:
const COLUMNS: TaskColumn[] = [
  { id: 'in-progress', name: 'In Progress', open: true },
  { id: 'check', name: 'Check', open: true },
  // ... (qa line removed)
];
```

**File:** `apps/vscode/src/computers/task-actions.computer.ts`

```typescript
// BEFORE:
case 'codecheck':
  return [
    {
      label: 'Run Checks',
      command: buildCommand('codecheck', id),
      description: 'Run configured checks',
    },
  ];

case 'qa':
  return [
    {
      label: 'Approve',
      command: buildCommand('approve', id),
      description: 'QA passed, commit code',
    },
    {
      label: 'Rework',
      command: buildCommand('rework', id),
      description: 'Send back for fixes',
    },
  ];

// AFTER:
case 'check':
  return [
    {
      label: 'Check',
      command: buildCommand('check', id),
      description: 'Run checks, QA, and commit',
    },
    {
      label: 'Rework',
      command: buildCommand('rework', id),
      description: 'Send back for fixes',
    },
  ];
// (qa case removed entirely)
```

**File:** `apps/vscode/src/capabilities/tasks-view.capability.ts`

```typescript
// BEFORE:
case 'codecheck':
  return new vscode.ThemeIcon('beaker');
case 'qa':
  return new vscode.ThemeIcon('checklist');

// AFTER:
case 'check':
  return new vscode.ThemeIcon('checklist');  // or 'beaker' - choose one
// (qa case removed)
```

---

### Step 10: Delete old skill directories

```bash
rm -rf apps/kanban/src/content/skills/kanban-codecheck/
rm -rf apps/kanban/src/content/skills/kanban-approve/
```

---

## Testing Plan

### Manual Testing Scenarios

**Scenario 1: Happy path - all checks pass, QA approved**
1. Create a task and move it to `check` status
2. Run `/kanban-check {id}`
3. Verify: Directives run first
4. Verify: Requirements traced after directives pass
5. Verify: QA prompt appears with acceptance criteria
6. Select "Yes" for QA
7. Verify: Code is committed with correct commit type
8. Verify: Task status is `update-docs`
9. Verify: Next step shows `/kanban-docs`

**Scenario 2: Directive check fails, user fixes**
1. Have a task with failing typecheck
2. Run `/kanban-check {id}`
3. Verify: Directive fails with error output
4. Select "Yes" to fix
5. Verify: Fix is applied
6. Verify: Checks restart from beginning
7. Verify: After all pass, QA prompt appears

**Scenario 3: QA fails, user reworks**
1. Run `/kanban-check {id}` with passing checks
2. At QA prompt, select "No"
3. Verify: Suggests `/kanban-rework {id}`
4. Run `/kanban-rework {id}`
5. Verify: Task accepts `check` status (not just old `qa`)
6. Verify: Task moves to `in-progress`

**Scenario 4: Rework from PR still works**
1. Move task to `pr` status manually
2. Run `/kanban-rework {id}`
3. Verify: PR is closed
4. Verify: Task moves to `in-progress`

**Scenario 5: No directives configured**
1. Remove all directives from config.yaml for kanban-check
2. Run `/kanban-check {id}`
3. Verify: "No code checks configured" message
4. Verify: Proceeds directly to requirement verification
5. Verify: Then proceeds to QA prompt

### Validation Checklist

- [ ] `/kanban-check` command is recognized
- [ ] `/kanban-codecheck` command no longer exists
- [ ] `/kanban-approve` command no longer exists
- [ ] `qa` status no longer appears in workflow
- [ ] `codecheck` renamed to `check` in workflow
- [ ] `/kanban-rework` accepts `check` status
- [ ] `/kanban-implement` suggests `/kanban-check` as next step
- [ ] `/kanban-overview` shows correct next steps for `check` status
- [ ] Config.yaml has `kanban-check` directive mapping
- [ ] All examples in skills use `/kanban-check` (not codecheck/approve)
- [ ] VSCode extension compiles without type errors
- [ ] VSCode sidebar shows `Check` column (not `Code Check` or `QA`)
- [ ] VSCode task actions show `/kanban-check` for tasks in `check` status

---

## Summary of Decisions

| Question | Decision |
|----------|----------|
| Skill name | `kanban-check` |
| Status columns | Remove `qa`, rename `codecheck` → `check` |
| kanban-rework | Update to accept `check` status instead of `qa` |
| Execution order | Directives first, then requirements verification |
| QA prompt | Show acceptance criteria, then simple yes/no |

## New Workflow

```
Before: implement → codecheck → qa → approve → update-docs
After:  implement → check → update-docs
                    └─ directives → requirements → QA prompt → commit
```

---

## Appendix A: Full kanban-check SKILL.md Content

```markdown
---
name: kanban-check
description: Run code checks, verify requirements, prompt for QA, and commit. Combines automated verification with human approval.
allowed-tools: Read, Write, Bash(*), AskUserQuestion
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Check Kanban Task

<purpose>
Run automated code checks using directives, verify requirements are met, prompt for human QA, and commit the code. This skill combines the verification and approval phases into a single command.
</purpose>

<context>
{{> directory-reference}}

{{> helper-scripts show_find_task=true show_find_plan=true show_get_date_time=true show_get_skill_config=true}}

{{> column-transition from="check" to="update-docs"}}

<note>
**This skill is an orchestrator.** It runs whatever check directives the user has configured in `.kanban/config.yaml`, verifies requirements are met, then prompts for human QA before committing.
</note>
</context>

<prohibited>
- Do not skip configured checks
- Do not mark checks as passed when they fail
- Do not commit without QA confirmation from user
- Do not use invented commit types like `kanban(...)` — valid types are: `feat`, `fix`, `refactor`, `docs`
- Do not auto-fix without asking the user first
- Do not commit sensitive files (.env, credentials)
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
      <action>List tasks in `check` status from `.kanban/tasks/`</action>
      <action>Use AskUserQuestion tool with:
        - header: "Task"
        - question: "Which task would you like to check?"
        - options: Build from task list (up to 4 tasks in check status), each with:
          - label: "{taskId}: {short title}" (truncate title if needed)
          - description: "Ready for verification"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a task ID directly</note>
    </branch>
  </step>

  <step name="read_task_file" outputs="taskPath, title, labels, acceptanceCriteria">
    <command>node .kanban/scripts/find-task.cjs {taskId}</command>
    <action>Read the file at the `path` from JSON output</action>
    <action>Parse XML</action>
    <validate>Verify status is `check`</validate>
    <branch condition="status is not check">
      <action>Use AskUserQuestion tool with:
        - header: "Continue?"
        - question: "Task is in {status} status. Expected: check. Continue anyway?"
        - options:
          - label: "Yes", description: "Proceed despite unexpected status"
          - label: "No", description: "Cancel and check task status first"
        - multiSelect: false
      </action>
    </branch>
    <action>Extract title, labels, and acceptance-criteria for later use</action>
    <branch condition="task not found">
      <output>Error: Task not found</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="verify_branch">
    {{> branch-verify-task}}
  </step>

  <step name="read_plan_file" outputs="planPath">
    <command>node .kanban/scripts/find-plan.cjs {taskId}</command>
    <action>Read the plan at the `path` from JSON output</action>
    <validate>Verify all implementation tasks have completed="true"</validate>
    <branch condition="any uncompleted tasks">
      <action>Use AskUserQuestion tool with:
        - header: "Incomplete"
        - question: "Plan has incomplete tasks. Run checks anyway?"
        - options:
          - label: "Yes", description: "Proceed despite incomplete plan tasks"
          - label: "No", description: "Cancel and complete remaining tasks first"
        - multiSelect: false
      </action>
    </branch>
  </step>

  <step name="load_check_directives" outputs="checkDirectives, hasChecks">
    <action>Read `.kanban/config.yaml`</action>
    <action>Find `directives.kanban-check` array</action>
    <branch condition="directives array is empty or not defined">
      <action>Set hasChecks = false</action>
      <output>No code checks configured.</output>
      <note>Proceeding without automated checks</note>
    </branch>
    <branch condition="directives array has entries">
      <action>Set hasChecks = true</action>
      <action>For each directive name: read `.kanban/directives/{name}.xml`</action>
    </branch>
  </step>

  <step name="run_checks">
    <note>
**For each check directive, determine type and execute:**

```
for each directive in checkDirectives:
    Print: "Running check: {directive name}..."

    # Determine check type from directive XML
    if directive contains type="command":
        Execute the command from <run> element
        if exit code == 0:
            Print "PASS: {directive name}"
            continue to next directive
        else:
            issues = command error output

    else if directive contains type="pattern":
        Scan files matching glob for forbidden/required patterns
        if no violations:
            Print "PASS: {directive name}"
            continue to next directive
        else:
            issues = list of pattern violations

    else if directive contains type="checklist":
        Review code against checklist items
        if all items satisfied:
            Print "PASS: {directive name}"
            continue to next directive
        else:
            issues = unsatisfied items

    # Handle failure
    Print "FAIL: {directive name}"
    Print issues

    Use AskUserQuestion tool with:
        - header: "Fix?"
        - question: "Check failed. Should I try to fix these issues?"
        - options:
          - label: "Yes (Recommended)", description: "Attempt to fix the issues automatically"
          - label: "No", description: "Exit and fix manually"
        - multiSelect: false

    if user selects Yes:
        Analyze the issues
        Make code changes to fix

        # Log attempt to plan
        Add to <iterations> section:
            <iteration phase="check" date="{YYYY-MM-DD}">
              <fix directive="{name}">{description of fix}</fix>
            </iteration>

        # Commit the fix
        git add {changed files}
        git commit -m "docs({taskId}): check-retry - {title}"

        # Restart all checks from beginning
        break and restart loop

    if user selects No:
        Print: "Exiting. Fix issues manually and re-run /kanban-check {taskId}"
        Exit

# If we get here, all checks passed
Print "All automated checks passed!"
```
    </note>
  </step>

  <step name="read_spec" outputs="functionalRequirements">
    <action>Get spec path from plan.xml's spec attribute</action>
    <action>Read spec file at `.kanban/tasks/{taskId}/spec.xml`</action>
    <action>Extract functional requirements (FR1, FR2, etc.)</action>
  </step>

  <step name="verify_requirements_met">
    <note>Before prompting for QA, verify spec requirements are addressed</note>

    <action name="trace_requirements">
      <action>For each functional requirement:</action>
      <action>1. Identify the code change that addresses it</action>
      <action>2. Verify the code is not a stub (no TODO/placeholder)</action>
      <action>3. Verify the code is reachable (wired into the application)</action>
    </action>

    <branch condition="gaps found">
      <output>
**Requirement Gaps Detected**

The following requirements may not be fully implemented:
{list gaps with details}
      </output>

      <action>Use AskUserQuestion with:
        - header: "Gaps found"
        - question: "Some requirements may have gaps. How to proceed?"
        - options:
          - label: "Return to implement", description: "Go back and address the gaps"
          - label: "Proceed with QA", description: "Gaps are acceptable, continue to QA"
        - multiSelect: false
      </action>

      <branch condition="user says return to implement">
        <action>Update task status back to in-progress</action>
        <output>Run /kanban-implement {taskId} to address gaps</output>
        <action>Exit</action>
      </branch>
    </branch>

    <branch condition="all requirements traced">
      <output>All requirements verified.</output>
    </branch>
  </step>

  <step name="prompt_qa_confirmation">
    <note>Only reached after all automated checks pass</note>

    <output>
**All automated checks passed!**

Now it's time to manually test the implementation.

**Task:** {taskId} - {title}

**Acceptance Criteria:**
{acceptance-criteria from task.xml, formatted as list}
    </output>

    <action>Use AskUserQuestion tool with:
      - header: "QA Passed?"
      - question: "Have you tested the application and verified it meets the acceptance criteria above?"
      - options:
        - label: "Yes", description: "QA passed, ready to commit and move to Update Docs"
        - label: "No", description: "Issues found, need to document and rework"
      - multiSelect: false
    </action>

    <branch condition="user selects No">
      <output>
Use `/kanban-rework {taskId}` to document issues and return to implementation.
      </output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="check_uncommitted_changes" outputs="changedFiles">
    <command>git status</command>
    <command>git diff --name-only</command>
    <output>Display files that will be committed</output>
    <branch condition="no changes found">
      <output>Warning: No uncommitted changes to commit.</output>
      <action>Use AskUserQuestion tool with:
        - header: "Proceed?"
        - question: "No uncommitted changes found. Proceed anyway (just move status)?"
        - options:
          - label: "Yes", description: "Continue and move task to Update Docs"
          - label: "No", description: "Cancel and investigate missing changes"
        - multiSelect: false
      </action>
    </branch>
  </step>

  <step name="determine_commit_type" outputs="commitType">
    <action>Check task labels array</action>
    <branch condition="contains `bug`">
      <action>type = `fix`</action>
    </branch>
    <branch condition="contains `refactor`">
      <action>type = `refactor`</action>
    </branch>
    <branch condition="contains `docs`">
      <action>type = `docs`</action>
    </branch>
    <branch condition="contains `feature` or default">
      <action>type = `feat`</action>
    </branch>
  </step>

  <step name="move_to_update_docs">
    <note>Update status before commit so it's included</note>
    <action>Change `status: check` to `status: update-docs`</action>
    <command>node .kanban/scripts/get-date-time.cjs</command>
    <action>Add `updated: {YYYY-MM-DD}` from output</action>
    <action>Write updated task file</action>
  </step>

  <step name="stage_and_commit">
    <note>Format: `{commitType}({taskId}): {title}`</note>
    <warning>Valid commit types: `feat`, `fix`, `refactor`, `docs`</warning>

    <action>Stage implementation files AND .kanban files together</action>
    <command>git add {implementation files}</command>
    <command>git add .kanban/</command>
    <note>`.kanban` files MUST be included — they accumulate status and plan changes</note>
    <command>git commit -m "{commitType}({taskId}): {title}"</command>
  </step>

  {{> directive-compliance}}

  <step name="output_result">
    <output>Print commit hash and message</output>
    <output>Print: "Task {taskId} moved to Update Docs"</output>
    <output>
**Checks passed, QA approved, code committed!**

Next: Update documentation
```
/clear
/kanban-docs {taskId}
```
    </output>
    {{> skill-complete}}
  </step>
</process>

<success_criteria>
- Task exists at `.kanban/tasks/{taskId}/task.xml`
- Plan exists at `.kanban/tasks/{taskId}/plan.xml`
- All directive checks passed
- User confirmed QA passed
- Task status is `update-docs`
- Git log shows appropriate commit type (`feat`, `fix`, `refactor`, or `docs`) with `({taskId}):`
- Next steps shown to user
</success_criteria>

<example>
**All Checks Pass, QA Approved:**

User: `/kanban-check 001`

```
Checking task 001 "Add user authentication"...

Loading check directives from config.yaml...
- check-typescript
- check-tests
- code-review

Running check: TypeScript...
PASS: TypeScript

Running check: Tests...
PASS: Tests

Running check: Code Review...
PASS: Code Review

All automated checks passed!

Verifying requirements...
- FR1: Login endpoint ✓
- FR2: JWT token generation ✓
- FR3: Password hashing ✓
All requirements verified.

**All automated checks passed!**

Now it's time to manually test the implementation.

**Task:** 001 - Add user authentication

**Acceptance Criteria:**
- Given a user enters valid credentials, when they click login, then they are authenticated
- Given a user enters invalid credentials, when they click login, then they see an error

[User selects "Yes" - QA passed]

Staging files:
- src/routes/auth.ts
- src/middleware/jwt.ts
- src/types/auth.ts
- .kanban/tasks/001/task.xml
- .kanban/tasks/001/plan.xml

Commit type: feat (from feature label)

Commit: e5f6g7h feat(001): Add user authentication

Task 001 moved to Update Docs

**Checks passed, QA approved, code committed!**

Next:
/clear
/kanban-docs 001
```
</example>

<example>
**Check Fails, User Fixes:**

User: `/kanban-check 001`

```
Checking task 001 "Add user authentication"...

Running check: TypeScript...
FAIL: TypeScript

Error output:
  src/routes/auth.ts:45:10 - error TS2345: Argument of type 'string' is not assignable

[User selects "Yes" to fix issues]

Analyzing failure...
Found issue: Type mismatch in auth handler
Fixing: Adding type assertion in src/routes/auth.ts:45

Committing fix...
Commit: a1b2c3d docs(001): check-retry - Add user authentication

Restarting checks...

Running check: TypeScript...
PASS: TypeScript

Running check: Tests...
PASS: Tests

All automated checks passed!

[QA prompt and commit flow continues...]
```
</example>

<example>
**QA Failed:**

User: `/kanban-check 001`

```
[All checks pass...]

**All automated checks passed!**

**Task:** 001 - Add user authentication

**Acceptance Criteria:**
- Given a user enters valid credentials...

[User selects "No" - issues found]

Use `/kanban-rework 001` to document issues and return to implementation.
```
</example>

<next_steps>
After checks pass and code is committed:
```
/clear
/kanban-docs {id}
```

If issues are found during QA:
```
/clear
/kanban-rework {id}
```
</next_steps>
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-02-24 | Added Appendix A with full kanban-check skill content |
| 2026-02-24 | Added VSCode extension updates (Step 9) |
| 2026-02-24 | Renamed `codecheck` status to `check` for consistency |
| 2026-02-24 | Finalized all decisions, added implementation steps and testing plan |
| 2026-02-24 | Initial draft with open questions |
