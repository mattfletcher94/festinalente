# Festina Lente

*"Make haste slowly"* — Emperor Augustus

Spec-driven development for AI coding agents. Move fast by being deliberate.

## The Problem

AI coding agents are powerful but suffer from **context rot**—they lose track of requirements, make assumptions, skip steps, and produce incomplete work. The longer the conversation, the worse it gets.

## The Solution

Festina Lente captures requirements, specifications, and plans in **persistent XML documents** that survive context limits. Each command reads these documents, does focused work, and writes progress back. The AI always knows what to do next.

## Installation

This package is hosted on GitHub Packages. First, authenticate with GitHub:

```bash
npm login --registry=https://npm.pkg.github.com --scope=@mattfletcher94
```

Then install:

```bash
npx @mattfletcher94/festinalente
```

Or add to your `.npmrc`:

```
@mattfletcher94:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

---

## Core Workflow

Every substantial task flows through these phases:

```
BACKLOG → SCOPED → PLANNED → IN PROGRESS → FINALIZE → DONE
```

### `/festina-create` — Capture the Problem

Creates a new task through conversational Q&A. Captures:
- **Problem**: What's broken or missing?
- **Value**: Why does this matter?
- **Acceptance Criteria**: What does "done" look like? (Gherkin format)

Outputs: `task.xml` with structured requirements

```
/festina-create "Add user authentication"
```

### `/festina-scope` — Research & Specify

Researches the codebase to understand HOW to build it. Can run parallel agents for deep exploration or quick sequential research.

- Reads existing patterns and architecture
- Identifies files to modify/create
- Resolves technical decisions through Q&A
- Documents pitfalls and mitigations

Outputs: `spec.xml` with functional requirements, affected files, patterns to follow

```
/festina-scope 001
```

### `/festina-plan` — Break Into Steps

Transforms the spec into executable implementation steps. Each step is atomic, verifiable, and self-contained.

- Creates numbered tasks with clear done criteria
- Includes code snippets showing target state
- Defines verification commands for each step
- Handles edge cases and pitfalls

Outputs: `plan.xml` with implementation steps

```
/festina-plan 001
```

### `/festina-implement` — Execute the Plan

Works through plan steps in order, verifying after each. Progress is tracked in the plan file so work can resume if interrupted.

- Marks steps complete as they're verified
- Runs automated checks after each step
- Can resume from any point
- Code stays uncommitted until finalization

```
/festina-implement 001
```

### `/festina-finalize` — Validate, Document & Complete

Consolidates check, docs, and merge into a single command. Runs directive checks, commits implementation, updates documentation, and completes the task.

- Runs all directive-configured validation checks
- Commits code after checks pass
- Updates product and engineering documentation
- Merges branch and marks task done

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

Then implements, commits, and optionally merges—all in one command.

---

## Documentation System

Festina Lente maintains two documentation layers that help the AI understand your codebase:

### Product Documentation (`.festinalente/product/`)

User-facing feature documentation organized by domain:

```
.festinalente/product/
├── overview.md           # Product overview
├── auth/
│   ├── login.md          # Login feature
│   └── registration.md   # Registration flow
└── tasks/
    └── management.md     # Task management
```

Each doc has structured frontmatter (tldr, keywords, boundaries) that enables semantic search. When you create a task, the AI finds related docs to understand context.

### Engineering Documentation (`.festinalente/engineering/`)

Technical documentation for patterns, systems, and conventions:

```
.festinalente/engineering/
├── overview.md           # Architecture overview
├── systems/
│   └── auth/             # Auth system docs
├── patterns/
│   └── repository.md     # Repository pattern
└── conventions/
    └── file-naming.md    # Naming conventions
```

### Why Documentation Matters

1. **Context for new tasks**: When you run `/festina-create`, the AI searches docs to understand what you're building on top of.

2. **Consistent implementation**: During `/festina-scope`, the AI finds patterns to follow and constraints to respect.

3. **Living documentation**: During `/festina-finalize`, stub docs get completed with what was actually built—docs stay accurate.

4. **LLM-optimized search**: Frontmatter fields like `tldr`, `keywords`, and `aliases` help the AI find the right docs quickly.

### Mapping Existing Codebases

For existing projects, run these commands to bootstrap documentation:

```
/festina-map-product      # Analyze and document user-facing features
/festina-map-engineering  # Analyze and document technical architecture
```

Both commands spawn parallel agents to explore your codebase, then guide you through Socratic Q&A to validate and enrich findings.

---

## Directives

Directives are project-specific rules that the AI must follow. They live in `.festinalente/directives/` as XML files and are loaded by commands based on your `config.yaml`.

### Example Directive Structure

```xml
<directive name="coding" version="1">
  <description>Code quality standards</description>

  <context>
    <principle id="T1">Never use `any` - use `unknown` and narrow with type guards</principle>
    <principle id="A1">Policy belongs in orchestrators, mechanism in capabilities</principle>
  </context>

  <validation>
    <check type="command">
      <run>pnpm build</run>
      <expect>Build succeeds (exit code 0)</expect>
    </check>
    <check type="pattern" files="**/*.ts">
      <forbidden>:\s*any\b</forbidden>
      <reason>any type disables type checking</reason>
    </check>
  </validation>
</directive>
```

### Configuring Directives

In `.festinalente/config.yaml`, map directives to commands:

```yaml
directives:
  festina-create:
    - design           # Loads .festinalente/directives/design.xml
  festina-scope:
    - coding
    - design
  festina-plan:
    - planning
    - coding
  festina-implement:
    - coding
  festina-finalize:
    - coding           # Runs validation checks from coding.xml
  festina-quick:
    - design
    - coding
```

### What Directives Control

- **Principles**: Core rules the AI references during work (architecture patterns, type safety, documentation standards)
- **Process Rules**: Phase-specific guidance (what to check during planning vs implementation)
- **Validation Checks**: Automated verification run by `/festina-finalize`:
  - **Command checks**: Run build/test/lint commands
  - **Pattern checks**: Scan for forbidden code patterns
  - **Checklists**: Manual review items
- **Examples**: Good and bad code samples the AI learns from

### Creating Directives

Use `/festina-directive` to create new directives through guided Q&A:

```
/festina-directive code-style
```

The command walks you through defining principles, validation checks, and examples—then links the directive to the appropriate workflow commands in `config.yaml`.

### Why Directives Matter

1. **Consistent code quality**: Every task follows the same standards
2. **Automated enforcement**: `/festina-finalize` runs your configured validations
3. **Project-specific rules**: Encode your team's conventions, not generic best practices
4. **AI learns your patterns**: Examples teach the AI your preferred style

---

## How It Prevents Context Rot

1. **Persistent State**: All decisions live in XML files, not conversation history
2. **Atomic Commands**: Each command does one thing and commits progress
3. **Self-Contained Plans**: Implementation steps include enough context to execute without re-reading everything
4. **Verification Gates**: Automated checks catch drift before it compounds
5. **Documentation Links**: Tasks reference docs, docs reference code—everything stays connected

---

## Command Reference

### Core Workflow

| Command | Purpose | Outputs |
|---------|---------|---------|
| `/festina-create` | Capture problem, value, acceptance criteria | `task.xml` |
| `/festina-scope` | Research codebase, create specification | `spec.xml` |
| `/festina-plan` | Break spec into implementation steps | `plan.xml` |
| `/festina-implement` | Execute plan steps with verification | Code changes (uncommitted) |
| `/festina-finalize` | Validate, commit, document, and complete | Done |

### Supporting Commands

| Command | Purpose |
|---------|---------|
| `/festina-quick` | Fast path for simple fixes — single commit |
| `/festina-save` | Save partial progress with WIP commit |
| `/festina-rework` | Return task from Finalize to In Progress with issue report |
| `/festina-delete` | Delete a task in Backlog |
| `/festina-overview` | View board status, task details, or visual kanban |
| `/festina-explore` | Explore questions and ideas through Socratic dialogue |

### Documentation & Setup

| Command | Purpose |
|---------|---------|
| `/festina-map-product` | Analyze codebase and document product features |
| `/festina-map-engineering` | Analyze codebase and document technical architecture |
| `/festina-define-product` | Define a new product through Socratic Q&A |
| `/festina-directive` | Create project-specific rules through guided Q&A |

---

## License

MIT
