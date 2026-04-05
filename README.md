# Festina Lente

*"Make haste slowly"* — Caesar Augustus

Spec-driven development for [Claude Code](https://docs.anthropic.com/en/docs/claude-code/skills).

---

We want to go faster with LLMs — that's the *haste*. But speed without structure is just chaos with better autocomplete. The *slowly* part is where you take control: define the problem before solving it, spec the work before writing code, verify the result before calling it done.

The spec lives on disk, survives context windows, and travels between sessions. Close the terminal, come back in a week, everything is still there. The file is the source of truth.

Festina Lente is a set of Claude Code skills that enforce this — structured files on disk, where each phase reads what the last one wrote:

```
/festina-create "Add password reset flow"     # 1. Describe the problem, define done
/festina-scope 001                             # 2. Research the codebase, write a spec
/festina-plan 001                              # 3. Break the spec into atomic steps
/festina-implement 001                         # 4. Execute each step, verify as you go
/festina-finalize 001                          # 5. Run checks, update docs
/festina-complete 001                          # 6. Close the ticket
```

---

## Quick Start

**Prerequisites:** [Claude Code](https://docs.anthropic.com/en/docs/claude-code) and Node.js 18+.

**1.** Install into your project:

```bash
npx festinalente
```

**2.** Map your codebase. This takes a few minutes, but it's what makes everything else work — the agent learns what's already built, what patterns you use, and how things connect (see [Documentation](#documentation)):

```
/festina-map-product          # Document user-facing features and domains
/festina-map-engineering      # Document technical architecture and patterns
```

> **Note:** Festina Lente currently works best with existing codebases where there's structure to map and patterns to follow. Greenfield project support is a work in progress.

**3.** Create your first task and follow the workflow:

```
/festina-create "Your first task"
```

Each skill tells you what to run next.

---

## The Workflow

Six phases, in order. Each one produces a file that the next one reads — the agent never depends on conversation history, because conversations degrade but files don't.

```
BACKLOG → SCOPED → PLANNED → IN-PROGRESS → FINALIZE → AWAITING-COMPLETION → DONE
```

### 1. Create

```
/festina-create "Add password reset flow"
```

You describe the problem. The agent proposes its understanding for you to confirm, then writes `task.xml` with the problem, value, and acceptance criteria. It also searches your docs to flag overlaps with existing features.

### 2. Scope

```
/festina-scope 001
```

This is where the codebase gets investigated — affected files, patterns to follow, risks, requirements. For complex tasks, parallel research agents fan out across product docs, engineering docs, and code. The output is a spec. Optionally, it can derive behavioral contracts (preconditions, postconditions, invariants) for stateful requirements.

### 3. Plan

```
/festina-plan 001
```

The spec turns into atomic steps — files to touch, code snippets, a verify command, done criteria. Detail scales with complexity: a two-file change gets a lightweight plan, a cross-cutting refactor gets dependency ordering and an inventory list. The litmus test: *can someone execute this without reading the conversation?*

### 4. Implement

```
/festina-implement 001
```

One step at a time. Read the context files, make changes, run verification. Progress gets written to disk after each step, so you can resume any time. If a directive is violated, it's caught right there — you don't find out during review.

### 5. Finalize

```
/festina-finalize 001
```

Directive checks run first. If something fails, the agent tries to fix it and re-runs from the top. Then goal-backward verification walks through each acceptance criterion to confirm it's actually been met. Finally, product and engineering docs get updated with what was built.

### 6. Complete

```
/festina-complete 001
```

Marks the task done. This is deliberately separate from finalize — it lets directives hook into closure (merge a PR, update a ticket, notify a channel) without re-running the quality checks.

---

## Documentation

Every new conversation, the agent knows nothing. What you built last week, which patterns your codebase uses, how features relate to each other — gone. Without docs, it'll duplicate things that already exist.

With docs, the agent reads your project's knowledge base before touching anything. That's the difference between "add a notification system" producing a duplicate, and the agent telling you "there's already a notification system in `product/notifications` — do you want to extend it?"

Festina Lente maintains two layers:

**Product docs** (`product/`) — what your software does, organized by domain:

- **Features** — how each feature works, its key workflows
- **Domains** — how features group together, their boundaries
- **Concepts** — core domain terms, rules, validation logic

**Engineering docs** (`engineering/`) — how your software is built:

- **Systems** — subsystems, components, data flows, extension points
- **Patterns** — recurring solutions with when-to-use guidance
- **Conventions** — your team's rules, with correct and incorrect examples

### How docs connect to tasks

When you create or scope a task, Festina Lente searches your docs by keyword, scores the results by relevance, and auto-links the best matches. The agent reads those linked docs before writing any code — so it already knows what patterns to follow and what features exist.

### How docs flow through the workflow

| Phase | What happens |
|-------|-------------|
| `/festina-map-*` | Bootstrap docs from your codebase |
| `/festina-create` | Search docs, auto-link related features to the task |
| `/festina-scope` | Read linked docs for context during research |
| `/festina-plan` | Reference patterns for implementation guidance |
| `/festina-implement` | Follow documented conventions |
| `/festina-finalize` | Update docs to reflect what was built |

Each task leaves the docs a little more complete than it found them. You bootstrap once with `/festina-map-product` and `/festina-map-engineering` — the workflow maintains them after that.

---

## Directives

Every team has rules — architecture boundaries, naming conventions, commit workflows. Without directives, you repeat them every session and hope the agent remembers. It won't.

Directives are XML files in `.festinalente/directives/`. You create them through guided Q&A:

```
/festina-directive typescript
```

Then map them to the skills where they apply, in `config.yaml`:

```yaml
directives:
  festina-implement:
    - typescript
  festina-finalize:
    - typescript
    - github
  festina-complete:
    - github
```

When a skill runs, it loads its directives before doing anything else. They're read fresh every time — the agent can't forget them because they're not in the conversation to begin with. Mandatory context.

### What they can do

| Capability | How it works |
|-----------|-------------|
| **Context principles** | Architecture patterns, naming conventions, dependency boundaries — loaded before any code gets written |
| **Automated checks** | Build commands, pattern scans, checklists — failures get auto-fixed and re-run |
| **Phase-specific rules** | Constraints that only apply during the phases that matter |
| **Skill overrides** | Replace default steps with your own workflow — GitHub PRs, Linear tickets, deployment pipelines |
| **Teaching by example** | Correct and incorrect code samples from your project, surfaced when a violation is found |

### Bundled

One directive ships with Festina Lente: `git.xml`. It commits to main with conventional messages. No branches, no PRs. Override it when you need more.

### Examples from this repo

This repository is built with Festina Lente:

- [**`github.xml`**](.festinalente/directives/github.xml) — Full GitHub PR workflow. Issues, branches, PRs at finalize, squash merge at complete.
- [**`coding.xml`**](.festinalente/directives/coding.xml) — Three-layer DAG architecture, TypeScript type safety, 24 automated checks.
- [**`design.xml`**](.festinalente/directives/design.xml) — Native VSCode UI standards.

---

## Projects

When work spans multiple tasks:

```
/festina-create-project "User authentication system"
```

You define the problem, scope, and numbered requirements. The skill decomposes it into 2–5 vertical tasks, each traced back to its requirements. They follow the normal workflow. When they're all done:

```
/festina-complete-project auth-system
```

---

## All Commands

### Core Workflow

| Command | What it does |
|---------|-------------|
| `/festina-create` | Create a task through Q&A |
| `/festina-scope` | Research codebase, write a spec |
| `/festina-plan` | Break spec into implementation steps |
| `/festina-implement` | Execute the plan |
| `/festina-finalize` | Checks, verification, doc updates |
| `/festina-complete` | Close the task |
| `/festina-quick` | Fast path for simple fixes |

### Lifecycle

| Command | What it does |
|---------|-------------|
| `/festina-save` | WIP commit mid-implementation |
| `/festina-rework` | Send a task back with an issue report |
| `/festina-delete` | Remove a task from backlog |
| `/festina-overview` | Kanban board and task details |

### Projects

| Command | What it does |
|---------|-------------|
| `/festina-create-project` | Decompose work into tracked tasks |
| `/festina-complete-project` | Close a project |

### Documentation & Discovery

| Command | What it does |
|---------|-------------|
| `/festina-map-product` | Generate product docs from codebase |
| `/festina-map-engineering` | Generate engineering docs from codebase |
| `/festina-discover` | Surface opportunities and gaps |

### Configuration

| Command | What it does |
|---------|-------------|
| `/festina-directive` | Create a directive through Q&A |

---

## The `.festinalente/` Directory

All state lives here:

```
.festinalente/
├── tasks/           # task.xml, spec.xml, plan.xml per task
├── projects/        # project.xml per project
├── quick/           # quick.xml per quick task
├── directives/      # Your rules and workflow overrides
├── product/         # Product docs by domain
├── engineering/     # Systems, patterns, conventions
├── config.yaml      # Directive → skill mapping
├── workflow.yaml    # Columns and transitions
├── glossary.yaml    # Term aliases for search
└── manifest.json    # Version metadata
```

By default, `git.xml` commits everything — tasks, specs, plans, docs — alongside your code. Full history in git, easy diffs, nothing lost. Gitignore what you don't want. This repo gitignores `tasks/` because the GitHub directive posts specs and plans to Issues instead.

---

## VSCode Extension

A companion extension (not yet on the marketplace) adds a sidebar:

- **Tasks** — Grouped by status, context-aware actions, CodeLens in `task.xml` files
- **Directives** — Browse by skill
- **Docs** — Product and engineering docs in the editor

---

## FAQ

**Why does this exist?**

I was building a rendering engine with Claude, prompting my way through it feature by feature. The speed was something I hadn't experienced before. Except the codebase was quietly falling apart underneath me — the LLM had filled performance-critical paths with the most statistically common solution to every question, and "common code" and "good code" diverge more than you'd expect. I spent weeks refactoring with the same tool that created the mess.

When I finally set up the architecture properly, the LLM started following my patterns instead of inventing its own. But every new conversation, it forgot everything. My architecture, my dependency rules, my conventions — gone. Forty messages in, rules I'd laid out at the start would get violated because they'd been pushed out of the context window. The conversation is temporary but the codebase is permanent. What I needed wasn't better prompts, it was a system that could outlive them.

**Isn't this too much process for solo work?**

The overhead is front-loaded. You spend a few minutes describing the problem and acceptance criteria, then the agent handles the rest — research, spec, plan, implementation, verification. The alternative is spending that time anyway, except scattered across a long conversation where requirements drift and the agent quietly wanders off course without either of you quite noticing.

**Why XML?**

Claude [parses XML unambiguously](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags), which matters when task status fields and IDs need to be reliable. You don't edit these files by hand — the skills read and write them.

**Why not just write better prompts?**

You can. And you should — a precise prompt that references existing patterns produces wildly different results from a vague one. But prompts don't survive between sessions. Directives, specs, and docs do. The gap between a good prompt and a good system is that the system works even when you forget to be precise, because the structure does the remembering for you.

---

## License

MIT
