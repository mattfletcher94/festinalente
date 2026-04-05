# Phase 1: Validation Reference

This file contains detailed guidance for the validation phase of `/festina-finalize`.

## 1. Verify Plan Completion

Before running checks, verify all implementation tasks are complete:

```
1. Run: node .festinalente/scripts/festinalente.cjs find-plan {taskId}
2. Read the plan.xml at the returned path
3. Parse the <tasks> section
4. For each <task> element:
   - Check if completed="true" exists
   - If NOT: add to incomplete list
5. If incomplete tasks exist:
   - Output WARNING listing incomplete task names
   - Auto-proceed to run checks
```

## 2. Check Execution by Type

Directives define checks with different types. Execute each based on its type:

### type="command"

```
1. Extract the <run> element content
2. Execute the command via Bash
3. Check exit code:
   - 0 = PASS
   - non-zero = FAIL (capture stderr as issues)
```

Example directive:
```xml
<validation type="command" name="TypeScript">
  <run>npx tsc --noEmit</run>
</validation>
```

### type="pattern"

```
1. Extract <glob> pattern to match files
2. Extract <forbidden> pattern
3. Scan matching files:
   - For <forbidden>: Fail if pattern found
4. If no violations: PASS
5. If violations: FAIL (list file:line for each violation)
```

Example directive:
```xml
<validation type="pattern" name="No Console Logs">
  <glob>src/**/*.ts</glob>
  <forbidden>console\.log</forbidden>
</validation>
```

### type="checklist"

```
1. Extract <item> elements from directive
2. For each item:
   - Read relevant code
   - Evaluate if item is satisfied
3. If all items satisfied: PASS
4. If any items unsatisfied: FAIL (list unsatisfied items)
```

Example directive:
```xml
<validation type="checklist" name="Code Review">
  <item>No hardcoded credentials</item>
  <item>Error handling present for async operations</item>
  <item>Input validation on user data</item>
</validation>
```

## 3. Auto-Fix Loop

When a check fails, prompt the user and handle their choice:

```
FAIL: {directive name}

Issues found:
{list issues with details}

Use AskUserQuestion:
  - header: "Fix?"
  - question: "Check failed. How should I proceed?"
  - options:
    - label: "Fix (Recommended)", description: "Attempt to fix the issues automatically"
    - label: "Skip", description: "Continue to next check"
    - label: "Abort", description: "Exit and fix manually"
  - multiSelect: false
```

### If user selects "Fix":

1. **Analyze the issues** - Understand what needs to change
2. **Make code changes** - Fix the identified issues
3. **Log to plan.xml iterations**:

```xml
<iterations>
  <iteration phase="finalize" date="{YYYY-MM-DD}">
    <fix directive="{directive name}">{description of what was fixed}</fix>
  </iteration>
</iterations>
```

4. **Restart ALL checks from the beginning** - This ensures the fix didn't break something else

### If user selects "Skip":

Continue to the next directive check. The skip is logged but no changes are made.

### If user selects "Abort":

```
Print: "Exiting. Fix issues manually and re-run /festina-finalize {taskId}"
Exit the skill
```

## Summary Flow

```
1. Verify plan completion
   └─ If incomplete: warn and auto-proceed

2. Load directives for finalize phase

3. For each directive:
   ├─ Run check by type
   ├─ If PASS: continue
   └─ If FAIL:
       ├─ Fix → make changes, log, RESTART
       ├─ Skip → continue to next
       └─ Abort → exit

4. Spec compliance review (independent Explore agent)
   ├─ PASS → continue
   ├─ PASS WITH NOTES → auto-acknowledge, proceed
   └─ FAIL → Fix / Acknowledge / Rework

5. Proceed to Phase 2 (Documentation)
```
