# Festina Lente

*"Make haste slowly"* — Caesar Augustus

Spec-driven task management for AI coding agents.

---

AI coding agents lose track of what you agreed on. The longer the conversation, the worse it gets — requirements scroll away, the context window fills, and the agent starts guessing. Festina Lente fixes this by moving decisions out of the conversation and into files on disk. The conversation becomes disposable. The specs are not.

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

Optionally, map your codebase so future tasks have context to draw on:

```
/festina-map-product          # Document user-facing features
/festina-map-engineering      # Document technical architecture
```

Then: `/festina-create "Your first task"`

---

## The Workflow

```
BACKLOG → SCOPED → PLANNED → IN PROGRESS → FINALIZE → AWAITING COMPLETION → DONE
```

**Create** — You describe the problem. The AI proposes its understanding for you to confirm. Problem, value, and acceptance criteria get written to `task.xml`.

**Scope** — The AI investigates the codebase and writes a specification: requirements, files to modify, patterns to follow, risks. Technical decisions are surfaced as questions, not assumptions.

**Plan** — The spec becomes atomic steps, each with files, code snippets, a verification command, and done criteria. The self-check: *can this be executed without reading the conversation?*

**Implement** — Each step runs in a fresh subagent with clean context. Verification runs after each step. Progress is written back immediately.

**Finalize** — Automated checks and an independent spec compliance review. Documentation updates. The task moves to `awaiting-completion`.

**Complete** — Marks the task done. Deliberately lightweight — validation happens in finalize, closure happens here. This separation lets directives hook into completion (merge a PR, notify a channel) without re-running quality gates.

---

## Documentation

Most AI coding tools treat every session as a blank slate. The agent has no memory of what was built last week, what patterns your project follows, or how your features connect to each other. You end up re-explaining context that the codebase itself should provide.

Festina Lente maintains two documentation layers in `.festinalente/` that solve this:

- **Product docs** (`product/`) — User-facing features, organized by domain. When you create a task, the AI searches these to understand what you are building on top of.
- **Engineering docs** (`engineering/`) — Systems, patterns, and conventions. When you scope, the AI finds existing patterns to follow rather than inventing new ones.

You bootstrap these with `/festina-map-product` and `/festina-map-engineering`, which read your codebase and generate initial documentation. After that, the docs feed into the workflow directly: when you run `/festina-create`, the AI searches them to understand what already exists; when you run `/festina-finalize`, documentation agents update them with what was just built. Each task leaves the project's documentation more complete than it found it.

---

## Directives

Every project has rules that AI assistants do not know about — architecture boundaries, commit conventions, review processes. Directives let you encode these once and have them enforced automatically.

They are XML files in `.festinalente/directives/`, created through guided Q&A (`/festina-directive coding`) and mapped to skills in `config.yaml`:

```yaml
directives:
  festina-implement:
    - coding
  festina-finalize:
    - coding
```

### What directives can do

**Coding standards** — Architectural principles, forbidden patterns, naming conventions. Loaded as mandatory context every time a skill runs.

**Automated checks** — Build commands, pattern scans, manual checklists. Failed checks trigger auto-fix and re-run.

**Phase-specific rules** — Constraints that apply only during planning, or implementation, or finalization.

**Skill overrides** — Skip default steps and replace them with different workflows. This is how you integrate GitHub, GitLab, or deployment pipelines without modifying skills.

**Teaching by example** — Show the AI what correct and incorrect code looks like. Violations surface the relevant example during review.

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

## License

MIT
