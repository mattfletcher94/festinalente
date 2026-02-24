---
id: "validation/xml"
title: "XML Validation"
type: feature
tldr: "Validate syntax of task.xml, spec.xml, and plan.xml files"
summary: "Uses fast-xml-parser to validate XML syntax in task files. Supports targeted validation by task ID or validates all tasks when run without arguments."
keywords: [xml, validation, syntax, task, spec, plan, targeted]
aliases: [validate-xml, xml-validator]
boundary: "Does NOT validate XML schema or content; only syntax parsing"
related: [validation/yaml, tasks/create]
updated: 2026-02-24
verified: 2026-02-24
code_refs:
  - .kanban/scripts/validate-xml.cjs
  - apps/kanban/src/scripts/validate-xml.ts
---

# XML Validation

> **TL;DR:** Validate syntax of task.xml, spec.xml, and plan.xml files

## Overview

XML Validation checks that task XML files parse correctly. It uses fast-xml-parser to detect syntax errors like unclosed tags, invalid characters, or malformed attributes. Errors include line and column numbers for quick fixes.

**Summary:** Syntax validation for task file integrity.

## How It Works

1. **With task ID argument:** Validate only that task's XML files (task.xml, spec.xml, plan.xml)
2. **Without arguments:** Scan all `.kanban/tasks/` subdirectories for XML files
3. Parse each file with fast-xml-parser
4. Report parsing errors with file path and message
5. Return JSON summary of valid/invalid files

### Key Workflows

**Targeted validation (single task):**
```bash
node .kanban/scripts/validate-xml.cjs 013
```
- Validates only task 013's XML files
- Faster feedback during development
- Ideal for pre-commit hooks

**Full validation (all tasks):**
```bash
node .kanban/scripts/validate-xml.cjs
```
- Validates all task XML files
- Returns JSON with results

**Automatic validation:**
- Run at end of each kanban skill
- Blocks completion if errors found

**Summary:** Validates specific task XML files by ID, or all tasks when no argument provided.

## Examples

### Targeted Validation (Recommended for Development)

```bash
node .kanban/scripts/validate-xml.cjs 013

# Success output:
# {
#   "valid": true,
#   "filesChecked": 3,
#   "errors": []
# }

# Task not found:
# {
#   "valid": false,
#   "error": true,
#   "message": "Task not found: 999"
# }
```

### Full Validation

```bash
node .kanban/scripts/validate-xml.cjs

# Success output:
# {
#   "valid": true,
#   "filesChecked": 15,
#   "errors": []
# }

# Error output:
# {
#   "valid": false,
#   "filesChecked": 15,
#   "errors": [
#     {
#       "file": ".kanban/tasks/001/task.xml",
#       "message": "Unclosed tag 'description'"
#     }
#   ]
# }
```

**Summary:** JSON output with validation results. Use task ID for targeted validation.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Validate XML schema (required elements)
- **Does NOT:** Validate content meaning
- **Does NOT:** Fix errors automatically

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Path | Task files location | .kanban/tasks/ |

## Interactions

- **All kanban skills**: Final validation step
- **Tasks**: Validates task.xml, spec.xml, plan.xml

## Limitations

- Only validates syntax, not schema
- No path-based arguments (use task ID only)
