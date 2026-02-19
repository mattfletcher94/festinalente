---
task: "{id}"
spec: "tasks/{id}/spec.md"
status: draft|approved|in-progress|completed
created: YYYY-MM-DD
updated: YYYY-MM-DD
generated_by: human|claude
model: {model-name}
version: 1
iteration: 1
complexity: simple|medium|complex
---

# Plan: {title}

## Overview

{2-3 sentence summary of implementation approach - NOT just "see spec"}
{Key architectural decision or pattern being followed}

See full specification: tasks/{id}/spec.md

## Technical Approach

{Why this approach - derived from spec's Research Findings}
{Key patterns being followed with file:line references}
{Any trade-offs considered}

## Implementation Tasks

<tasks>
<!-- Task format:
<task id="N" type="auto|manual" depends="comma,separated,ids">
  <name>Brief description</name>
  <files>path/to/file.ts (create|modify|delete)</files>
  <requirements>FR1, FR2</requirements>
  <pattern>Pattern name at path/to/example.ts:line</pattern>
  <action>
    - Step 1
    - Step 2
  </action>
  <verify>command to run OR "Manual: description"</verify>
  <done>Acceptance criteria for this task</done>
</task>
-->
</tasks>

## Testing Strategy

- **Automated:** {tests to write, if any}
- **Manual:** {what to verify by hand}
- **Regression:** {what existing behavior to confirm still works}

## Edge Cases

- {edge case 1} — {how to handle}
- {edge case 2} — {how to handle}

## Potential Pitfalls

- {pitfall 1} — {mitigation}
- {pitfall 2} — {mitigation}

## Iterations
<!-- Added by kanban-rework when issues found -->

## WIP Notes
<!-- Added by kanban-save for partial progress -->

## Completeness Verification
<!-- Added by kanban-plan after self-check -->
- [ ] File paths are absolute/specific
- [ ] Actions are self-contained (no "see above" references)
- [ ] Pattern references include file:line
- [ ] Verify commands are executable
- [ ] Dependencies are explicit
- [ ] Approach explains rationale (WHY not just WHAT)
- [ ] Edge cases are specific to this implementation
