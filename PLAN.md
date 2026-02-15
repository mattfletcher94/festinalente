# XML Enhancement Plan for Skill Files (Phase 2)

## Status: Ready for Implementation

**Decisions made:**
- Full XML structure for all inner content (no prose-based steps)
- Convert all 8 partials to XML
- Convert all 19 skills to XML
- Big bang migration (all at once)
- Only `# Title` remains as markdown

---

## Phase 1 Complete: Structural XML Migration

The first phase migrated all 19 skills to use XML semantic tags at the outline level:

```xml
<purpose>...</purpose>
<context>...</context>
<prohibited>...</prohibited>
<process>
  <step name="..." outputs="..." when="...">
    Free-form markdown content here
  </step>
</process>
<success_criteria>...</success_criteria>
```

**This phase was completed** - see commit `0da76ea`.

---

## Phase 2: Deep XML Enhancement (Current Exploration)

### Problem Statement

While the outer structure now uses XML, the **inner content within steps** remains free-form markdown:

```xml
<step name="search_product_docs" when="`.kanban/product/` directory exists and is not empty">
  Extract keywords from the task title (nouns, verbs, domain terms).

  ```bash
  node .claude/scripts/search-product.cjs {keyword1} {keyword2} ...
  ```

  **If docs with score ≥ 0.5 found:**
  - These docs describe existing features this task relates to
  - Set `affects: [{matched-ids}]` in task frontmatter
  - Briefly note: "Related product docs: {ids}"

  **If no docs with score ≥ 0.3 found:**
  - This may be a NEW feature not yet documented
  - Ask user: "This looks like a new feature..."
</step>
```

**Observations:**
- Conditional logic ("If X, then Y") is written as prose with bold headers
- Shell commands are just code blocks without semantic meaning
- Actions and outputs are mixed together
- User prompts are embedded in text

---

## Research Findings

### Anthropic's Official Guidance

From [Anthropic's XML documentation](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags):

1. **Clarity** - XML clearly separates different parts of prompts
2. **Accuracy** - Reduces errors from misinterpretation
3. **Flexibility** - Easy to find, add, remove, or modify parts
4. **Parseability** - Makes extraction and post-processing easier
5. **Nesting** - Use nested tags for hierarchical content
6. **Consistency** - Use same tag names throughout

> "There are no canonical 'best' XML tags that Claude has been trained with in particular, although we recommend that your tag names make sense with the information they surround."

### GSD Repository Patterns

From [gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done):

- Uses XML as a **reliable interface between reasoning stages**
- Every task includes `<verify>` sections with concrete, testable assertions
- XML provides semantic clarity for machine parsing

### Key Insight

XML works best when it creates **clear boundaries** and **semantic meaning**. The question is: would adding more XML to inner content genuinely improve Claude's understanding, or would it add verbosity without benefit?

---

## Socratic Exploration

### Question 1: What problems are we actually trying to solve?

**Current state:**
- Steps work, but inner content interpretation may vary
- Conditional branches ("If X, then Y") are prose-based
- Commands are code blocks without semantic distinction
- Expected outputs are described in prose

**Consider:**
- Are we seeing inconsistent behavior from Claude following step instructions?
- Are certain patterns misinterpreted more than others?
- Is the prose within steps ever ambiguous?

**Answer:**
> "LLM doesn't always follow the rules and steps and validation properly and does things its own way"

This is a real behavioral issue, not theoretical. The LLM:
- Ignores or skips steps
- Doesn't follow the defined process order
- Skips validation/success criteria
- Improvises instead of following instructions

**Follow-up: Where does it fail?**
> "It's inconsistent, could be anything"

This is significant - failures are **unpredictable**. This suggests:
- The issue isn't one specific element (like conditionals or commands)
- The prose-based inner content may lack sufficient "weight" or distinction
- More structural XML throughout might help create clearer boundaries
- We likely need a **comprehensive approach**, not targeted fixes

---

### Question 2: What would maximum XML structure look like?

Full transformation of the example step:

```xml
<step name="search_product_docs">
  <precondition>`.kanban/product/` directory exists and is not empty</precondition>

  <action>Extract keywords from the task title (nouns, verbs, domain terms).</action>

  <command>node .claude/scripts/search-product.cjs {keyword1} {keyword2} ...</command>

  <branch condition="docs with score ≥ 0.5 found">
    <note>These docs describe existing features this task relates to</note>
    <action>Set `affects: [{matched-ids}]` in task frontmatter</action>
    <output>Briefly note: "Related product docs: {ids}"</output>
  </branch>

  <branch condition="no docs with score ≥ 0.3 found">
    <note>This may be a NEW feature not yet documented</note>
    <prompt>This looks like a new feature. What domain should it belong to? (e.g., auth, billing, users)</prompt>
    <action>Set `affects: [{domain}/{slug-from-title}]` - doc will be created during /kanban-docs</action>
  </branch>

  <branch condition="`.kanban/product/` is empty or doesn't exist">
    <action>Skip this step</action>
    <output>No product docs yet</output>
  </branch>
</step>
```

**Consider:**
- Is this more or less readable to humans?
- Does the added structure help Claude understand intent better?
- Is this level of verbosity worth it?

**Answer:**
> 1. "It feels clearer yes"
> 2. "Yes" (verbosity acceptable)
> 3. "Yes" (semantic distinction valuable)
>
> "But does this help the LLM, that's the main thing"

---

### Critical Question: Does XML Actually Help the LLM?

**Evidence from Anthropic:**

From [Anthropic's official documentation](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags):

> "Claude was trained with XML tags in the training data. Using XML tags like `<example>`, `<document>`, etc. to structure your prompts can help guide Claude's output."

Key benefits they cite:
1. **Accuracy** - "Reduce errors caused by Claude misinterpreting parts of your prompt"
2. **Clarity** - "Clearly separate different parts of your prompt"
3. **Nesting** - "Nest tags for hierarchical content"

**Why this matters for our problem:**

The issue you're seeing - LLM ignoring steps, skipping validation, improvising - suggests Claude isn't clearly distinguishing:
- What to **do** vs. what to **say**
- What's **conditional** vs. what's **always required**
- What's a **command to run** vs. what's **context**

Prose with bold headers (`**If X:**`) looks like formatting to Claude. But `<branch condition="X">` is a semantic boundary that says "this is conditional logic."

**The hypothesis:**
- XML tags aren't just visual - they're semantic markers Claude was trained to respect
- More granular XML = more semantic boundaries = less room for improvisation
- `<command>` means "run this" not "this is an example"
- `<branch>` means "conditional path" not "suggestion"

**How we could test this:**
1. Convert ONE skill to full XML structure
2. Run it 5-10 times on realistic inputs
3. Compare compliance rate to the current prose version

---

### Question 3: What semantic categories should we distinguish?

Potential inner-step tags:

| Tag | Purpose | Example |
|-----|---------|---------|
| `<action>` | What to do | "Extract keywords from title" |
| `<command>` | Shell command to run | `node .claude/scripts/...` |
| `<output>` | What to say/display | "Task created successfully" |
| `<prompt>` | Question to ask user | "Which task to implement?" |
| `<branch>` | Conditional logic | "If X, then..." |
| `<note>` | Explanation/context | "This is because..." |
| `<validate>` | Check/assertion within step | "Verify status is 'refined'" |
| `<precondition>` | Move `when=""` to nested tag | Clearer condition definition |

**Answer:**
> "Your schema looks good. Validate should be its own yes"
> "We shouldn't have markdown titles anymore, it should all be XML"

**Confirmed XML Schema:**

### Document-Level Tags (outer structure)

| Tag | Meaning | Required |
|-----|---------|----------|
| `<purpose>` | What this skill accomplishes | Yes |
| `<context>` | Background info, partials | No |
| `<prohibited>` | What NOT to do | No |
| `<process>` | Container for steps | Yes |
| `<success_criteria>` | Validation checklist | Yes |
| `<example>` | Example interaction | No |
| `<next_steps>` | What to run next | No |

### Step-Level Tags (inside `<step>`)

| Tag | Meaning | When to Use |
|-----|---------|-------------|
| `<action>` | Do this thing | Any instruction to perform |
| `<command>` | Run this exact command | Shell/script commands |
| `<output>` | Display this to user | Messages, summaries, results |
| `<prompt>` | Ask user this question | Interactive questions |
| `<branch condition="...">` | Conditional block | If/else logic |
| `<precondition>` | Step prerequisite | Replaces `when=""` attribute (optional) |
| `<note>` | Context/explanation | Optional background info |
| `<validate>` | Check/assertion | Mid-step verification |
| `<warning>` | Critical caution | Important constraints |
| `<example_code lang="...">` | Code example (not to run) | YAML/JSON examples, templates |

### Final Document Structure

```xml
---
name: kanban-{action}
description: ...
allowed-tools: ...
argument-hint: ...
disable-model-invocation: true
---

# {Title}

<purpose>
{Single sentence describing goal}
</purpose>

<context>
{{> partials here}}
</context>

<prohibited>
- Do not {anti-pattern}
</prohibited>

<process>
  <step name="{step_id}" outputs="{vars}">
    <precondition>{when this step applies}</precondition>
    <action>{instruction}</action>
    <command>{shell command}</command>
    <validate>{check something}</validate>
    <branch condition="{if X}">
      <action>{do Y}</action>
      <output>{say Z}</output>
    </branch>
    <output>{display result}</output>
  </step>
</process>

<success_criteria>
- {Criterion 1}
- {Criterion 2}
</success_criteria>

<example>
User: /kanban-{action} {args}

{Example output}
</example>

<next_steps>
/clear
/kanban-{next} {id}
</next_steps>
```

**Note:** Only the `# {Title}` remains as markdown (for human readability). Everything else is XML.

---

### Question 4: How do we measure success?

Possible metrics:
1. **Consistency** - Does Claude follow instructions more reliably?
2. **Error reduction** - Fewer misinterpretations?
3. **Maintainability** - Easier to edit and understand skills?
4. **Verbosity tradeoff** - Does added structure hurt readability?

**Consider:**
- Do we have examples of current failure modes to address?
- Can we A/B test structured vs. unstructured approaches?
- What's the maintenance burden of more XML?

**Answer:**
Given inconsistent failures, success = LLM follows skills more reliably.
Practical measure: Run converted skill multiple times, observe compliance.

---

### Question 5: What's the minimum viable enhancement?

Instead of maximum XML, what's the **smallest change** that might help?

**Option A: Just add `<command>` tags**
```xml
<step name="get_next_id" outputs="nextId">
  <command>node .claude/scripts/next-id.cjs</command>
  Use `nextId` from JSON output.
</step>
```

**Option B: Add `<command>` and `<output>` tags**
```xml
<step name="output_result">
  <output>Print the created file path and task ID</output>
  <output>Print commit hash</output>
  <output when="needs-refinement label added">Note this to user</output>
</step>
```

**Option C: Add conditional structure only**
```xml
<step name="detect_vague">
  <when condition="task has vagueness indicators">
    <check>Title is very short (<5 words) without clear action verb</check>
    <check>No description could be generated</check>
    <action>Add `needs-refinement` to labels array</action>
    <output>Task marked as needs-refinement. Run `/kanban-refine {id}` to clarify.</output>
  </when>
</step>
```

**Option D: Hybrid - XML for disambiguation, prose for descriptions**
- Use `<command>` for shell commands
- Use `<branch>` for conditionals
- Use `<prompt>` for user questions
- Keep explanatory text as prose

**Consider:**
- Start small and iterate?
- Full transformation at once?
- Which elements cause the most confusion currently?

**Answer:**
> "Option B, big bang migration"

Decision: Convert all 19 skills at once to full XML structure.

---

## Proposed Options Summary

| Option | Scope | Effort | Benefit |
|--------|-------|--------|---------|
| **1. Minimal** | `<command>` and `<prompt>` only | Low | Targeted |
| **2. Moderate** | Add `<branch>`, `<output>`, `<action>` | Medium | Clearer conditionals |
| **3. Full** | All content tagged | High | Maximum structure |
| **4. Hybrid** | XML for disambiguation, prose for descriptions | Medium | Balance |

---

## Implementation Plan (Big Bang Migration)

### Phase 1: Preparation

1. **Build baseline**
   ```bash
   pnpm run build
   cp -r dist dist-baseline
   ```

### Phase 2: Convert Partials (8 files)

Convert all partials in `src/content/partials/*.md` to XML:

| Partial | Current | Convert To |
|---------|---------|------------|
| `directory-reference.md` | Prose | `<note>` tags |
| `helper-scripts.md` | Markdown + code blocks | `<command>` tags |
| `workflow-load.md` | Prose instruction | `<action>` tag |
| `column-transition.md` | Prose | `<note>` tag |
| `branch-verify-main.md` | Prose + command | `<validate>` + `<command>` |
| `branch-verify-task.md` | Prose + command | `<validate>` + `<command>` |
| `user-skills.md` | Prose + command | `<action>` + `<command>` |
| `product-docs-scripts.md` | Prose + code blocks | `<command>` tags |

**Example conversion:**

Before (`helper-scripts.md`):
```markdown
## Helper Scripts

Use these scripts to reliably find files:

```bash
{{#if show_find_task}}
node .claude/scripts/find-task.cjs {id}
{{/if}}
```
```

After:
```xml
<note>Use these scripts to reliably find files:</note>

{{#if show_find_task}}
<command description="Find task by ID">node .claude/scripts/find-task.cjs {id}</command>
{{/if}}
```

### Phase 3: Convert All 19 Skills

For each skill in `src/content/skills/*/SKILL.md`:

1. Keep YAML frontmatter unchanged
2. Keep `# Title` as only markdown heading
3. Convert all content to XML:
   - `## Example` → `<example>`
   - `## Next Steps` → `<next_steps>`
   - All step inner content → semantic XML tags
4. Apply step-level tags:
   - Prose instructions → `<action>`
   - Code blocks for commands → `<command>`
   - "Print/Display/Note" → `<output>`
   - "Ask user" → `<prompt>`
   - `**If X:**` blocks → `<branch condition="X">`
   - `when=""` attributes → `<precondition>` (optional, can keep attribute)
   - Checks/assertions → `<validate>`

**Skills to convert (19 total):**

| # | Skill | Complexity |
|---|-------|------------|
| 1 | kanban-init | Low |
| 2 | kanban-status | Low |
| 3 | kanban-view | Low |
| 4 | kanban-create | Medium |
| 5 | kanban-refine | Medium |
| 6 | kanban-scope | High |
| 7 | kanban-plan | Medium |
| 8 | kanban-implement | High |
| 9 | kanban-save | Low |
| 10 | kanban-verify | High |
| 11 | kanban-approve | Medium |
| 12 | kanban-rework | Medium |
| 13 | kanban-docs | Medium |
| 14 | kanban-merge | Medium |
| 15 | kanban-map-product | Medium |
| 16 | kanban-define-product | Medium |
| 17 | kanban-report-task | Low |
| 18 | kanban-report-label | Low |
| 19 | kanban-report-user | Low |

### Phase 4: Validation

1. **Build and compare**
   ```bash
   pnpm run build
   diff -r dist-baseline/skills dist/skills
   ```

2. **Check for:**
   - All partials expanded correctly
   - No truncated content
   - XML tags present in output
   - Valid structure

### Phase 5: Testing

1. Run each skill type at least once
2. Observe if compliance improves
3. Document any issues

---

## Open Questions (All Resolved)

- [x] What specific failure modes? → Inconsistent, unpredictable non-compliance
- [x] Should partials get XML? → Yes, convert all 8 partials to XML
- [x] How handle code blocks in XML? → Use `<command>` tag
- [x] Machine-parseability value? → Yes, clearer boundaries
- [x] Help or hurt readability? → Acceptable tradeoff for compliance
- [x] What about Example/Next Steps? → Convert to `<example>` and `<next_steps>` tags
- [x] Any markdown headers? → Only `# Title` remains, everything else XML

---

## Conversion Rules (Detailed)

### Rule 1: Prose Instructions → `<action>`

**Before:** `Extract keywords from the task title.`
**After:** `<action>Extract keywords from the task title</action>`

### Rule 2: Code Blocks with Commands → `<command>`

**Before:**
```markdown
```bash
node .claude/scripts/next-id.cjs
```
```

**After:**
```xml
<command>node .claude/scripts/next-id.cjs</command>
```

### Rule 3: Multi-line Commands → Single `<command>` with newlines

**Before:**
```markdown
```bash
mkdir -p .kanban/tasks
mkdir -p .kanban/specs
```
```

**After:**
```xml
<command>
mkdir -p .kanban/tasks
mkdir -p .kanban/specs
</command>
```

### Rule 4: Bold Conditional Headers → `<branch>`

**Before:**
```markdown
**If docs with score ≥ 0.5 found:**
- Set `affects` in frontmatter
- Note to user
```

**After:**
```xml
<branch condition="docs with score ≥ 0.5 found">
  <action>Set `affects` in frontmatter</action>
  <output>Note to user</output>
</branch>
```

### Rule 5: "Ask user" / Questions → `<prompt>`

**Before:** `Ask user: "What is this product called?"`
**After:** `<prompt>What is this product called?</prompt>`

### Rule 6: "Print" / "Display" / "Note" → `<output>`

**Before:** `Print created directories`
**After:** `<output>Print created directories</output>`

### Rule 7: Checks/Validations → `<validate>`

**Before:** `Check if .kanban/ directory exists`
**After:** `<validate>Check if .kanban/ directory exists</validate>`

### Rule 8: Context/Explanations → `<note>`

**Before:** `This becomes the root product doc that LLMs read first`
**After:** `<note>This becomes the root product doc that LLMs read first</note>`

### Rule 9: `when=""` Attribute → Keep OR Use `<precondition>`

**Decision:** Keep `when=""` attribute for simple conditions. Use `<precondition>` when the condition needs more explanation.

**Simple (keep attribute):**
```xml
<step name="foo" when="status is refined">
```

**Complex (use precondition):**
```xml
<step name="foo">
  <precondition>`.kanban/product/` directory exists and contains at least one .md file</precondition>
```

### Rule 10: YAML/JSON Code Blocks (Not Commands) → `<example_code>`

For code blocks that are examples, not commands to run:

**Before:**
```markdown
```yaml
name: My Project
settings:
  version: "2.0"
```
```

**After:**
```xml
<example_code lang="yaml">
name: My Project
settings:
  version: "2.0"
</example_code>
```

### Rule 11: Critical/Warning Text → `<warning>`

**Before:** `**CRITICAL:** Do NOT add extra properties`
**After:** `<warning>Do NOT add extra properties</warning>`

### Rule 12: Markdown Tables → Keep as Markdown

Tables inside `<note>` or `<example>` can remain as markdown - they're reference material.

### Rule 13: Handlebars + XML

Handlebars conditionals wrap XML tags:

```xml
{{#if show_find_task}}
<command description="Find task by ID">node .claude/scripts/find-task.cjs {id}</command>
{{/if}}
```

NOT:
```xml
<command>
{{#if show_find_task}}
node .claude/scripts/find-task.cjs {id}
{{/if}}
</command>
```

---

## Complete Partial Conversions (All 8)

### 1. `directory-reference.md`

**BEFORE:**
```markdown
## Directory Reference
- **`.claude/`** — System config (workflow, templates, skills) — READ ONLY
- **`.kanban/`** — Project data (tasks, specs, plans, product docs) — READ/WRITE
```

**AFTER:**
```xml
<note>
- **`.claude/`** — System config (workflow, templates, skills) — READ ONLY
- **`.kanban/`** — Project data (tasks, specs, plans, product docs) — READ/WRITE
</note>
```

---

### 2. `helper-scripts.md`

**BEFORE:**
```markdown
## Helper Scripts

Use these scripts to reliably find files:

```bash
{{#if show_find_task}}
# Find task by ID (returns JSON with path and metadata)
node .claude/scripts/find-task.cjs {id}

{{/if}}
{{#if show_next_id}}
# Get next task ID (returns JSON with nextId, currentHighest, padding)
node .claude/scripts/next-id.cjs

{{/if}}
```
```

**AFTER:**
```xml
<note>Use these scripts to reliably find files:</note>

{{#if show_find_task}}
<command description="Find task by ID (returns JSON with path and metadata)">node .claude/scripts/find-task.cjs {id}</command>
{{/if}}

{{#if show_find_spec}}
<command description="Find spec by ID (returns JSON with path)">node .claude/scripts/find-spec.cjs {id}</command>
{{/if}}

{{#if show_find_plan}}
<command description="Find plan by ID (returns JSON with path)">node .claude/scripts/find-plan.cjs {id}</command>
{{/if}}

{{#if show_list_tasks}}
<command description="List all tasks (returns JSON with count and tasks array)">node .claude/scripts/list-tasks.cjs</command>
<command description="List tasks filtered by status">node .claude/scripts/list-tasks.cjs --status=in-progress</command>
{{/if}}

{{#if show_next_id}}
<command description="Get next task ID (returns JSON with nextId, currentHighest, padding)">node .claude/scripts/next-id.cjs</command>
{{/if}}

{{#if show_get_date_time}}
<command description="Get current date/time (returns JSON with iso and date formats)">node .claude/scripts/get-date-time.cjs</command>
{{/if}}

{{#if show_get_user_skills}}
<command description="Get user-defined skills for a command (returns JSON with skill paths)">node .claude/scripts/get-user-skills.cjs {command}</command>
<example_code lang="json">
{
  "command": "kanban-verify",
  "count": 2,
  "skills": [
    { "name": "check-typescript", "path": ".claude/skills/check-typescript/SKILL.md", "exists": true }
  ]
}
</example_code>
{{/if}}
```

---

### 3. `workflow-load.md`

**BEFORE:**
```markdown
Read `.claude/kanban-workflow.yaml` for column definitions, labels, priorities, and commit formats. Use these values throughout this skill.
```

**AFTER:**
```xml
<action>Read `.claude/kanban-workflow.yaml` for column definitions, labels, priorities, and commit formats</action>
<note>Use these values throughout this skill</note>
```

---

### 4. `column-transition.md`

**BEFORE:**
```markdown
## Column Transition

```
{{from}} → {{to}}
```

See `.claude/kanban-workflow.yaml` for column definitions and valid transitions.
```

**AFTER:**
```xml
<note>Column transition: {{from}} → {{to}}</note>
<note>See `.claude/kanban-workflow.yaml` for column definitions and valid transitions</note>
```

---

### 5. `branch-verify-main.md`

**BEFORE:**
```markdown
Run `git branch --show-current`
- If not on `main` (or `master`):
  - Error: "This command must be run on the main branch{{#if reason}} {{reason}}{{/if}}. Current branch: \{branch\}"
  - Suggest: "Switch to main with `git checkout main`"
  - Exit
```

**AFTER:**
```xml
<command>git branch --show-current</command>
<validate>Must be on `main` or `master` branch</validate>
<branch condition="not on main/master">
  <output>Error: This command must be run on the main branch{{#if reason}} {{reason}}{{/if}}. Current branch: {branch}</output>
  <output>Suggest: Switch to main with `git checkout main`</output>
  <action>Exit</action>
</branch>
```

---

### 6. `branch-verify-task.md`

**BEFORE:**
```markdown
Run `git branch --show-current`
- Expected branch: `task/\{id\}` (where \{id\} is the task ID)
- If not on expected branch:
  - Error: "This command must be run on branch task/\{id\}. Current branch: \{branch\}"
  - Suggest: "Switch to task branch with `git checkout task/\{id\}`"
  - Exit
```

**AFTER:**
```xml
<command>git branch --show-current</command>
<validate>Must be on branch `task/{id}` where {id} is the task ID</validate>
<branch condition="not on expected branch">
  <output>Error: This command must be run on branch task/{id}. Current branch: {branch}</output>
  <output>Suggest: Switch to task branch with `git checkout task/{id}`</output>
  <action>Exit</action>
</branch>
```

---

### 7. `user-skills.md`

**BEFORE:**
```markdown
**STOP.** Before proceeding, you MUST load and apply user-defined skills. This is mandatory.

1. Run `node .claude/scripts/get-user-skills.cjs kanban-{{command}}`
2. Parse the JSON output
3. If `count > 0`, for EACH skill in the `skills` array:
   - Check `exists` is `true`
   - Read the skill file at `path`
   - Follow ALL instructions as mandatory requirements
   - User skill instructions take precedence over defaults
4. If `count === 0`, no user skills configured - proceed with defaults

**Skipping user skills is a critical error. Do not proceed without checking them.**
```

**AFTER:**
```xml
<warning>Before proceeding, you MUST load and apply user-defined skills. This is mandatory.</warning>

<command>node .claude/scripts/get-user-skills.cjs kanban-{{command}}</command>
<action>Parse the JSON output</action>

<branch condition="count > 0">
  <action>For EACH skill in the `skills` array where `exists` is `true`:</action>
  <action>Read the skill file at `path`</action>
  <action>Follow ALL instructions as mandatory requirements</action>
  <note>User skill instructions take precedence over defaults</note>
</branch>

<branch condition="count === 0">
  <action>No user skills configured - proceed with defaults</action>
</branch>

<warning>Skipping user skills is a critical error. Do not proceed without checking them.</warning>
```

---

### 8. `product-docs-scripts.md`

**BEFORE:**
```markdown
## Product Documentation Scripts

Use these scripts to work with product documentation:

```bash
{{#if show_list_product}}
# List all product docs
node .claude/scripts/list-product.cjs
{{/if}}
{{#if show_search_product}}
# Search product docs by keywords
node .claude/scripts/search-product.cjs keyword1 keyword2 ...
{{/if}}
```

**Path rule:** ID `auth/login` → Path `.kanban/product/auth/login.md`
```

**AFTER:**
```xml
<note>Use these scripts to work with product documentation:</note>

{{#if show_list_product}}
<command description="List all product docs (returns JSON with count and docs array)">node .claude/scripts/list-product.cjs</command>
<command description="Filter by type">node .claude/scripts/list-product.cjs --type=feature</command>
<command description="Filter by domain">node .claude/scripts/list-product.cjs --domain=auth</command>
{{/if}}

{{#if show_search_product}}
<command description="Search product docs by keywords (returns JSON sorted by relevance)">node .claude/scripts/search-product.cjs keyword1 keyword2 ...</command>
<command description="With minimum score threshold">node .claude/scripts/search-product.cjs password reset --min-score=0.3</command>
<note>Score ≥ 0.5: Strong match | Score 0.3-0.5: Possible match | Score < 0.3: Weak match | No results: Likely new feature</note>
{{/if}}

{{#if show_check_product}}
<command description="Check if product docs exist by ID">node .claude/scripts/check-product.cjs auth/login auth/mfa billing/invoices</command>
{{/if}}

<note>Path rule: ID `auth/login` → Path `.kanban/product/auth/login.md`</note>
```

---

## Complete Skill Conversion Example: `kanban-init`

### BEFORE (Current):

```markdown
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
    - Check if `.kanban/` directory exists
    - If exists, ask user: "Kanban already initialized. Reinitialize? (This will NOT delete existing tasks)"
    - If user declines, exit
  </step>

  <step name="check_git_repository">
    - Run `git status` to verify we're in a git repo
    - If not a git repo, warn: "Not a git repository. Kanban works best with git for commit tracking."
    - Ask if user wants to continue anyway
  </step>

  <step name="create_directory_structure">
    ```bash
    mkdir -p .kanban/tasks
    mkdir -p .kanban/specs
    mkdir -p .kanban/plans
    mkdir -p .kanban/product
    mkdir -p .kanban/skills
    ```
  </step>

  <step name="create_product_overview">
    - Read template from `.claude/kanban-templates/overview.md`
    - Create `.kanban/product/overview.md`
    - Ask user: "What is this product called?"
    - Ask user: "In one sentence, what does it do?"
    - Fill template with responses
    - This becomes the root product doc that LLMs read first
  </step>

  <step name="create_config_yaml">
    - Read template from `.claude/kanban-templates/config.yaml`
    - Write to `.kanban/config.yaml` **exactly as-is** (do not modify or add properties)
    - If template not found, create minimal config **exactly as shown below**:

    **CRITICAL: Do NOT add, invent, or improvise any properties not shown in the template.**
      ```yaml
      name: My Project
      user-skills:
        "kanban-create":
          skills:
      settings:
        version: "2.0"
      ```
  </step>

  <step name="output_result">
    - Print created directories
    - Print config location
    - Suggest next steps
  </step>
</process>

<success_criteria>
- `.kanban/` directory exists
- `.kanban/tasks/` directory exists
- `.kanban/config.yaml` exists
- Next steps shown to user
</success_criteria>

## Example
User: `/kanban-init`
Initializing kanban board...

## Next Steps
/clear
/kanban-define-product
```

### AFTER (Converted):

```markdown
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
      <action>Create minimal config exactly as shown:</action>
      <warning>Do NOT add, invent, or improvise any properties not shown in the template</warning>
      <example_code lang="yaml">
name: My Project
user-skills:
  "kanban-create":
    skills:
settings:
  version: "2.0"
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
- `.kanban/config.yaml` exists
- Next steps shown to user
</success_criteria>

<example>
User: `/kanban-init`

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
- Or create a task: /kanban-create "Your first task"
</example>

<next_steps>
/clear
/kanban-define-product
</next_steps>
```

---

## Implementation Checklist

### Phase 1: Preparation
- [ ] Run `pnpm run build`
- [ ] Copy `dist` to `dist-baseline` for comparison

### Phase 2: Convert Partials (8 files)
- [ ] `src/content/partials/directory-reference.md`
- [ ] `src/content/partials/helper-scripts.md`
- [ ] `src/content/partials/workflow-load.md`
- [ ] `src/content/partials/column-transition.md`
- [ ] `src/content/partials/branch-verify-main.md`
- [ ] `src/content/partials/branch-verify-task.md`
- [ ] `src/content/partials/user-skills.md`
- [ ] `src/content/partials/product-docs-scripts.md`

### Phase 3: Convert Skills (19 files)
- [ ] `src/content/skills/kanban-init/SKILL.md`
- [ ] `src/content/skills/kanban-status/SKILL.md`
- [ ] `src/content/skills/kanban-view/SKILL.md`
- [ ] `src/content/skills/kanban-create/SKILL.md`
- [ ] `src/content/skills/kanban-refine/SKILL.md`
- [ ] `src/content/skills/kanban-scope/SKILL.md`
- [ ] `src/content/skills/kanban-plan/SKILL.md`
- [ ] `src/content/skills/kanban-implement/SKILL.md`
- [ ] `src/content/skills/kanban-save/SKILL.md`
- [ ] `src/content/skills/kanban-verify/SKILL.md`
- [ ] `src/content/skills/kanban-approve/SKILL.md`
- [ ] `src/content/skills/kanban-rework/SKILL.md`
- [ ] `src/content/skills/kanban-docs/SKILL.md`
- [ ] `src/content/skills/kanban-merge/SKILL.md`
- [ ] `src/content/skills/kanban-map-product/SKILL.md`
- [ ] `src/content/skills/kanban-define-product/SKILL.md`
- [ ] `src/content/skills/kanban-report-task/SKILL.md`
- [ ] `src/content/skills/kanban-report-label/SKILL.md`
- [ ] `src/content/skills/kanban-report-user/SKILL.md`

### Phase 4: Validation
- [ ] Run `pnpm run build`
- [ ] Compare `dist/skills` with `dist-baseline/skills`
- [ ] Verify all partials expanded correctly
- [ ] Verify XML tags present in output

### Phase 5: Testing
- [ ] Test `/kanban-init` on a fresh project
- [ ] Test `/kanban-create` with a new task
- [ ] Test `/kanban-status` to view board
- [ ] Observe compliance behavior

### Phase 6: Cleanup
- [ ] Remove `dist-baseline` directory
- [ ] Commit changes

---

## Rollback Plan

If XML conversion causes problems:

1. **Revert commits:** `git revert HEAD~N` (where N is number of commits)
2. **Or restore from baseline:** `cp -r dist-baseline/skills dist/skills`
3. **Rebuild:** `pnpm run build`

The original files are preserved in git history.

---

## Appendix: Sources

- [Anthropic XML Tags Documentation](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags)
- [Anthropic Prompt Engineering Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- [GSD Repository](https://github.com/gsd-build/get-shit-done)
- [Structured Prompting Techniques Guide](https://codeconductor.ai/blog/structured-prompting-techniques-xml-json/)
