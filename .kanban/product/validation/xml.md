---
id: "validation/xml"
title: "XML Validation"
type: feature
tldr: "Validate syntax of task.xml, spec.xml, and plan.xml files"
summary: "Uses fast-xml-parser to validate XML syntax in task files. Reports parsing errors with line/column information for quick fixes."
keywords: [xml, validation, syntax, task, spec, plan]
aliases: [validate-xml, xml-validator]
boundary: "Does NOT validate XML schema or content; only syntax parsing"
related: [validation/yaml, tasks/create]
updated: 2026-02-20
---

# XML Validation

> **TL;DR:** Validate syntax of task.xml, spec.xml, and plan.xml files

## Overview

XML Validation checks that task XML files parse correctly. It uses fast-xml-parser to detect syntax errors like unclosed tags, invalid characters, or malformed attributes. Errors include line and column numbers for quick fixes.

**Summary:** Syntax validation for task file integrity.

## How It Works

1. Scan `.kanban/tasks/` for XML files
2. Parse each file with fast-xml-parser
3. Report parsing errors with location
4. Return summary of valid/invalid files

### Key Workflows

**Manual validation:**
```bash
node .kanban/scripts/validate-xml.cjs
```
- Validates all task XML files
- Returns JSON with results

**Automatic validation:**
- Run at end of each kanban skill
- Blocks completion if errors found

**Summary:** Validates all XML files and reports errors.

## Examples

### Typical Usage

```bash
node .kanban/scripts/validate-xml.cjs

# Success output:
# { "valid": true, "files": 3, "errors": [] }

# Error output:
# {
#   "valid": false,
#   "files": 3,
#   "errors": [
#     {
#       "file": ".kanban/tasks/001/task.xml",
#       "line": 15,
#       "column": 8,
#       "message": "Unclosed tag 'description'"
#     }
#   ]
# }
```

**Summary:** JSON output with validation results.

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
- Validates all files each run (no incremental)
