---
id: "010"
title: "Autoplay mode: automatically run next command when current finishes"
status: scoped
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
Running kanban commands manually between phases is tedious and repetitive. Having to return and trigger each phase (scope, plan, implement, etc.) breaks focus and interrupts other work. Users want to set a task running and let it progress through phases automatically while they focus on other things.

## What value would it provide if solved?
- Streamlined workflow - enable autoplay once and phases chain automatically without manual intervention
- Less context switching - stay focused on other work while the task progresses through phases
- Faster task completion with reduced manual overhead

## Acceptance Criteria

Given a task is open in the task detail pane
And the task has been created (not during kanban-create)
When the user views the task pane
Then an autoplay toggle is visible in the task detail pane

Given autoplay is enabled for a task
When the current kanban phase completes successfully
Then the next phase command is executed immediately
And no delay or countdown is shown

Given autoplay is enabled for a task
When the current phase is a review phase (codecheck, qa, or pr)
Then autoplay stops and waits for manual review
And the user can trigger rework or approve to continue

Given autoplay is enabled for a task
When the user leaves the task or closes the application
Then the autoplay state resets (session-only, not persisted)

Given a user is running kanban-create
When they create a new task
Then autoplay toggle is not available during task creation

## Notes
- Review phases that stop autoplay: codecheck, qa, pr (phases that can result in rework)
- Autoplay toggle location: task detail pane (middle pane when task is open)
- State persistence: session only, resets on task change or app close
- Transition behavior: immediate, no countdown or delay
