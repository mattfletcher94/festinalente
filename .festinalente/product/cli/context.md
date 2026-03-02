---
id: cli/context
title: "Context Commands"
type: feature
tldr: "Smart context selection and freshness checking for LLM consumption"
summary: "Context commands select relevant documentation at configurable detail tiers and check if loaded docs are stale relative to code changes."
keywords: [context, select, freshness, tiers, tokens, smart]
aliases: [context-commands, select-context]
boundary: "Does not load context into prompts - skills handle that"
references: [skills/finalize]
uses: [systems/cli]
updated: 2026-03-01
---

# Context Commands

> **TL;DR:** Smart context selection and freshness checking for LLM consumption

## Overview

Context commands help skills load the right documentation without overwhelming token budgets. They select docs by relevance and tier, and detect when docs are stale.

**Summary:** Context commands manage what AI sees during implementation.

## Commands

| Command | Purpose |
|---------|---------|
| `select-context {taskId} --tier=standard` | Select relevant docs |
| `check-freshness {docId}` | Check if doc is stale |
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

# Check doc freshness
node .festinalente/scripts/festinalente.cjs check-freshness auth/login
```

## Boundaries

- **Does NOT:** Inject context into prompts
- **Does NOT:** Update stale docs → See finalize skill
