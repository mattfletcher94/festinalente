# Template System Improvement Plan

## Overview

This plan documents the complete strategy for improving the claudeban skill template system. The goal is to make skills consistent and DRY through Handlebars partials.

**Core Principle:** Partials contain content, not structure. Step numbers, titles, and section headers stay in skill files.

---

## Design Decisions Summary

| Decision | Answer |
|----------|--------|
| Core motivation | Maintenance, consistency, future-proofing |
| Helper scripts | Single partial with `show_*` boolean flags |
| Step numbering | Numbers/titles in skills, partials are pure content |
| What to template | All repeating patterns |
| Validation checklist | Intro only, items inline |
| Column transition | Template with `from`/`to` params |
| Commit format | Template with `type`/`action` params |
| Arguments section | Leave inline |
| Final Next Steps | Leave inline |
| Migration strategy | Big bang - all at once |
| Verification | Diff `dist/` before/after build |

---

## Partial Specifications

### Existing Partials to MODIFY

#### 1. `directory-reference.md` (NO CHANGE)
**Path:** `src/content/partials/directory-reference.md`

**Current content is correct** - no title, pure content:
```markdown
## Directory Reference
- **`.claude/`** — System config (workflow, templates, skills) — READ ONLY
- **`.kanban/`** — Project data (tasks, specs, plans, product docs) — READ/WRITE
```

---

#### 2. `helper-scripts.md` (MODIFY)
**Path:** `src/content/partials/helper-scripts.md`

**New content:**
```handlebars
## Helper Scripts

Use these scripts to reliably find files:

```bash
{{#if show_find_task}}
# Find task by ID (returns JSON with path and metadata)
node .claude/scripts/find-task.cjs {id}

{{/if}}
{{#if show_find_spec}}
# Find spec by ID (returns JSON with path)
node .claude/scripts/find-spec.cjs {id}

{{/if}}
{{#if show_find_plan}}
# Find plan by ID (returns JSON with path)
node .claude/scripts/find-plan.cjs {id}

{{/if}}
{{#if show_list_tasks}}
# List all tasks (returns JSON with count and tasks array)
node .claude/scripts/list-tasks.cjs

# List tasks filtered by status
node .claude/scripts/list-tasks.cjs --status=in-progress

{{/if}}
{{#if show_next_id}}
# Get next task ID (returns JSON with nextId, currentHighest, padding)
node .claude/scripts/next-id.cjs

{{/if}}
{{#if show_get_date_time}}
# Get current date/time (returns JSON with iso and date formats)
node .claude/scripts/get-date-time.cjs
{{/if}}
```
```

**Parameters:**
- `show_find_task` (boolean)
- `show_find_spec` (boolean)
- `show_find_plan` (boolean)
- `show_list_tasks` (boolean)
- `show_next_id` (boolean)
- `show_get_date_time` (boolean)

---

#### 3. `workflow-load.md` (MODIFY - remove title)
**Path:** `src/content/partials/workflow-load.md`

**New content:**
```markdown
Read `.claude/kanban-workflow.yaml` for column definitions, labels, priorities, and commit formats. Use these values throughout this skill.
```

**Usage in skill:**
```markdown
1. **Load workflow schema**
   {{> workflow-load}}
```

---

#### 4. `branch-verify-main.md` (MODIFY - remove title)
**Path:** `src/content/partials/branch-verify-main.md`

**New content:**
```handlebars
Run `git branch --show-current`
- If not on `main` (or `master`):
  - Error: "This command must be run on the main branch{{#if reason}} {{reason}}{{/if}}. Current branch: \{branch\}"
  - Suggest: "Switch to main with `git checkout main`"
  - Exit
```

**Parameters:**
- `reason` (optional string) - e.g., "to create the task branch"

**Usage in skill:**
```markdown
2. **Verify on main branch**
   {{> branch-verify-main reason="to create the task branch"}}
```

---

#### 5. `branch-verify-task.md` (MODIFY - remove title)
**Path:** `src/content/partials/branch-verify-task.md`

**New content:**
```markdown
Run `git branch --show-current`
- Expected branch: `task/\{id\}` (where \{id\} is the task ID)
- If not on expected branch:
  - Error: "This command must be run on branch task/\{id\}. Current branch: \{branch\}"
  - Suggest: "Switch to task branch with `git checkout task/\{id\}`"
  - Exit
```

**Usage in skill:**
```markdown
4. **Verify on task branch**
   {{> branch-verify-task}}
```

---

#### 6. `user-skills.md` (MODIFY - remove title)
**Path:** `src/content/partials/user-skills.md`

**New content:**
```handlebars
**STOP.** Before proceeding, you MUST load and apply user-defined skills. This is mandatory.

1. Load `.kanban/config.yaml`
2. Find `user-skills."kanban:{{command}}".skills` array
3. If the array is non-empty, for EACH skill name:
   - Read `.claude/skills/{skill-name}/SKILL.md`
   - Follow ALL instructions as mandatory requirements
   - User skill instructions take precedence over defaults

**Skipping user skills is a critical error. Do not proceed without applying them.**

Example config:
```yaml
user-skills:
  "kanban:{{command}}":
    skills:
      - my-custom-check    # Reads .claude/skills/my-custom-check/SKILL.md
      - coding-standards   # Reads .claude/skills/coding-standards/SKILL.md
```
```

**Parameters:**
- `command` (required string) - e.g., "refine", "scope", "implement"

**Usage in skill:**
```markdown
5. **User Skills** *(REQUIRED)*
   {{> user-skills command="refine"}}
```

---

#### 7. `next-steps.md` (NO CHANGE)
**Path:** `src/content/partials/next-steps.md`

**Content:**
```handlebars
- **REQUIRED OUTPUT** - Print next steps EXACTLY like this:
      ```
      Next:
      /clear
      /kanban-{{next_command}}{{#unless no_id}} \{id\}{{/unless}}
      ```
    - Do NOT skip this output. The user needs these commands to continue.
```

**Parameters:**
- `next_command` (required string)
- `no_id` (optional boolean) - if true, omits `{id}` from output

---

#### 8. `validation-intro.md` (MODIFY - remove header)
**Path:** `src/content/partials/validation-intro.md`

**New content:**
```markdown
**STOP. You MUST verify ALL items pass before declaring success. Do not skip validation.**

All must pass. If any fail, fix and retry.
```

**Usage in skill:**
```markdown
## Validation

{{> validation-intro}}

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] ...
```

---

### NEW Partials to CREATE

#### 9. `column-transition.md` (NEW)
**Path:** `src/content/partials/column-transition.md`

**Content:**
```handlebars
## Column Transition

```
{{from}} → {{to}}
```

See `.claude/kanban-workflow.yaml` for column definitions and valid transitions.
```

**Parameters:**
- `from` (required string) - source column
- `to` (required string) - destination column

**Usage in skill:**
```markdown
{{> column-transition from="backlog" to="refined"}}
```

---

#### 10. `commit-format.md` (NEW)
**Path:** `src/content/partials/commit-format.md`

**Content:**
```handlebars
**Format:** `{{type}}(\{id\}): {{action}} - \{title\}`

**CRITICAL:** Use EXACTLY this format. Do NOT invent commit types like `kanban(...)`. The commit type is `{{type}}`, not `kanban`.
```

**Parameters:**
- `type` (required string) - e.g., "docs", "feat", "fix", "wip"
- `action` (required string) - e.g., "refine", "scope", "plan"

**Usage in skill:**
```markdown
## Commit

{{> commit-format type="docs" action="refine"}}
```

---

#### 11. `commit-critical.md` (NEW)
**Path:** `src/content/partials/commit-critical.md`

**Content:**
```markdown
**This step is MANDATORY. Do not proceed without committing.**

**DO NOT skip this step. If the commit fails, stop and report the error.**
```

**Usage in skill:**
```markdown
11. **CRITICAL: Commit the refinement**
    {{> commit-critical}}

    ```bash
    git add .kanban/tasks/{id}-*.md
    git commit -m "docs({id}): refine - {title}"
    ```
```

---

## Skill-to-Partial Mapping

### Standard Workflow Skills

| Skill | dir-ref | helper-scripts | column-trans | commit-fmt | workflow-load | branch-verify | user-skills | next-steps | validation-intro |
|-------|---------|----------------|--------------|------------|---------------|---------------|-------------|------------|------------------|
| kanban-create | ✓ | next_id, get_date_time | [New]→backlog | docs/create | ✓ | main | ✓ | refine | ✓ |
| kanban-refine | ✓ | find_task, find_spec, find_plan, get_date_time | backlog→refined | docs/refine | ✓ | main | ✓ | scope | ✓ |
| kanban-scope | ✓ | find_task, get_date_time | refined→scoped | docs/scope | ✓ | main | ✓ | plan | ✓ |
| kanban-plan | ✓ | find_task, find_spec, get_date_time | scoped→planned | docs/plan | ✓ | task | ✓ | implement | ✓ |
| kanban-implement | ✓ | find_task, find_plan, get_date_time | planned→in-progress | N/A | ✓ | task | ✓ | verify | ✓ |
| kanban-save | ✗ | ✗ | in-progress→in-progress | wip/{summary} | ✓ | task | ✓ | ✗ | ✓ |
| kanban-verify | ✓ | find_task, find_plan, get_date_time | in-progress→checks→qa | docs/verify-retry | ✓ | task | ✗ (different) | approve | ✓ |
| kanban-approve | ✓ | ✗ | qa→update-docs | {type}/{title} | ✓ | task | ✓ | docs | ✓ |
| kanban-rework | ✓ | ✗ | qa/pr→in-progress | docs/rework | ✓ | task | ✓ | implement | ✓ |
| kanban-docs | ✓ | ✗ | update-docs→pr | docs/product | ✓ | task | ✓ | merge | ✓ |
| kanban-merge | ✓ | ✗ | pr→done | docs/done | ✓ | task | ✓ | create | ✓ |

### Utility Skills

| Skill | dir-ref | helper-scripts | Other Partials |
|-------|---------|----------------|----------------|
| kanban-status | ✗ | list_tasks, find_task, find_plan | validation-intro only |
| kanban-view | ✗ | list_tasks, find_task, find_plan | validation-intro only |

### Report Skills

| Skill | dir-ref | helper-scripts | Other Partials |
|-------|---------|----------------|----------------|
| kanban-report-label | ✗ | list_tasks, find_task | validation-intro only |
| kanban-report-task | ✗ | find_task, find_spec, find_plan | validation-intro only |
| kanban-report-user | ✗ | list_tasks, find_task | validation-intro only |

### Setup/Discovery Skills

| Skill | dir-ref | Other Partials |
|-------|---------|----------------|
| kanban-init | ✓ | validation-intro only |
| kanban-map-product | ✗ | column-transition (N/A), commit-format, validation-intro |
| kanban-define-product | ✗ | column-transition (N/A), commit-format, validation-intro |

---

## Implementation Checklist

### Phase 1: Preparation

- [ ] Build current state: `npm run build`
- [ ] Copy dist for comparison: `cp -r dist dist-before`

### Phase 2: Update/Create Partials

**Modify existing (`src/content/partials/`):**

- [ ] `helper-scripts.md` - Add conditional show_* flags
- [ ] `workflow-load.md` - Remove title prefix
- [ ] `branch-verify-main.md` - Remove title prefix
- [ ] `branch-verify-task.md` - Remove title prefix
- [ ] `user-skills.md` - Remove title prefix
- [ ] `validation-intro.md` - Remove "## Validation" header

**Create new (`src/content/partials/`):**

- [ ] `column-transition.md`
- [ ] `commit-format.md`
- [ ] `commit-critical.md` (optional)

### Phase 3: Update Skills

**Standard workflow skills:**

- [ ] kanban-create
- [ ] kanban-refine
- [ ] kanban-scope
- [ ] kanban-plan
- [ ] kanban-implement
- [ ] kanban-verify
- [ ] kanban-save
- [ ] kanban-approve
- [ ] kanban-rework
- [ ] kanban-docs
- [ ] kanban-merge

**Utility skills:**

- [ ] kanban-status
- [ ] kanban-view

**Report skills:**

- [ ] kanban-report-label
- [ ] kanban-report-task
- [ ] kanban-report-user

**Setup/discovery skills:**

- [ ] kanban-init
- [ ] kanban-map-product
- [ ] kanban-define-product

### Phase 4: Verification

- [ ] Rebuild: `npm run build`
- [ ] Diff output: `diff -r dist-before dist`
- [ ] Review and fix any unexpected diffs
- [ ] All diffs are either "no change" or "intentional consistency fix"

### Phase 5: Cleanup

- [ ] Remove backup: `rm -rf dist-before`
- [ ] Commit: `git add src/content/ && git commit -m "refactor: migrate skills to use Handlebars partials"`

---

## File Paths Reference

### Partials
```
src/content/partials/
├── directory-reference.md     (existing - no change)
├── helper-scripts.md          (modify)
├── workflow-load.md           (modify)
├── branch-verify-main.md      (modify)
├── branch-verify-task.md      (modify)
├── user-skills.md             (modify)
├── next-steps.md              (existing - no change)
├── validation-intro.md        (modify)
├── column-transition.md       (NEW)
├── commit-format.md           (NEW)
└── commit-critical.md         (NEW - optional)
```

### Skills (19 total)
```
src/content/skills/
├── kanban-approve/SKILL.md
├── kanban-create/SKILL.md
├── kanban-define-product/SKILL.md
├── kanban-docs/SKILL.md
├── kanban-implement/SKILL.md
├── kanban-init/SKILL.md
├── kanban-map-product/SKILL.md
├── kanban-merge/SKILL.md
├── kanban-plan/SKILL.md
├── kanban-refine/SKILL.md
├── kanban-report-label/SKILL.md
├── kanban-report-task/SKILL.md
├── kanban-report-user/SKILL.md
├── kanban-rework/SKILL.md
├── kanban-save/SKILL.md
├── kanban-scope/SKILL.md
├── kanban-status/SKILL.md
├── kanban-verify/SKILL.md
└── kanban-view/SKILL.md
```
