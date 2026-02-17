---
id: "patterns/handlebars-partials"
title: "Handlebars Partials Pattern"
type: pattern
summary: "Skill templates composed via reusable Handlebars partials for DRY content"
keywords: [handlebars, partials, templates, skills, compilation]
related: ["systems/kanban"]
paths: ["apps/kanban/src/content/partials/", "apps/kanban/tools/build.ts"]
updated: 2026-02-17
---

# Handlebars Partials Pattern

This pattern uses Handlebars partials to compose skill markdown files from reusable content blocks, ensuring consistency and reducing duplication across skills.

## Quick Reference

| Location | Purpose |
|----------|---------|
| `src/content/partials/*.md` | Reusable content blocks |
| `src/content/skills/*/SKILL.md` | Skills that include partials |
| `tools/build.ts` | Compilation pipeline |
| `dist/skills/` | Compiled output (partials resolved) |

## Build Process

1. Partials registered from `partials/*.md` (name = filename without extension)
2. Skills scanned for `{{> partial-name}}` syntax
3. Handlebars compiles and inlines partial content
4. Output written to `dist/skills/`

## Validation Checklist

- [ ] Partial files use kebab-case naming (`helper-scripts.md`)
- [ ] Partials contain only reusable content (no skill-specific logic)
- [ ] Skills reference partials with `{{> partial-name}}`
- [ ] Build runs without Handlebars compilation errors

## Examples

### Correct

```markdown
<!-- partials/workflow-load.md -->
<step name="load_workflow">
  <action>Read `.kanban/workflow.yaml` for column definitions</action>
</step>

<!-- skills/kanban-create/SKILL.md -->
<process>
  {{> workflow-load}}

  <step name="create_task">
    <!-- skill-specific content -->
  </step>
</process>
```

### Incorrect

```markdown
<!-- BAD: Partial with skill-specific content -->
<!-- partials/create-task.md -->
This partial is only used by kanban-create...

<!-- BAD: Hardcoding content that should be a partial -->
<!-- skills/kanban-refine/SKILL.md -->
<step name="load_workflow">
  <action>Read `.kanban/workflow.yaml`...</action>  <!-- Duplicated! -->
</step>
```

## Common Violations

- Duplicating content across skills instead of extracting to partial
- Creating partials that are only used once (not truly reusable)
- Using Handlebars helpers that aren't registered (build will fail silently)
