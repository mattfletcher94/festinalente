# Festina Lente

*"Make haste slowly"* — Caesar Augustus

Spec-driven task management for AI coding agents.

---

AI coding agents lose track of what you agreed on. The longer the conversation, the worse it gets — requirements scroll away, the context window fills, and the agent starts guessing. Festina Lente fixes this by moving decisions out of the conversation and into structured XML files on disk. XML because LLMs parse it reliably — tasks, specs, plans, and directives all use it to keep the agent deterministic as work moves across phases. The conversation becomes disposable. The specs are not.

---

## What It Looks Like

```
/festina-create "Add password reset flow"     # Describe the problem, define done
/festina-scope 001                             # Research the codebase, write a spec
/festina-plan 001                              # Break the spec into atomic steps
/festina-implement 001                         # Execute each step, verify as you go
/festina-finalize 001                          # Run checks, update docs
/festina-complete 001                          # Close the ticket
```

Each command reads what the last one wrote. Close the terminal between any two and pick up where you left off.

For small fixes: `/festina-quick "Fix typo in login button"`

---

## Quick Start

Install and initialize:

```bash
npx festinalente
```

Before your first task, map your codebase. This is how Festina Lente learns what your project is and how it is built — every future task draws on this context:

```
/festina-map-product          # Document user-facing features
/festina-map-engineering      # Document technical architecture
```

Then: `/festina-create "Your first task"`

---

## The Workflow

```
BACKLOG → SCOPED → PLANNED → IN-PROGRESS → FINALIZE → AWAITING-COMPLETION → DONE
```

**`/festina-create`** — You describe the problem. The AI proposes its understanding for you to confirm. Problem, value, and acceptance criteria get written to `task.xml`.

**`/festina-scope`** — The AI investigates the codebase and writes a specification: requirements, files to modify, patterns to follow, risks. Technical decisions are surfaced as questions, not assumptions.

**`/festina-plan`** — The spec becomes atomic steps, each with files, code snippets, a verification command, and done criteria. The self-check: *can this be executed without reading the conversation?*

**`/festina-implement`** — Each step runs in a fresh subagent with clean context. Verification runs after each step. Progress is written back immediately.

**`/festina-finalize`** — Automated checks and an independent spec compliance review. Documentation updates. The task moves to `awaiting-completion`.

**`/festina-complete`** — Marks the task done. Deliberately lightweight — validation happens in finalize, closure happens here. This separation lets directives hook into completion (merge a PR, notify a channel) without re-running quality gates.

---

## Documentation

Without persistent documentation, every session starts from scratch — the agent has no memory of what was built last week, what patterns your project follows, or how features connect.

Festina Lente maintains two documentation layers in `.festinalente/`:

- **Product docs** (`product/`) — User-facing features, organized by domain.
- **Engineering docs** (`engineering/`) — Systems, patterns, and conventions.

You bootstrap these with `/festina-map-product` and `/festina-map-engineering`, which read your codebase and generate initial documentation. After that, the docs feed into the workflow directly: when you run `/festina-create`, the AI searches them to understand what already exists; when you run `/festina-finalize`, documentation agents update them with what was just built. Each task leaves the project's documentation more complete than it found it.

---

## Directives

Directives are what make Festina Lente adapt to your project rather than the other way around. Every team has rules — architecture boundaries, commit conventions, review processes, deployment gates — and without directives, you repeat them every session and hope the agent remembers. Directives encode these rules once, and from that point on they are enforced automatically, every time, across every skill. The agent cannot forget them because they are loaded before the work begins.

They are XML files in `.festinalente/directives/`, created through guided Q&A (`/festina-directive coding`) and mapped to skills in `config.yaml`:

```yaml
directives:
  festina-create:
    - linear          # Pull ticket details from Linear
  festina-scope:
    -
  festina-plan:
    -
  festina-implement:
    - typescript      # Strict types, no enums, layer boundaries
    - react           # Component patterns, accessibility, hooks rules
  festina-finalize:
    - typescript
    - react
    - github          # Commit, push, open PR for review
  festina-complete:
    - github          # Squash merge on approval, clean up branch
    - linear          # Update ticket status, post summary
```

### What directives can do

**Coding standards** — Define the rules your team actually follows: architectural principles, forbidden patterns, naming conventions, dependency boundaries. These are not suggestions — they are loaded as mandatory context before the AI writes a single line of code.

**Automated checks** — Run build commands, scan for forbidden patterns, present manual checklists. If a check fails during finalization, the AI attempts to fix it and re-runs all checks from the beginning. Your CI rules run before the code ever leaves the machine.

**Phase-specific rules** — Different phases need different guidance. A directive can enforce constraints only during planning, or only during implementation, or only during finalization — so the AI gets relevant rules without noise from unrelated phases.

**Skill overrides** — The most powerful capability. A directive can skip default skill steps entirely and replace them with custom workflows. This is how you integrate external systems — GitHub PRs, Linear tickets, deployment pipelines — without touching the skills themselves. The yaml example above shows exactly this: `github` and `linear` directives replacing default behavior at finalize and complete.

**Teaching by example** — Show the AI what correct and incorrect code looks like in your project. When a violation is found during review, the relevant example is surfaced to explain not just *what* is wrong but *why*, and how to fix it.

### The bundled directive

The only directive that ships with Festina Lente is `git.xml`. It commits directly to main with conventional commit messages and pushes at finalize and complete. No branching by default — if your project needs feature branches or PR workflows, you override it with your own directive.

### Real-world examples

This repository is built with Festina Lente, and its directives demonstrate what is possible:

- [**`github.xml`**](.festinalente/directives/github.xml) — Full GitHub PR workflow. Overrides `git.xml` to create issues, push branches, open PRs during finalize, then check approval and squash merge during complete.
- [**`coding.xml`**](.festinalente/directives/coding.xml) — Three-layer architecture enforcement, TypeScript type safety rules, circular dependency checks.
- [**`design.xml`**](.festinalente/directives/design.xml) — Native VSCode UI standards for the companion extension.

---

## Other Commands

| Command | Purpose |
|---------|---------|
| `/festina-quick` | Fast path for simple fixes |
| `/festina-save` | WIP commit mid-implementation |
| `/festina-rework` | Send a task back with an issue report |
| `/festina-delete` | Remove a task |
| `/festina-overview` | View the kanban board |
| `/festina-explore` | Explore ideas before committing to a task |
| `/festina-map-product` | Document product features |
| `/festina-map-engineering` | Document technical architecture |
| `/festina-define-product` | Define a new product from scratch |

---

## The `.festinalente/` Directory

All state lives in a single directory at the root of your project:

- `tasks/` — One folder per task containing `task.xml`, `spec.xml`, and `plan.xml`
- `directives/` — Your project's rules and workflow customizations
- `product/` — Product documentation, organized by domain
- `engineering/` — Engineering documentation — systems, patterns, conventions
- `config.yaml` — Maps directives to skills
- `workflow.yaml` — Column definitions and transitions

Some of these folders can be gitignored depending on your workflow. This repository, for example, gitignores `tasks/` because the GitHub directive posts specs and plans to GitHub Issues instead — the local files are just working state.

---

## VSCode Extension

A companion extension (not yet on the marketplace) surfaces Festina Lente in the sidebar:

- **Tasks** — Grouped by status column, with context-aware actions (Scope, Plan, Implement, Finalize, Complete). CodeLens buttons appear directly in open `task.xml` files.
- **Directives** — Browse directives organized by which skills they apply to.
- **Product & Engineering Docs** — Navigate your documentation without leaving the editor.

File watchers keep everything in sync as tasks progress.

---

## License

MIT
