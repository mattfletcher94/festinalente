# Workflow Consolidation Plan

## Status: Ready for Implementation

This document tracks the planning and implementation of consolidating the festina/kanban workflow from a 4-step post-implementation process to a 2-step process.

---

## Current State Analysis

### Existing Workflow (Post-Implementation)

```
implement → check → docs → merge → DONE
     │         │       │       │
     │         │       │       └─ Create PR, wait for approval, merge (github directive)
     │         │       └─ Update product/engineering docs, push branch
     │         └─ Run validations, QA approval, commit code
     └─ Execute plan steps, leave code uncommitted
```

### Current Column Progression
```
PLANNED → IN-PROGRESS → CHECK → UPDATE-DOCS → PR → DONE
```

### What Each Skill Currently Does

| Skill | Input State | Key Actions | Output State | Commits |
|-------|-------------|-------------|--------------|---------|
| `festina-implement` | planned | Execute plan tasks, run per-task verification | in-progress → check | None (code uncommitted) |
| `festina-check` | check | Run directive checks, verify requirements, prompt QA, auto-fix loop | update-docs | Yes: `feat/fix/refactor({id}): {title}` |
| `festina-docs` | update-docs | Update product/eng docs, push branch | pr | Yes: `docs({id}): product - {desc}` |
| `festina-merge` | pr | Create PR, check approval status, merge when approved | done | Yes: `docs({id}): done - {title}` |

### Key Files
- **Skills:** `.claude/skills/kanban-*/SKILL.md` (also `.claude/skills/festina-*/SKILL.md`)
- **Config:** `.festinalente/config.yaml` - maps directives to skills
- **Directives:** `.festinalente/directives/*.xml` - especially `github.xml` for PR workflow
- **Workflow:** `.kanban/workflow.yaml` - column definitions and transitions

---

## Proposed Change

### User's Core Insight
> "The check→merge boundary is artificial - they're really one continuous 'finalize the work' phase"

### Proposed New Workflow
```
implement → finalize → DONE
     │          │
     │          └─ Validate → Commit → Docs → Commit → PR → Merge
     └─ Execute plan steps, leave code UNCOMMITTED
```

### Proposed Column Progression
```
PLANNED → IN-PROGRESS → FINALIZE → DONE
```

**Columns removed:** `CHECK`, `UPDATE-DOCS`, `PR`
**Column renamed/added:** `FINALIZE` (task is ready for `/festina-finalize`)

| After this skill... | Task status becomes |
|---------------------|---------------------|
| festina-implement | `finalize` |
| festina-finalize | `done` |

---

## Open Questions (Socratic Discovery)

### Q1: When Should Code Be Committed?

**Current:** Code is committed in `festina-check` after QA approval.

**REVISED DECISION:** Code committed in `festina-finalize` Phase 1, AFTER directive checks pass.

**Constraint identified:** User does NOT want code committed before directive checks (build, lint, types) pass. But also doesn't want to bloat `implement` with check logic.

**Solution:**
- `implement` stays as-is: execute plan, verify spec, leave code **uncommitted**
- `festina-finalize` Phase 1: run directive checks → auto-fix if needed → commit

**Flow:**
```
implement (code uncommitted)
    ↓
festina-finalize Phase 1:
    ├─ Run directive checks (coding.xml validations)
    ├─ If fails: auto-fix loop
    ├─ Prompt: "Checks passed. Ready to commit?"
    └─ If Yes: commit with feat/fix/refactor({id}): {title}
```

**Implications:**
- `implement` stays lean (no check logic)
- Nothing commits until checks pass (safety guarantee preserved)
- Single "finalize" command handles everything post-implement

---

### Q2: Where Does the QA Step Go?

**Current:** QA happens in `festina-check` after automated checks pass.

**Options:**
1. **QA before PR** - User tests locally, approves, then PR is created
2. **QA during PR review** - PR serves as the QA trigger, user reviews in PR context
3. **QA is implicit** - Automated checks are sufficient; PR review replaces manual QA

**Considerations:**
- PR review provides a natural "pause and test" moment
- Some users may want to QA before exposing to team
- Automated checks catch most issues; human QA catches UX issues

**Decision:** User handles QA themselves. The LLM ignores QA; user tests before running `/festina-finalize` if they want.

---

### Q3: What Validation Checks Run When?

**Current `festina-check` responsibilities:**
- Run directive-configured automated checks (build, lint, type checks)
- Pattern scanning for code violations
- Requirements verification (trace spec to implementation)
- Human QA prompt
- Auto-fix loop with user approval
- Commit code

**For the new `festina-finalize`:**
- Which checks MUST pass before creating a PR?
- Which checks can be deferred to CI?
- Which checks happen during PR review?

**Decision:** This is up to the user's directive configuration. User defines what validation checks run in their `coding.xml` or equivalent.

---

### Q4: Should `festina-merge` Be Renamed to `festina-pr`?

**Arguments for `festina-pr`:**
- More accurately describes what happens: PR creation, review, merge
- "Merge" implies immediate action; PR is a process
- Consistent with GitHub-centric workflow

**Arguments against:**
- `merge` describes the end goal, which is clearer for the user
- "PR" is jargon (though widely understood)
- Breaking change for existing users/scripts

**Decision:** The skill will be named `festina-finalize`. It describes the action: finalize the work.

---

### Q5: What Happens If Checks Fail During `festina-finalize`?

**Options:**
1. **Block PR creation** - No PR until all checks pass
2. **Create draft PR** - PR exists but marked as draft/blocked
3. **Create PR anyway** - Let CI report failures in PR context
4. **Return to implement** - Like current rework flow

**Considerations:**
- CI will run checks anyway on PR
- Blocking locally saves time (fail fast)
- Draft PRs can be useful for "WIP - needs CI fixes"

**Decision:** Ask the user. When checks fail, prompt user with options: Fix? / Skip? / Abort?

---

### Q6: How Does `festina-docs` Fit in the New Flow?

**User's suggestion:** docs comes after implement, before pr.

**Current flow:** implement → check → docs → merge
**Proposed flow:** implement → docs → pr

**Questions:**
- Should docs be REQUIRED before PR, or optional?
- What if implementation has no user-facing changes?
- Should docs be part of PR, or committed before?

**Decision:** Docs run as part of finalize (Phase 2), before PR/merge. If no docs needed (internal change), skip the doc phase.

---

## Architecture: Reference-Based Skill Design

### Confirmed by Official Docs

From [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills):

> **Keep `SKILL.md` under 500 lines. Move detailed reference material to separate files.**
>
> Reference supporting files from `SKILL.md` so Claude knows what each file contains and when to load them. This keeps SKILL.md focused on the essentials while letting Claude access detailed reference material only when needed.

### The Pattern
Instead of embedding all guidance in one massive skill, the main skill acts as an **orchestrator** that loads reference files on-demand at each phase.

### Proposed Structure

**Source location:** `apps/festinalente/src/content/skills/` (builds to `.claude/skills/`, `.opencode/skills/`, `dist/skills/`)

```
apps/festinalente/src/content/skills/festina-finalize/
├── SKILL.md                    # Lean orchestrator (~400 lines)
├── checks.md                   # Phase 1: How to run directive checks, auto-fix patterns
├── docs-product.md             # Phase 2: Product doc templates, frontmatter, mermaid
└── docs-engineering.md         # Phase 2: Engineering doc templates
```

**Note:** Phase 3 (complete) behavior comes from user's directives, not skill reference files. The skill provides a default (local merge), directives can override.

### Pattern Compliance

**SKILL.md MUST follow existing skill patterns:**

- `<step name="...">` NOT `<phase>` (phases are conceptual, not XML tags)
- Handlebars partials: `{{> directory-reference}}`, `{{> helper-scripts}}`, `{{> workflow-load}}`, `{{> branch-verify-task}}`, `{{> load-directives}}`, `{{> directive-compliance}}`, `{{> skill-complete}}`
- Step elements: `<action>`, `<command>`, `<branch condition="...">`, `<validate>`, `<note>`, `<output>`
- AskUserQuestion format: header, question, options (label + description), multiSelect

**The ONLY new pattern introduced:**
```xml
<action>Read checks.md for detailed check execution guidance</action>
```
This tells the LLM to load a reference file when needed. Everything else follows existing conventions.

### SKILL.md Skeleton

```xml
---
name: festina-finalize
description: Validate, commit, document, and complete a task.
allowed-tools: Read, Write, Bash(*), Grep, AskUserQuestion
argument-hint: "[task-id]"
disable-model-invocation: true
---

# Finalize Festina Lente Task

<purpose>
Run directive checks, commit implementation, update docs, and complete the task.
</purpose>

<context>
{{> directory-reference}}
{{> helper-scripts show_find_task=true show_find_plan=true show_get_date_time=true show_get_skill_config=true}}
{{> column-transition from="finalize" to="done"}}
</context>

<prohibited>
- Do not commit code that fails directive checks without user approval
- Do not skip documentation analysis
- Do not merge with dirty working tree
</prohibited>

<process>
  <step name="load_workflow">
    {{> workflow-load}}
  </step>

  <step name="get_task_id" outputs="taskId">
    <!-- Same pattern as other skills -->
  </step>

  <step name="read_task_file">
    <!-- Same pattern -->
  </step>

  <step name="verify_branch">
    {{> branch-verify-task}}
  </step>

  <step name="load_directives">
    {{> load-directives skill="finalize"}}
  </step>

  <step name="detect_resume_state">
    <note>Check what's already been done (for resumability)</note>
    <command>git log --oneline -1</command>
    <action>Check if last commit matches patterns:</action>
    <branch condition="last commit is 'docs({id}): done'">
      <output>Task already complete!</output>
      <action>Exit</action>
    </branch>
    <branch condition="last commit is 'docs({id}): product/engineering'">
      <note>Docs committed, skip to Phase 3</note>
      <action>Set resumeFrom = "phase3"</action>
    </branch>
    <branch condition="last commit is '{type}({id}): {title}'">
      <note>Implementation committed, skip to Phase 2</note>
      <action>Set resumeFrom = "phase2"</action>
    </branch>
    <branch condition="else">
      <action>Set resumeFrom = "phase1"</action>
    </branch>
  </step>

  <!-- PHASE 1: VALIDATE (skip if resumeFrom > phase1) -->
  <step name="verify_plan_completion">
    <action>Read checks.md for detailed guidance</action>
    <command>node .festinalente/scripts/find-plan.cjs {taskId}</command>
    <action>Read plan.xml, verify all tasks have completed="true"</action>
    <branch condition="incomplete tasks exist">
      <action>Prompt user: proceed anyway or cancel?</action>
    </branch>
  </step>

  <step name="run_checks">
    <action>Read checks.md for check execution and auto-fix loop</action>
    <action>Run <validation> checks from loaded directives</action>
    <branch condition="check fails">
      <action>Ask user: Fix? / Skip? / Abort?</action>
      <action>If Fix: make changes, log to plan.xml iterations, restart checks</action>
    </branch>
  </step>

  <step name="check_uncommitted_changes">
    <action>Read checks.md for guidance</action>
    <command>git status</command>
    <command>git diff --name-only</command>
    <output>Display files that will be committed</output>
    <branch condition="no changes found">
      <action>Warn user, prompt to proceed or cancel</action>
    </branch>
  </step>

  <step name="commit_implementation">
    <action>Read checks.md for commit type determination</action>
    <action>Determine commit type from labels (feat/fix/refactor/docs)</action>
    <command>git add {implementation files}</command>
    <command>git add .festinalente/</command>
    <command>git commit -m "{type}({taskId}): {title}"</command>
  </step>

  <!-- PHASE 2: DOCUMENT -->
  <step name="analyze_doc_impact">
    <action>Check affects/engineering fields in task</action>
    <branch condition="product docs needed">
      <action>Read docs-product.md for detailed guidance</action>
      <action>Includes: analyze impact, load smart context, update/complete/create docs</action>
      <action>Includes: update domain _index.md, update glossary, validate docs</action>
    </branch>
    <branch condition="engineering docs needed">
      <action>Read docs-engineering.md for detailed guidance</action>
      <action>Includes: analyze impact, load smart context, update/complete/create docs</action>
      <action>Includes: update engineering _index.md</action>
    </branch>
    <branch condition="no docs needed">
      <output>No documentation updates needed (internal change)</output>
    </branch>
  </step>

  <step name="commit_docs" when="docs were created or updated">
    <command>git add .festinalente/product/</command>
    <command>git add .festinalente/engineering/</command>
    <command>git add .festinalente/glossary.yaml</command>
    <branch condition="both product and engineering">
      <command>git commit -m "docs({taskId}): product+engineering - {description}"</command>
    </branch>
    <branch condition="only product">
      <command>git commit -m "docs({taskId}): product - {description}"</command>
    </branch>
    <branch condition="only engineering">
      <command>git commit -m "docs({taskId}): engineering - {description}"</command>
    </branch>
  </step>

  <!-- PHASE 3: COMPLETE -->
  <step name="check_already_pushed">
    <command>git log origin/task/{taskId}..HEAD --oneline 2>/dev/null</command>
    <branch condition="no new commits (already pushed)">
      <note>Resuming - skip to merge confirmation</note>
      <action>Go to prompt_merge_confirmation</action>
    </branch>
    <branch condition="has new commits OR remote doesn't exist">
      <command>git push -u origin task/{taskId}</command>
    </branch>
  </step>

  <step name="verify_ready_to_merge">
    <command>git log main..HEAD --oneline</command>
    <output>Show commits to be merged</output>
  </step>

  <step name="prompt_merge_confirmation">
    <note>DEFAULT behavior. Directives can override (e.g., github.xml skips this, uses PR approval instead)</note>
    <action>Use AskUserQuestion tool with:
      - header: "Merge?"
      - question: "Ready to merge this branch into main?"
      - options:
        - label: "Yes", description: "Merge branch task/{taskId} into main"
        - label: "No", description: "Cancel - I'll merge later"
      - multiSelect: false
    </action>
    <branch condition="user selects No">
      <output>Branch pushed. Run /festina-finalize {taskId} again when ready to merge.</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="complete_task">
    <command>git checkout main</command>
    <command>git merge task/{taskId} --no-ff</command>
    <command>git branch -d task/{taskId}</command>
    <action>Update task status to done, add completed date</action>
    <action>Commit: docs({taskId}): done - {title}</action>
  </step>

  {{> directive-compliance}}

  <step name="output_result">
    <output>Task {taskId} completed!</output>
    {{> skill-complete}}
  </step>
</process>
```

### Reference Files

Reference files contain detailed guidance that would bloat SKILL.md. They are plain markdown (no Handlebars) and loaded on-demand.

**CRITICAL: These files MUST preserve ALL behaviors from the merged skills.**

---

#### checks.md (~200 lines)

**Source:** Extracted from `festina-check/SKILL.md` steps: `read_plan_file`, `run_checks`, `check_uncommitted_changes`, `determine_commit_type`

**MUST include:**

1. **Verify plan completion** (from `read_plan_file`)
   - Read plan.xml via `find-plan.cjs`
   - Verify all implementation tasks have `completed="true"`
   - If incomplete tasks exist: prompt user to proceed or cancel

2. **Check execution by type** (from `run_checks`)
   - `type="command"`: Execute `<run>` element, check exit code
   - `type="pattern"`: Scan files matching glob for forbidden/required patterns
   - `type="checklist"`: Review code against checklist items
   - Print PASS/FAIL for each check

3. **Auto-fix loop** (from `run_checks`)
   - On failure: prompt "Fix? / Skip? / Abort?"
   - If Fix: analyze issues, make code changes
   - **Log fix to plan.xml iterations:**
     ```xml
     <iteration phase="finalize" date="{YYYY-MM-DD}">
       <fix directive="{name}">{description of fix}</fix>
     </iteration>
     ```
   - Commit fix: `docs({taskId}): check-retry - {title}`
   - Restart ALL checks from beginning after fix

4. **Check uncommitted changes** (from `check_uncommitted_changes`)
   - Run `git status` and `git diff --name-only`
   - Display files that will be committed
   - If NO changes found: warn user and prompt to proceed or cancel

5. **Determine commit type** (from `determine_commit_type`)
   - Check task labels array
   - `bug` → `fix`
   - `refactor` → `refactor`
   - `docs` → `docs`
   - `feature` or default → `feat`

---

#### docs-product.md (~350 lines)

**Source:** Extracted from `festina-docs/SKILL.md` steps: `analyze_product_doc_impact`, `load_smart_context`, `update_existing_docs`, `complete_stub_docs`, `create_new_docs`, `handle_internal_changes`, `update_domain_index`, `update_glossary`, `validate_docs`

**MUST include:**

1. **Analyze product doc impact** (from `analyze_product_doc_impact`)
   - Read task's `affects` element
   - Run `check-product.cjs {affects IDs}`
   - Categorize into: stubDocs, existingDocs, missingDocs
   - Search for unlisted impacts via `search-product.cjs`
   - Present analysis to user with AskUserQuestion

2. **Load smart context** (from `load_smart_context`)
   - Run `select-context.cjs {taskId} --tier=standard --max=3 --type=product`
   - Parse JSON output
   - Note structure and quality patterns from similar docs
   - Use as reference when writing new docs

3. **Update existing docs** (from `update_existing_docs`)
   - Read current doc at `.festinalente/product/{id}.md`
   - Make minimal, focused updates (don't rewrite entire doc)
   - Verification prompt: "Does this doc accurately reflect the implementation?"
   - If Yes: update `verified: {date}` and `code_refs`
   - If Needs correction: get details, fix, re-verify
   - Update diagrams if architecture/data flow/UI changed

4. **Complete stub docs** (from `complete_stub_docs`)
   - Remove `stub: true` and `task:` from frontmatter
   - **Required frontmatter fields:**
     - `tldr:` Single sentence, max 100 chars
     - `summary:` One sentence for LLM discovery
     - `keywords:` 3-5 search terms
     - `aliases:` Alternative names
     - `boundary:` What this does NOT cover
     - `updated:` Current date
     - `verified:` Current date
     - `code_refs:` Files touched by this task
   - **Required content sections:**
     - TL;DR blockquote at top
     - Overview with summary
     - How It Works with key workflows
     - Examples with code snippets from implementation
     - Boundaries listing what it does NOT do
   - **Diagram completion:**
     - Review code flow for sequence/flowchart diagrams
     - Check for UI components → ASCII mockups
     - Trace data flow → data flow diagrams
     - If database models exist → erDiagram

5. **Create new docs** (from `create_new_docs`)
   - Create domain folder if needed: `.festinalente/product/{domain}/`
   - Use templates: `product-feature.md` or `product-concept.md`
   - Fill ALL frontmatter fields (same as stub completion)
   - Keep scope focused on THIS feature/concept only

6. **Handle internal changes** (from `handle_internal_changes`)
   - If `affects` is empty AND labels include [bug, refactor, chore]
   - Analyze if any product behavior actually changed
   - If no user-facing changes: skip with message "No product doc updates needed"

7. **Update domain index** (from `update_domain_index`)
   - Check if `.festinalente/product/{domain}/_index.md` exists
   - If exists: add new doc to appropriate section with one-line description (from tldr)
   - If multiple docs now exist but no _index.md: consider creating one

8. **Update glossary** (from `update_glossary`)
   - Identify new terms introduced by this feature
   - Check if terms exist in `.festinalente/glossary.yaml`
   - If new terms found, add entries with:
     - `term:` The canonical name
     - `aliases:` Alternative names/spellings
     - `definition:` Brief explanation
   - Output: "Added to glossary: {terms}"

9. **Validate docs** (from `validate_docs`)
   - Run `validate-docs.cjs {changed doc paths}`
   - If passes: output "Quality check passed"
   - If fails: output issues, fix them, re-run validation

---

#### docs-engineering.md (~250 lines)

**Source:** Extracted from `festina-docs/SKILL.md` steps: `analyze_engineering_doc_impact`, `load_smart_context`, `complete_stub_engineering_docs`, `update_engineering_docs`, `create_new_engineering_docs`, `update_engineering_index`

**MUST include:**

1. **Analyze engineering doc impact** (from `analyze_engineering_doc_impact`)
   - Read task's `engineering` element
   - Run `check-engineering.cjs {engineering IDs}`
   - Categorize into: engStubDocs, engExistingDocs, engMissingDocs
   - Search for unlisted impacts via `search-engineering.cjs`
   - Present analysis to user with AskUserQuestion

2. **Load smart context** (from `load_smart_context`)
   - Run `select-context.cjs {taskId} --tier=standard --max=3 --type=engineering`
   - Note engineering doc structure patterns
   - Use as reference when writing new docs

3. **Complete stub engineering docs** (from `complete_stub_engineering_docs`)
   - Remove `stub: true` and `task:` from frontmatter
   - **Required frontmatter fields:** (same as product docs)
   - **Required content sections by type:**
     - **system:** Overview, Architecture, Components, Data Flow, Integration, Boundaries
     - **pattern:** Overview, Problem, Solution, When to Use, Implementation, Examples, Boundaries
     - **convention:** Overview, Rule, Rationale, Examples, Exceptions, Boundaries
   - **Diagram completion by type:**
     - **system:** Architecture diagram, Data Flow diagram
     - **pattern:** Structure diagram (classDiagram)
     - **convention:** ASCII diagrams showing correct vs incorrect

4. **Update engineering docs** (from `update_engineering_docs`)
   - Read current doc (use ID→path rules from check-engineering)
   - Identify sections needing changes based on implementation
   - Make minimal, focused updates
   - SCOPE RESTRICTION: Only update what THIS task implemented

5. **Create new engineering docs** (from `create_new_engineering_docs`)
   - Determine doc type: system, pattern, or convention
   - Use AskUserQuestion to confirm type if unclear
   - Create folder if needed: `.festinalente/engineering/{type}s/`
   - Use templates: `engineering-system.md`, `engineering-pattern.md`, `engineering-convention.md`
   - Fill ALL frontmatter fields
   - Keep scope focused on THIS system/pattern/convention only

6. **Update engineering index** (from `update_engineering_index`)
   - Check if `.festinalente/engineering/{type}s/_index.md` exists
   - If exists: add new doc to appropriate section with one-line description
   - If multiple docs now exist but no _index.md: consider creating one

### How It Works

The main SKILL.md contains:
1. Context/prohibited sections (shared)
2. High-level process flow with phases
3. Markdown links to reference files with descriptions of when to load them

**From SKILL.md (at the end):**
```markdown
## Reference Files

Load these as needed during each phase:

- **[checks.md](checks.md)** - Load in Phase 1: Contains plan verification, check execution by type, auto-fix loop with iteration logging, uncommitted changes check, and commit type determination
- **[docs-product.md](docs-product.md)** - Load in Phase 2 if product docs needed: Contains impact analysis, smart context loading, doc update/complete/create flows, domain index updates, glossary updates, and validation
- **[docs-engineering.md](docs-engineering.md)** - Load in Phase 2 if engineering docs needed: Contains impact analysis, smart context loading, type-specific sections (system/pattern/convention), and engineering index updates
```

### Size Estimates

| Component | Lines | When Loaded |
|-----------|-------|-------------|
| SKILL.md (orchestrator) | ~400 | Always |
| checks.md | ~200 | Phase 1 |
| docs-product.md | ~350 | Phase 2 (if product docs needed) |
| docs-engineering.md | ~250 | Phase 2 (if engineering docs needed) |

**Max context at any phase:** ~600-750 lines (orchestrator + one ref)

### Benefits
- **Single command:** `/festina-finalize` does everything post-implement
- **Context stays manageable:** Only loads relevant reference per phase
- **Reference files updateable independently:** Change docs guidance without touching orchestrator
- **Docs reference only loaded when needed:** Internal refactors skip Phase 2 entirely
- **Matches existing pattern:** Skills already load directives on-demand
- **Two-command workflow:** Just `implement` then `finalize`

### Directive Handling Strategy

**Directives are user-defined.** The skill loads whatever directives the user configures - it does NOT hardcode specific directives like `github.xml`.

**Example user config:**
```yaml
festina-finalize: [coding]           # User without GitHub
festina-finalize: [coding, github]   # User with GitHub integration
festina-finalize: [coding, gitlab]   # User with GitLab integration
```

**How it works:**
1. Skill reads config to get directive list for `festina-finalize`
2. At start of each phase, load ALL configured directives
3. Apply `<process>` rules matching the current phase
4. Apply `<override>` sections that skip/replace default behavior
5. Run `<validation>` checks from directives

**Default behavior (no directives):**
- Phase 1: No automated checks, just commit
- Phase 2: Update docs based on reference files
- Phase 3: Local git merge to main, cleanup branch

**With directives (user-defined):**
- `coding.xml` adds validation checks to Phase 1
- `github.xml` overrides Phase 3 with PR workflow
- Any directive can add/override behavior

**Cleanup required:**
- Delete `festina-check` skill (merged into finalize)
- Delete `festina-docs` skill (merged into finalize)
- Delete `festina-merge` skill (replaced by finalize)
- Update config to remove old skill directive mappings

### Flow Visualization

```
/festina-finalize 001
    │
    │   [Code is UNCOMMITTED at this point]
    │
    ├─► Phase 1: VALIDATE (load checks.md)
    │   │
    │   ├─ Verify plan completion
    │   │   └─ Check all plan tasks have completed="true"
    │   │
    │   ├─ Load configured directives
    │   │
    │   ├─ Run <validation> checks from directives
    │   │   ├─ For each check: PASS or FAIL
    │   │   └─ If FAIL: Ask "Fix? / Skip? / Abort?"
    │   │       ├─ Fix: make changes, log to plan.xml, commit retry, RESTART all checks
    │   │       ├─ Skip: continue to next check
    │   │       └─ Abort: exit skill
    │   │
    │   ├─ Check uncommitted changes
    │   │   └─ If none: warn user, prompt to proceed
    │   │
    │   ├─ Determine commit type from labels
    │   │   └─ bug→fix, refactor→refactor, docs→docs, default→feat
    │   │
    │   └─ Commit: {type}(001): {title}
    │
    │   [Implementation is now COMMITTED]
    │
    ├─► Phase 2: DOCUMENT (load docs-product.md / docs-engineering.md)
    │   │
    │   ├─ Analyze doc impact
    │   │   ├─ Check affects field → product docs
    │   │   ├─ Check engineering field → engineering docs
    │   │   └─ If neither: skip (internal change)
    │   │
    │   ├─ Load smart context (select-context.cjs)
    │   │   └─ Find similar docs as quality reference
    │   │
    │   ├─ Update/Complete/Create docs
    │   │   ├─ Existing docs: minimal updates, verify with user
    │   │   ├─ Stub docs: fill frontmatter + content + diagrams
    │   │   └─ New docs: use templates, fill all fields
    │   │
    │   ├─ Update indexes
    │   │   ├─ Domain _index.md for product docs
    │   │   └─ Type _index.md for engineering docs
    │   │
    │   ├─ Update glossary (if new terms)
    │   │
    │   ├─ Validate docs (validate-docs.cjs)
    │   │
    │   └─ Commit: docs(001): {product|engineering|product+engineering} - {description}
    │
    │   [Docs are now COMMITTED]
    │
    └─► Phase 3: COMPLETE
        │
        ├─ Push branch: git push -u origin task/001
        │
        ├─ Verify ready to merge
        │   ├─ Ensure working tree is clean
        │   └─ Show commits to be merged
        │
        │   [DEFAULT - no directive override]
        ├─ Update task: status=done, add completed date
        ├─ Commit: docs(001): done - {title}
        ├─ git checkout main
        ├─ git merge task/001 --no-ff
        ├─ git branch -d task/001
        │
        │   [WITH DIRECTIVE OVERRIDE - e.g., github.xml]
        └─ Directive replaces default with PR workflow
```

**Note:** No QA prompt. User handles QA themselves before running `/festina-finalize`.

---

## Implementation Checklist

**Source location:** `apps/festinalente/src/content/skills/`

### Phase 1: Create festina-finalize Skill
- [ ] Create `apps/festinalente/src/content/skills/festina-finalize/SKILL.md` (~400 lines orchestrator)
- [ ] Create `apps/festinalente/src/content/skills/festina-finalize/checks.md` (how to run directive checks)
- [ ] Create `apps/festinalente/src/content/skills/festina-finalize/docs-product.md` (from festina-docs product logic)
- [ ] Create `apps/festinalente/src/content/skills/festina-finalize/docs-engineering.md` (from festina-docs engineering logic)

### Phase 2: Delete Old Skills
- [ ] Delete `apps/festinalente/src/content/skills/festina-check/`
- [ ] Delete `apps/festinalente/src/content/skills/festina-docs/`
- [ ] Delete `apps/festinalente/src/content/skills/festina-merge/`

### Phase 3: Update festina-implement
- [ ] Update `apps/festinalente/src/content/skills/festina-implement/SKILL.md`:
  - **Add requirement verification at end** (moved from festina-check):
    - For each FR: identify code, verify no stubs, verify wired in
    - If gaps: ask user to fix or proceed
  - Output messaging: "Next: /festina-finalize {id}"
  - Remove references to /festina-check

### Phase 4: Config & Workflow Updates

**Config files:**
- [ ] Update `.festinalente/config.yaml`:
  - Remove: festina-check, festina-docs, festina-merge
  - Add: festina-finalize: []  (directives are user-configured)

**Templates:**
- [ ] Update `apps/festinalente/src/content/templates/config.yaml` (lines 18-20):
  - Remove: `festina-check`, `festina-docs`, `festina-merge`
  - Add: `festina-finalize: []`

**Workflow definition (source of truth):**
- [ ] Update `apps/festinalente/src/content/workflow.yaml`:
  - Remove columns: `check`, `update-docs`, `pr` (lines 18-26)
  - Add column: `finalize` with description "Validation, documentation, and completion"
  - Update transitions (lines 62-65):
    - `in-progress: [finalize]`
    - `finalize: [done, in-progress]` (complete or rework)
  - Update commits section (lines 73-76):
    - Remove: `check-retry`, `check`, `docs`
    - Add: `finalize: "{commit-type}({id}): {title}"` and `finalize-docs: "docs({id}): {description}"`

### Phase 5: Other Skills Updates

**festina-rework** (`apps/festinalente/src/content/skills/festina-rework/SKILL.md`):
- [ ] Update column transitions comment (lines 21-25): `check → in-progress` and `pr → in-progress` → `finalize → in-progress`
- [ ] Update task listing (line 45): `check` or `pr` status → `finalize` status
- [ ] Update validation (line 62): status is `check` or `pr` → status is `finalize`
- [ ] Update phase name logic (lines 232-233): Remove check/pr distinction
- [ ] Update next steps (lines 290-292, 487-492): `/festina-check` → `/festina-finalize`

**festina-overview** (`apps/festinalente/src/content/skills/festina-overview/SKILL.md`):
- [ ] Update active states (line 59): `check, update-docs, pr` → `finalize`
- [ ] Update column order note (line 97): Remove `check, update-docs, pr`, add `finalize`
- [ ] Update board overview output (lines 106-113): Remove Check/Update Docs/PR sections, add Finalize
- [ ] Update visual board column list (lines 137-145): Replace old columns with `finalize`
- [ ] Update next command suggestions (lines 286-293):
  - Remove: `case check`, `case update-docs`, `case pr`
  - Add: `case finalize` → `/festina-finalize {taskId}` or `/festina-rework {taskId}`
- [ ] Update examples (lines 324, 338-340, 364-366): Replace old column names

### Phase 6: Directive Updates (in this repo's .festinalente/directives/)

**coding.xml:**
- [ ] Line 70: `<rule id="P-A6" phase="check">` → `phase="finalize"`
- [ ] Line 88: `<rule id="P-R1" phase="check">` → `phase="finalize"`
- [ ] Line 91: `<rule id="P-R2" phase="check">` → `phase="finalize"`
- [ ] Line 94: `<rule id="P-B1" phase="check">` → `phase="finalize"`

**github.xml:**
- [ ] Line 31: `<override phase="merge">` → `phase="finalize"`
- [ ] Line 57: `<rule id="M-G1" phase="merge">` → `phase="finalize"`
- [ ] Line 64: `<rule id="M-G2" phase="merge">` → `phase="finalize"`
- [ ] Line 78: `<rule id="M-G3" phase="merge">` → `phase="finalize"`
- [ ] Line 89: `<rule id="M-G4" phase="merge">` → `phase="finalize"`
- [ ] Line 99: `<rule id="M-G5" phase="merge">` → `phase="finalize"`

**Note:** These are THIS repo's directives, not part of the distributed skill. Users with their own directives will need to update them similarly.

### Phase 7: VSCode Extension Updates

The VSCode extension has hardcoded status values that must be updated.

**Files to update:**

- [ ] `apps/vscode/src/types/task-types.ts` (lines 12-14)
  - Remove: `'check'`, `'update-docs'`, `'pr'`
  - Add: `'finalize'`

- [ ] `apps/vscode/src/computers/task-grouping.computer.ts` (lines 19-21)
  - Remove columns: `{ id: 'check', ... }`, `{ id: 'update-docs', ... }`, `{ id: 'pr', ... }`
  - Add column: `{ id: 'finalize', name: 'Finalize', open: true }`

- [ ] `apps/vscode/src/computers/task-actions.computer.ts` (lines 62-95)
  - Remove cases: `case 'check':`, `case 'update-docs':`, `case 'pr':`
  - Add case: `case 'finalize':` with action `{ label: 'Finalize', command: '/festina-finalize {id}', description: 'Validate, document, and complete' }`
  - Update `case 'in-progress':` to suggest finalize as next step

- [ ] `apps/vscode/src/capabilities/tasks-view.capability.ts` (lines 37-41)
  - Remove icon mappings for: `'check'`, `'update-docs'`, `'pr'`
  - Add icon mapping for: `'finalize'`

- [ ] Rebuild extension: `pnpm --filter @mattfletcher94/festinalente-vscode build`

### Phase 8: Product Documentation Updates

**Task domain docs** (`.festinalente/product/tasks/`):

- [ ] **Delete** `.festinalente/product/tasks/check.md` (replaced by finalize)
- [ ] **Create** `.festinalente/product/tasks/finalize.md`:
  - Document the new finalize skill
  - Cover all 3 phases: validate, document, complete
  - Include mermaid diagram showing the flow
  - Update code_refs to point to new skill location

- [ ] **Update** `.festinalente/product/tasks/workflow.md`:
  - Line 5: tldr "8-column" → "6-column"
  - Line 6: summary - remove "check, update-docs, pr", add "finalize"
  - Lines 30-43: Update mermaid stateDiagram:
    - Remove: Check, UpdateDocs, PR states
    - Add: Finalize state
    - Update transitions
  - Lines 45-52: Update workflow description
  - Lines 57-61: Update happy path and rework paths
  - Lines 71-78: Update transitions YAML example
  - Lines 81-88: Update edge case example

- [ ] **Update** `.festinalente/product/tasks/_index.md`:
  - Line 6: summary - remove "check, update-docs, pr", add "finalize"
  - Line 10: contains array - replace `tasks/check` with `tasks/finalize`
  - Line 22: "9-column workflow" → "6-column workflow"
  - Line 46: table - replace check row with finalize row
  - Lines 62-64: Update mermaid diagram (remove Check/Update Docs/PR, add Finalize)
  - Line 75: Update column list

- [ ] **Update** `.festinalente/product/tasks/rework.md` (if exists):
  - Update references to check/pr columns → finalize
  - Update next step suggestions

### Phase 9: README Updates

**README.md** (root):
- [ ] Update workflow diagram (line 28):
  - FROM: `BACKLOG → SCOPED → PLANNED → IN PROGRESS → CHECK → UPDATE DOCS → PR → DONE`
  - TO: `BACKLOG → SCOPED → PLANNED → IN PROGRESS → FINALIZE → DONE`
- [ ] Remove `/festina-check` section (lines 87-98)
- [ ] Remove `/festina-docs` section (lines 100-111)
- [ ] Remove `/festina-merge` section (lines 113-119)
- [ ] Add `/festina-finalize` section describing the consolidated command
- [ ] Update config.yaml example (lines 241-242): Remove `festina-check`, add `festina-finalize`
- [ ] Update command reference table (lines 289-301):
  - Remove: `/festina-check`, `/festina-docs`, `/festina-merge`
  - Add: `/festina-finalize` with description "Validate, document, and complete task"

### Phase 10: Rebuild & Final Verification
- [ ] Run full build: `pnpm build` to regenerate:
  - `.claude/skills/` - Built Claude Code skills
  - `.opencode/skills/` - Built OpenCode skills
  - `apps/festinalente/dist/` - Distribution package
- [ ] Verify no references to old skills remain: `grep -r "festina-check\|festina-docs\|festina-merge" .claude .opencode`
- [ ] Verify no references to old columns remain: `grep -r "'check'\|'update-docs'\|'pr'" apps/vscode/src`
- [ ] Test the new workflow end-to-end with a sample task
- [ ] Update any product docs in `.festinalente/product/` that describe the workflow

---

## Decisions Log

| Question | Decision | Rationale | Date |
|----------|----------|-----------|------|
| Q1: Commit timing | In festina-finalize Phase 1, AFTER checks pass | Keep implement lean; preserve "no commit until checks pass" guarantee | 2026-02-27 |
| Q2: QA placement | **User handles QA themselves** | LLM ignores QA; user tests before running finalize if they want | 2026-02-27 |
| Q3: Validation distribution | **Defined by user's directive** | User configures what checks run in their coding.xml | 2026-02-27 |
| Q4: Skill name | `festina-finalize` | Describes the action: finalize the work | 2026-02-27 |
| Q5: Failed check handling | **Ask user** | Prompt user on what to do when checks fail | 2026-02-27 |
| Q6: Docs in flow | Part of finalize Phase 2, before PR | Docs committed before PR is created | 2026-02-27 |
| **Architecture** | **Reference-based skill with 3 ref files** | Official docs recommend <500 line SKILL.md + separate reference files | 2026-02-27 |

---

## Behaviors Preserved (Verification Checklist)

**CRITICAL: Use this checklist during implementation to verify NO behaviors are lost.**

### From festina-check → Phase 1 (checks.md)

- [ ] `read_plan_file`: Verify all plan tasks have `completed="true"` before running checks
- [ ] `run_checks`: Execute each check type (command/pattern/checklist)
- [ ] `run_checks`: Print PASS/FAIL for each directive check
- [ ] `run_checks`: Auto-fix loop with user prompt (Fix? / Skip? / Abort?)
- [ ] `run_checks`: Log fix to plan.xml `<iteration phase="finalize">` section
- [ ] `run_checks`: Commit fix with `docs({id}): check-retry - {title}`
- [ ] `run_checks`: Restart ALL checks from beginning after fix
- [ ] `check_uncommitted_changes`: Warn if no uncommitted changes found
- [ ] `determine_commit_type`: Map labels to commit type (bug→fix, refactor→refactor, etc.)
- [ ] `stage_and_commit`: Stage implementation files AND .festinalente/ together
- [ ] `stage_and_commit`: Use correct commit format `{type}({id}): {title}`

### From festina-docs → Phase 2 (docs-product.md, docs-engineering.md)

- [ ] `analyze_product_doc_impact`: Check `affects` field, run `check-product.cjs`
- [ ] `analyze_product_doc_impact`: Categorize as stub/existing/missing
- [ ] `analyze_product_doc_impact`: Search for unlisted impacts via `search-product.cjs`
- [ ] `analyze_product_doc_impact`: Present analysis to user with AskUserQuestion
- [ ] `analyze_engineering_doc_impact`: Same flow for `engineering` field
- [ ] `load_smart_context`: Run `select-context.cjs` to load similar docs as reference
- [ ] `update_existing_docs`: Minimal focused updates, verification prompt
- [ ] `update_existing_docs`: Update `verified` date and `code_refs`
- [ ] `update_existing_docs`: Update diagrams if architecture/flow/UI changed
- [ ] `complete_stub_docs`: Remove `stub: true` and `task:` from frontmatter
- [ ] `complete_stub_docs`: Fill ALL required frontmatter fields (tldr, summary, keywords, aliases, boundary, etc.)
- [ ] `complete_stub_docs`: Fill ALL required content sections (TL;DR, Overview, How It Works, Examples, Boundaries)
- [ ] `complete_stub_docs`: Complete diagrams based on implementation analysis
- [ ] `complete_stub_engineering_docs`: Type-specific sections (system/pattern/convention)
- [ ] `complete_stub_engineering_docs`: Type-specific diagrams
- [ ] `create_new_docs`: Use templates, fill all fields, keep scope focused
- [ ] `create_new_engineering_docs`: Determine type, use correct template
- [ ] `handle_internal_changes`: Skip docs if no user-facing changes
- [ ] `update_domain_index`: Add new doc to `_index.md` with one-line description
- [ ] `update_engineering_index`: Add new doc to type's `_index.md`
- [ ] `update_glossary`: Add new terms to `glossary.yaml` with aliases and definition
- [ ] `validate_docs`: Run `validate-docs.cjs`, fix issues if validation fails
- [ ] `commit_docs_and_task`: Correct commit format based on what changed (product/engineering/both)

### From festina-merge → Phase 3 (SKILL.md complete_task step)

- [ ] `verify_ready_to_merge`: Ensure working tree is clean
- [ ] `verify_ready_to_merge`: Show commits to be merged (`git log main..HEAD --oneline`)
- [ ] `move_to_done_and_commit`: Update status to `done`, add `updated` and `completed` dates
- [ ] `move_to_done_and_commit`: Commit with `docs({id}): done - {title}`
- [ ] `merge_branch`: Use `--no-ff` to preserve branch history
- [ ] `cleanup_branch`: Delete task branch after merge
- [ ] `output_result`: Show next steps to user

### Removed (Intentionally)

- [ ] `prompt_qa_confirmation`: User handles QA themselves before running /festina-finalize
- [ ] `prompt_merge_confirmation`: Simplified flow, no confirmation needed

---

## References

- Current skills: `.claude/skills/festina-*/SKILL.md` and `.claude/skills/kanban-*/SKILL.md`
- GitHub directive: `.festinalente/directives/github.xml`
- Workflow config: `.kanban/workflow.yaml`
- Skill config: `.festinalente/config.yaml`
