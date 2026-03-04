# Festina Lente

*"Make haste slowly"* — Caesar Augustus

Spec-driven development for AI coding agents. Move fast by being deliberate.

## The Problem

AI coding agents are powerful but suffer from **context rot** — they lose track of requirements, make assumptions, skip steps, and produce incomplete work. The longer the conversation, the worse it gets. A 30-minute session that started with clear requirements ends with the agent hallucinating features nobody asked for, forgetting half the acceptance criteria, and leaving a trail of half-implemented code.

This happens because conversation history is a terrible place to store decisions. Messages scroll away, context windows fill up, and the agent is left guessing at what was agreed three hundred messages ago.

## The Philosophy

Festina Lente is built on a single insight: **the AI's memory should not be the conversation**.

Every decision, every requirement, every implementation step gets written to a persistent XML document on disk. When a command runs, it reads these documents, does focused work, and writes progress back. The conversation can be abandoned, the terminal can crash, the context window can fill — it doesn't matter. The state lives in the files.

This creates a natural rhythm:

1. **Capture** what needs to be done (requirements in `task.xml`)
2. **Research** how to do it (technical decisions in `spec.xml`)
3. **Plan** the steps (atomic tasks in `plan.xml`)
4. **Execute** one step at a time (code changes, verified individually)
5. **Validate** everything works (automated checks, documentation, merge)

Each phase produces a document. Each document is self-contained. Each command reads only what it needs. The AI always knows exactly what to do next, because the answer is written down.

## Installation

This package is hosted on [GitHub Packages](https://github.com/mattfletcher94/festinalente/packages). Create a `.npmrc` file in your project root:

```
@mattfletcher94:registry=https://npm.pkg.github.com
```

Then run:

```bash
npx @mattfletcher94/festinalente
```

---

## Getting Started

After installing, run these commands to teach Festina Lente about your codebase:

```
/festina-map-product        # Analyze and document user-facing features
/festina-map-engineering    # Analyze and document technical architecture
```

Both commands spawn parallel agents to explore your code, then walk you through Socratic Q&A to validate and enrich findings. The output is a set of markdown docs in `.festinalente/product/` and `.festinalente/engineering/` that every subsequent command uses for context.

Once mapping is done, optionally create directives for your project's conventions:

```
/festina-directive coding   # Define code quality rules, build checks, forbidden patterns
```

Then start working:

```
/festina-create "Add user authentication"
```

---

## Core Workflow

Every substantial task flows through six phases, each producing a persistent artifact:

```
BACKLOG → SCOPED → PLANNED → IN PROGRESS → FINALIZE → DONE
```

### `/festina-create` — Capture the Problem

Creates a new task through conversational Q&A. Before asking anything, it searches your product and engineering documentation for relevant context — so the conversation starts informed, not blank.

Asks three questions:
1. **Problem** — What's broken or missing?
2. **Value** — Why does this matter?
3. **Acceptance Criteria** — What does "done" look like? (Gherkin Given/When/Then format)

**Produces:** `.festinalente/tasks/{id}/task.xml` — a structured requirements document with problem, value, acceptance criteria, labels, priority, and references to affected documentation.

**Commit:** `docs({id}): create - {title}`

```
/festina-create "Add user authentication"
```

Active directives can extend this behavior — for example, a directive could automatically create a GitHub Issue or Jira ticket after the task is written.

### `/festina-scope` — Research & Specify

Reads the task and researches your codebase to understand HOW to build it. Chooses between two research modes:

- **Quick mode** — Sequential research for simple tasks
- **Deep mode** — Spawns four parallel agents: Product Context Researcher, Pattern Finder, Codebase Analyzer, and Pitfall Detector

The output is a technical specification that documents:
- Functional requirements (numbered, traceable to acceptance criteria)
- Files to create or modify (with rationale)
- Code patterns to follow (with line references to existing code)
- Dependencies (internal and external)
- Risks and mitigations
- Constraints from active directives

Any unresolved technical decisions are surfaced as questions for the developer.

**Produces:** `.festinalente/tasks/{id}/spec.xml`
**Creates branch:** `task/{id}`
**Commit:** `docs({id}): scope - {title}`

```
/festina-scope 001
```

### `/festina-plan` — Break Into Steps

Transforms the spec into an executable implementation plan. Assesses complexity (simple/medium/complex) and creates numbered, atomic tasks. Each task includes:

- **Files** to create or modify
- **Requirements** it satisfies (traced back to spec)
- **Pattern** references to existing code to follow
- **Action** — detailed instructions with code snippets showing the target state
- **Verify** — a command to run after completion (e.g., `npx tsc --noEmit`)
- **Done** criteria — what must be true when the step is complete

The plan also documents edge cases, pitfalls, testing strategy, and task dependencies. A self-check question is applied: *"Can this plan be executed without reading the conversation?"*

**Produces:** `.festinalente/tasks/{id}/plan.xml`
**Commit:** `docs({id}): plan - {title}`

```
/festina-plan 001
```

### `/festina-implement` — Execute the Plan

Works through plan steps in dependency order. For each step:

1. Reads the task instructions and code snippets
2. Implements the changes
3. Runs the verification command
4. Marks the step `completed="true"` in `plan.xml`

Uses smart context loading (`select-context`) to pull in only the documentation needed — minimal, standard, or full tiers depending on task complexity — so the context window doesn't fill with irrelevant docs.

After all steps complete, runs anti-pattern scans (no leftover TODO/FIXME), requirement tracing (every requirement addressed), and wiring verification.

**Code stays uncommitted** — finalization handles the commit after validation.

```
/festina-implement 001
```

### `/festina-finalize` — Validate, Document & Complete

A three-phase consolidation:

**Phase 1 — Validate:** Runs all validation checks from active directives (build commands, pattern scans, checklists). If checks fail, attempts auto-fix and re-runs. Commits implementation code after checks pass.

**Phase 2 — Document:** Spawns parallel agents to update product and engineering documentation with what was actually built. Stub docs created during `/festina-create` get filled in.

**Phase 3 — Complete:** Pushes branch and merges to main. Marks the task as done. Directives can override the merge behavior — for example, replacing local merges with a PR-based review workflow.

**Commits:**
- `{type}({id}): {title}` — implementation commit (type is `feat`, `fix`, `refactor`, or `docs` based on task label)
- `docs({id}): {description}` — documentation updates
- `docs({id}): done - {title}` — task completion

```
/festina-finalize 001
```

---

## Quick Tasks

For simple fixes that don't need the full workflow:

```
/festina-quick "Fix typo in login button"
```

Quick tasks ask only two questions:
1. What problem are you solving?
2. What does done look like?

Creates a `quick.xml`, a `quick/{id}` branch, implements, commits, and optionally merges — all in one command.

**Commit:** `quick({id}): {title}`

---

## How Specs Are Stored

All Festina Lente state lives in the `.festinalente/` directory at your project root:

```
.festinalente/
├── config.yaml                    # Directive-to-skill mappings + settings
├── workflow.yaml                  # Column/label/priority/transition/commit definitions
├── manifest.json                  # Version, runtimes, installed metadata
├── glossary.yaml                  # Project-specific term aliases for search expansion
│
├── directives/                    # Project-specific rules (XML)
│   ├── coding.xml                 # Your code quality rules
│   └── ...                        # Any directives you create
│
├── tasks/                         # Full workflow tasks
│   ├── 001/
│   │   ├── task.xml               # Requirements (created by /festina-create)
│   │   ├── spec.xml               # Technical spec (created by /festina-scope)
│   │   └── plan.xml               # Implementation plan (created by /festina-plan)
│   ├── 002/
│   │   ├── task.xml
│   │   ├── spec.xml
│   │   └── plan.xml
│   └── ...
│
├── quick/                         # Quick task files
│   └── {id}.xml
│
├── product/                       # Product documentation
│   ├── overview.md
│   └── {domain}/
│       └── {feature}.md
│
├── engineering/                   # Engineering documentation
│   ├── overview.md
│   ├── systems/
│   ├── patterns/
│   └── conventions/
│
├── templates/                     # XML/MD templates for all document types
│   ├── task.xml
│   ├── spec.xml
│   ├── plan.xml
│   └── ...
│
└── scripts/                       # Built CLI scripts
```

Each task gets its own directory (`tasks/{id}/`) containing up to three XML files — one per workflow phase. These files are the single source of truth. The conversation is disposable; the files are not.

Skills are installed to `.claude/skills/` as built output from the festinalente npm package. Each skill is a `SKILL.md` file that Claude Code reads when you invoke the corresponding slash command.

---

## Commit Vocabulary

Every commit Festina Lente creates follows a strict, predictable format defined in `workflow.yaml`. This makes the git history readable and traceable:

| Phase | Commit Format | Example |
|-------|---------------|---------|
| Create | `docs({id}): create - {title}` | `docs(001): create - Add user auth` |
| Scope | `docs({id}): scope - {title}` | `docs(001): scope - Add user auth` |
| Plan | `docs({id}): plan - {title}` | `docs(001): plan - Add user auth` |
| WIP Save | `wip({id}): {summary}` | `wip(001): steps 1-3 complete` |
| Implementation | `{type}({id}): {title}` | `feat(001): Add user auth` |
| Check Retry | `docs({id}): check-retry - {title}` | `docs(001): check-retry - Add user auth` |
| Documentation | `docs({id}): {description}` | `docs(001): product + engineering` |
| Rework | `docs({id}): rework - {title}` | `docs(001): rework - Add user auth` |
| Done | `docs({id}): done - {title}` | `docs(001): done - Add user auth` |
| Delete | `docs({id}): delete - {title}` | `docs(001): delete - Add user auth` |
| Quick Task | `quick({id}): {title}` | `quick(004): Fix login typo` |
| Map Product | `docs: map-product - {features}` | `docs: map-product - auth, tasks` |
| Map Engineering | `docs: map-engineering - {systems}` | `docs: map-engineering - API layer` |
| Define Product | `docs: define-product - {description}` | `docs: define-product - Task manager` |
| Create Directive | `docs: create directive - {name}` | `docs: create directive - coding` |

The `{type}` in implementation commits comes from the task's label: `feature` → `feat`, `bug` → `fix`, `refactor` → `refactor`, `docs` → `docs`.

---

## Directives

Directives are project-specific rules that the AI must follow. They live in `.festinalente/directives/` as XML files and are loaded by commands based on your `config.yaml` configuration.

Directives solve a fundamental problem: every project has conventions, standards, and workflows that generic AI assistants don't know about. Rather than repeating "remember to run the build" or "don't use `any` types" every session, you encode these rules once and they're enforced automatically.

### Anatomy of a Directive

Every directive has up to five sections:

```xml
<directive name="example" version="1">

  <!-- What this directive is for -->
  <description>...</description>

  <!-- Principles: rules the AI references during work -->
  <context>
    <principle id="P1" keywords="...">Rule text</principle>
  </context>

  <!-- Process rules: phase-specific guidance -->
  <process>
    <rule id="R1" phase="plan">What to do during planning</rule>
    <rule id="R2" phase="implement">What to do during implementation</rule>
  </process>

  <!-- Validation: automated checks run by /festina-finalize -->
  <validation>
    <check type="command">         <!-- Run a shell command -->
      <run>pnpm build</run>
      <expect>Exit code 0</expect>
    </check>
    <check type="pattern" files="**/*.ts">  <!-- Scan for forbidden patterns -->
      <forbidden>:\s*any\b</forbidden>
      <reason>any disables type checking</reason>
    </check>
    <check type="checklist">       <!-- Manual review items -->
      <item>All exports have documentation</item>
    </check>
  </validation>

  <!-- Examples: good and bad code the AI learns from -->
  <examples>
    <example type="violation">
      <code>// BAD: ...</code>
      <explanation>Why this is wrong</explanation>
    </example>
    <example type="correct">
      <code>// GOOD: ...</code>
      <explanation>Why this is right</explanation>
    </example>
  </examples>

</directive>
```

### Overrides: Replacing Workflow Steps

Directives can go beyond rules and validation — they can **override entire workflow steps**. The `<override>` element tells the system to skip specific steps within a skill and replace them with custom process rules:

```xml
<override phase="finalize">
  <skip step="merge_branch"/>
  <skip step="cleanup_branch"/>
  <reason>Custom workflow replaces local git merge</reason>
  <instead rules="M-1,M-2,M-3"/>
</override>
```

This means directives aren't just passive rules — they can fundamentally change how the workflow operates for your project. For example, you could replace local merges with a PR-based review workflow, or add deployment steps after finalization.

### Configuring Directives

In `.festinalente/config.yaml`, you map directives to the skills that should load them:

```yaml
directives:
  festina-create:
    - coding
  festina-scope:
    - coding
  festina-plan:
    - planning
    - coding
  festina-implement:
    - coding
  festina-finalize:
    - coding
  festina-quick:
    - coding
```

Each skill loads only the directives it needs. A `coding` directive might be loaded everywhere to enforce type safety and architecture rules, while a `planning` directive only applies during the plan phase. Skills with `[]` load no directives.

### Creating Directives

Use `/festina-directive` to create new directives through guided Q&A:

```
/festina-directive code-style
```

The command walks you through defining the purpose, which phases it applies to, principles, validation checks, and examples — then generates the XML and links it to the appropriate skills in `config.yaml`.

---

## Documentation System

Festina Lente maintains two documentation layers that help the AI understand your codebase across sessions:

### Product Documentation (`.festinalente/product/`)

User-facing feature documentation organized by domain:

```
.festinalente/product/
├── overview.md
├── auth/
│   ├── login.md
│   └── registration.md
└── tasks/
    └── management.md
```

Each doc has structured frontmatter (`tldr`, `keywords`, `boundaries`) that enables semantic search. When you create a task, the AI finds related docs to understand what you're building on top of.

### Engineering Documentation (`.festinalente/engineering/`)

Technical documentation for patterns, systems, and conventions:

```
.festinalente/engineering/
├── overview.md
├── systems/
│   └── auth/
├── patterns/
│   └── repository.md
└── conventions/
    └── file-naming.md
```

### Why Documentation Matters

1. **Context for new tasks**: `/festina-create` searches docs to understand what you're building on top of.
2. **Consistent implementation**: `/festina-scope` finds patterns to follow and constraints to respect.
3. **Living documentation**: `/festina-finalize` completes stub docs with what was actually built — docs stay accurate.
4. **LLM-optimized search**: Frontmatter fields like `tldr`, `keywords`, and `aliases` help the AI find the right docs quickly.

---

## Supporting Commands

| Command | Purpose |
|---------|---------|
| `/festina-quick` | Fast path for simple fixes — two questions, single commit |
| `/festina-save` | Save partial progress with a WIP commit (`wip({id}): {summary}`) |
| `/festina-rework` | Return a task from Finalize to In Progress with a structured issue report |
| `/festina-delete` | Delete a task that's still in Backlog |
| `/festina-overview` | View board status, task details, or visual ASCII kanban |
| `/festina-explore` | Explore questions and ideas through Socratic dialogue before committing to a task |
| `/festina-map-product` | Analyze codebase and document product features |
| `/festina-map-engineering` | Analyze codebase and document technical architecture |
| `/festina-define-product` | Define a new product from scratch through Socratic Q&A *(WIP)* |
| `/festina-directive` | Create project-specific directives through guided Q&A |

---

## How It Prevents Context Rot

1. **Persistent State** — All decisions live in XML files, not conversation history
2. **Atomic Commands** — Each command does one thing and commits progress
3. **Self-Contained Plans** — Implementation steps include enough context to execute without re-reading everything
4. **Verification Gates** — Automated checks catch drift before it compounds
5. **Documentation Links** — Tasks reference docs, docs reference code — everything stays connected
6. **Stateless Resumability** — Commands read state from files each run, so work survives terminal crashes, context limits, and session breaks

---

## This Repository: Dogfooding

This repo is a **dogfooding project** — Festina Lente is used to build itself. The tasks in `.festinalente/tasks/`, the directives in `.festinalente/directives/`, and the commit history all reflect real usage of the system developing its own features. When you see completed tasks, specs, and plans here, those are real artifacts from real development sessions.

The directives in this repo are project-specific examples — they're not part of the Festina Lente product, but they demonstrate the full range of what directives can do.

### `coding.xml` — Architecture & Type Safety

Enforces a three-layer architecture (Computer, Capability, Orchestrator) with strict dependency direction, TypeScript type safety rules, and documentation standards. Key principles:

- Dependencies must form a DAG: `Computer <- Capability <- Orchestrator`
- Every module categorized with suffix: `.computer.ts`, `.capability.ts`, `.orchestrator.ts`
- Never use `any` — use `unknown` and narrow with type guards
- No `@deprecated` — delete or keep, no middle ground
- All exported symbols must have TSDoc documentation

Validation runs build commands, circular dependency checks, and pattern scans for forbidden code:

```xml
<check type="command" severity="error">
  <run>pnpm check:dpdm</run>
  <expect>No circular dependencies (exit code 0)</expect>
</check>
<check type="pattern" severity="error" files="**/*.ts">
  <forbidden>:\s*any\b</forbidden>
  <reason>any type disables type checking - use unknown and narrow</reason>
</check>
<check type="pattern" severity="error" files="*.capability.ts">
  <forbidden>import.*\.capability\.</forbidden>
  <reason>Capabilities cannot import other capabilities (lateral dependency)</reason>
</check>
```

Examples teach the AI the difference between correct and incorrect patterns:

```xml
<example type="violation">
  <code><![CDATA[
// WRONG: Policy in capability
function ensureSession(): Session {
  if (session && session.isValid) return session;  // Policy!
  return createSession();
}
  ]]></code>
  <explanation>Capability decides WHEN to create - this is policy, belongs in orchestrator</explanation>
</example>
<example type="correct">
  <code><![CDATA[
// CORRECT: Mechanism in capability, policy in orchestrator
function createSession(): Session { return api.createSession(); }
function getSession(): Session {
  if (session && session.isValid) return session;
  return createSession();
}
  ]]></code>
</example>
```

### `github.xml` — PR Workflow Integration

The most advanced directive in this repo. It integrates the entire workflow with GitHub Issues and PRs using MCP tools, demonstrating how directives can override core workflow behavior.

**Principles** establish the rules: every task syncs to a GitHub Issue, PRs replace local merges, commands are stateless and resumable.

**Process rules** add behavior to specific phases. During `create`, a rule fires after task.xml is written to create a GitHub Issue:

```xml
<rule id="C-G1" phase="create">
  AFTER creating task.xml, sync to GitHub:

  IF $ARGUMENTS was a GitHub issue number (#N or just N):
    1. Fetch issue via mcp__GitHub__issue_read (method: "get")
    2. Add github-issue="#N" and github-url to task element

  ELSE (normal title):
    1. Get owner/repo from: git remote get-url origin
    2. Create issue via mcp__GitHub__issue_write
    3. Add github-issue="#N" and github-url to task element
</rule>
```

During `finalize`, an **override** skips the default local merge and replaces it with a PR state machine:

```xml
<override phase="finalize">
  <skip step="merge_branch"/>
  <skip step="cleanup_branch"/>
  <reason>GitHub PR workflow replaces local git merge</reason>
  <instead rules="M-G1,M-G2,M-G3,M-G4,M-G5"/>
</override>
```

The replacement rules form a chain: check if a PR exists → create one if not → check review status → merge if approved → clean up. Each rule reads GitHub state and takes the appropriate next action:

```xml
<rule id="M-G3" phase="finalize">
  CHECK PR STATUS via mcp__GitHub__pull_request_read:
  - state="merged"                  → cleanup
  - reviewDecision="CHANGES_REQUESTED" → prompt with PR link, EXIT
  - reviewDecision="APPROVED"       → merge
  - else                            → "Awaiting review", EXIT
</rule>
```

The key insight is **statelessness** — every time `/festina-finalize` runs, it reads the current state and picks up where it left off. You can close your terminal, come back tomorrow, and run the command again.

### `design.xml` — VSCode UI Standards

Enforces native VSCode patterns for the companion VSCode extension: use ThemeIcons and ThemeColors exclusively (never hardcode hex), keyboard-first design, and a process rule that requires proposing three options (minimal/moderate/rich) before implementing any UI feature.

```xml
<check type="pattern" severity="error" files="**/*.ts">
  <forbidden>['"]#[0-9a-fA-F]{3,8}['"]</forbidden>
  <reason>Hardcoded hex colors break theme compatibility. Use vscode.ThemeColor instead.</reason>
</check>
```

---

These directives are not built into Festina Lente — they're project-specific customizations created with `/festina-directive`. You could write similar directives for your own architecture patterns, your team's code review process, or integrations with Jira, Linear, or any other tool. The point is that directives can go far beyond code style rules — they can reshape the entire workflow.

---

## VSCode Extension

Festina Lente ships with a companion VSCode extension that surfaces your tasks, specs, plans, and directives directly in the sidebar — so you never have to dig through `.festinalente/` manually.

### Sidebar Panel

The extension adds a dedicated activity bar icon with six views:

- **Tasks** — Groups tasks by status column (In Progress, Finalize, Planned, Scoped, Backlog, Done). Each task shows its priority, labels, which spec/plan files exist, and the next action to take. Expanding a task reveals action buttons and clickable file items.
- **Quicks** — A flat list of quick tasks.
- **Config** — Shows the status of `config.yaml` with click-to-open.
- **Directives** — Two-level tree showing which directives are mapped to which workflow phases, read from `config.yaml`. Missing directive files are flagged with a warning icon.
- **Product Docs** — Browses `.festinalente/product/` markdown files.
- **Engineering Docs** — Browses `.festinalente/engineering/` markdown files.

### Actions

Every task has context-aware actions based on its current status — Scope, Plan, Implement, Continue, Save WIP, Finalize, Rework. Clicking an action opens a terminal and runs the corresponding `/festina-*` command. The Tasks view toolbar includes buttons to create tasks, refresh, and search by ID/title/label/status.

### CodeLens

When a `task.xml` file is open in the editor, CodeLens buttons appear at the top showing the available actions for that task. Click to run directly.

### Auto-Refresh

File watchers keep all views in sync. Edit a task XML, add a directive, update documentation — the sidebar updates automatically.

### Runtime

The extension supports two AI runtimes, configurable via `festinalente.runtime` in VSCode settings:

- **`claude`** (default) — Runs commands via Claude Code
- **`opencode`** — Runs commands via OpenCode

---

## License

MIT
