---
id: "utilities/glossary"
title: "Glossary Expansion"
type: feature
tldr: "Expand search queries using project-specific term aliases"
summary: "Uses .kanban/glossary.yaml to expand search terms with synonyms. 'sign in' expands to include 'login', 'authentication', improving search recall."
keywords: [glossary, expansion, synonyms, aliases, search]
aliases: [expand-query, query-expansion, term-expansion]
boundary: "Does NOT perform search; only expands query terms"
related: [docs/search]
updated: 2026-02-20
---

# Glossary Expansion

> **TL;DR:** Expand search queries using project-specific term aliases

## Overview

Glossary Expansion improves search recall by expanding query terms with project-specific synonyms. The glossary maps terms to aliases (e.g., "login" → ["sign in", "signin", "authentication"]), so searching for any alias finds docs using the canonical term.

**Summary:** Synonym expansion for better search coverage.

## How It Works

1. Read `.kanban/glossary.yaml`
2. For each query term:
   - Check if it matches any term or alias
   - If match, add all aliases to expanded query
3. Return original + expanded terms

### Key Workflows

**Usage:**
```bash
node .kanban/scripts/expand-query.cjs "sign in"
```

**Output:**
```json
{
  "original": ["sign in"],
  "expanded": ["sign in", "login", "authentication", "auth"]
}
```

**Glossary structure:**
```yaml
version: 1
terms:
  - term: "login"
    aliases: ["sign in", "signin", "authentication"]
    domain: auth
    definition: "User authentication process"
```

**Summary:** Term-to-alias mapping for expansion.

## Examples

### Typical Usage

```bash
node .kanban/scripts/expand-query.cjs "dark mode"

# If glossary has: theme → [dark mode, light mode, color scheme]
# Output:
# {
#   "original": ["dark mode"],
#   "expanded": ["dark mode", "theme", "color scheme"]
# }
```

### No Expansion Found

```bash
node .kanban/scripts/expand-query.cjs "xyz123"

# Output:
# {
#   "original": ["xyz123"],
#   "expanded": ["xyz123"]
# }
```

**Summary:** Graceful handling of unknown terms.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Perform the actual search
- **Does NOT:** Modify the glossary
- **Does NOT:** Auto-generate aliases

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Path | Glossary file location | .kanban/glossary.yaml |

## Interactions

- **Search**: Uses expanded terms for matching
- **Map-product**: Generates initial glossary

## Limitations

- Manual glossary maintenance required
- No fuzzy matching on aliases
- Case-sensitive matching
