---
id: cli/validation
title: "Validation Commands"
type: feature
tldr: "XML, YAML, and documentation quality validation"
summary: "Validation commands check task XML structure, YAML syntax, directive format, and documentation quality standards with detailed error reporting. The VSCode extension provides real-time directive diagnostics in the editor."
keywords: [validation, xml, yaml, docs, quality, errors, diagnostics, linter, vscode]
aliases: [validate, validation-commands]
boundary: "Does not auto-fix issues - only reports them"
references: []
uses: [systems/cli, systems/vscode-extension]
intent: reference
prerequisites: []
---

# Validation Commands

> **TL;DR:** XML, YAML, and documentation quality validation

## Overview

Validation commands verify file structure and quality. They report issues but don't auto-fix - skills handle remediation.

**Summary:** Validation catches issues before they cause problems.

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

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
- Intent field validation (9 checks total, including `has-intent` warning)

## VSCode Directive Diagnostics

The VSCode extension validates directive XML files in real-time as you edit, surfacing errors and warnings as editor diagnostics (inline squigglies in the Problems panel).

### What It Validates

- **Malformed XML** — Parse errors are reported as errors on the `<directive>` element
- **Missing root element** — Files without a `<directive>` root are flagged
- **Required directive attributes** — `name`, `version`, `created`, `updated` must be present
- **Name/filename mismatch** — The `name` attribute must match the filename
- **Date format** — `created` and `updated` must use `YYYY-MM-DD` format
- **Rule elements** — Each `<rule>` requires `id` and `phase` attributes
- **Phase values** — Unknown phase names produce warnings (valid: check, complete, complete-project, create, create-project, define, delete, directive, finalize, implement, map-engineering, map-product, plan, quick, rework, save, scope)
- **Check elements** — Each `<check>` requires `id`, `type`, and `severity` attributes, plus type-specific child elements
- **Duplicate IDs** — All `id` attributes across principles, rules, and checks must be unique

### Severity Mapping

| Condition | Diagnostic Severity |
|-----------|-------------------|
| Missing required attribute or element | Error |
| Malformed XML | Error |
| Invalid/unknown attribute value (e.g., unknown phase) | Warning |

### Behavior

- Diagnostics update in real-time as the document changes
- Diagnostics are cleared when all issues are fixed
- Diagnostics are cleared when the file is closed

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
