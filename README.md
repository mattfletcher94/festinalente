# Festina Lente

*"Make haste slowly"* — Caesar Augustus

Spec-driven development for AI coding agents. Move fast by being deliberate.

## What is it?

Festina Lente is a structured workflow system for LLM-powered development. It prevents context rot by capturing requirements, specifications, and plans in persistent documents that AI agents can follow.

## Installation

```bash
npx @mattfletcher94/festinalente
```

## Workflow

```
/festina-create "Add user authentication"
       ↓
/festina-scope 001
       ↓
/festina-plan 001
       ↓
/festina-implement 001
       ↓
/festina-check 001
       ↓
/festina-docs 001
       ↓
/festina-merge 001
```

| Command | Phase | Output |
|---------|-------|--------|
| `/festina-create` | Capture problem, value, acceptance criteria | `task.xml` |
| `/festina-scope` | Research codebase, create specification | `spec.xml` |
| `/festina-plan` | Break spec into atomic implementation steps | `plan.xml` |
| `/festina-implement` | Execute plan tasks in order | Code changes |
| `/festina-check` | Run tests, verify requirements, QA | Committed code |
| `/festina-docs` | Update product & engineering docs | Documentation |
| `/festina-merge` | Verify PR merged, close task | Done |

## Quick Tasks

For simple fixes that don't need full spec/plan:

```
/festina-quick "Fix typo in README"
```

## Status

```
/festina-overview
```

## License

MIT
