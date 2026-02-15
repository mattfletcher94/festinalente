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

**Current content is correct:**
```handlebars
- **REQUIRED OUTPUT** - Print next steps EXACTLY like this:
      ```
      Next:
      /clear
      /kanban:{{next_command}}{{#unless no_id}} \{id\}{{/unless}}
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

### Setup/Discovery Skills

| Skill | dir-ref | Other Partials |
|-------|---------|----------------|
| kanban-init | ✓ | validation-intro only |
| kanban-map-product | ✗ | column-transition (N/A), commit-format, validation-intro |
| kanban-define-product | ✗ | column-transition (N/A), commit-format, validation-intro |

---

## Detailed Partial Usage Per Skill

### kanban-create
```handlebars
{{> directory-reference}}

{{> helper-scripts show_next_id=true show_get_date_time=true}}

{{> column-transition from="[New Task]" to="backlog"}}

## Commit

{{> commit-format type="docs" action="create"}}

## Steps

1. **Load workflow schema**
   {{> workflow-load}}

2. **Verify on main branch**
   {{> branch-verify-main}}

...

4. **User Skills** *(REQUIRED)*
   {{> user-skills command="create"}}

...

## Validation

{{> validation-intro}}

- [ ] Task file exists...
```

### kanban-refine
```handlebars
{{> directory-reference}}

{{> helper-scripts show_find_task=true show_find_spec=true show_find_plan=true show_get_date_time=true}}

{{> column-transition from="backlog" to="refined"}}

## Commit

{{> commit-format type="docs" action="refine"}}

## Steps

1. **Load workflow schema**
   {{> workflow-load}}

2. **Verify on main branch**
   {{> branch-verify-main}}

...

5. **User Skills** *(REQUIRED)*
   {{> user-skills command="refine"}}

...

12. **Confirm refinement complete**
    ...
    {{> next-steps next_command="scope"}}

## Validation

{{> validation-intro}}

- [ ] Task file exists...
```

### kanban-scope
```handlebars
{{> directory-reference}}

{{> helper-scripts show_find_task=true show_get_date_time=true}}

{{> column-transition from="refined" to="scoped"}}

## Commit

{{> commit-format type="docs" action="scope"}}

## Steps

1. **Load workflow schema**
   {{> workflow-load}}

2. **Verify on main branch**
   {{> branch-verify-main reason="to create the task branch"}}

...

5. **User Skills** *(REQUIRED)*
   {{> user-skills command="scope"}}

...

## Validation

{{> validation-intro}}
```

### kanban-plan
```handlebars
{{> directory-reference}}

{{> helper-scripts show_find_task=true show_find_spec=true show_get_date_time=true}}

{{> column-transition from="scoped" to="planned"}}

## Commit

{{> commit-format type="docs" action="plan"}}

## Steps

1. **Load workflow schema**
   {{> workflow-load}}

...

4. **Verify on task branch**
   {{> branch-verify-task}}

...

7. **User Skills** *(REQUIRED)*
   {{> user-skills command="plan"}}

...

## Validation

{{> validation-intro}}
```

### kanban-implement
```handlebars
{{> directory-reference}}

{{> helper-scripts show_find_task=true show_find_plan=true show_get_date_time=true}}

{{> column-transition from="planned" to="in-progress"}}

## Commit

None - code stays uncommitted until QA passes. Use `/kanban:save` to save partial progress.

## Steps

1. **Load workflow schema**
   {{> workflow-load}}

...

4. **Verify on task branch**
   {{> branch-verify-task}}

...

8. **User Skills** *(REQUIRED)*
   {{> user-skills command="implement"}}

...

12. **Report completion**
    ...
    {{> next-steps next_command="verify"}}

## Validation

{{> validation-intro}}
```

### kanban-verify
```handlebars
{{> directory-reference}}

{{> helper-scripts show_find_task=true show_find_plan=true show_get_date_time=true}}

{{> column-transition from="in-progress" to="checks → qa"}}

## Commit

{{> commit-format type="docs" action="verify-retry"}}

## Steps

1. **Load workflow schema**
   {{> workflow-load}}

...

4. **Verify on task branch**
   {{> branch-verify-task}}

...

(Note: verify has different user-skills pattern - loads from config differently)

...

8. **Handle success**
   ...
   {{> next-steps next_command="approve"}}

## Validation

{{> validation-intro}}
```

### kanban-save
```handlebars
{{> column-transition from="in-progress" to="in-progress (no change)"}}

## Commit

{{> commit-format type="wip" action="{summary}"}}

## Steps

1. **Load workflow schema**
   {{> workflow-load}}

...

4. **Verify on task branch**
   {{> branch-verify-task}}

...

6. **User Skills** *(REQUIRED)*
   {{> user-skills command="save"}}

...

## Validation

{{> validation-intro}}
```

### kanban-approve
```handlebars
{{> directory-reference}}

{{> column-transition from="qa" to="update-docs"}}

## Commit

**Format:** `{type}({id}): {title}` where `{type}` comes from task label:
- `bug` label → `fix({id}): {title}`
- `feature` label → `feat({id}): {title}`
- `refactor` label → `refactor({id}): {title}`
- `docs` label → `docs({id}): {title}`
- Default → `feat({id}): {title}`

**CRITICAL:** Use EXACTLY these formats. Do NOT invent commit types like `kanban(...)`.

## Steps

1. **Load workflow schema**
   {{> workflow-load}}

...

4. **Verify on task branch**
   {{> branch-verify-task}}

5. **User Skills** *(REQUIRED)*
   {{> user-skills command="approve"}}

...

11. **Confirm**
    ...
    {{> next-steps next_command="docs"}}

## Validation

{{> validation-intro}}
```

### kanban-rework
```handlebars
{{> directory-reference}}

{{> column-transition from="qa / pr" to="in-progress"}}

## Commit

{{> commit-format type="docs" action="rework"}}

## Steps

1. **Load workflow schema**
   {{> workflow-load}}

...

4. **Verify on task branch**
   {{> branch-verify-task}}

...

6. **User Skills** *(REQUIRED)*
   {{> user-skills command="rework"}}

...

12. **Confirm**
    ...
    {{> next-steps next_command="implement"}}

## Validation

{{> validation-intro}}
```

### kanban-docs
```handlebars
{{> directory-reference}}

{{> column-transition from="update-docs" to="pr"}}

## Commit

{{> commit-format type="docs" action="product"}}

## Steps

1. **Load workflow schema**
   {{> workflow-load}}

...

4. **Verify on task branch**
   {{> branch-verify-task}}

5. **User Skills** *(REQUIRED)*
   {{> user-skills command="docs"}}

...

## Validation

{{> validation-intro}}
```

### kanban-merge
```handlebars
{{> directory-reference}}

{{> column-transition from="pr" to="done"}}

## Commit

{{> commit-format type="docs" action="done"}}

## Steps

1. **Load workflow schema**
   {{> workflow-load}}

...

4. **Verify on task branch**
   {{> branch-verify-task}}

5. **User Skills** *(REQUIRED)*
   {{> user-skills command="merge"}}

...

11. **Confirm completion**
    ...
    {{> next-steps next_command="create" no_id=true}}

## Validation

{{> validation-intro}}
```

### kanban-status
```handlebars
{{> helper-scripts show_list_tasks=true show_find_task=true show_find_plan=true}}

...

## Validation

{{> validation-intro}}
```

### kanban-view
```handlebars
{{> helper-scripts show_list_tasks=true show_find_task=true show_find_plan=true}}

...

## Validation

{{> validation-intro}}
```

### kanban-init
```handlebars
{{> directory-reference}}

...

## Validation

{{> validation-intro}}
```

### kanban-map-product
```handlebars
## Column Transition

N/A - This is a product discovery command, not a task workflow command.

## Commit

{{> commit-format type="docs" action="map-product"}}

...

## Validation

{{> validation-intro}}
```

### kanban-define-product
```handlebars
## Column Transition

N/A - This is a product discovery command, not a task workflow command.

## Commit

{{> commit-format type="docs" action="define-product"}}

...

## Validation

{{> validation-intro}}
```

---

## Implementation Steps

### Phase 1: Preparation

1. **Capture baseline**
   ```bash
   npm run build
   cp -r dist dist-before
   ```

2. **Create backup branch**
   ```bash
   git checkout -b template-migration-backup
   git checkout main
   ```

### Phase 2: Update/Create Partials

Files to modify in `src/content/partials/`:

1. `helper-scripts.md` - Add conditional show_* flags
2. `workflow-load.md` - Remove title prefix
3. `branch-verify-main.md` - Remove title prefix
4. `branch-verify-task.md` - Remove title prefix
5. `user-skills.md` - Remove title prefix
6. `validation-intro.md` - Remove "## Validation" header

Files to create in `src/content/partials/`:

7. `column-transition.md` - New partial
8. `commit-format.md` - New partial
9. `commit-critical.md` - New partial (optional, for commit step boilerplate)

### Phase 3: Update Skills

Update each skill in `src/content/skills/*/SKILL.md`:

**Standard workflow skills (11 files):**
1. kanban-create
2. kanban-refine (already using partials - update to new format)
3. kanban-scope
4. kanban-plan
5. kanban-implement
6. kanban-verify
7. kanban-save
8. kanban-approve
9. kanban-rework
10. kanban-docs
11. kanban-merge

**Utility skills (2 files):**
12. kanban-status
13. kanban-view

**Setup/discovery skills (3 files):**
14. kanban-init
15. kanban-map-product
16. kanban-define-product

### Phase 4: Verification

1. **Rebuild**
   ```bash
   npm run build
   ```

2. **Diff output**
   ```bash
   diff -r dist-before dist
   ```

3. **Review diffs**
   - No diff = correct replacement
   - Expected diff = intentional consistency fix
   - Unexpected diff = bug to fix

4. **Fix any issues and repeat**

### Phase 5: Cleanup

1. **Remove backup**
   ```bash
   rm -rf dist-before
   git branch -d template-migration-backup
   ```

2. **Commit**
   ```bash
   git add src/content/
   git commit -m "refactor: migrate skills to use Handlebars partials"
   ```

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

### Skills
```
src/content/skills/
├── kanban-create/SKILL.md
├── kanban-refine/SKILL.md
├── kanban-scope/SKILL.md
├── kanban-plan/SKILL.md
├── kanban-implement/SKILL.md
├── kanban-save/SKILL.md
├── kanban-verify/SKILL.md
├── kanban-approve/SKILL.md
├── kanban-rework/SKILL.md
├── kanban-docs/SKILL.md
├── kanban-merge/SKILL.md
├── kanban-status/SKILL.md
├── kanban-view/SKILL.md
├── kanban-init/SKILL.md
├── kanban-map-product/SKILL.md
└── kanban-define-product/SKILL.md
```

---

## Change Log

| Date | Change |
|------|--------|
| 2026-02-15 | Initial analysis of current state and patterns |
| 2026-02-15 | Completed Socratic Q&A - all design decisions finalized |
| 2026-02-15 | Full implementation plan with partial specs and skill mappings |
