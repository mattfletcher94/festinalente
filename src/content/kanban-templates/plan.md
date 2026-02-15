---
task: "{id}"
spec: "specs/{id}-{slug}.spec.md"
status: draft|approved|in-progress|completed
created: YYYY-MM-DD
updated: YYYY-MM-DD
generated_by: human|claude
model: {model-name}
version: 1
iteration: 1
---

# Plan: {title}

## Overview
{Brief summary of implementation approach}
{References functional spec for full context}

## Implementation Steps

<!-- Step Guidelines:
1. ATOMIC: Each step = one logical change that leaves codebase working
2. COMPLETE: Understand desired change, definition of done, all sub-steps, all info needed
3. TRACEABLE: Reference specific file(s) and/or FR from spec
4. SEPARABLE: Don't mix concerns - refactoring separate from features
5. TESTABLE: The change can be verified (test, type-check, manual)
-->

- [ ] Step 1: {description} `path/to/file.ts` (FR1)
- [ ] Step 2: {description} `path/to/file.ts` (FR1)
- [ ] Step 3: {description} `path/to/new.ts` (FR2)

## Iterations
<!-- Added by verify-fail-task or review-fail-task -->

### Attempt {n} — {Phase} Failed ({YYYY-MM-DD})

**Phase:** verify|review
**Result:** failed

**Errors/Issues:**
- {error or feedback item}

**Action:** {guidance for fixing}

## WIP Notes
<!-- Added by in-progress-wip-commit -->

**Last WIP:** YYYY-MM-DD
**Progress:** {completed}/{total} steps

**Continuation hints:**
- Next step: {description}
- Context: {relevant context for resuming}
