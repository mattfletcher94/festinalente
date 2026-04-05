# Goal Verification Reference

This file contains detailed guidance for the goal-backward verification step of `/festina-finalize`.

## 1. Extract Acceptance Criteria

Before verifying behaviors, extract and translate the acceptance criteria:

```
1. Read the task.xml file for the current task
2. Parse the <acceptance-criteria> element
3. If acceptance-criteria is empty or missing:
   - Warn user: "No acceptance criteria defined in task.xml"
   - Use AskUserQuestion:
     - header: "Missing Acceptance Criteria"
     - question: "No acceptance criteria found. How should I proceed?"
     - options:
       - label: "Skip", description: "Skip goal verification entirely"
       - label: "Define inline", description: "Define acceptance criteria now"
     - multiSelect: false
   - If "Skip": skip goal verification, proceed to Phase 2
   - If "Define inline": let user type criteria, store temporarily
4. For each criterion in acceptance-criteria:
   - Translate into a user-observable behavior statement
   - Format: "When [action], then [expected result]"
   - No code or implementation language — pure user perspective
   - Each statement must have a clear expected outcome
5. Collect all behavior statements into a numbered list
```

Example translation:

```
Criterion: "The system validates input before saving"
Behavior:  "When a user submits invalid input, then the system displays
            a validation error and does not save the data"
```

## 2. Optional Stub Detection (Directive-Driven)

Stub detection is entirely directive-driven. If no directive defines stub-detection patterns, this section is skipped.

```
1. Check loaded directives for a stub-detection section
   - Look for: type, patterns, file globs
2. If NO directive has stub-detection:
   - Print: "No stub detection directive loaded — skipping stub scan"
   - Proceed to Section 3
3. If a directive has stub-detection:
   a. Read plan.xml to get the list of modified files from task <file> elements
   b. For each pattern in the directive's stub-detection section:
      - Scan modified files using Grep with the pattern
      - Collect matches with file:line references
   c. If matches found:
      - Present findings to user with file:line details
      - Use AskUserQuestion:
        - header: "Stub Patterns Detected"
        - question: "Found potential stubs in modified files. How should I proceed?"
        - options:
          - label: "Fix stubs first", description: "Make targeted fixes, then restart from stub scan"
          - label: "Test anyway", description: "Proceed to behavior verification despite stubs"
          - label: "Dismiss", description: "Ignore findings, proceed to verification"
        - multiSelect: false
      - If "Fix stubs first":
        - Make targeted fixes for the detected stubs
        - Restart from the beginning of this section (re-scan)
      - If "Test anyway": proceed to Section 3
      - If "Dismiss": proceed to Section 3
   d. If no matches found:
      - Print: "No stub patterns detected"
      - Proceed to Section 3
```

Example directive stub-detection section:

```xml
<stub-detection>
  <pattern glob="src/**/*.ts">throw new Error\(['"]not implemented['"]\)</pattern>
  <pattern glob="src/**/*.ts">TODO|FIXME|HACK</pattern>
</stub-detection>
```

## 3. Interactive Behavior Verification

Present each observable behavior to the user for interactive verification:

```
1. Present the full numbered list of observable behaviors to the user
2. For each behavior (n of total):
   - Use AskUserQuestion:
     - header: "Verify Behavior {n}/{total}"
     - question: "{behavior statement}"
     - options:
       - label: "YES", description: "Works as described"
       - label: "NO", description: "Doesn't work"
       - label: "DIFFERENT", description: "Works but not as described"
     - multiSelect: false
   - If "DIFFERENT": prompt user for explanation of how it differs
3. Track all responses:
   - Store: behavior index, statement, response, explanation (if DIFFERENT)
4. After all behaviors verified, proceed to Section 4
```

## 4. Handle Results

Evaluate the collected verification responses:

```
1. If ALL responses are YES:
   - Log pass to plan.xml iterations:
     <iteration phase="finalize-goal-verification" date="{YYYY-MM-DD}">
       <result status="pass">All {n} behaviors verified</result>
     </iteration>
   - Proceed to Phase 2 (Documentation)

2. If ANY responses are NO or DIFFERENT:
   - Proceed to Section 5 (Diagnostic Flow)
```

## 5. Diagnostic Flow (NO/DIFFERENT Responses)

When behaviors fail verification, diagnose and resolve:

```
1. Collect all failed behaviors (NO or DIFFERENT responses)
   - Include: behavior statement, response type, user explanation (if DIFFERENT)

2. Read plan.xml to get the list of modified files from task <file> elements

3. Spawn Explore subagent scoped to modified files:
   - Prompt includes:
     - Failed behavior statements
     - User's DIFFERENT explanations (if any)
     - List of modified files from the plan
   - Agent checks for:
     - Missing wiring (exports not imported, handlers not registered)
     - Incomplete logic (early returns, missing branches)
     - Wrong assumptions (incorrect data shapes, wrong API usage)
     - Unwired exports (functions defined but never called)
   - Agent returns structured findings:
     - file, line, issue type, description

4. Present diagnostic findings to user

5. Use AskUserQuestion:
   - header: "Diagnostic Results"
   - question: "How should I proceed with the failed behaviors?"
   - options:
     - label: "Fix now", description: "Make targeted code changes, then re-test failed behaviors"
     - label: "Rework", description: "Exit to /festina-rework with diagnostic findings"
     - label: "Acknowledge", description: "Continue with gaps noted"
   - multiSelect: false
```

### If user selects "Fix now":

```
1. Apply targeted fixes based on diagnostic findings
2. Re-run Section 3 ONLY for the previously failed behaviors (not all behaviors)
3. If all now pass:
   - Proceed as full pass (log pass to iterations, continue to Phase 2)
4. If still failing:
   - Return to diagnostic flow (step 3 above) with remaining failures
```

### If user selects "Rework":

```
1. Print: "Run /festina-rework {taskId}"
   - Include diagnostic findings as structured context
2. Exit the skill
```

### If user selects "Acknowledge":

```
1. Log partial pass to plan.xml iterations:
   <iteration phase="finalize-goal-verification" date="{YYYY-MM-DD}">
     <result status="partial">{n} of {total} behaviors verified. Issues: {summary}</result>
   </iteration>
2. Proceed to Phase 2 (Documentation)
```

### Logging after fix or rework:

```xml
<iteration phase="finalize-goal-verification" date="{YYYY-MM-DD}">
  <result status="partial|rework">{n} of {total} behaviors verified. Issues: {summary}</result>
</iteration>
```

## Summary Flow

```
1. Extract acceptance criteria from task.xml
   └─ If missing: Skip / Define inline

2. Optional stub detection (directive-driven)
   ├─ No directive: skip
   └─ Directive loaded:
       ├─ No matches: continue
       └─ Matches found: Fix stubs / Test anyway / Dismiss

3. Interactive behavior verification
   └─ For each behavior: YES / NO / DIFFERENT

4. Handle results
   ├─ All YES → log pass, proceed to Phase 2
   └─ Any NO/DIFFERENT → diagnostic flow

5. Diagnostic flow
   ├─ Spawn Explore subagent on modified files
   └─ Present findings:
       ├─ Fix now → targeted fixes, re-test failed only
       ├─ Rework → exit to /festina-rework
       └─ Acknowledge → log partial, proceed to Phase 2
```
