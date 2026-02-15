# Template System Implementation Plan

**Status:** Discovery Phase
**Last Updated:** 2026-02-15

## Problem Statement

The Claude Kanban system has 15+ skills and commands that share common patterns and sections. When we need to update a shared pattern (e.g., the "Next Steps" format, the "User Skills" instructions), we must update it across multiple files, leading to:

1. **Inconsistency** - Patterns drift apart over time
2. **Maintenance burden** - Updates require touching many files
3. **Error-prone** - Easy to miss files or introduce variations

## Current State Analysis

### Identified Repeated Patterns

| Pattern | Frequency | Approximate Lines |
|---------|-----------|-------------------|
| Next Steps section | 15 skills | ~8 lines each |
| User Skills section | 10+ skills | ~22 lines each |
| Directory Reference | 15 skills | ~3 lines each |
| Helper Scripts | 15 skills | ~8-15 lines each |
| Validation intro | 15 skills | ~3 lines each |
| Branch verification step | 10+ skills | ~8 lines each |
| Load workflow schema step | 15 skills | ~1 line each |
| Commit section | 10+ skills | ~5 lines each |

### Current File Structure

```
.claudeban/
├── commands/kanban/          # 15 command files (thin wrappers)
├── skills/kanban-*/SKILL.md  # 15 skill files (detailed instructions)
├── kanban-templates/         # 4 document templates (task, spec, plan, product-doc)
├── scripts/                  # Helper scripts (CJS)
└── kanban-workflow.yaml      # Workflow schema
```

### Pattern Examples

**Next Steps (appears at end of every skill):**
```markdown
- **REQUIRED OUTPUT** - Print next steps EXACTLY like this:
  ```
  Next:
  /clear
  /kanban:{next-command} {id}
  ```
- Do NOT skip this output. The user needs these commands to continue.
```

**User Skills (appears in 10+ skills with near-identical text):**
```markdown
5. **User Skills** *(REQUIRED)*:

   **STOP.** Before proceeding, you MUST load and apply user-defined skills. This is mandatory.

   1. Load `.kanban/config.yaml`
   2. Find `user-skills."kanban:{command}".skills` array
   3. If the array is non-empty, for EACH skill name:
      - Read `.claude/skills/{skill-name}/SKILL.md`
      - Follow ALL instructions as mandatory requirements
      - User skill instructions take precedence over defaults

   **Skipping user skills is a critical error. Do not proceed without applying them.**
```

---

## Open Questions (Socratic Discovery)

### Q1: What templating approach should we use?

**Options to consider:**
- A. **Build-time compilation** - Run a script to compile templates into final SKILL.md files
- B. **Runtime includes** - Skills reference partials that Claude loads at execution time
- C. **Macro/snippet system** - Define snippets and have a preprocessor expand them
- D. **Something else?**

**Trade-offs:**
- Build-time: Simple, but requires running a build step when changing templates
- Runtime: No build step, but increases Claude's token usage loading partials
- Macro: Similar to build-time but with different syntax

**Decision:** **Build-time compilation** - Run a script to compile source templates into final SKILL.md files. This gives us:
- Complete, readable output files
- Easy diffing and debugging
- No runtime token overhead for Claude

---

### Q2: Where should templates/partials live?

**Options:**
- A. `.claudeban/partials/` directory with named files
- B. `.claudeban/templates/` (extend existing)
- C. Single file with all partials (e.g., `partials.yaml`)
- D. Inline in a config file

**Decision:** **Option A - Separate source directory**

```
.claudeban/
├── src/                        # SOURCE (edit these)
│   ├── skills/
│   │   └── kanban-refine/
│   │       └── SKILL.md        # Contains template markers
│   ├── commands/
│   │   └── kanban/
│   │       └── refine.md       # If commands also need templates
│   └── partials/               # Shared template fragments
│       ├── user-skills.md
│       ├── next-steps.md
│       ├── directory-reference.md
│       └── ...
├── skills/                     # OUTPUT (generated, don't edit)
│   └── kanban-refine/
│       └── SKILL.md
└── commands/                   # OUTPUT (generated)
    └── kanban/
        └── refine.md
```

Source files in `src/`, partials in `src/partials/`, compiled output in existing locations.

---

### Q3: What syntax should templates use?

**Options:**
- A. **Mustache/Handlebars** - `{{> next-steps command="verify" }}`
- B. **Custom markers** - `<!-- INCLUDE: next-steps(command=verify) -->`
- C. **YAML anchors** - Native YAML, but limited to YAML files
- D. **EJS/template literals** - `<%= include('next-steps', {command: 'verify'}) %>`

**Decision:** **Handlebars syntax** - `{{> partial-name param="value" }}`

Well-known, battle-tested, easy to read. Any `{{` conflicts in code examples can be escaped with `\{{` or raw blocks `{{{{raw}}}}...{{{{/raw}}}}`.

---

### Q4: Should we use an existing templating library or build our own?

**Considerations:**
- Existing: Handlebars, EJS, Nunjucks, Mustache
- Custom: Simpler, fewer dependencies, tailored to our needs

**Decision:** **Handlebars + custom build script**

- Use [Handlebars](https://www.npmjs.com/package/handlebars) (~10M weekly downloads, actively maintained)
- Write a simple build script (`scripts/build-skills.cjs`, ~50-100 lines)
- Full control, no learning curve, rock-solid foundation

---

### Q5: How do we handle parameters in templates?

**Example:** The "Next Steps" template needs:
- `next_command` - The command to suggest (e.g., "verify", "plan")
- `task_id_var` - Whether to include `{id}` placeholder

**Decision:** _TBD_

---

### Q6: What's the development workflow?

**Options:**
- A. Edit source files → Run build → Commit compiled files
- B. Edit source files → Build automatically on pre-commit
- C. Edit source files → CI builds and commits
- D. No build step (runtime resolution)

**Decision:** _TBD_

---

## Proposed Solution

_To be filled in after Socratic dialogue_

### Architecture

_TBD_

### File Structure

_TBD_

### Template Definitions

_TBD_

### Build Process

_TBD_

### Migration Strategy

_TBD_

---

## Implementation Steps

_To be filled in after design decisions are made_

1. [ ] Step 1: _TBD_
2. [ ] Step 2: _TBD_
3. [ ] Step 3: _TBD_

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing skills | High | Keep original files until validated |
| Template syntax conflicts with markdown | Medium | Choose non-conflicting markers |
| Over-engineering | Medium | Start with 2-3 templates, expand as needed |

---

## Appendix: Full Pattern Inventory

_Detailed list of all patterns to be templatized - to be expanded_

### 1. Next Steps Pattern
- Used in: refine, scope, plan, implement, verify, approve, docs, merge
- Parameters: `next_command`, `include_task_id`

### 2. User Skills Pattern
- Used in: refine, scope, plan, implement, verify, approve, docs
- Parameters: `command_name`

### 3. Directory Reference Pattern
- Used in: all skills
- Parameters: none (static)

### 4. Helper Scripts Pattern
- Used in: all skills
- Parameters: `scripts[]` - list of scripts to document

### 5. Validation Intro Pattern
- Used in: all skills
- Parameters: none (static)

### 6. Branch Verification Pattern
- Used in: most skills
- Parameters: `required_branch` (main or task/{id})

### 7. Workflow Schema Load Pattern
- Used in: all skills
- Parameters: none (static)
