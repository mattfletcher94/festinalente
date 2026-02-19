---
id: "cli/quality"
title: "Quality Skills"
type: feature
tldr: "Skills for documentation validation and quality auditing"
summary: "Interactive skills for auditing documentation quality, identifying issues, and guiding fixes through conversational improvement"
keywords: [quality, validation, audit, improve, tldr, summary, keywords]
aliases: [validation, auditing, doc-quality]
boundary: "Does not create or map documentation - see Discovery Skills"
related: [cli/docs, cli/discovery]
updated: 2026-02-19
---

# Quality Skills

> **TL;DR:** Skills for documentation validation and quality auditing

## Overview

Quality Skills allow users to validate and improve documentation quality. This is important because documentation must be complete, consistent, and useful for AI context selection.

**Summary:** Audit and fix documentation quality issues across the project.

## How It Works

1. User invokes a quality skill
2. Skill scans all documentation for issues
3. Skill reports findings with severity levels
4. User fixes issues interactively

### Key Workflows

**Quality Audit Flow:**
- Scan all product and engineering docs
- Check for required fields and quality criteria
- Report errors (critical) and warnings (recommended)
- Optionally fix issues interactively

**Summary:** Scan, report, fix.

## Skills

### /kanban-quality-check

Audits all documentation and generates quality report.

- **Scans**: `.kanban/product/` and `.kanban/engineering/`
- **Checks**: Required fields, completeness, consistency
- **Reports**: Errors and warnings with file locations

```
/kanban-quality-check
```

**Quality Checks:**
| Check | Severity | Description |
|-------|----------|-------------|
| has-tldr | error | Document must have tldr field (max 100 chars) |
| has-summary | error | Document must have summary field |
| has-keywords | warning | Document should have keywords for search |
| has-overview | warning | Feature docs should have Overview section |
| has-examples | warning | Feature docs should have Examples section |
| has-boundaries | warning | Documents should define what they don't cover |
| not-too-short | warning | Body content should be substantial |
| not-too-long | warning | TL;DR should be concise |

### /kanban-improve-docs

Interactively fixes documentation quality issues.

- **Reads**: Quality report from validation
- **Guides**: User through fixing each issue
- **Updates**: Documentation with fixes

```
/kanban-improve-docs
```

**Fix Flow:**
1. Run quality check
2. Present issues sorted by severity
3. For each issue, suggest fix and ask for confirmation
4. Update document and move to next issue

## Examples

### Typical Usage: Quality Check

```
User: /kanban-quality-check

Claude: Scanning documentation...

Quality Report
══════════════════════════════════════
Product Docs: 8 files, 3 issues
Engineering Docs: 5 files, 2 issues

ERRORS (2):
  auth/login.md - Missing tldr field
  patterns/error-handling.md - Missing summary field

WARNINGS (3):
  auth/session.md - No examples section
  tasks/management.md - No boundaries section
  systems/database.md - Keywords field empty

Run /kanban-improve-docs to fix these issues.
```

### Typical Usage: Improve Docs

```
User: /kanban-improve-docs

Claude: Starting interactive fix for 5 issues...

ERROR 1/2: auth/login.md - Missing tldr field

Current overview:
"The login feature handles user authentication..."

Suggested tldr:
"Handles user authentication with email/password and session management"

Accept this tldr? [Y/n/edit]

[User confirms or edits]

Fixed: auth/login.md (1/5 complete)
```

### Edge Case: No Issues

```
User: /kanban-quality-check

Claude: Scanning documentation...

Quality Report
══════════════════════════════════════
Product Docs: 8 files, 0 issues
Engineering Docs: 5 files, 0 issues

All documentation passes quality checks!
```

**Summary:** Quality check reports issues, improve-docs fixes them interactively.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Create new documentation → See [Discovery Skills](./discovery.md)
- **Does NOT:** Update documentation content → See [Documentation Skills](./docs.md)
- **Does NOT:** Validate code (only documentation)

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| type | Filter by doc type (product/engineering) | all |

## Interactions

- **Documentation Skills**: Quality issues may trigger doc updates
- **Discovery Skills**: Quality check validates docs created by mapping

## Limitations

- Cannot validate documentation accuracy (only structure/completeness)
- Interactive fixes require user confirmation
- No automatic fix mode (user must review each change)
