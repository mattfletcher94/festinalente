---
name: map-product
description: Discover and document an existing codebase's features
allowed-tools: Read, Write, Glob, Grep, Bash(git add *, git commit *, git status), AskUserQuestion
argument-hint: (no arguments)
---

# Map Product

Analyze an existing codebase and create initial product documentation through Socratic dialogue.

## Usage

`/kanban:map-product`

## When to use

- You have an existing codebase with real features
- Product documentation doesn't exist or is incomplete
- You want LLM-ready documentation for future task work

## Workflow

1. Invoke the **kanban-map-product** skill
2. Skill handles codebase analysis, Q&A, doc generation, and commit

## Commit

Uses `commits.map-product` format from `.claudeban/kanban-workflow.yaml`.

## Example

`/kanban:map-product`

Analyzes codebase, asks clarifying questions, generates product docs, and commits.
