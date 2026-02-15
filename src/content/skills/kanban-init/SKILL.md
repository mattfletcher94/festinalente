---
name: kanban-init
description: Initialize kanban board structure in current project
allowed-tools: Read, Write, Bash(ls *, mkdir *, git status)
disable-model-invocation: true
---

# Initialize Kanban Board

<purpose>
Create the `.kanban/` directory structure for a new project.
</purpose>

<context>
{{> directory-reference}}
</context>

<prohibited>
- Do not add extra properties to config.yaml beyond what the template specifies
- Do not invent config keys like `verification`, `checks`, `hooks`, `commands`
- Do not delete existing tasks when reinitializing
</prohibited>

<process>
  <step name="check_already_initialized">
    <validate>Check if `.kanban/` directory exists</validate>
    <branch condition="directory exists">
      <prompt>Kanban already initialized. Reinitialize? (This will NOT delete existing tasks)</prompt>
      <branch condition="user declines">
        <action>Exit</action>
      </branch>
    </branch>
  </step>

  <step name="check_git_repository">
    <command>git status</command>
    <validate>Verify we're in a git repo</validate>
    <branch condition="not a git repo">
      <output>Warning: Not a git repository. Kanban works best with git for commit tracking.</output>
      <prompt>Continue anyway?</prompt>
    </branch>
  </step>

  <step name="create_directory_structure">
    <command>
mkdir -p .kanban/tasks
mkdir -p .kanban/specs
mkdir -p .kanban/plans
mkdir -p .kanban/product
mkdir -p .kanban/skills
    </command>
  </step>

  <step name="create_product_overview">
    <action>Read template from `.claude/kanban-templates/overview.md`</action>
    <action>Create `.kanban/product/overview.md`</action>
    <prompt>What is this product called?</prompt>
    <prompt>In one sentence, what does it do?</prompt>
    <action>Fill template with responses</action>
    <note>This becomes the root product doc that LLMs read first</note>
  </step>

  <step name="create_config_yaml">
    <action>Read template from `.claude/kanban-templates/config.yaml`</action>
    <action>Write to `.kanban/config.yaml` exactly as-is (do not modify or add properties)</action>
    <branch condition="template not found">
      <action>Create minimal config exactly as shown</action>
      <warning>Do NOT add, invent, or improvise any properties not shown in the template</warning>
      <note>The config.yaml schema has exactly three top-level keys: `name`, `user-skills`, `settings`</note>
      <note>Do NOT add keys like `verification`, `checks`, `hooks`, `commands`, or anything else</note>
      <example_code lang="yaml">
# Skill names resolve to .claude/skills/{name}/SKILL.md
name: My Project

user-skills:
  "kanban-create":
    skills:
  "kanban-refine":
    skills:
  "kanban-scope":
    skills:
  "kanban-plan":
    skills:
  "kanban-implement":
    skills:
  "kanban-save":
    skills:
  "kanban-verify":
    skills:
  "kanban-approve":
    skills:
  "kanban-docs":
    skills:
  "kanban-merge":
    skills:
  "kanban-rework":
    skills:
  "kanban-map-product":
    skills:
  "kanban-define-product":
    skills:

settings:
  version: "2.0"
  idPrefix: ""
  idPadding: 3
  archiveOnComplete: false
      </example_code>
    </branch>
  </step>

  <step name="output_result">
    <output>Print created directories</output>
    <output>Print config location</output>
    <output>Suggest next steps</output>
  </step>
</process>

<success_criteria>
- `.kanban/` directory exists
- `.kanban/tasks/` directory exists
- `.kanban/specs/` directory exists
- `.kanban/plans/` directory exists
- `.kanban/product/` directory exists
- `.kanban/skills/` directory exists
- `.kanban/config.yaml` exists
- `.kanban/config.yaml` has ONLY these top-level keys: `name`, `user-skills`, `settings` (no extra keys)
- Next steps shown to user
</success_criteria>

<note>
**File Naming Conventions:**

| Directory | File Pattern | Example |
|-----------|-------------|---------|
| `.kanban/tasks/` | `{id}-{slug}.md` | `001-add-login.md` |
| `.kanban/specs/` | `{id}-{slug}.spec.md` | `001-add-login.spec.md` |
| `.kanban/plans/` | `{id}-{slug}.plan.md` | `001-add-login.plan.md` |
| `.kanban/product/` | `{feature}.md` | `authentication.md` |
| `.kanban/skills/` | `{name}.md` | `check-typescript.md` |

User-defined skills in `.kanban/skills/` are simple `.md` files (NOT directories with `SKILL.md` inside).
</note>

<warning>Always glob/search first to discover existing naming conventions rather than guessing.</warning>

<example>
User: `/kanban-init`

```
Initializing kanban board...

Created directories:
- .kanban/tasks/
- .kanban/specs/
- .kanban/plans/
- .kanban/product/
- .kanban/skills/

Created config:
- .kanban/config.yaml

Kanban initialized!

Next steps:
- Define your product: /kanban-define-product
- Or map existing code: /kanban-map-product
- Or create a task: /kanban-create "Your first task"
```
</example>

<next_steps>
For new projects:
```
/clear
/kanban-define-product
```

For existing codebases:
```
/clear
/kanban-map-product
```

Or skip product discovery and create a task:
```
/clear
/kanban-create "Task title"
```
</next_steps>
