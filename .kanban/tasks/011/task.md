---
id: "011"
title: "Prevent product docs from linking to non-existent related features"
status: "refined"
priority: "high"
labels: [bug]
created: 2026-02-18
updated: 2026-02-18
completed:
spec: "tasks/011/spec.md"
plan: "tasks/011/plan.md"
affects: []
engineering: []
---

# Prevent product docs from linking to non-existent related features

## Description
When completing a task lifecycle, product documentation is added at the end. However, the product documentation file that gets created includes a `related` item in the front matter that links to a related feature that doesn't exist in the product documentation. We need to validate that related links point to existing docs, or not include them if they don't exist.

## What problem are you trying to solve?
Product documentation created by `/kanban-docs` includes `related` field entries that link to non-existent product docs. This causes broken references in the documentation system. Currently, 2 broken links exist:
- `cli/commands` - referenced by 4 docs
- `gui/kanban-board` - referenced by 1 doc

## What value would it provide if solved?
Ensures documentation integrity by only linking to docs that actually exist. Prevents confusion when navigating related features and maintains a clean, consistent documentation system.

## Acceptance Criteria

Given the /kanban-docs skill is creating a new product doc
And the AI suggests related features in the `related` field
When any suggested related feature does not exist as a product doc
Then that non-existent feature is omitted from the `related` field
And only existing related features are included

Given the /kanban-docs skill is updating an existing product doc
When the `related` field contains links to non-existent docs
Then those broken links are removed from the `related` field

Given existing product docs with broken related links
When this fix is implemented
Then the existing broken links (cli/commands, gui/kanban-board) are cleaned up

## Notes
The fix should be implemented by adding validation instructions to the kanban-docs skill. The skill already has access to `check-product.cjs` script which can validate whether product doc IDs exist.
