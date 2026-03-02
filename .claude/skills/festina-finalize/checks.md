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
   - List them to user
   - Use AskUserQuestion: "Plan has incomplete tasks. Run checks anyway?"
   - Options: Yes (proceed) / No (cancel)
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
2. Extract <forbidden> and/or <required> patterns
3. Scan matching files:
   - For <forbidden>: Fail if pattern found
   - For <required>: Fail if pattern NOT found
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

4. **Commit the fix**:
```bash
git add {changed files}
git commit -m "docs({taskId}): check-retry - {title}"
```

5. **Restart ALL checks from the beginning** - This ensures the fix didn't break something else

### If user selects "Skip":

Continue to the next directive check. The skip is logged but no changes are made.

### If user selects "Abort":

```
Print: "Exiting. Fix issues manually and re-run /festina-finalize {taskId}"
Exit the skill
```

## 4. Check Uncommitted Changes

After checks pass, verify there's code to commit:

```
1. Run: git status
2. Run: git diff --name-only
3. Display files that will be committed
4. If NO changes found:
   - Output: "Warning: No uncommitted changes to commit."
   - Use AskUserQuestion:
     - header: "Proceed?"
     - question: "No uncommitted changes found. Proceed anyway?"
     - options:
       - label: "Yes", description: "Continue to documentation phase"
       - label: "No", description: "Cancel and investigate"
   - If No: Exit
```

## 5. Determine Commit Type

The commit type is derived from task labels:

| Label Contains | Commit Type |
|----------------|-------------|
| `bug`          | `fix`       |
| `refactor`     | `refactor`  |
| `docs`         | `docs`      |
| `feature` (or default) | `feat` |

```
1. Read task's <labels> element
2. Check for label matches in priority order:
   - If contains "bug" → type = "fix"
   - If contains "refactor" → type = "refactor"
   - If contains "docs" → type = "docs"
   - Otherwise → type = "feat"
3. Store type for commit message
```

## 6. Commit Implementation

Stage and commit all implementation files:

```bash
# Stage implementation files (from plan's files list)
git add {implementation files from plan.xml}

# ALWAYS include .festinalente/ - it tracks task state
git add .festinalente/

# Commit with conventional commit format
git commit -m "{type}({taskId}): {title}"
```

**Example commits:**
- `feat(001): Add user authentication`
- `fix(002): Resolve login redirect bug`
- `refactor(003): Simplify database queries`

**CRITICAL:**
- Valid types are ONLY: `feat`, `fix`, `refactor`, `docs`
- NEVER use invented types like `festina(...)` or `task(...)`
- ALWAYS include `.festinalente/` files in the commit

## Summary Flow

```
1. Verify plan completion
   └─ If incomplete: prompt user

2. Load directives for finalize phase

3. For each directive:
   ├─ Run check by type
   ├─ If PASS: continue
   └─ If FAIL:
       ├─ Fix → make changes, log, commit, RESTART
       ├─ Skip → continue to next
       └─ Abort → exit

4. Check uncommitted changes
   └─ If none: prompt user

5. Determine commit type from labels

6. Commit: {type}({taskId}): {title}

7. Proceed to Phase 2 (Documentation)
```
