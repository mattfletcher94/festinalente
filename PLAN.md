# Kanban System Redesign Plan

## Problem Statement

The current command naming convention is unintuitive. Commands follow a `kanban:{current-column}-{action}-task` pattern which requires users to know their current state before knowing what command to run. Engineers think in actions ("I want to refine this"), not states ("I'm in backlog").

## Goals

1. Simplify command names to be action-based
2. Clarify column names where ambiguous
3. Streamline failure handling
4. Make the system intuitive for PMs and Engineers

---

## Command Renaming

### Core Workflow Commands

| Current | New | Description |
|---------|-----|-------------|
| `kanban:define-task "title"` | `kanban:create "title"` | Create a new task |
| `kanban:backlog-refine-task 001` | `kanban:refine 001` | Q&A to clarify requirements |
| `kanban:refined-scope-task 001` | `kanban:scope 001` | Research codebase, write spec |
| `kanban:scoped-plan-task 001` | `kanban:plan 001` | Create implementation checklist |
| `kanban:planned-implement-task 001` | `kanban:implement 001` | Execute plan, write code |
| `kanban:in-progress-verify-task 001` | `kanban:verify 001` | AI code review (skills-based). Auto-loops until pass, auto-advances. |
| `kanban:verify-pass-task 001` | *(removed)* | No longer needed - verify auto-advances |
| `kanban:review-pass-task 001` | `kanban:approve 001` | Human confirms QA passed. Commits code. |
| `kanban:update-docs-complete-task 001` | `kanban:docs 001` | LLM updates product docs. Commits. Moves to PR. |
| `kanban:awaiting-merge-merge-task 001` | `kanban:merge 001` | Merge PR to main |

### Utility Commands

| Current | New | Description |
|---------|-----|-------------|
| `kanban:init` | `kanban:init` | Initialize board (no change) |
| `kanban:status` | `kanban:status` | Show board status (no change) |
| `kanban:status [id]` | `kanban:status [id]` | Show task status (no change) |
| `kanban:in-progress-wip-commit 001` | `kanban:save 001` | Save work-in-progress |
| `kanban:map-product` | `kanban:map-product` | Document existing codebase (no change) |
| `kanban:define-product` | `kanban:define-product` | Define product vision (no change) |

### Failure Handling

| Current | New | Description |
|---------|-----|-------------|
| `kanban:verify-fail-task 001` | *(automatic)* | AI fixes issues and retries verify |
| `kanban:review-fail-task 001` | `kanban:rework 001` | Return to In Progress from QA |
| `kanban:awaiting-merge-fail-task 001` | `kanban:rework 001` | Return to In Progress from PR |

**Behavior:**
- `kanban:verify 001` runs AI code review using configured skills (style checks, linting, etc). If issues found, AI fixes them and retries automatically. Once passing, auto-advances to QA. All attempts are logged on the task card.
- `kanban:rework 001` is the single command for human-initiated rejection. Works from QA or PR columns. Reason is logged on the task card. Task returns to In Progress.

---

## Column Renaming

| Current | New | Rationale |
|---------|-----|-----------|
| Backlog | Backlog | No change |
| Refined | Refined | No change |
| Scoped | Scoped | No change |
| Planned | Planned | No change |
| In Progress | In Progress | No change |
| **Verify** | **Checks** | AI code review using skills (style, lint, tests) |
| **Review** | **QA** | Human tests the application works as expected |
| Update Docs | Update Docs | No change |
| Awaiting Merge | **PR** | Clearer - waiting for GitHub PR review |
| Done | Done | No change |

---

## Branching Strategy

### Principle: Branch Before File Changes

The task branch is created at **scope**, not at plan or implement. This follows the principle of creating a branch before making changes to files.

### Why Branch at Scope?

| Command | Branch | Files | Rationale |
|---------|--------|-------|-----------|
| `create` | main | `.kanban/tasks/001.md` | Task file is like a ticket - shared on main |
| `refine` | main | *(modifies task file)* | Still refining the idea - stays on main |
| `scope` | **creates `task/001`** | `.kanban/specs/001.spec.md` | First "work artifact" - belongs on branch |
| `plan` | task/001 | `.kanban/plans/001.plan.md` | Implementation details - on branch |
| `implement` | task/001 | *(source code)* | Code changes - on branch |

### Benefits

1. **Main stays clean** - Only task definitions (ideas/tickets) live on main
2. **Easy abandonment** - If a task is abandoned after scoping, delete the branch. No orphan specs on main.
3. **Clear separation**:
   - `main` = What we want to do (tasks)
   - `task/001` = How we're doing it (specs, plans, code)
4. **Parallel work** - Multiple tasks can be scoped/planned without conflicts

### Branch Lifecycle

```
main                          task/001
  │
  ├─ create (task file)
  │
  ├─ refine (update task)
  │
  ├─ scope ──────────────────────┬─ (branch created)
  │                              │
  │                              ├─ spec file created
  │                              │
  │                              ├─ plan (plan file)
  │                              │
  │                              ├─ implement (code)
  │                              │
  │                              ├─ verify/approve/docs
  │                              │
  │                              ├─ (PR created on GitHub)
  │                              │
  ├─ merge ◄─────────────────────┴─ (branch deleted)
  │
  ▼
```

---

## Workflow Transitions

```
Backlog ──create──► Backlog
                        │
                    refine
                        │
                        ▼
                    Refined
                        │
                     scope
                        │
                        ▼
                     Scoped
                        │
                      plan
                        │
                        ▼
                    Planned
                        │
                   implement
                        │
                        ▼
                  In Progress ◄─────────────────┐
                        │                       │
                     verify                     │
                        │                       │
                ┌───────┴───────┐               │
                │               │               │
            (pass)          (fail)              │
                │               │               │
                │          (AI fixes,           │
                │           retries)            │
                ▼               │               │
             Checks ◄───────────┘               │
                │                               │
           (auto-advance)                       │
                │                               │
                ▼                               │
               QA                               │
                │                               │
         ┌──────┴──────┐                        │
         │             │                        │
      approve       rework ─────────────────────┤
         │                                      │
         ▼                                      │
     Update Docs                                │
         │                                      │
        docs                                    │
         │                                      │
         ▼                                      │
        PR ◄──── (user creates PR on GitHub)    │
         │                                      │
    ┌────┴────┐                                 │
    │         │                                 │
  merge    rework ──────────────────────────────┘
    │
    ▼
   Done
```

---

## Happy Path Example

```bash
/kanban:create "Add dark mode support"    # → Backlog
/kanban:refine 001                        # → Refined
/kanban:scope 001                         # → Scoped (creates task branch)
/kanban:plan 001                          # → Planned
/kanban:implement 001                     # → In Progress
/kanban:verify 001                        # → Checks (AI review, auto-loops, auto-advances to QA)
# Human tests the application...
/kanban:approve 001                       # → Update Docs (commits code)
/kanban:docs 001                          # → PR (commits docs)
# User creates PR on GitHub, reviews, approves...
/kanban:merge 001                         # → Done
```

---

## Detailed Workflow Explanation

### Phase 1: Discovery (on main branch)

| Step | Command | What Happens |
|------|---------|--------------|
| **Create** | `kanban:create "title"` | Creates task file in `.kanban/tasks/`. Task in Backlog. Commits. |
| **Refine** | `kanban:refine 001` | AI asks clarifying questions. Fills problem/value/acceptance criteria. Task in Refined. Commits. |
| **Scope** | `kanban:scope 001` | AI researches codebase. Creates spec file. **Creates `task/001` branch.** Task in Scoped. Commits. |

### Phase 2: Implementation (on task branch)

| Step | Command | What Happens |
|------|---------|--------------|
| **Plan** | `kanban:plan 001` | Creates implementation plan with checkboxes. Task in Planned. Commits. |
| **Implement** | `kanban:implement 001` | AI executes plan, writes code. Task in In Progress. **No commit** (code uncommitted for review). |
| **Save** | `kanban:save 001` | *(Optional)* If interrupted, commits WIP. |

### Phase 3: Review (on task branch)

| Step | Command | What Happens |
|------|---------|--------------|
| **Verify** | `kanban:verify 001` | AI code review using skills. If issues: AI fixes and retries. Once passing: auto-advances to QA. Logged to card. |
| **QA** | *(human testing)* | Human tests the application to verify it works as expected. |
| **Approve** | `kanban:approve 001` | Human confirms QA passed. **Commits code.** Task in Update Docs. |

### Phase 4: Finalize (on task branch → main)

| Step | Command | What Happens |
|------|---------|--------------|
| **Docs** | `kanban:docs 001` | AI updates product documentation. Commits. Task in PR. |
| **PR** | *(on GitHub)* | User creates PR on GitHub. PR review happens externally. |
| **Merge** | `kanban:merge 001` | Merges PR. Deletes task branch. Returns to main. Task in Done. |

### Failure Recovery

| From | Command | What Happens |
|------|---------|--------------|
| QA | `kanban:rework 001` | Task returns to In Progress. Reason logged. |
| PR | `kanban:rework 001` | Task returns to In Progress. Reason logged. |

---

## Implementation Tasks

### Phase 1: Command Files
- [ ] Create `kanban:create` (rename from define-task)
- [ ] Create `kanban:refine` (rename from backlog-refine-task)
- [ ] Create `kanban:scope` (rename from refined-scope-task)
- [ ] Create `kanban:plan` (rename from scoped-plan-task)
- [ ] Create `kanban:implement` (rename from planned-implement-task)
- [ ] Create `kanban:verify` with auto-loop and auto-advance logic
- [ ] Create `kanban:approve` (commits code, moves to Update Docs)
- [ ] Create `kanban:docs` (updates docs, commits, moves to PR)
- [ ] Create `kanban:merge` (rename from awaiting-merge-merge-task)
- [ ] Create `kanban:save` (rename from wip-commit)
- [ ] Create `kanban:rework` (consolidates fail commands)
- [ ] Remove old command files

### Phase 2: Workflow Schema
- [ ] Update `.claude/kanban-workflow.yaml`
- [ ] Rename `verify` column to `checks`
- [ ] Rename `review` column to `qa`
- [ ] Rename `awaiting-merge` column to `pr`
- [ ] Update valid transitions
- [ ] Add auto-advance transition from checks → qa
- [ ] Document that `scope` creates the task branch

### Phase 3: Verify Auto-Loop Logic
- [ ] Implement retry logic in `kanban:verify`
- [ ] AI fixes issues and retries automatically
- [ ] Log each attempt to task card
- [ ] Auto-advance to QA when passing

### Phase 4: Documentation
- [ ] Update README with new command names
- [ ] Update any inline help/status messages
- [ ] Update skill files that reference old commands

### Phase 5: Testing
- [ ] Test full happy path with new commands
- [ ] Test verify auto-loop on failure
- [ ] Test `kanban:rework` from QA
- [ ] Test `kanban:rework` from PR
- [ ] Verify task card logging

---

## Migration Notes

- Old command names should error with a helpful message pointing to the new name
- Existing tasks in `.kanban/tasks/` do not need migration (column names in frontmatter remain compatible)
- The `status` field values in task frontmatter should be updated if column names change:
  - `verify` → `checks`
  - `review` → `qa`
  - `awaiting-merge` → `pr`

---

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| Command style | State-prefixed (`backlog-refine-task`) | Action-based (`refine`) |
| Fail commands | 3 separate commands | 1 `rework` + automatic verify retry |
| Verify behavior | Manual pass/fail commands | Auto-loop until pass, auto-advance |
| Column clarity | Verify/Review ambiguous | Checks (AI) / QA (human) |
| PR creation | System creates PR | User creates PR on GitHub |
| Branch creation | At scope | At scope (unchanged, but now explicit) |
| Commands to learn | ~15 | ~11 |

---

## Command Quick Reference

| Command | Description |
|---------|-------------|
| `kanban:init` | Initialize board |
| `kanban:status` | Show board status |
| `kanban:create "title"` | Create new task |
| `kanban:refine 001` | Refine requirements |
| `kanban:scope 001` | Research & write spec |
| `kanban:plan 001` | Create implementation plan |
| `kanban:implement 001` | Write code |
| `kanban:save 001` | Save WIP |
| `kanban:verify 001` | AI code review |
| `kanban:approve 001` | Approve QA, commit code |
| `kanban:docs 001` | Update product docs |
| `kanban:merge 001` | Merge PR |
| `kanban:rework 001` | Return to In Progress |

---

## File-by-File Implementation Guide

This section provides a complete inventory of all files that must be created, renamed, modified, or deleted. An implementer with no prior context should be able to execute this plan.

### Directory Structure Reference

```
.claudeban/                              # System files (shipped with package)
├── kanban-workflow.yaml                 # Workflow schema (columns, transitions, commits)
├── kanban-templates/                    # Templates for user files
│   ├── config.yaml                      # Template for .kanban/config.yaml
│   ├── task.md
│   ├── spec.md
│   ├── plan.md
│   └── product-doc.md
├── commands/kanban/                     # Command definitions
│   └── {command-name}.md
└── skills/kanban-{command-name}/        # Skill implementations
    └── SKILL.md

.kanban/                                 # User project files (created by init)
├── config.yaml                          # User's command configuration
├── tasks/
├── specs/
├── plans/
├── product/
└── skills/                              # User-defined verification checks
```

---

### 1. Command Files (`.claudeban/commands/kanban/`)

#### Commands to RENAME

| Old Filename | New Filename | Notes |
|--------------|--------------|-------|
| `define-task.md` | `create.md` | Update name, description, usage examples, "Next:" references |
| `backlog-refine-task.md` | `refine.md` | Update name, description, usage examples, "Next:" references |
| `refined-scope-task.md` | `scope.md` | Update name, description, usage examples, "Next:" references |
| `scoped-plan-task.md` | `plan.md` | Update name, description, usage examples, "Next:" references |
| `planned-implement-task.md` | `implement.md` | Update name, description, usage examples, "Next:" references |
| `in-progress-verify-task.md` | `verify.md` | Major rewrite - add auto-loop/auto-advance logic |
| `review-pass-task.md` | `approve.md` | Update name, change column reference from `review` to `qa` |
| `update-docs-complete-task.md` | `docs.md` | Update name, remove PR creation (just update docs) |
| `awaiting-merge-merge-task.md` | `merge.md` | Update name, change column reference from `awaiting-merge` to `pr` |
| `in-progress-wip-commit.md` | `save.md` | Update name |

#### Commands to DELETE

| Filename | Reason |
|----------|--------|
| `verify-pass-task.md` | Functionality merged into `verify.md` (auto-advance) |
| `verify-fail-task.md` | Functionality merged into `verify.md` (auto-retry) |
| `review-fail-task.md` | Replaced by `rework.md` |
| `awaiting-merge-fail-task.md` | Replaced by `rework.md` |

#### Commands to CREATE

| Filename | Description |
|----------|-------------|
| `rework.md` | New consolidated fail command. Works from QA or PR columns. Returns task to In Progress. Logs reason to task card. |

#### Commands to KEEP (no changes to filename)

| Filename | Changes Needed |
|----------|----------------|
| `init.md` | Update "Next:" references to use new command names |
| `status.md` | Update command suggestions to use new names |
| `view.md` | No changes needed |
| `map-product.md` | No changes needed |
| `define-product.md` | No changes needed |
| `report-user.md` | No changes needed |
| `report-task.md` | No changes needed |
| `report-label.md` | No changes needed |

---

### 2. Skill Files (`.claudeban/skills/`)

#### Skills to RENAME (directory + SKILL.md content)

| Old Directory | New Directory | Content Updates |
|---------------|---------------|-----------------|
| `kanban-define-task/` | `kanban-create/` | Update name in frontmatter, all "Next:" references, column references |
| `kanban-backlog-refine-task/` | `kanban-refine/` | Update name in frontmatter, all "Next:" references |
| `kanban-refined-scope-task/` | `kanban-scope/` | Update name in frontmatter, all "Next:" references |
| `kanban-scoped-plan-task/` | `kanban-plan/` | Update name in frontmatter, all "Next:" references |
| `kanban-planned-implement-task/` | `kanban-implement/` | Update name in frontmatter, all "Next:" references |
| `kanban-in-progress-verify-task/` | `kanban-verify/` | **Major rewrite** - add auto-loop, auto-fix, auto-advance logic |
| `kanban-review-pass-task/` | `kanban-approve/` | Update name, column `review` → `qa`, "Next:" references |
| `kanban-update-docs-complete-task/` | `kanban-docs/` | Update name, remove PR creation, column `awaiting-merge` → `pr` |
| `kanban-awaiting-merge-merge-task/` | `kanban-merge/` | Update name, column `awaiting-merge` → `pr` |
| `kanban-in-progress-wip-commit/` | `kanban-save/` | Update name in frontmatter |

#### Skills to DELETE

| Directory | Reason |
|-----------|--------|
| `kanban-verify-pass-task/` | Merged into `kanban-verify/` |
| `kanban-verify-fail-task/` | Merged into `kanban-verify/` |
| `kanban-review-fail-task/` | Replaced by `kanban-rework/` |
| `kanban-awaiting-merge-fail-task/` | Replaced by `kanban-rework/` |

#### Skills to CREATE

| Directory | Description |
|-----------|-------------|
| `kanban-rework/SKILL.md` | Handles human-initiated rejection from QA or PR. Asks for reason, logs to task card, returns to In Progress. |

#### Skills to KEEP (no changes to directory name)

| Directory | Changes Needed |
|-----------|----------------|
| `kanban-init/` | Update "Next:" references to new command names |
| `kanban-status/` | Update command suggestions to new names |
| `kanban-view/` | No changes needed |
| `kanban-map-product/` | No changes needed |
| `kanban-define-product/` | No changes needed |

---

### 3. Workflow Schema (`.claudeban/kanban-workflow.yaml`)

#### Column Changes

```yaml
# BEFORE
- id: verify
  name: Verify
  description: Implementation complete, running automated checks
- id: review
  name: Review
  description: Checks passed, awaiting human code review
- id: awaiting-merge
  name: Awaiting Merge
  description: PR created, awaiting merge to main

# AFTER
- id: checks
  name: Checks
  description: AI code review using skills (style, lint, tests)
- id: qa
  name: QA
  description: Human tests the application works as expected
- id: pr
  name: PR
  description: Awaiting GitHub PR review and merge
```

#### Transition Changes

```yaml
# BEFORE
transitions:
  in-progress: [verify]
  verify: [review, in-progress]
  review: [update-docs, in-progress]
  update-docs: [awaiting-merge]
  awaiting-merge: [done, in-progress]

# AFTER
transitions:
  in-progress: [checks]
  checks: [qa]                    # Auto-advance only (no manual fail)
  qa: [update-docs, in-progress]  # approve or rework
  update-docs: [pr]
  pr: [done, in-progress]         # merge or rework
```

#### Commit Format Changes

```yaml
# BEFORE
commits:
  verify-fail: "docs({id}): verify-fail - {title}"
  review-fail: "docs({id}): review-fail - {title}"
  merge-fail: "docs({id}): merge-fail - {title}"

# AFTER
commits:
  verify-retry: "docs({id}): verify-retry - {title}"  # When AI retries
  rework: "docs({id}): rework - {title}"              # Consolidated fail
  # Remove: verify-fail, review-fail, merge-fail
```

---

### 4. Template Files (`.claudeban/kanban-templates/`)

#### `config.yaml` - UPDATE command references

```yaml
# BEFORE
commands:
  "kanban:define-task":
    skills: []
  "kanban:backlog-refine-task":
    skills: []
  "kanban:refined-scope-task":
    skills: []
  "kanban:scoped-plan-task":
    skills: []
  "kanban:planned-implement-task":
    skills: []
  "kanban:in-progress-wip-commit":
    skills: []
  "kanban:in-progress-verify-task":
    skills: []
  "kanban:verify-pass-task":
    skills: []
  "kanban:verify-fail-task":
    skills: []
  "kanban:review-pass-task":
    skills: []
  "kanban:review-fail-task":
    skills: []
  "kanban:update-docs-complete-task":
    skills: []

# AFTER
commands:
  "kanban:create":
    skills: []
  "kanban:refine":
    skills: []
  "kanban:scope":
    skills: []
  "kanban:plan":
    skills: []
  "kanban:implement":
    skills: []
  "kanban:save":
    skills: []
  "kanban:verify":
    skills: []
  "kanban:approve":
    skills: []
  "kanban:docs":
    skills: []
  "kanban:rework":
    skills: []
```

#### Other templates - NO CHANGES NEEDED

- `task.md` - Status values are IDs, not display names
- `spec.md` - No command references
- `plan.md` - No command references
- `product-doc.md` - No command references

---

### 5. Documentation Files

#### `GUIDE.md` - FULL REWRITE

Update all sections:
- Command examples (use new names)
- Workflow diagram (use new column names)
- Quick reference table
- Step-by-step walkthrough
- Failure handling section (describe `rework` command, auto-retry for verify)

#### `README.md` - UPDATE

Update any command examples to use new names.

---

### 6. Example Project (`example-project/`)

#### `.kanban/config.yaml` - UPDATE command references

Same changes as the template `config.yaml`.

---

### 7. Skill Content Updates

Each renamed skill file needs these updates in its `SKILL.md`:

1. **Frontmatter `name:`** - Update to new name (e.g., `kanban-create`)
2. **Column references** - Update any mentions of:
   - `verify` → `checks`
   - `review` → `qa`
   - `awaiting-merge` → `pr`
3. **"Next:" output blocks** - Update command names:
   ```markdown
   # BEFORE
   Next:
   /clear
   /kanban:backlog-refine-task {id}

   # AFTER
   Next:
   /clear
   /kanban:refine {id}
   ```
4. **Example sections** - Update command names in examples
5. **Validation sections** - Update any command name references

---

### 8. Special Case: `kanban-verify/SKILL.md`

This skill requires significant logic changes:

#### Current Behavior
1. Run checks
2. If fail: commit failure, print "fix and re-run"
3. If pass: ask user to continue, print "Next: /kanban:verify-pass-task"

#### New Behavior
1. Run checks
2. If fail:
   - Log attempt to task card
   - AI analyzes the failure
   - AI attempts to fix the issues
   - Re-run checks (loop back to step 1)
   - Maximum 3 retry attempts before asking user
3. If pass:
   - Update task status to `checks`
   - Auto-advance: Update task status to `qa`
   - Print "All checks passed. Task moved to QA."
   - Print "Next: /kanban:approve {id}"

#### Key Changes
- Remove reference to `verify-pass-task` and `verify-fail-task`
- Add retry loop logic
- Add auto-advance logic
- Log all attempts to plan file under `## Iterations`

---

### 9. New Skill: `kanban-rework/SKILL.md`

Create new skill with:

```markdown
---
name: kanban-rework
description: Return task to In Progress for fixes. Works from QA or PR columns.
allowed-tools: Read, Write, Bash(git *)
---

# Rework Kanban Task

Return a task to In Progress when human review finds issues.

## Valid From Columns
- `qa` (QA)
- `pr` (PR)

## Steps
1. Get task ID from $ARGUMENTS
2. Read task file, verify status is `qa` or `pr`
3. Ask user: "What needs to be fixed?"
4. Log reason to plan file under `## Iterations`
5. Update task status to `in-progress`
6. Commit with format: `docs({id}): rework - {title}`
7. Print "Next: /kanban:implement {id}" or appropriate command

## Commit
**Format:** `docs({id}): rework - {title}`
```

---

### 10. Cross-Reference Checklist

After all changes, verify these references are updated:

- [ ] All `"Next:"` blocks in skill files use new command names
- [ ] All column ID references use new IDs (`checks`, `qa`, `pr`)
- [ ] All commit format references in skills match workflow.yaml
- [ ] Config template lists all new commands, no old commands
- [ ] GUIDE.md uses new command names throughout
- [ ] Status command suggests new command names
- [ ] Init command's "Next:" uses new command name

---

## Implementation Order

Execute in this order to avoid broken references:

### Step 1: Update Workflow Schema
Update `.claudeban/kanban-workflow.yaml` first since all other files reference it.

### Step 2: Create New Files
1. Create `kanban-rework/SKILL.md`
2. Create `rework.md` command

### Step 3: Rename and Update Skills (in workflow order)
1. `kanban-create/` (from kanban-define-task)
2. `kanban-refine/` (from kanban-backlog-refine-task)
3. `kanban-scope/` (from kanban-refined-scope-task)
4. `kanban-plan/` (from kanban-scoped-plan-task)
5. `kanban-implement/` (from kanban-planned-implement-task)
6. `kanban-save/` (from kanban-in-progress-wip-commit)
7. `kanban-verify/` (from kanban-in-progress-verify-task) - **major rewrite**
8. `kanban-approve/` (from kanban-review-pass-task)
9. `kanban-docs/` (from kanban-update-docs-complete-task)
10. `kanban-merge/` (from kanban-awaiting-merge-merge-task)

### Step 4: Rename and Update Commands
Same order as skills above.

### Step 5: Update Utility Skills/Commands
1. `kanban-init/` - update "Next:" references
2. `kanban-status/` - update command suggestions

### Step 6: Delete Old Files
1. Delete old skill directories
2. Delete old command files

### Step 7: Update Templates
1. Update `.claudeban/kanban-templates/config.yaml`

### Step 8: Update Documentation
1. Rewrite `GUIDE.md`
2. Update `README.md`

### Step 9: Update Example Project
1. Update `example-project/.kanban/config.yaml`

### Step 10: Final Verification
1. Run through happy path manually
2. Test rework from QA
3. Test rework from PR
4. Test verify auto-retry
5. Verify all "Next:" suggestions are correct

---

## String Replacements Reference

When updating files, make these global replacements:

### Command Name Replacements
| Find | Replace With |
|------|--------------|
| `kanban:define-task` | `kanban:create` |
| `kanban:backlog-refine-task` | `kanban:refine` |
| `kanban:refined-scope-task` | `kanban:scope` |
| `kanban:scoped-plan-task` | `kanban:plan` |
| `kanban:planned-implement-task` | `kanban:implement` |
| `kanban:in-progress-wip-commit` | `kanban:save` |
| `kanban:in-progress-verify-task` | `kanban:verify` |
| `kanban:verify-pass-task` | *(remove - no replacement)* |
| `kanban:verify-fail-task` | *(remove - no replacement)* |
| `kanban:review-pass-task` | `kanban:approve` |
| `kanban:review-fail-task` | `kanban:rework` |
| `kanban:update-docs-complete-task` | `kanban:docs` |
| `kanban:awaiting-merge-merge-task` | `kanban:merge` |
| `kanban:awaiting-merge-fail-task` | `kanban:rework` |

### Column ID Replacements
| Find | Replace With |
|------|--------------|
| `status: verify` | `status: checks` |
| `status: review` | `status: qa` |
| `status: awaiting-merge` | `status: pr` |
| `id: verify` | `id: checks` |
| `id: review` | `id: qa` |
| `id: awaiting-merge` | `id: pr` |

### Skill Name Replacements (in frontmatter)
| Find | Replace With |
|------|--------------|
| `name: kanban-define-task` | `name: kanban-create` |
| `name: kanban-backlog-refine-task` | `name: kanban-refine` |
| `name: kanban-refined-scope-task` | `name: kanban-scope` |
| `name: kanban-scoped-plan-task` | `name: kanban-plan` |
| `name: kanban-planned-implement-task` | `name: kanban-implement` |
| `name: kanban-in-progress-wip-commit` | `name: kanban-save` |
| `name: kanban-in-progress-verify-task` | `name: kanban-verify` |
| `name: kanban-review-pass-task` | `name: kanban-approve` |
| `name: kanban-update-docs-complete-task` | `name: kanban-docs` |
| `name: kanban-awaiting-merge-merge-task` | `name: kanban-merge` |

---

## Validation Checklist

After implementation, verify:

### Commands Exist
- [ ] `.claudeban/commands/kanban/create.md`
- [ ] `.claudeban/commands/kanban/refine.md`
- [ ] `.claudeban/commands/kanban/scope.md`
- [ ] `.claudeban/commands/kanban/plan.md`
- [ ] `.claudeban/commands/kanban/implement.md`
- [ ] `.claudeban/commands/kanban/save.md`
- [ ] `.claudeban/commands/kanban/verify.md`
- [ ] `.claudeban/commands/kanban/approve.md`
- [ ] `.claudeban/commands/kanban/docs.md`
- [ ] `.claudeban/commands/kanban/merge.md`
- [ ] `.claudeban/commands/kanban/rework.md`
- [ ] `.claudeban/commands/kanban/init.md`
- [ ] `.claudeban/commands/kanban/status.md`

### Skills Exist
- [ ] `.claudeban/skills/kanban-create/SKILL.md`
- [ ] `.claudeban/skills/kanban-refine/SKILL.md`
- [ ] `.claudeban/skills/kanban-scope/SKILL.md`
- [ ] `.claudeban/skills/kanban-plan/SKILL.md`
- [ ] `.claudeban/skills/kanban-implement/SKILL.md`
- [ ] `.claudeban/skills/kanban-save/SKILL.md`
- [ ] `.claudeban/skills/kanban-verify/SKILL.md`
- [ ] `.claudeban/skills/kanban-approve/SKILL.md`
- [ ] `.claudeban/skills/kanban-docs/SKILL.md`
- [ ] `.claudeban/skills/kanban-merge/SKILL.md`
- [ ] `.claudeban/skills/kanban-rework/SKILL.md`
- [ ] `.claudeban/skills/kanban-init/SKILL.md`
- [ ] `.claudeban/skills/kanban-status/SKILL.md`

### Old Files Removed
- [ ] No `define-task.md` in commands
- [ ] No `backlog-refine-task.md` in commands
- [ ] No `refined-scope-task.md` in commands
- [ ] No `scoped-plan-task.md` in commands
- [ ] No `planned-implement-task.md` in commands
- [ ] No `in-progress-wip-commit.md` in commands
- [ ] No `in-progress-verify-task.md` in commands
- [ ] No `verify-pass-task.md` in commands
- [ ] No `verify-fail-task.md` in commands
- [ ] No `review-pass-task.md` in commands
- [ ] No `review-fail-task.md` in commands
- [ ] No `update-docs-complete-task.md` in commands
- [ ] No `awaiting-merge-merge-task.md` in commands
- [ ] No `awaiting-merge-fail-task.md` in commands
- [ ] No `kanban-define-task/` in skills
- [ ] No `kanban-backlog-refine-task/` in skills
- [ ] No `kanban-refined-scope-task/` in skills
- [ ] No `kanban-scoped-plan-task/` in skills
- [ ] No `kanban-planned-implement-task/` in skills
- [ ] No `kanban-in-progress-wip-commit/` in skills
- [ ] No `kanban-in-progress-verify-task/` in skills
- [ ] No `kanban-verify-pass-task/` in skills
- [ ] No `kanban-verify-fail-task/` in skills
- [ ] No `kanban-review-pass-task/` in skills
- [ ] No `kanban-review-fail-task/` in skills
- [ ] No `kanban-update-docs-complete-task/` in skills
- [ ] No `kanban-awaiting-merge-merge-task/` in skills
- [ ] No `kanban-awaiting-merge-fail-task/` in skills

### Workflow Schema Updated
- [ ] Column `checks` exists (not `verify`)
- [ ] Column `qa` exists (not `review`)
- [ ] Column `pr` exists (not `awaiting-merge`)
- [ ] Transitions updated for new column IDs
- [ ] Commit formats updated

### No Stale References
- [ ] `grep -r "kanban:define-task" .claudeban/` returns nothing
- [ ] `grep -r "kanban:backlog-refine-task" .claudeban/` returns nothing
- [ ] `grep -r "kanban:verify-pass-task" .claudeban/` returns nothing
- [ ] `grep -r "kanban:verify-fail-task" .claudeban/` returns nothing
- [ ] `grep -r "kanban:review-fail-task" .claudeban/` returns nothing
- [ ] `grep -r "status: verify" .claudeban/` returns nothing (except workflow.yaml history comments)
- [ ] `grep -r "status: review" .claudeban/` returns nothing
- [ ] `grep -r "status: awaiting-merge" .claudeban/` returns nothing
