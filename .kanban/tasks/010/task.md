---
id: "010"
title: "Autoplay mode: automatically run next command when current finishes"
status: backlog
priority: medium
labels: [feature]
created: 2026-02-18
updated: 2026-02-18
completed:
spec: "tasks/010/spec.md"
plan: "tasks/010/plan.md"
affects: [gui/autoplay-mode]
engineering: []
---

# Autoplay mode: automatically run next command when current finishes

## Description
Add an autoplay mode that automatically runs the 'next up' command when the current command finishes. This continues until reaching phases that require manual user review such as QA, code review, or PR - at which point the user may want to call 'rework'.

## What problem are you trying to solve?
{Filled during refine phase via Q&A}

## What value would it provide if solved?
{Filled during refine phase via Q&A}

## Acceptance Criteria

<!-- Use Gherkin format (Given/When/Then) -->

Given {precondition}
When {action}
Then {expected outcome}
And {additional outcome}

## Notes
- Should stop at manual review phases: QA, code review, PR
- User should be able to call 'rework' at these checkpoints
