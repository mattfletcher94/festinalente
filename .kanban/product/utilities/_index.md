---
id: "utilities/_index"
title: "Utilities"
type: domain
tldr: "Shared helpers for ID generation, dates, config, and query expansion"
summary: "The utilities domain provides cross-cutting helper scripts: task ID generation, date/time formatting, configuration access, and glossary-based query expansion."
keywords: [utilities, helpers, id, date, config, glossary]
aliases: [utils, helpers, infrastructure]
boundary: "Does NOT contain business logic; only low-level utilities"
contains: [utilities/id-generation, utilities/datetime, utilities/config, utilities/glossary]
related: [tasks/_index, docs/_index]
updated: 2026-02-25
---

# Utilities

> **TL;DR:** Shared helpers for ID generation, dates, config, and query expansion

## Overview

The Utilities domain provides cross-cutting helper scripts used by multiple other domains. These are low-level utilities without business logic: generating task IDs, formatting dates, reading configuration, and expanding search queries with glossary terms.

**Why it exists:** Centralized utilities prevent duplication and ensure consistency.

**Summary:** This domain provides shared infrastructure for kanban operations.

## Boundaries

This domain does NOT contain business logic; only infrastructure utilities.

- **Does NOT:** Manage tasks or docs
- **Does NOT:** Make workflow decisions
- **Does NOT:** Validate content
- **See instead:** Other domains for business features

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| [id-generation](./id-generation.md) | Generate sequential task IDs | stable |
| [datetime](./datetime.md) | Get current date/time in standard formats | stable |
| [config](./config.md) | Access skill and directive configuration | stable |
| [glossary](./glossary.md) | Term expansion for search queries | stable |

**Summary:** This domain contains 4 utility features.

## Key Concepts

- **ID padding**: Task IDs padded to consistent width (e.g., 001, 002)
- **ISO date**: Standard YYYY-MM-DD format for timestamps
- **Config**: YAML configuration in .kanban/config.yaml
- **Glossary**: Term-to-alias mappings for search

## Relationships

| Related Domain | Relationship |
|----------------|--------------|
| [tasks](../tasks/_index.md) | Uses ID generation and dates |
| [docs](../docs/_index.md) | Uses glossary for search expansion |

**Summary:** This domain is consumed by other domains.
