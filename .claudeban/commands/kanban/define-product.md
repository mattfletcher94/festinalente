---
name: define-product
description: Define a new product through Socratic dialogue
allowed-tools: Read, Write, Bash(git add *, git commit *, git status), AskUserQuestion
argument-hint: (no arguments)
---

# Define Product

Define a new product's features through Socratic dialogue.

## Usage

`/kanban:define-product`

## When to use

- Starting a new project from scratch
- Want to document product vision before coding
- Need LLM-ready documentation for task planning

## Workflow

1. Invoke the **kanban-define-product** skill
2. Skill handles Q&A, doc generation, and commit

## Commit format

`docs: define-product - {summary of product defined}`

## Example

`/kanban:define-product`

Asks vision questions, explores features, generates product docs, and commits.
