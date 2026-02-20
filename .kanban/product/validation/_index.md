---
id: "validation/_index"
title: "Validation"
type: domain
tldr: "XML, YAML, directive, and documentation quality validation"
summary: "The validation domain provides syntax and quality validation for task files (XML), frontmatter (YAML), directives (XML schema), and documentation (quality checks)."
keywords: [validation, xml, yaml, directives, quality]
aliases: [validators, checks, quality-assurance]
boundary: "Does NOT execute code checks (tests, lint); only validates file structure and content"
contains: [validation/xml, validation/yaml, validation/directives, validation/docs-quality]
related: [tasks/_index, docs/_index]
updated: 2026-02-20
---

# Validation

> **TL;DR:** XML, YAML, directive, and documentation quality validation

## Overview

The Validation domain provides structure and quality validation for kanban files. It validates XML syntax in task/spec/plan files, YAML frontmatter in documentation, directive schemas, and documentation quality (tldr length, examples present, etc.).

**Why it exists:** Ensures file integrity and documentation quality for reliable AI processing.

**Summary:** This domain provides file and content validation for kanban workflow integrity.

## Boundaries

This domain does NOT execute runtime code checks (tests, typecheck, lint). For that, see [tasks/codecheck](../tasks/codecheck.md).

- **Does NOT:** Run tests or linters
- **Does NOT:** Validate business logic
- **Does NOT:** Modify files (read-only validation)
- **See instead:** [tasks/codecheck](../tasks/codecheck.md) for code quality checks

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| [xml](./xml.md) | Validate task.xml, spec.xml, plan.xml syntax | stable |
| [yaml](./yaml.md) | Validate YAML frontmatter in markdown docs | stable |
| [directives](./directives.md) | Validate directive XML schema and references | stable |
| [docs-quality](./docs-quality.md) | Check documentation completeness and quality | stable |

**Summary:** This domain contains 4 validation features.

## Key Concepts

- **Syntax validation**: Check XML/YAML parses correctly
- **Schema validation**: Check required elements/fields exist
- **Quality checks**: Check content meets standards (length, sections)
- **Severity**: error (blocks), warning (advisory), info (suggestion)

## Relationships

| Related Domain | Relationship |
|----------------|--------------|
| [tasks](../tasks/_index.md) | Validates task XML files |
| [docs](../docs/_index.md) | Validates documentation quality |

**Summary:** This domain validates files from tasks and docs domains.
