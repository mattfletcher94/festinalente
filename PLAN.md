# Plan: Restructure Skills with XML Tags for LLM Compliance

## Problem Statement

### Observed Behavior

When running `/kanban-create`, the LLM exhibited **consistent failures** to follow skill instructions:

1. **Wrong tools used**: LLM used `Search()`, `Glob()`, and `ls` commands to explore the codebase instead of using the helper scripts (`next-id.cjs`, `search-product.cjs`, etc.)

2. **Wrong output location**: Created task file in `.kanban/product/` instead of `.kanban/tasks/`

3. **Wrong template**: Used `product-doc.md` template structure instead of `task.md`

4. **Skipped commit**: Did not commit the task file as instructed

### Root Cause

The markdown-based skill format lacks clear semantic boundaries. LLMs struggle to distinguish:
- What sections are instructions vs. reference material
- Where one step ends and another begins
- What behaviors are explicitly prohibited
- What constitutes success

### Why "CRITICAL" Sections Don't Scale

Adding `## CRITICAL — Read Before Proceeding` sections to skills:
- Creates inconsistent formatting across skills
- Becomes "noise" that LLMs learn to ignore
- Doesn't address structural ambiguity
- Requires manual maintenance per skill

---

## Solution: XML Semantic Tags

Restructure all 19 skills to use XML tags that provide clear semantic boundaries for LLM parsing.

### XML Schema

```xml
<purpose>
  Single sentence describing what this skill accomplishes.
</purpose>

<context>
  Background knowledge the LLM needs (not instructions).
  - Where files live
  - What schemas define
  - Domain-specific facts
</context>

<prohibited>
  - Anti-pattern 1 (what NOT to do)
  - Anti-pattern 2
  - Anti-pattern 3
</prohibited>

<process>
  <step name="step_id" outputs="variableName">
    Instructions for this step.
    The `outputs` attribute declares variables produced by this step.
  </step>

  <step name="conditional_step" when="condition is true">
    Instructions for conditional step.
    The `when` attribute means this step only executes if condition holds.
  </step>

  <step name="dependent_step">
    This step can use {variableName} from earlier step's outputs.
  </step>
</process>

<success_criteria>
  - Validation check 1
  - Validation check 2
  - Validation check 3
</success_criteria>
```

### Tag Definitions

| Tag | Required | Purpose |
|-----|----------|---------|
| `<purpose>` | Yes | Single sentence: what does this skill do? |
| `<context>` | No | Background facts (not instructions) the LLM needs |
| `<prohibited>` | No | Explicit list of anti-patterns and mistakes to avoid |
| `<process>` | Yes | Container for all steps |
| `<step>` | Yes (inside process) | Individual instruction step |
| `<success_criteria>` | Yes | Checklist to validate the skill executed correctly |

### Step Attributes

| Attribute | Required | Purpose |
|-----------|----------|---------|
| `name` | Yes | Unique identifier for the step (snake_case) |
| `outputs` | No | Variable(s) this step produces for later steps |
| `when` | No | Condition that must be true for this step to execute |

### Handlebars Partials

Partials work inside XML tags. They compile to plain text before the LLM sees anything:

```xml
<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="verify_branch">
    {{> branch-verify-main}}
  </step>
</process>
```

---

## Conversion Example

### Before (Current Format)

```markdown
---
name: kanban-create
description: Create a new task...
allowed-tools: Read, Write, Bash(...)
---

# Create Kanban Task

Create a new task file in `.kanban/tasks/` in the **Backlog** column and commit.

## CRITICAL — Read Before Proceeding

**You are creating a TASK, not a product doc.**
- **Output location:** `.kanban/tasks/{id}-{slug}.md`
- **NOT** `.kanban/product/`

**You MUST use the helper scripts. Do NOT:**
- Use `Search()` or `Glob()` to find files manually
- Run `ls` commands to explore directories

## Reference

{{> directory-reference}}
{{> helper-scripts show_next_id=true}}

## Steps

- [ ] 1. **Load workflow schema**
   {{> workflow-load}}

- [ ] 2. **Verify on main branch**
   {{> branch-verify-main}}

- [ ] 3. **Determine next ID**
   Run `node .claude/scripts/next-id.cjs`
   Use `nextId` from JSON output.

- [ ] 4. **Create task file**
   Write to `.kanban/tasks/{id}-{slug}.md`

- [ ] 5. **Commit the task file**
   Format: `docs({id}): create - {title}`

## Validation

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Git log shows `docs({id}): create -`
```

### After (XML Format)

```markdown
---
name: kanban-create
description: Create a new task...
allowed-tools: Read, Write, Bash(...)
---

# Create Kanban Task

<purpose>
Create a new task file in `.kanban/tasks/` in the Backlog column and commit it.
</purpose>

<context>
- Workflow schema at `.kanban/kanban-workflow.yaml` defines columns, labels, priorities
- Tasks are stored in `.kanban/tasks/{id}-{slug}.md`
- Product docs are stored in `.kanban/product/` (NOT for tasks)
- Task template is at `.claude/kanban-templates/task.md`
</context>

<prohibited>
- Do not use `Search()` or `Glob()` to find files
- Do not use `ls` commands to explore directories
- Do not read `.kanban/config.yaml` directly
- Do not create files in `.kanban/product/` (that's for product docs, not tasks)
- Do not skip the commit step
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="verify_branch">
    {{> branch-verify-main}}
  </step>

  <step name="get_next_id" outputs="nextId">
    Run: `node .claude/scripts/next-id.cjs`
    Parse JSON output and extract `nextId` value.
  </step>

  <step name="get_task_details" outputs="title, slug, priority, labels">
    - Title: Use $ARGUMENTS if provided, otherwise ask user
    - Slug: Lowercase title with hyphens
    - Priority: Ask user, default to `medium`
    - Labels: Auto-detect from title using `labels[].detect-keywords` in workflow schema
  </step>

  <step name="search_product_docs" when="`.kanban/product/` directory exists and is not empty">
    Run: `node .claude/scripts/search-product.cjs {keywords}`
    If matches with score ≥ 0.5, set `affects: [{matched-ids}]` in frontmatter.
  </step>

  <step name="detect_vague" when="title lacks specificity (< 5 words, no action verb, or ambiguous)">
    Add `needs-refinement` to labels array.
    Note to user: "Task marked as needs-refinement. Run `/kanban-refine {id}` to clarify."
  </step>

  <step name="create_task_file">
    Read template from `.claude/kanban-templates/task.md`
    Create file at `.kanban/tasks/{nextId}-{slug}.md`
    Fill frontmatter: `id`, `title`, `status: backlog`, `priority`, `labels`, `created`, `affects`
    Fill body: `## Description`, `## Notes`
  </step>

  <step name="commit">
    ```bash
    git add .kanban/tasks/{nextId}-{slug}.md
    git commit -m "docs({nextId}): create - {title}"
    ```
  </step>

  <step name="output_result">
    Print: file path, task ID, commit hash
    If `needs-refinement` label added, note this to user
    Suggest next command: `/kanban-refine {id}`
  </step>
</process>

<success_criteria>
- Task file exists at `.kanban/tasks/{nextId}-*.md`
- Frontmatter contains `id: "{nextId}"`
- Frontmatter contains `status: backlog`
- Frontmatter contains `title: "{title}"`
- Task file contains `## Description` section
- Git log shows `docs({nextId}): create -`
- Next steps shown to user
</success_criteria>
```

---

## Implementation Steps

### Step 1: Build Baseline

Before making any changes, build the project and save output as baseline for comparison.

```bash
# Clean and build
pnpm run clean
pnpm run build

# Copy dist to temp folder for comparison
cp -r dist dist-baseline
```

### Step 2: Migrate All Skills

Convert all 19 skills in `src/content/skills/*/SKILL.md` to the XML format.

**Skills to migrate:**

| # | Skill | Path |
|---|-------|------|
| 1 | kanban-create | `src/content/skills/kanban-create/SKILL.md` |
| 2 | kanban-refine | `src/content/skills/kanban-refine/SKILL.md` |
| 3 | kanban-scope | `src/content/skills/kanban-scope/SKILL.md` |
| 4 | kanban-plan | `src/content/skills/kanban-plan/SKILL.md` |
| 5 | kanban-implement | `src/content/skills/kanban-implement/SKILL.md` |
| 6 | kanban-verify | `src/content/skills/kanban-verify/SKILL.md` |
| 7 | kanban-approve | `src/content/skills/kanban-approve/SKILL.md` |
| 8 | kanban-rework | `src/content/skills/kanban-rework/SKILL.md` |
| 9 | kanban-docs | `src/content/skills/kanban-docs/SKILL.md` |
| 10 | kanban-merge | `src/content/skills/kanban-merge/SKILL.md` |
| 11 | kanban-init | `src/content/skills/kanban-init/SKILL.md` |
| 12 | kanban-status | `src/content/skills/kanban-status/SKILL.md` |
| 13 | kanban-view | `src/content/skills/kanban-view/SKILL.md` |
| 14 | kanban-save | `src/content/skills/kanban-save/SKILL.md` |
| 15 | kanban-map-product | `src/content/skills/kanban-map-product/SKILL.md` |
| 16 | kanban-define-product | `src/content/skills/kanban-define-product/SKILL.md` |
| 17 | kanban-report-task | `src/content/skills/kanban-report-task/SKILL.md` |
| 18 | kanban-report-label | `src/content/skills/kanban-report-label/SKILL.md` |
| 19 | kanban-report-user | `src/content/skills/kanban-report-user/SKILL.md` |

**For each skill:**

1. Keep the YAML frontmatter unchanged
2. Keep the `# Title` heading
3. Replace markdown structure with XML tags:
   - `## CRITICAL` section → content moves to `<prohibited>`
   - `## Reference` section → remove (info goes to `<context>` or inline in steps)
   - `## Steps` section → `<process>` with `<step>` tags
   - `## Validation` section → `<success_criteria>`
   - `## Example` section → keep as-is after `</success_criteria>` (optional)
   - `## Next Steps` section → keep as-is (optional)
4. Add `name` attribute to every step (snake_case, unique within skill)
5. Add `outputs` attribute to steps that produce values used later
6. Add `when` attribute to conditional steps
7. Ensure Handlebars partials remain inside appropriate step tags

### Step 3: Build and Compare

After migrating all skills, rebuild and compare against baseline.

```bash
# Rebuild
pnpm run build

# Compare (look for unexpected differences)
diff -r dist-baseline/skills dist/skills
```

**What to check:**

- All partials expanded correctly (no `{{>` in output)
- No truncated content
- No missing sections
- XML tags present in output
- Similar content length (accounting for XML overhead)

### Step 4: Fix Issues

If diff reveals problems:
- Fix broken partial references
- Fix missing content
- Ensure all steps have `name` attributes
- Rebuild and re-compare

### Step 5: Clean Up

Once validation passes:

```bash
# Remove baseline
rm -rf dist-baseline
```

---

## Checklist

- [ ] Build baseline to `dist-baseline/`
- [ ] Migrate `kanban-create`
- [ ] Migrate `kanban-refine`
- [ ] Migrate `kanban-scope`
- [ ] Migrate `kanban-plan`
- [ ] Migrate `kanban-implement`
- [ ] Migrate `kanban-verify`
- [ ] Migrate `kanban-approve`
- [ ] Migrate `kanban-rework`
- [ ] Migrate `kanban-docs`
- [ ] Migrate `kanban-merge`
- [ ] Migrate `kanban-init`
- [ ] Migrate `kanban-status`
- [ ] Migrate `kanban-view`
- [ ] Migrate `kanban-save`
- [ ] Migrate `kanban-map-product`
- [ ] Migrate `kanban-define-product`
- [ ] Migrate `kanban-report-task`
- [ ] Migrate `kanban-report-label`
- [ ] Migrate `kanban-report-user`
- [ ] Rebuild project
- [ ] Compare against baseline
- [ ] Fix any issues
- [ ] Remove baseline folder

---

## Session Log

### Session 1: Initial Problem Discovery

- Observed LLM failures in `/kanban-create`
- Researched get-shit-done repo for XML approach
- Proposed XML restructuring

### Session 2: Schema Design

**Date**: 2026-02-15

**Decisions Made:**
1. **Schema finalized**: `<purpose>`, `<context>`, `<prohibited>`, `<process>`, `<step>`, `<success_criteria>`
2. **Step attributes**: `name` (required), `outputs` (optional), `when` (optional for conditionals)
3. **Partials**: Keep using inside steps (they compile before LLM sees them)
4. **Migration strategy**: Big bang (all 19 skills at once)
5. **Validation strategy**: Build diff comparison against baseline

**Next Action**: Execute the implementation steps above.
