# Plan: Fix Skill Execution Issues

## Problem Summary

Two issues were identified during the kanban workflow execution:

1. **Plan file not committed**: The LLM did not commit the plan file during `/kanban:plan`, even though the skill explicitly instructs this in Step 11 and validates it.

2. **Unnecessary info written to task file**: After `/kanban:verify` passed, the LLM wrote verification success information to the task file, which should only go to the plan file's `## Iterations` section.

---

## Current State Analysis

### Issue 1: Plan Not Committed

**What the skill says (kanban-plan, Step 11):**
```bash
git add .kanban/plans/{id}-{slug}.plan.md .kanban/tasks/{id}-*.md
git commit -m "docs({id}): plan - {title}"
```

**Validation requirement:**
- `[ ] Git log shows docs({id}): plan -`

**Observed behavior:** The LLM did not execute the commit.

**User clarification:** The LLM didn't even try to commit — it skipped the step entirely.

**Root cause hypothesis:** The instruction exists but isn't emphatic enough. The LLM likely:
- Completed the "write files" step
- Then jumped to the "Confirm" step without executing the commit

**Open questions:**
- Q2: Is the instruction sufficiently explicit, or could it be misinterpreted?
- Q3: Should the skill use stronger language or structural enforcement?

---

### Issue 2: Verify Writing to Task File

**What the skill says (kanban-verify, Step 8):**
- Update task status to `qa` and add `updated: {YYYY-MM-DD}` — **this goes to task file**
- Log success to `## Iterations` section — **this goes to plan file**

**Observed behavior:** The LLM wrote verification pass info to the task file.

**User clarification:**
- LLM wrote something like "checks passed" info to the task file
- User does NOT want any logging to task file on success
- Task file should ONLY get: status change to `qa` and `updated: YYYY-MM-DD`

**Root cause hypothesis:** The current skill says "Log success to plan's ## Iterations section" but the LLM:
- Either misread "plan" as "task"
- Or decided to log to both files
- The instruction conflates "update task file" with "log to plan file" in the same step

**Open questions:**
- Q5: Should we separate the task update and plan logging into distinct steps?
- Q6: Should we explicitly state "DO NOT add verification logs to task file"?

---

## Socratic Discussion Points

### To resolve these issues, we need to answer:

1. **Why did the LLM skip the commit step?**
   - Was it a context window issue?
   - Was the instruction buried or unclear?
   - Does the skill need explicit "STOP AND COMMIT" markers?

2. **Why did the LLM write to the wrong file?**
   - Was the instruction ambiguous?
   - Should we use file paths explicitly in the instruction?

3. **What enforcement mechanisms should we add?**
   - More explicit instructions?
   - Better separation of "write to X" vs "write to Y"?
   - Required confirmation steps?

---

## Investigation Status

- [x] Read kanban-plan SKILL.md
- [x] Read kanban-verify SKILL.md
- [x] Read task template
- [x] Read plan template
- [x] Clarify exact content written to task file — verification pass info (unwanted)
- [x] Determine root cause of commit skip — LLM skipped step entirely
- [x] Identify all skills with commit steps (12 skills)
- [x] Identify all skills with validation sections (16 skills)
- [x] Finalize solution approach

---

## Agreed Solution Approach

Based on discussion, we will use two techniques:

### Technique 1: Emphatic Markers (CRITICAL/MANDATORY)

Add strong emphasis to critical steps that must not be skipped. Pattern:

```markdown
## **CRITICAL: Step Title**

**This step is MANDATORY. Do not proceed without completing it.**

{instructions}

**If this fails, stop and report the error. Do not skip this step.**
```

### Technique 2: Explicit Negative Instructions (DO NOT)

Add clear "DO NOT" statements to prevent unwanted behavior. Pattern:

```markdown
**DO NOT** add X to Y.
**DO NOT** skip this step.
**ONLY** do X, nothing else.
```

### NOT Using: Step Splitting

We will NOT split compound steps into separate steps. Keep the flow concise.

---

## Implementation Steps

### Change Type A: Add CRITICAL/MANDATORY to ALL commit steps

Apply to these 11 skills that have commit steps:

| # | Skill | Commit Format |
|---|-------|---------------|
| 1 | `kanban-create` | `docs({id}): create - {title}` |
| 2 | `kanban-refine` | `docs({id}): refine - {title}` |
| 3 | `kanban-scope` | `docs({id}): scope - {title}` |
| 4 | `kanban-plan` | `docs({id}): plan - {title}` |
| 5 | `kanban-save` | `wip({id}): {progress summary}` |
| 6 | `kanban-verify` | `docs({id}): verify-retry - {title}` (on retry only) |
| 7 | `kanban-approve` | `{type}({id}): {title}` |
| 8 | `kanban-docs` | `docs({id}): product - {description}` |
| 9 | `kanban-merge` | `docs({id}): done - {title}` |
| 10 | `kanban-rework` | `docs({id}): rework - {title}` |
| 11 | `kanban-map-product` | `docs: map-product - {summary}` |
| 12 | `kanban-define-product` | `docs: define-product - {description}` |

**Pattern to apply:**

Change from:
```markdown
N. **Commit {description}**:
    ```bash
    git add ...
    git commit -m "..."
    ```
```

Change to:
```markdown
N. **CRITICAL: Commit {description}**:

    **This step is MANDATORY. Do not proceed without committing.**

    ```bash
    git add ...
    git commit -m "..."
    ```

    **DO NOT skip this step. If the commit fails, stop and report the error.**
```

---

### Change Type B: Add STOP marker to ALL validation sections

Apply to all 16 skills.

**Pattern to apply:**

Change from:
```markdown
## Validation

All must pass. If any fail, fix and retry.

- [ ] ...
```

Change to:
```markdown
## Validation

**STOP. You MUST verify ALL items pass before declaring success. Do not skip validation.**

All must pass. If any fail, fix and retry.

- [ ] ...
```

---

### Change Type C: kanban-verify specific changes

**File:** `.claudeban/skills/kanban-verify/SKILL.md`

#### C1: Add negative instructions for task file (Step 8)

After the "Auto-advance to QA" section, add:

```markdown
   **IMPORTANT: Task file changes are ONLY:**
   - `status: qa`
   - `updated: {YYYY-MM-DD}`

   **DO NOT add verification results, check names, pass/fail logs, or any other content to the task file.**
```

#### C2: Remove success logging to plan file

Remove this entire block from Step 8:
```markdown
   - Log success to plan's ## Iterations section:
     ```markdown
     ### Attempt {n} — Verify Passed ({YYYY-MM-DD})
     **Phase:** checks
     **Result:** passed
     **Attempts:** {number of attempts taken}

     All checks passed:
     - {check 1}: PASS
     - {check 2}: PASS
     ```
```

Only log to plan file on FAILURE (which is already handled in Step 7).

---

## Summary of All Changes

| Skill | Change Type A (Commit) | Change Type B (Validation) | Change Type C (Verify-specific) |
|-------|------------------------|----------------------------|--------------------------------|
| kanban-create | Yes | Yes | — |
| kanban-refine | Yes | Yes | — |
| kanban-scope | Yes | Yes | — |
| kanban-plan | Yes | Yes | — |
| kanban-implement | — | Yes | — |
| kanban-save | Yes | Yes | — |
| kanban-verify | Yes (retry only) | Yes | C1 + C2 |
| kanban-approve | Yes | Yes | — |
| kanban-docs | Yes | Yes | — |
| kanban-merge | Yes | Yes | — |
| kanban-rework | Yes | Yes | — |
| kanban-map-product | Yes | Yes | — |
| kanban-define-product | Yes | Yes | — |
| kanban-init | — | Yes | — |
| kanban-status | — | Yes | — |
| kanban-view | — | Yes | — |

**Total changes:**
- 12 skills get Change Type A (commit emphasis)
- 16 skills get Change Type B (validation emphasis)
- 1 skill gets Change Type C (verify-specific fixes)

---

## Decision Log

| Question | Decision | Rationale |
|----------|----------|-----------|
| Add CRITICAL markers to commit steps? | Yes | LLM skipped commit entirely; needs emphasis |
| Add DO NOT negative instructions? | Yes | Prevents unwanted behavior explicitly |
| Split compound steps? | No | Keep flow concise |
| Apply to all skills? | Yes | Consistency across the system |
| Log success to plan file? | No | Only log failures; success needs no record |
| Strengthen validation sections? | Yes | LLM must verify before declaring success |

---

## Implementation Checklist

When implementing, apply changes in this order:

1. [ ] Change Type B: Add STOP marker to all 16 validation sections
2. [ ] Change Type A: Add CRITICAL/MANDATORY to all 12 commit steps
3. [ ] Change Type C1: Add negative instructions to kanban-verify Step 8
4. [ ] Change Type C2: Remove success logging from kanban-verify Step 8
5. [ ] Test: Run through a complete workflow to verify fixes

---

## Notes

- The root cause of both issues was insufficient emphasis in instructions
- LLMs respond well to CRITICAL, MANDATORY, STOP, and DO NOT markers
- Negative instructions (what NOT to do) are as important as positive instructions
- This fix applies a consistent pattern across all skills for maintainability
