---
id: "patterns/handlebars-partials"
title: "Handlebars Partials Pattern"
type: pattern
summary: "Template composition using Handlebars partials for reusable skill content"
keywords: [handlebars, templates, partials, skills, composition]
related: ["systems/kanban"]
paths: ["apps/kanban/src/content/partials/", "apps/kanban/tools/build.ts"]
updated: 2026-02-17
---

# Handlebars Partials Pattern

Handlebars partials enable template composition for skill files. Partials are reusable markdown fragments that can be included in multiple skills, reducing duplication and ensuring consistency.

## Quick Reference

| Location | Purpose |
|----------|---------|
| `src/content/partials/*.md` | Partial template files |
| `src/content/skills/*.md` | Skill files that use partials |
| `tools/build.ts` | Registers partials and compiles skills |

## How It Works

1. Build script reads all `.md` files from `src/content/partials/`
2. Each file is registered as a partial with name = filename (without `.md`)
3. Skills can include partials using `{{> partial-name}}`
4. Compiled output goes to `dist/skills/`

## Validation Checklist

- [ ] Partial files are in `src/content/partials/`
- [ ] Partial names match the filename (e.g., `common-steps.md` → `{{> common-steps}}`)
- [ ] No circular partial references
- [ ] Partials don't contain Handlebars expressions that require context (partials receive no context)

## Examples

### Correct

```markdown
<!-- src/content/partials/commit-step.md -->
<step name="commit">
  <note>Format: `{commit-format}`</note>
  <command>git add {files}</command>
  <command>git commit -m "{message}"</command>
</step>
```

```markdown
<!-- src/content/skills/my-skill.md -->
# Skill: My Skill

<process>
  <step name="do_work">
    <action>Do the main work</action>
  </step>

  {{> commit-step}}
</process>
```

### Build Output

The compiled skill will have the partial content inlined:

```markdown
# Skill: My Skill

<process>
  <step name="do_work">
    <action>Do the main work</action>
  </step>

  <step name="commit">
    <note>Format: `{commit-format}`</note>
    <command>git add {files}</command>
    <command>git commit -m "{message}"</command>
  </step>
</process>
```

### Incorrect

```markdown
<!-- BAD: Partial with context variable (partials receive empty context) -->
{{> header title=pageTitle}}

<!-- BAD: Circular reference -->
<!-- partial-a.md contains {{> partial-b}} -->
<!-- partial-b.md contains {{> partial-a}} -->

<!-- BAD: Using partials in templates/ (only skills are compiled) -->
```

## Common Violations

1. **Putting partials in wrong directory** - Must be in `src/content/partials/`
2. **Expecting context variables** - Partials receive empty `{}` context
3. **Using partials in templates** - Only skill files are compiled with Handlebars
4. **Missing partial** - Build will fail if partial doesn't exist
