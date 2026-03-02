---
id: cli/validation
title: "Validation Commands"
type: feature
tldr: "XML, YAML, and documentation quality validation"
summary: "Validation commands check task XML structure, YAML syntax, directive format, and documentation quality standards with detailed error reporting."
keywords: [validation, xml, yaml, docs, quality, errors]
aliases: [validate, validation-commands]
boundary: "Does not auto-fix issues - only reports them"
references: []
uses: [systems/cli]
updated: 2026-03-01
---

# Validation Commands

> **TL;DR:** XML, YAML, and documentation quality validation

## Overview

Validation commands verify file structure and quality. They report issues but don't auto-fix - skills handle remediation.

**Summary:** Validation catches issues before they cause problems.

## Commands

| Command | Purpose |
|---------|---------|
| `validate-xml {taskId}` | Validate task XML structure |
| `validate-yaml {path}` | Validate YAML syntax |
| `validate-directive {path}` | Validate directive XML format |
| `validate-docs {path}` | Check doc quality standards |

## Validation Checks

### XML Validation
- Well-formed XML structure
- Required elements present
- Valid status values

### Doc Quality
- Required frontmatter fields
- Summary sections present
- Boundary field populated

## Examples

```bash
# Validate task
node .festinalente/scripts/festinalente.cjs validate-xml 001

# Validate doc
node .festinalente/scripts/festinalente.cjs validate-docs .festinalente/product/auth/login.md
```

## Boundaries

- **Does NOT:** Auto-fix validation errors
- **Does NOT:** Validate code syntax → Use TypeScript/ESLint
