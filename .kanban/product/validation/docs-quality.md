---
id: "validation/docs-quality"
title: "Documentation Quality"
type: feature
tldr: "Check documentation completeness with 8 quality criteria"
summary: "Validates documentation quality: tldr length, summary length, keywords count, overview section, examples, boundaries, content length. Reports pass/warning/error status."
keywords: [quality, documentation, tldr, summary, examples, validation]
aliases: [validate-docs, doc-quality, quality-check]
boundary: "Does NOT check content accuracy; only structural completeness"
related: [docs/product, docs/engineering]
updated: 2026-02-20
---

# Documentation Quality

> **TL;DR:** Check documentation completeness with 8 quality criteria

## Overview

Documentation Quality validates that docs meet minimum standards for AI consumption. It checks 8 criteria covering frontmatter completeness and body structure. Each check has a severity (error, warning) and specific thresholds.

**Summary:** Automated quality gates for documentation.

## How It Works

1. Scan product and engineering docs
2. For each doc, run 8 quality checks:
   - **has-tldr** (error): tldr field > 10 chars
   - **has-summary** (error): summary field > 50 chars
   - **has-keywords** (warning): keywords array >= 2 items
   - **has-overview** (error): Overview section present
   - **has-examples** (warning): Code blocks present
   - **has-boundaries** (warning): Boundaries section present
   - **not-too-short** (warning): Content > 300 chars
   - **not-too-long** (warning): Content < 5000 chars
3. Return report with pass/warning/error counts

### Key Workflows

**Quality check:**
```bash
node .kanban/scripts/validate-docs.cjs
```
- Checks all docs
- Returns JSON report

**Summary:** 8 checks with error/warning severity.

## Examples

### Typical Usage

```bash
node .kanban/scripts/validate-docs.cjs

# Output:
# {
#   "total": 12,
#   "passed": 10,
#   "warnings": 2,
#   "errors": 0,
#   "results": [
#     {
#       "file": ".kanban/product/auth/login.md",
#       "status": "pass",
#       "checks": { "has-tldr": "pass", "has-summary": "pass", ... }
#     },
#     {
#       "file": ".kanban/product/auth/session.md",
#       "status": "warning",
#       "checks": { "has-examples": "warning" }
#     }
#   ]
# }
```

**Summary:** Per-doc results with check details.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Check content accuracy or correctness
- **Does NOT:** Fix quality issues automatically
- **Does NOT:** Block workflow (advisory only)

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| tldr min | Minimum tldr length | 10 chars |
| summary min | Minimum summary length | 50 chars |
| keywords min | Minimum keywords count | 2 |
| content min | Minimum content length | 300 chars |
| content max | Maximum content length | 5000 chars |

## Interactions

- **Docs**: Validates product and engineering docs
- **/kanban-quality-check**: Uses this validation

## Limitations

- Structural checks only, not semantic
- Fixed thresholds (not configurable)
- Stub docs will fail (expected)
