---
id: "systems/data-model"
title: "Data Model & Storage"
type: system
tldr: "File-based storage with XML tasks, YAML config, Markdown docs"
summary: "Persists tasks, specs, plans, configuration, and documentation in structured file formats"
keywords: [storage, xml, yaml, markdown, tasks, specs, plans, config]
aliases: [file-storage, persistence]
boundary: "Does not enforce workflow transitions - skills do that"
references: [systems/cli, systems/vscode-extension]
uses: []
paths: [.festinalente]
intent: reference
prerequisites: []
---

# Data Model & Storage

> **TL;DR:** File-based storage with XML tasks, YAML config, Markdown docs

## Overview

<!-- Each section must be self-contained: open with a context sentence, no back-references -->

Festina Lente uses file-based storage in the `.festinalente/` directory. Tasks are XML, configuration is YAML, and documentation is Markdown with YAML frontmatter. No database required.

**Why it exists:** File-based storage enables version control, human readability, and no infrastructure dependencies. AI agents can read/write files directly.

**Summary:** XML for tasks, YAML for config, Markdown for docs.

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

## Directory Structure

```
.festinalente/
├── projects/
│   └── {id}/
│       └── project.xml    # Project metadata and task grouping
├── tasks/
│   └── {id}/
│       ├── task.xml       # Task metadata
│       ├── spec.xml       # Functional specification
│       └── plan.xml       # Implementation plan
├── quick/
│   └── {id}/
│       └── quick.xml      # Quick task (mini-task)
├── product/
│   └── docs/
│       ├── overview.md    # Product overview
│       └── features/      # Feature documentation
├── engineering/
│   ├── overview.md        # This file's parent
│   ├── systems/           # System documentation
│   ├── patterns/          # Pattern documentation
│   └── conventions/       # Convention documentation
├── directives/
│   └── {name}.xml         # LLM instruction sets
├── scripts/               # Build artifacts (festinalente.cjs)
├── templates/             # XML/YAML templates
├── config.yaml            # Project settings
├── workflow.yaml          # Workflow definitions (immutable)
├── glossary.yaml          # Domain terminology
└── manifest.json          # Installation metadata
```

## Task Lifecycle

```mermaid
stateDiagram-v2
    [*] --> backlog: festina-create
    backlog --> scoped: festina-scope
    scoped --> planned: festina-plan
    planned --> in_progress: festina-implement
    in_progress --> finalize: festina-finalize
    finalize --> done: festina-done
    finalize --> in_progress: festina-rework
    done --> [*]
```

## Core Schemas

### task.xml

```xml
<task
  id="001"
  status="backlog"
  priority="medium"
  title="Task title"
  labels="feature"
  created="2026-03-01"
  updated="2026-03-01">
  <problem>What problem this solves</problem>
  <value>Why it matters</value>
  <acceptance-criteria>
    - Criterion 1
    - Criterion 2
  </acceptance-criteria>
</task>
```

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique task ID (e.g., "001") |
| status | enum | backlog, scoped, planned, in-progress, finalize, done |
| priority | enum | critical, high, medium, low |
| title | string | Short task title |
| labels | string | Comma-separated labels (bug, feature, docs, refactor) |
| problem | text | Problem statement |
| value | text | Value proposition |
| acceptance-criteria | text | Markdown list of criteria |
| project-id | string | Optional. References parent project ID (e.g., "P001") |
| project-requirements | string | Optional. Comma-separated requirement IDs from parent project (e.g., "R1,R3") |

> **Project Grouping:** When a task belongs to a project, `project-id` links it to the parent `project.xml` and `project-requirements` maps which project requirements this task addresses. This creates a bidirectional relationship: `project.xml` lists tasks in its `<tasks>` element, and each task references the project via `project-id`.

### project.xml

```xml
<project
  id="001"
  status="open"
  created="2026-03-01"
  updated="2026-03-01">
  <title>Project title</title>
  <description>Project description</description>
  <problem>What problem this solves</problem>
  <value>Why it matters</value>
  <scope>
    <in-scope><item>Scope item</item></in-scope>
    <out-of-scope><item>Exclusion</item></out-of-scope>
  </scope>
  <requirements>
    <requirement id="R1">Requirement text</requirement>
  </requirements>
  <acceptance-criteria>
    <criterion>Given ... When ... Then ...</criterion>
  </acceptance-criteria>
  <tasks></tasks>
  <notes></notes>
  <research>
    <stack></stack>
    <features></features>
    <architecture></architecture>
    <pitfalls></pitfalls>
  </research>
  <affects></affects>
  <engineering></engineering>
</project>
```

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique project ID (e.g., "001") |
| status | enum | open, in-progress, done |
| title | text | Short project title |
| description | text | Project description |
| problem | text | Problem statement |
| value | text | Value proposition |
| scope | element | In-scope and out-of-scope items |
| requirements | element | Numbered requirements |
| acceptance-criteria | element | Given/When/Then criteria |
| tasks | text | References to child task IDs |
| research | element | Optional. Research findings from greenfield flow (stack, features, architecture, pitfalls) |

> **Note:** Project status can derive from child task progress. Use `get-project-progress` to compute completion percentage from task statuses.

### spec.xml

```xml
<spec task="{id}" created="YYYY-MM-DD" updated="YYYY-MM-DD">
  <title>Task title</title>
  <context>Problem and value context</context>
  <scope>
    <in-scope><item>Scope item</item></in-scope>
    <out-of-scope><item>Exclusion</item></out-of-scope>
  </scope>
  <delta>                           <!-- Optional: brownfield tasks -->
    <current>What exists today</current>
    <changing>What this task modifies</changing>
    <unchanged>What stays the same</unchanged>
  </delta>
  <boundaries>                      <!-- Optional: autonomy boundaries -->
    <always>Proceed without asking</always>
    <ask-first>Needs user approval</ask-first>
    <never>Hard stop</never>
  </boundaries>
  <contracts>                       <!-- Optional: behavioral contracts -->
    <contract id="C1" requirement="FR1">
      <name>Contract name</name>
      <precondition>What must be true before</precondition>
      <postcondition>What must be true after</postcondition>
      <invariant>What must always be true</invariant>
      <property>General verifiable property</property>
    </contract>
  </contracts>
  <requirements>
    <requirement id="FR1">Requirement text</requirement>
  </requirements>
  <files>
    <file action="create|modify|delete" path="src/foo.ts" reason="Why"/>
  </files>
  <patterns>
    <pattern name="name">
      <description>Description</description>
      <reference>file:line</reference>
    </pattern>
  </patterns>
  <research>
    <product><finding doc="doc-id">Insight</finding></product>
    <engineering><finding doc="doc-id">Pattern reference</finding></engineering>
    <codebase><finding component="name" path="path">Analysis</finding></codebase>
    <pitfalls><pitfall issue="issue" mitigation="mitigation"/></pitfalls>
  </research>
  <constraints><constraint>Constraint</constraint></constraints>
  <dependencies>
    <dependency type="external|internal">Description</dependency>
  </dependencies>
  <risks>
    <risk impact="high|medium|low" mitigation="mitigation">Description</risk>
  </risks>
  <open-questions><question>Unresolved item</question></open-questions>
</spec>
```

> **Contracts** (added in task 007): Define preconditions, postconditions, invariants, and verifiable properties for the implementation. Contract IDs link to requirement IDs and flow into plan.xml as contract verification tests.

### plan.xml

```xml
<plan task="{id}" spec="tasks/{id}/spec.xml" status="draft"
      complexity="{complexity}" created="YYYY-MM-DD" updated="YYYY-MM-DD"
      generated-by="claude" model="{model}" version="1" iteration="1">
  <title>Task title</title>
  <overview>High-level approach summary</overview>
  <approach>
    <rationale>Why this approach</rationale>
    <breaking-changes>Any breaking changes</breaking-changes>
  </approach>
  <inventory>Files and components involved</inventory>
  <tasks>
    <task id="1" type="auto" depends="optional-task-ids">
      <name>Short descriptive name</name>
      <files>path/to/file.ts (create|modify)</files>
      <requirements>FR1, FR2</requirements>
      <pattern>Pattern to follow or file path reference</pattern>
      <context>
        <file>path/to/existing/file.ts</file>
      </context>
      <action>Detailed implementation instructions</action>
      <verify>Verification command</verify>
      <done>Completion criteria</done>
      <!-- Optional: added by /festina-implement when contracts exist -->
      <contract-verification verified-at="ISO-timestamp">
        <result contract="C1" status="pass|fail">
          <evidence>file:line reference</evidence>
          <details>
            <precondition status="pass|fail">Explanation</precondition>
            <postcondition status="pass|fail">Explanation</postcondition>
            <invariant status="pass|fail">Explanation</invariant>
          </details>
        </result>
      </contract-verification>
    </task>
  </tasks>
  <testing>
    <automated>Automated test plan</automated>
    <manual>Manual test steps</manual>
    <regression>Regression considerations</regression>
    <!-- Optional: derived from behavioral contracts -->
    <contract-test contract="C1">
      <positive>Input → expected output for valid case</positive>
      <negative>Input → expected behavior for invalid case</negative>
      <property>Property-based test description</property>
    </contract-test>
  </testing>
  <edge-cases>Edge cases to handle</edge-cases>
  <pitfalls>Implementation pitfalls</pitfalls>
  <iterations>Iteration tracking</iterations>
  <wip>Work in progress notes</wip>
  <completeness>Completeness tracking</completeness>
</plan>
```

> **Contract Testing** (added in task 007): The `<testing>` section includes `<contract-test>` elements that map to contracts defined in spec.xml. Each task's `<contract-verification>` records whether contracts pass or fail during implementation.

### config.yaml

```yaml
directives:
  festina-create: [github, design]
  festina-scope: [github, coding, design]
  festina-plan: [github, coding]
  festina-implement: [github, coding]
  festina-save: [github]
  festina-finalize: [github, coding]
  festina-complete: [github, coding]
  festina-rework: [github, coding]
  festina-delete: [github]
  festina-quick: [github, design, coding]
  festina-explore: []
  festina-overview: []
  festina-directive: [github]
  festina-map-product: [github]
  festina-map-engineering: [github]
  festina-create-project: [github]
  festina-complete-project: [github]
```

> **Note:** Directives are user-configurable per skill. Skills are git-agnostic — all git operations (branching, committing, merging) are handled by the configured directive (e.g., `github.xml` for full GitHub integration with Issues, PRs, and team review workflow). The `git` directive is available as a simpler alternative.

### workflow.yaml (Immutable)

```yaml
columns:
  - id: backlog
    name: Backlog
  - id: scoped
    name: Scoped
  # ... etc

labels:
  - id: bug
    commit-type: fix
  - id: feature
    commit-type: feat
  # ... etc

transitions:
  backlog: [scoped]
  scoped: [planned]
  # ... etc
```

## Interactions

| System | Relationship | Notes |
|--------|--------------|-------|
| [cli](../cli/_index.md) | Reads/writes all files | Handlers use capabilities for I/O |
| [vscode-extension](../vscode-extension/_index.md) | Watches and reads files | FileWatchers detect changes |

**Summary:** Both CLI and extension read/write data model files.

## Boundaries

What this system does NOT handle:

- **Does NOT:** Enforce transitions → Skills validate status changes
- **Does NOT:** Execute commands → See [cli](../cli/_index.md)
- **Does NOT:** Render UI → See [vscode-extension](../vscode-extension/_index.md)

## Extension Points

### Adding a new Document Type

**Checklist:**
- [ ] Create XML/YAML schema in `templates/`
- [ ] Add parser in `computers/{name}-parser.computer.ts`
- [ ] Add handler in `handlers/{name}.handler.ts`
- [ ] Register commands in orchestrator
- [ ] Update TreeView if needed
