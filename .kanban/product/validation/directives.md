---
id: "validation/directives"
title: "Directive Validation"
type: feature
tldr: "Validate directive XML structure, phases, and check types"
summary: "Validates directive files against schema: required attributes, valid phase values, valid check types, and rule/example reference resolution."
keywords: [directives, validation, schema, phases, checks]
aliases: [validate-directive, directive-validator]
boundary: "Does NOT execute directive checks; only validates directive definition"
related: [validation/xml, tasks/check]
updated: 2026-02-24
verified: 2026-02-24
code_refs:
  - apps/kanban/src/scripts/validate-directive.ts
---

# Directive Validation

> **TL;DR:** Validate directive XML structure, phases, and check types

## Overview

Directive Validation checks that directive files follow the expected schema. It validates phase values (scope, plan, implement, check, rework, docs), check types (command, pattern, checklist), severity levels (error, warning, info), and reference resolution.

**Summary:** Schema validation for governance directives.

## How It Works

1. Scan `.kanban/directives/` for XML files
2. Parse each directive
3. Validate:
   - Required attributes (id, name)
   - Valid phases in `<process>` rules
   - Valid check types in `<validation>` checks
   - Valid severity levels
   - Example references resolve to existing rules
4. Return validation results

### Key Workflows

**Manual validation:**
```bash
node .kanban/scripts/validate-directive.cjs
```
- Validates all directive files
- Returns JSON with results

**Directive schema:**
- `<directive>`: Root element with id, name
- `<context>`: Guiding principles
- `<process>`: Rules by phase
- `<validation>`: Automated checks
- `<examples>`: Correct/incorrect examples

**Summary:** Validates directive structure and references.

## Examples

### Typical Usage

```bash
node .kanban/scripts/validate-directive.cjs

# Output:
# {
#   "valid": true,
#   "directives": 3,
#   "errors": [],
#   "warnings": []
# }
```

### Valid Directive Structure

```xml
<directive id="architecture" name="Architecture">
  <context>
    <principle>Use factory functions, not classes</principle>
  </context>

  <process>
    <rule phase="implement" id="R1">
      Use dependency injection for all services
    </rule>
  </process>

  <validation>
    <check id="V1" type="pattern" severity="error" files="**/*.ts">
      <forbidden>class\s+\w+</forbidden>
      <reason>Use factory functions instead of classes</reason>
    </check>
  </validation>

  <examples>
    <example ref="R1" type="correct">
      <code>const service = createAuthService(deps)</code>
    </example>
  </examples>
</directive>
```

**Summary:** Validates against directive schema.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Execute the directive checks
- **Does NOT:** Validate code against directives
- **Does NOT:** Create or modify directives

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Path | Directive location | .kanban/directives/ |
| Valid phases | Allowed phase values | scope, plan, implement, check, rework, docs |
| Valid check types | Allowed check types | command, pattern, checklist |

## Interactions

- **Check**: Directives used during verification phase
- **Skills**: Directives loaded by kanban skills

## Limitations

- Only validates definition, not execution
- Example code not validated for correctness
