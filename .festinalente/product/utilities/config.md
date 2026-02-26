---
id: "utilities/config"
title: "Configuration Access"
type: feature
tldr: "Read skill and directive configuration from config.yaml"
summary: "Provides access to skill-specific configuration including directive assignments. Returns which directives apply to each kanban skill."
keywords: [config, configuration, directives, skills, settings]
aliases: [get-skill-config, skill-config, config-access]
boundary: "Does NOT modify config; read-only access"
related: [tasks/check, validation/directives]
updated: 2026-02-24
verified: 2026-02-24
code_refs:
  - apps/kanban/src/scripts/get-skill-config.ts
---

# Configuration Access

> **TL;DR:** Read skill and directive configuration from config.yaml

## Overview

Configuration Access provides read access to skill-specific settings from `.kanban/config.yaml`. Primarily used to determine which directives apply to each kanban skill, enabling customizable governance rules.

**Summary:** Directive-to-skill mapping for governance.

## How It Works

1. Read `.kanban/config.yaml`
2. Find directives section for requested skill
3. For each directive, check if file exists
4. Return directive list with existence flags

### Key Workflows

**Usage:**
```bash
node .kanban/scripts/get-skill-config.cjs kanban-check
```

**Output:**
```json
{
  "skill": "kanban-check",
  "directives": [
    { "name": "typescript", "path": ".kanban/directives/typescript.xml", "exists": true },
    { "name": "testing", "path": ".kanban/directives/testing.xml", "exists": true }
  ]
}
```

**Summary:** Returns directives with existence check.

## Examples

### Typical Usage

```bash
node .kanban/scripts/get-skill-config.cjs kanban-implement

# Output:
# {
#   "skill": "kanban-implement",
#   "directives": [
#     { "name": "architecture", "path": ".kanban/directives/architecture.xml", "exists": true }
#   ]
# }
```

### Config Structure

```yaml
# .kanban/config.yaml
directives:
  kanban-check:
    - typescript
    - testing
  kanban-implement:
    - architecture
```

**Summary:** YAML config maps directives to skills.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Modify configuration
- **Does NOT:** Validate directive content
- **Does NOT:** Return full config (skill-specific only)

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Path | Config file location | .kanban/config.yaml |

## Interactions

- **All skills**: Load directives at start
- **Check**: Determines which checks to run

## Limitations

- Read-only access
- Skill-specific queries only
- No config validation
