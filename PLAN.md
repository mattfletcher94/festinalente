# Branching Strategy Plan

## Status: Discovery Phase

## Problem Statement
The Claude Kanban system currently operates on whatever branch the user is on. We need to introduce a branching strategy where work happens on `task/{id}` branches.

## Current Understanding

### Workflow Phases
The system has 9 columns with these key transitions:

```
backlog → refined → scoped → planned → in-progress → verify → review → update-docs → done
```

### Current Git Operations

| Command | Commits? | What's Committed |
|---------|----------|-----------------|
| `define-task` | YES | Task file (docs) |
| `backlog-refine-task` | YES | Refined task (docs) |
| `refined-scope-task` | YES | Functional spec (docs) |
| `scoped-plan-task` | YES | Implementation plan (docs) |
| `planned-implement-task` | NO | Code written but uncommitted |
| `in-progress-wip-commit` | YES | WIP progress (stays in-progress) |
| `in-progress-verify-task` | On fail | Iteration notes (docs) |
| `verify-pass-task` | NO | Just moves status |
| `verify-fail-task` | YES | Failure notes (docs) |
| `review-pass-task` | YES | **Implementation code** |
| `review-fail-task` | YES | Review feedback (docs) |
| `update-docs-complete-task` | YES | Product docs |

### Key Observation
- Documentation commits happen throughout the workflow
- **Code is only committed once** at `review-pass-task`
- Code remains uncommitted during: `planned-implement-task` → `verify` → `review`

---

## Socratic Exploration

### Question 1: What is the purpose of branching?

*Exploring why we branch at all helps us understand when branching makes sense.*

Possible purposes:
- [ ] Isolate incomplete/experimental work from main
- [ ] Enable parallel work on multiple tasks
- [ ] Create a clean PR for code review
- [ ] Keep main always deployable
- [ ] Other: ___

### Question 2: What should live on the branch?

*Different content might warrant different branching strategies.*

Options to consider:
- [ ] Only implementation code
- [ ] Planning docs + code
- [ ] Everything from task creation onwards
- [ ] Only what will be in the PR

### Question 3: When should the branch be created?

*Candidate moments in the workflow:*

| When | Pros | Cons |
|------|------|------|
| `define-task` | Full history on branch | Many doc-only commits on branch |
| `scoped-plan-task` | Plan + code together | Still doc commits before code |
| `planned-implement-task` | Code isolation only | Plan not on branch |
| Other | ? | ? |

### Question 4: When should the branch be merged?

*Candidate moments:*

| When | Pros | Cons |
|------|------|------|
| `review-pass-task` | Code reviewed and ready | Docs update still pending |
| `update-docs-complete-task` | Everything complete | PR includes doc update |
| Other | ? | ? |

### Question 5: What happens to doc commits on main?

*If we branch late (e.g., at implementation), the earlier doc commits are on main.*

Options:
- [ ] That's fine - docs don't affect deployability
- [ ] We should branch earlier
- [ ] We need a different strategy entirely

---

## Research Needed
- [ ] Best practices for feature branch timing
- [ ] How teams handle documentation in branching strategies
- [ ] PR-based workflows with AI assistance

---

## Decision Log
*(Will be updated as we reach conclusions)*

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Purpose of branching | **Enable PR workflow** | User wants PRs for code review before merging to main |
| 2 | What lives on branch | **Spec, plan, code, product docs** | Everything from scope onwards represents "committed work" |
| 3 | When to create branch | **`refined-scope-task`** | Define/refine are exploration; scope beg