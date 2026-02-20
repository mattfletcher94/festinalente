---
id: "validation/yaml"
title: "YAML Validation"
type: feature
tldr: "Validate YAML frontmatter in markdown documentation"
summary: "Uses gray-matter to parse and validate YAML frontmatter in product and engineering docs. Reports syntax errors for quick fixes."
keywords: [yaml, frontmatter, validation, markdown, docs]
aliases: [validate-yaml, yaml-validator, frontmatter-validation]
boundary: "Does NOT validate frontmatter fields; only YAML syntax"
related: [validation/xml, docs/product]
updated: 2026-02-20
---

# YAML Validation

> **TL;DR:** Validate YAML frontmatter in markdown documentation

## Overview

YAML Validation checks that documentation frontmatter parses correctly. It uses gray-matter to extract and validate the YAML block at the top of markdown files. Invalid YAML prevents docs from being searchable.

**Summary:** Syntax validation for documentation frontmatter.

## How It Works

1. Scan `.kanban/product/` and `.kanban/engineering/` for markdown files
2. Extract frontmatter using gray-matter
3. Report parsing errors with file path
4. Return summary of valid/invalid files

### Key Workflows

**Manual validation:**
```bash
node .kanban/scripts/validate-yaml.cjs
```
- Validates all doc frontmatter
- Returns JSON with results

**Summary:** Validates all markdown frontmatter.

## Examples

### Typical Usage

```bash
node .kanban/scripts/validate-yaml.cjs

# Success output:
# { "valid": true, "files": 12, "errors": [] }

# Error output:
# {
#   "valid": false,
#   "files": 12,
#   "errors": [
#     {
#       "file": ".kanban/product/auth/login.md",
#       "message": "Invalid indentation at line 4"
#     }
#   ]
# }
```

**Summary:** JSON output with validation results.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Validate required fields (id, title, etc.)
- **Does NOT:** Validate field values
- **Does NOT:** Fix errors automatically

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Paths | Doc locations | .kanban/product/, .kanban/engineering/ |

## Interactions

- **Docs**: Validates product and engineering docs
- **Search**: Invalid YAML prevents search indexing

## Limitations

- Only validates syntax, not schema
- Validates all files each run (no incremental)
