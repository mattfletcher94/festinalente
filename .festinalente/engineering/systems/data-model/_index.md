---
id: "systems/data-model"
title: "Data Model & Storage"
type: system
tldr: "File-based persistence using XML for tasks, YAML for config, and Markdown for documentation"
summary: "Defines and persists all project state as structured files in .festinalente/, enabling context-window-safe AI workflows"
keywords: [storage, xml, yaml, markdown, tasks, specs, plans, config, persistence, file-based]
aliases: [data-model, storage, persistence]
boundary: "Does not enforce schemas — validation is a separate system"
references: [systems/cli, systems/validation]
uses: []
paths: [.festinalente]
intent: reference
prerequisites: []
updated: "2026-04-05"
---

# Data Model & Storage

> **TL;DR:** File-based persistence using XML for tasks, YAML for config, and Markdown for documentation

## Overview

All Festina Lente state persists as files in `.festinalente/`. Tasks use XML for structured data (task.xml, spec.xml, plan.xml), configuration uses YAML (config.yaml, workflow.yaml), and documentation uses Markdown with YAML frontmatter. This file-based approach means state survives context windows and is version-controlled via git.

**Why it exists:** AI agents lose in-memory state between conversations. File-based persistence ensures every artifact is durable, diffable, and reviewable in git history.

**Summary:** Structured files on disk replace a database — XML for workflow artifacts, YAML for config, Markdown for docs.

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

## File Formats

| Path Pattern | Format | Purpose | Managed By |
|-------------|--------|---------|-----------|
| `tasks/{id}/task.xml` | XML | Task metadata, status, labels, refs | festina-create/complete/delete |
| `tasks/{id}/spec.xml` | XML | Functional specification | festina-scope |
| `tasks/{id}/plan.xml` | XML | Atomic implementation steps | festina-plan |
| `quick/{id}/quick.xml` | XML | Quick task (small changes) | festina-quick |
| `projects/{id}/project.xml` | XML | Multi-task grouping | festina-create-project |
| `config.yaml` | YAML | Directive-to-skill mappings | User / festina-directive |
| `workflow.yaml` | YAML | Columns, labels, priorities, transitions | Read-only (shipped) |
| `directives/{name}.xml` | XML | Enforcement rules | festina-directive |
| `product/{domain}/**/*.md` | Markdown + YAML | Feature documentation | festina-map-product |
| `engineering/**/*.md` | Markdown + YAML | Technical documentation | festina-map-engineering |
| `glossary.yaml` | YAML | Technical terms and aliases | festina-map-* |
| `templates/*.md` | Markdown | Document templates | Shipped with install |

**Summary:** 4 XML schemas (task, spec, plan, quick), 3 YAML configs, Markdown docs with YAML frontmatter.

## Directory Layout

```
.festinalente/
├── tasks/
│   └── {NNN-slug}/
│       ├── task.xml         # Status, labels, priority, refs
│       ├── spec.xml         # Requirements, affected files
│       └── plan.xml         # Implementation steps
├── quick/
│   └── {NNN-slug}/
│       └── quick.xml        # Self-contained quick task
├── projects/
│   └── {slug}/
│       └── project.xml      # Project metadata, task list
├── product/                 # Product documentation
├── engineering/             # Engineering documentation
├── directives/              # Enforcement rules
├── templates/               # Doc templates
├── scripts/                 # Helper scripts
├── config.yaml              # Directive mappings
├── workflow.yaml            # Workflow schema (read-only)
└── glossary.yaml            # Technical glossary
```

## Interactions

| System | Relationship | Notes |
|--------|--------------|-------|
| [CLI](../systems/cli/_index.md) | Reads/writes all file formats via handlers + computers | XML/YAML parsing in computers |
| [Validation](../systems/validation/_index.md) | Validates file structure and content quality | Schema checks, broken refs |

**Summary:** Central data layer consumed by CLI for operations and validation for integrity checks.

## Boundaries

What this system does NOT handle:

- **Does NOT:** validate file content → See [Validation](../systems/validation/_index.md)
- **Does NOT:** search document content → See [Search](../systems/search/_index.md)
- **Does NOT:** version or commit files → handled by git directive
