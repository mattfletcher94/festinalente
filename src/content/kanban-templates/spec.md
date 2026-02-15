---
task: "{id}"
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Functional Specification: {title}

## Context
{Background - what exists today, why this change is needed}
{Pulls from task's "problem" and "value" sections}

## Scope

### In Scope
- {What this spec covers}

### Out of Scope
- {Explicit boundaries - prevents scope creep}

## Functional Requirements
{What the system must do. Each requirement should be testable.}

- FR1: The system shall...
- FR2: The system shall...
- FR3: The system shall...

## Affected Files
- `path/to/file.ts` (modify) - {reason}
- `path/to/new-file.ts` (create) - {reason}
- `path/to/old-file.ts` (delete) - {reason}

## Existing Patterns
{LLM actively searches codebase for similar implementations}
{User-defined skills may provide additional pattern guidance}

- **Pattern:** {description}
  - Reference: `path/to/example.ts:42`
- **Pattern:** {description}
  - Reference: `path/to/another.ts:15`

## Technical Constraints
- {Must use existing X library}
- {Cannot modify Y because...}
- {Performance requirement: ...}
- {Compatibility requirement: ...}

## Dependencies

### External
- {Libraries/APIs needed}

### Internal
- {Other tasks/features this depends on}

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| {risk description} | {high/medium/low} | {mitigation strategy} |

## Open Questions
{Unresolved items that need clarification before/during implementation}

- [ ] {Question 1}
- [ ] {Question 2}
