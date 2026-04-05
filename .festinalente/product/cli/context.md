---
id: cli/context
title: "Context Commands"
type: feature
tldr: "Smart context selection for LLM consumption"
summary: "Context commands select relevant documentation at configurable detail tiers."
keywords: [context, select, tiers, tokens, smart]
aliases: [context-commands, select-context]
boundary: "Does not load context into prompts - skills handle that"
references: [skills/finalize]
uses: [systems/cli]
intent: procedural
prerequisites: []
---

# Context Commands

> **TL;DR:** Smart context selection for LLM consumption

## Overview

Context commands help skills load the right documentation without overwhelming token budgets. They select docs by relevance and tier.

**Summary:** Context commands manage what AI sees during implementation.

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

## Commands

| Command | Purpose |
|---------|---------|
| `select-context {taskId} --tier=standard` | Select relevant docs |
| `expand-query {keywords}` | Expand with glossary terms |

### Tiers

| Tier | Token Budget | Content |
|------|--------------|---------|
| minimal | ~50 | tldr only |
| standard | ~200 | overview + key sections |
| full | ~500-1000 | complete document |

## Examples

```bash
# Select context for task
node .festinalente/scripts/festinalente.cjs select-context 001 --tier=standard --max=3
```

## Boundaries

- **Does NOT:** Inject context into prompts
