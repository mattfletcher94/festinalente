---
id: "docs/freshness"
title: "Freshness Check"
type: feature
tldr: "Detect stale docs where referenced code has changed"
summary: "Checks documentation staleness by comparing verified date against code file modifications. Warns during implementation if relevant docs may be outdated."
keywords: [freshness, stale, outdated, verified, code-refs]
aliases: [check-freshness, stale-docs, doc-freshness]
boundary: "Does NOT update docs; only detects staleness for warnings"
related: [docs/context-selection, tasks/implement]
updated: 2026-02-20
---

# Freshness Check

> **TL;DR:** Detect stale docs where referenced code has changed

## Overview

Freshness Check detects when documentation may be outdated. Docs include a `verified` date (when last confirmed accurate) and optional `code_refs` (code files they reference). If the verified date is old AND referenced code files have been modified, the doc is flagged as stale.

**Summary:** Automated staleness detection for documentation maintenance.

## How It Works

1. Scan all docs in product and engineering folders
2. For each doc with `verified` date:
   - Calculate days since verification
   - If `code_refs` specified, check git for modifications
   - If days > threshold AND code modified: mark stale
3. Return list of stale docs with details
4. During implementation, warn about stale relevant docs

### Key Workflows

**Pre-implementation check:**
```bash
node .kanban/scripts/check-freshness.cjs --stale-days=30
```
- Returns JSON with stale docs
- Implementation skill checks if task's docs are stale

**Warning flow:**
- Claude loads relevant docs for task
- Freshness check identifies stale docs
- Claude warns: "This doc may be outdated..."
- User can review or continue

**Summary:** Automated detection with optional user review.

## Examples

### Typical Usage

```bash
# Check for stale docs (30 day threshold)
node .kanban/scripts/check-freshness.cjs --stale-days=30

# Output:
# {
#   "totalDocs": 15,
#   "staleDocs": [
#     {
#       "id": "auth/login",
#       "verifiedDate": "2025-12-01",
#       "daysSinceVerified": 81,
#       "modifiedCodeRefs": ["src/auth/login.ts", "src/auth/session.ts"]
#     }
#   ]
# }
```

### Doc with Code Refs

```yaml
---
id: "auth/login"
verified: 2025-12-01
code_refs:
  - src/auth/login.ts
  - src/auth/session.ts
---
```

**Summary:** Staleness based on verification date and code changes.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Update docs automatically
- **Does NOT:** Block implementation (only warns)
- **Does NOT:** Check doc content accuracy (only dates)

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| --stale-days | Days before considered stale | 30 |

## Interactions

- **Implementation**: Warns during task execution
- **Docs**: Reads verified and code_refs fields
- **Git**: Checks file modification history

## Limitations

- Requires `verified` date in frontmatter
- code_refs are optional but improve accuracy
- Git history required for modification checks
