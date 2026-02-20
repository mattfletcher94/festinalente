# Directive Prominence Enhancement Plan

**Goal:** Make directives more prominent and influential during LLM task execution.

**Status:** Decisions finalized through Socratic Q&A. Ready for implementation.

---

## Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Format | XML only | Single source of truth, structured, validatable |
| File location | `.kanban/directives/{name}.xml` | Flat structure, simpler than folders |
| Section types | context, process, validation, examples | Covers all directive use cases |
| All sections | Optional | Allows pure-action, pure-context, etc. |
| Validation script | `validate-directive.cjs` | Separate from task XML validation |
| Template | `.kanban/templates/directive.xml` | Consistent with other templates |
| Creation skill | `kanban-directive` | Create + link to skills (updates config.yaml) |
| Compliance | Validation step in ALL skills | Every skill that loads directives runs their checks |
| Reinforcement | Start + End only | No mid-process reinforcement; adds complexity without clear benefit |
| Migration | Big bang | Migrate all 7 directives in single commit |
| Source location | `apps/kanban/src/content/` | Skills built from source, not edited directly in `.claude/skills/` |
| Config structure | `hooks.{skill}.directives[]` → `directives.{skill}[]` | Flatter, clearer structure |
| Breaking changes | Yes, no backwards compat | Update all references in one commit, move forwards only |

---

## Breaking Changes (No Backwards Compatibility)

This migration breaks existing setups. All changes happen in one commit - we move forwards only.

| Change | Old | New |
|--------|-----|-----|
| Directive format | `.kanban/directives/{name}/DIRECTIVE.md` | `.kanban/directives/{name}.xml` |
| Config structure | `hooks.{skill}.directives: [...]` | `directives.{skill}: [...]` |
| Script name | `get-hook-config.cjs` | `get-skill-config.cjs` |
| Partial name | `hook-config.md` | `load-directives.md` |
| Step name | `load_hook_config` | `load_directives` |

**New config.yaml structure:**
```yaml
name: "project-name"

directives:
  kanban-scope:
    - architecture
    - vue-integration
    - typescript
  kanban-plan:
    - planning
    - architecture
  kanban-implement:
    - architecture
    - vue-integration
    - typescript
    - tsdoc
  kanban-codecheck:
    - code-review
  kanban-rework:
    - architecture
    - vue-integration
    - typescript
    - tsdoc

settings:
  version: "2.0"
  idPrefix: ""
  idPadding: 3
```

**No deprecation warnings. No fallbacks. No legacy support.**

---

## Part 1: Directive Taxonomy

Directives are **instruction sets that modify LLM behavior during specific workflow phases**.

### Four Section Types

| Section | Purpose | When Referenced |
|---------|---------|-----------------|
| `<context>` | Principles/mindset to maintain | Throughout task |
| `<process>` | Phase-specific rules | At phase start |
| `<validation>` | Compliance checks (commands, patterns, checklists) | After implementation |
| `<examples>` | Concrete correct/violation illustrations | When relevant rule triggered |

---

## Part 2: XML Schema

### File Location
```
.kanban/directives/{name}.xml
```

Example:
```
.kanban/directives/architecture.xml
.kanban/directives/typescript.xml
.kanban/directives/testing.xml
```

### Complete Schema

```xml
<?xml version="1.0" encoding="UTF-8"?>
<directive name="{name}" version="1"
           created="{YYYY-MM-DD}" updated="{YYYY-MM-DD}">

  <description>
    {Brief description of what this directive enforces}
  </description>

  <!-- OPTIONAL: Principles to keep in mind throughout -->
  <context>
    <principle id="C1" keywords="{comma,separated,keywords}">
      {Principle text - mindset to maintain}
    </principle>
    <principle id="C2" keywords="{keywords}">
      {Another principle}
    </principle>
  </context>

  <!-- OPTIONAL: Phase-specific rules -->
  <process>
    <rule id="P1" phase="{phase1,phase2}">
      {Rule text - what to do during these phases}
    </rule>
    <rule id="P2" phase="{phase}">
      {Another rule}
    </rule>
  </process>

  <!-- OPTIONAL: Compliance checks -->
  <validation>
    <!-- Command check: runs a command, expects success -->
    <check id="V1" type="command" severity="{error|warning|info}">
      <run>{command to execute}</run>
      <expect>{expected outcome description}</expect>
    </check>

    <!-- Pattern check: regex against file contents -->
    <check id="V2" type="pattern" severity="{severity}" files="{glob}">
      <forbidden>{regex pattern}</forbidden>
      <reason>{why this pattern is forbidden}</reason>
    </check>

    <!-- Checklist: manual verification items -->
    <check id="V3" type="checklist" severity="{severity}">
      <item>{First thing to verify}</item>
      <item>{Second thing to verify}</item>
    </check>
  </validation>

  <!-- OPTIONAL: Concrete examples -->
  <examples>
    <example ref="{rule-id}" type="{correct|violation}">
      <code><![CDATA[
{code snippet}
      ]]></code>
      <explanation>{why this is correct/wrong}</explanation>
    </example>
  </examples>

</directive>
```

### Schema Rules

**Root `<directive>` attributes:**
| Attribute | Required | Description |
|-----------|----------|-------------|
| `name` | Yes | Unique identifier (matches filename without .xml) |
| `version` | Yes | Schema version (currently "1") |
| `created` | Yes | Creation date (YYYY-MM-DD) |
| `updated` | Yes | Last update date (YYYY-MM-DD) |

**`<context>` section:**
| Element | Attributes | Description |
|---------|------------|-------------|
| `<principle>` | `id` (required), `keywords` (optional) | A principle/mindset to maintain |

**`<process>` section:**
| Element | Attributes | Description |
|---------|------------|-------------|
| `<rule>` | `id` (required), `phase` (required) | Phase-specific rule |

Valid phases: `scope`, `plan`, `implement`, `codecheck`, `rework`, `docs`

**`<validation>` section:**
| Element | Attributes | Children |
|---------|------------|----------|
| `<check type="command">` | `id`, `severity` | `<run>`, `<expect>` |
| `<check type="pattern">` | `id`, `severity`, `files` | `<forbidden>` or `<required>`, `<reason>` |
| `<check type="checklist">` | `id`, `severity` | `<item>` (multiple) |

Severity values: `error`, `warning`, `info`

**`<examples>` section:**
| Element | Attributes | Children |
|---------|------------|----------|
| `<example>` | `ref` (rule id), `type` (correct/violation) | `<code>`, `<explanation>` |

---

## Part 3: Implementation Plan

> **Note:** All source files are in `apps/kanban/src/`. The built output goes to `.claude/skills/` and `.kanban/` at runtime. We edit SOURCE files only.

### Phase 1: Create Foundation

**1.1 Create directive.xml template**
- Source: `apps/kanban/src/content/kanban-templates/directive.xml`
- Runtime output: `.kanban/templates/directive.xml` (copied during init)
- Contains empty structure with comments explaining each section

**1.2 Create validate-directive.ts script**
- Source: `apps/kanban/src/scripts/validate-directive.ts`
- Runtime output: `.kanban/scripts/validate-directive.cjs`
- Interface: `node .kanban/scripts/validate-directive.cjs [directive-name]`
- Returns JSON: `{ valid: boolean, errors: string[] }`
- Validates:
  - Required attributes on `<directive>` (name, version, created, updated)
  - Valid section structure (context/process/validation/examples)
  - Unique IDs within directive (C1, P1, V1 etc. must be unique)
  - Valid phase values in `<process>` rules (scope|plan|implement|codecheck|rework|docs)
  - Valid severity values in `<validation>` checks (error|warning|info)
  - `ref` attributes in `<examples>` point to existing rule IDs
- Dependencies: Use `fast-xml-parser` for XML parsing (already in project)

**1.3 Rename and update get-hook-config.ts → get-skill-config.ts**
- Source: `apps/kanban/src/scripts/get-hook-config.ts` → `get-skill-config.ts`
- Changes:
  - Read from `config.directives[skillName]` instead of `config.hooks[skillName].directives`
  - Change directive path from `.kanban/directives/{name}/DIRECTIVE.md` to `.kanban/directives/{name}.xml`
  - Return JSON: `{ skill: string, directives: [{ name, path, exists }] }`

### Phase 2: Create kanban-directive Skill

**2.1 Source location:** `apps/kanban/src/content/skills/kanban-directive/SKILL.md`

**2.2 Purpose:** Interactive creation of new directives through Socratic Q&A.

**2.3 Process flow:**
```
1. Prompt for directive name
2. Understand purpose through conversation
3. Ask which section types needed (context, process, validation, examples)
4. For each selected section, gather content through Q&A
5. Generate XML and write to .kanban/directives/{name}.xml
6. Run validate-directive.cjs
7. Link directive to skills by updating .kanban/config.yaml
8. Commit both files
```

**2.4 Full skill definition:** See Appendix A

### Phase 3: Update Partials and Skills

**3.1 Rename and update load-directives partial**

Source: `apps/kanban/src/content/partials/hook-config.md` → `load-directives.md`

Current partial uses: `{{> hook-config command="implement"}}`
New partial uses: `{{> load-directives skill="implement"}}`

**New content for `load-directives.md`:**
```xml
<step name="load_directives">
  <command>node .kanban/scripts/get-skill-config.cjs kanban-{{skill}}</command>
  <action>Parse the JSON output</action>

  <branch condition="directives.length > 0">
    <warning>Directives are MANDATORY. You MUST follow them.</warning>
    <action>For EACH directive where `exists` is `true`:</action>
    <action>Read the directive XML file at `path`</action>
    <action>Parse and apply:</action>
    <action>- `<context>` principles: Maintain as ongoing mindset</action>
    <action>- `<process>` rules where phase="{{skill}}": Follow as requirements</action>
    <note>`<validation>` checks will run in directive_compliance step</note>
    <note>`<examples>` will be shown if violations are found</note>
  </branch>
</step>

<example_code lang="json">
{
  "skill": "kanban-{{skill}}",
  "directives": [
    { "name": "architecture", "path": ".kanban/directives/architecture.xml", "exists": true }
  ]
}
</example_code>
```

**3.2 Create directive-compliance partial**

Source: `apps/kanban/src/content/partials/directive-compliance.md` (NEW)

**Content for `directive-compliance.md`:**
```xml
<step name="directive_compliance">
  <note>Verify compliance with all loaded directives</note>

  <action>For each directive loaded in load_directives step:</action>
  <action>Re-read the directive XML file</action>

  <action>Run each `<validation>` check:</action>

  <branch condition="check type=command">
    <command>{content of <run> element}</command>
    <validate>{content of <expect> element}</validate>
  </branch>

  <branch condition="check type=pattern">
    <action>For each file matching `files` glob that was modified:</action>
    <action>Check content against `<forbidden>` or `<required>` regex</action>
  </branch>

  <branch condition="check type=checklist">
    <action>Self-assess each `<item>` as Y/N</action>
  </branch>

  <branch condition="any check fails">
    <output>Directive violation: {check id} - {reason}</output>
    <action>Find `<example>` elements where ref matches failed check</action>
    <action>Show violation examples to illustrate the problem</action>
    <action>Show correct examples to illustrate the fix</action>
    <prompt>Fix now or acknowledge and continue?</prompt>
  </branch>
</step>
```

**3.3 Update skills to use new partials**

Each skill that loads directives needs TWO changes:

1. Replace `{{> hook-config command="X"}}` with `{{> load-directives skill="X"}}`
2. Add `{{> directive-compliance}}` before the final output step

**Skills using hook-config partial (9 total):**
| Skill | Source Path | Line | Changes |
|-------|-------------|------|---------|
| kanban-create | `apps/kanban/src/content/skills/kanban-create/SKILL.md` | 53 | load-directives + directive-compliance |
| kanban-scope | `apps/kanban/src/content/skills/kanban-scope/SKILL.md` | 83 | load-directives + directive-compliance |
| kanban-plan | `apps/kanban/src/content/skills/kanban-plan/SKILL.md` | 185 | load-directives + directive-compliance |
| kanban-implement | `apps/kanban/src/content/skills/kanban-implement/SKILL.md` | 159 | load-directives + directive-compliance |
| kanban-save | `apps/kanban/src/content/skills/kanban-save/SKILL.md` | 80 | load-directives + directive-compliance |
| kanban-docs | `apps/kanban/src/content/skills/kanban-docs/SKILL.md` | 93 | load-directives + directive-compliance |
| kanban-approve | `apps/kanban/src/content/skills/kanban-approve/SKILL.md` | 81 | load-directives + directive-compliance |
| kanban-merge | `apps/kanban/src/content/skills/kanban-merge/SKILL.md` | 77 | load-directives + directive-compliance |
| kanban-rework | `apps/kanban/src/content/skills/kanban-rework/SKILL.md` | 93 | load-directives + directive-compliance |

**3.4 kanban-codecheck - SPECIAL CASE**

kanban-codecheck does NOT use the hook-config partial. It reads config directly:

- Source: `apps/kanban/src/content/skills/kanban-codecheck/SKILL.md`
- Lines 98-108: `load_check_directives` step reads config.yaml directly
- Line 100: References `hooks.kanban-codecheck.directives`
- Line 108: References `.kanban/directives/{name}/DIRECTIVE.md`

**Required changes for kanban-codecheck:**
1. Line 100: Change `hooks.kanban-codecheck.directives` → `directives.kanban-codecheck`
2. Line 108: Change `.kanban/directives/{name}/DIRECTIVE.md` → `.kanban/directives/{name}.xml`
3. Update examples throughout the file that reference directive paths (lines 235, 276, 313, 361, 427)

**3.5 Phase-appropriate validation:**

Not all validation types make sense for all phases:
- `kanban-scope`, `kanban-plan`: Checklist validation only (no code changes yet)
- `kanban-implement`, `kanban-rework`: All validation types (command, pattern, checklist)
- `kanban-codecheck`: All validation types (final verification)

To handle this, the `directive-compliance` partial should check the current skill name and skip command/pattern checks for scope and plan.

### Phase 4: Migrate Existing Directives (This Repository)

> **Note:** This phase migrates the directives in THIS repo (claudeban) which is itself a kanban project. Future users of kanban will start fresh with XML directives.

**4.1 Migration approach:** Big bang - migrate all 7 directives in one commit.

**4.2 Directives to migrate** (in `.kanban/directives/` of this repo):
1. architecture
2. typescript
3. vue-integration
4. tsdoc
5. code-review
6. planning
7. testing

**4.3 For each directive:**
1. Read existing `.kanban/directives/{name}/DIRECTIVE.md`
2. Extract content into XML sections:
   - Quick Reference tables → `<context>` principles
   - Validation Checklist → `<validation>` checks
   - Forbidden Patterns → `<validation type="pattern">`
   - Common Violations → `<examples type="violation">`
   - Required Patterns → `<examples type="correct">`
3. Write `.kanban/directives/{name}.xml` (flat file, not folder)
4. Run `node .kanban/scripts/validate-directive.cjs {name}`
5. Delete old `.kanban/directives/{name}/` folder

**4.4 Update `.kanban/config.yaml`** (this repo):
Change from:
```yaml
hooks:
  kanban-implement:
    directives: [architecture, typescript]
    product: []
    engineering: []
```
To:
```yaml
directives:
  kanban-implement:
    - architecture
    - typescript
```

**4.5 Single commit:** `refactor: migrate directives to XML format`

---

## Part 4: Skill Loading and Compliance Flow

### Flow Overview
```
Skill starts
    │
    ▼
┌─────────────────────────────────────────┐
│  {{> load-directives skill="X"}}        │
│  • Call get-skill-config.cjs            │
│  • Read each directive XML              │
│  • Apply <context> principles           │
│  • Apply <process> rules for phase X    │
└─────────────────────────────────────────┘
    │
    ▼
    ... skill executes its main work ...
    │
    ▼
┌─────────────────────────────────────────┐
│  {{> directive-compliance}}             │
│  • Re-read each directive XML           │
│  • Run <validation> checks              │
│  • Show <examples> if violations found  │
│  • Prompt to fix or continue            │
└─────────────────────────────────────────┘
    │
    ▼
Skill completes
```

### Partial: load-directives.md
```xml
<step name="load_directives">
  <command>node .kanban/scripts/get-skill-config.cjs kanban-{{skill}}</command>
  <branch condition="directives.length > 0">
    <warning>Directives are MANDATORY.</warning>
    <action>For EACH directive where exists is true:</action>
    <action>Read the directive XML at path</action>
    <action>Apply `<context>` principles as ongoing mindset</action>
    <action>Apply `<process>` rules where phase matches "{{skill}}"</action>
    <note>Validation checks run later in directive_compliance step</note>
  </branch>
</step>
```

### Partial: directive-compliance.md
```xml
<step name="directive_compliance">
  <action>For each directive loaded earlier:</action>
  <action>Re-read the directive XML</action>

  <action>Run validation checks:</action>
  <branch condition="type=command">
    <command>{run element content}</command>
    <validate>{expect element content}</validate>
  </branch>
  <branch condition="type=pattern">
    <action>Check modified/created files against forbidden/required patterns</action>
  </branch>
  <branch condition="type=checklist">
    <action>Self-assess each item</action>
  </branch>

  <branch condition="any check fails">
    <output>Directive violation: {check id} - {reason}</output>
    <action>Show relevant examples from directive</action>
    <prompt>Fix now or acknowledge and continue?</prompt>
  </branch>
</step>
```

### Skill Partial Usage
Each skill uses these partials like this:
```markdown
<process>
  <step name="load_workflow">...</step>

  {{> load-directives skill="implement"}}

  <step name="main_work">...</step>

  {{> directive-compliance}}

  <step name="output_result">...</step>
</process>
```

---

## Part 5: Implementation Tasks

### Source File Locations
```
apps/kanban/src/
├── content/
│   ├── kanban-templates/
│   │   ├── directive.xml         # NEW: XML template (replaces directive.md)
│   │   └── config.yaml           # UPDATE: new directives structure
│   ├── partials/
│   │   ├── load-directives.md    # RENAME from hook-config.md + UPDATE
│   │   └── directive-compliance.md  # NEW: compliance step partial
│   └── skills/
│       └── kanban-directive/
│           └── SKILL.md          # NEW: directive creation skill
└── scripts/
    ├── get-skill-config.ts       # RENAME from get-hook-config.ts + UPDATE
    └── validate-directive.ts     # NEW: directive XML validator
```

---

### Task 1: Foundation - Templates & Scripts

**1.1 Create directive.xml template**
- [ ] Create `apps/kanban/src/content/kanban-templates/directive.xml`
- [ ] Use schema from Part 2 (with comments explaining each section)
- [ ] Delete `apps/kanban/src/content/kanban-templates/directive.md`

**1.2 Update config.yaml template**
- [ ] Edit `apps/kanban/src/content/kanban-templates/config.yaml`
- [ ] Replace `hooks:` structure with `directives:` structure (see Breaking Changes section)
- [ ] Migrate all 19 hooks to new structure:

**Complete list of hooks to migrate (19 total):**
| Old (hooks.{name}) | New (directives.{name}) |
|-------------------|------------------------|
| kanban-status | directives.kanban-status |
| kanban-create | directives.kanban-create |
| kanban-refine | directives.kanban-refine |
| kanban-scope | directives.kanban-scope |
| kanban-plan | directives.kanban-plan |
| kanban-implement | directives.kanban-implement |
| kanban-save | directives.kanban-save |
| kanban-codecheck | directives.kanban-codecheck |
| kanban-approve | directives.kanban-approve |
| kanban-docs | directives.kanban-docs |
| kanban-merge | directives.kanban-merge |
| kanban-rework | directives.kanban-rework |
| kanban-map-product | directives.kanban-map-product |
| kanban-define-product | directives.kanban-define-product |
| kanban-map-engineering | directives.kanban-map-engineering |
| kanban-view | directives.kanban-view |
| kanban-report-label | directives.kanban-report-label |
| kanban-report-task | directives.kanban-report-task |
| kanban-report-user | directives.kanban-report-user |

- [ ] Remove `product: []` and `engineering: []` from old structure (now just arrays)
- [ ] Update header comments (lines 1-9):
  - Line 7: Change `DIRECTIVE.md` → `.xml`
  - Update schema description to reflect new structure

**1.3 Create validate-directive.ts**
- [ ] Create `apps/kanban/src/scripts/validate-directive.ts`
- [ ] Use `fast-xml-parser` for XML parsing
- [ ] Implement validations listed in Phase 1.2
- [ ] Return JSON: `{ valid: boolean, errors: string[] }`

**1.4 Rename and update get-hook-config.ts**
- [ ] Rename `apps/kanban/src/scripts/get-hook-config.ts` → `get-skill-config.ts`
- [ ] Change config read from `config.hooks[skill].directives` to `config.directives[skill]`
- [ ] Change directive path from `{name}/DIRECTIVE.md` to `{name}.xml`

**1.5 Update other scripts referencing hooks**
- [ ] Run: `grep -r "hooks" apps/kanban/src/scripts/`
- [ ] Update each script to use new `config.directives` structure

---

### Task 2: Partials

**2.1 Rename and update hook-config partial**
- [ ] Rename `apps/kanban/src/content/partials/hook-config.md` → `load-directives.md`
- [ ] Update content per Phase 3.1 specification
- [ ] Change `{{command}}` variable to `{{skill}}`

**2.2 Create directive-compliance partial**
- [ ] Create `apps/kanban/src/content/partials/directive-compliance.md`
- [ ] Use content from Phase 3.2 specification

**2.3 Update other partials referencing hooks**
- [ ] `apps/kanban/src/content/partials/directory-reference.md` (line 8)
  - Change "custom instructions for hooks" → "custom instructions for skills"
- [ ] `apps/kanban/src/content/partials/helper-scripts.md` (lines 29, 34)
  - Line 29: Change `get-hook-config.cjs` → `get-skill-config.cjs`
  - Line 29: Change `{hook}` parameter to `{skill}`
  - Line 34: Change `DIRECTIVE.md` → `.xml` in example JSON

---

### Task 3: Skills

**3.1 Create kanban-directive skill**
- [ ] Create `apps/kanban/src/content/skills/kanban-directive/SKILL.md`
- [ ] Use full definition from Appendix A

**3.2 Update skills using hook-config partial (9 skills)**

For each skill, make these changes:
1. Replace `{{> hook-config command="X"}}` with `{{> load-directives skill="X"}}`
2. Add `{{> directive-compliance}}` before final output step

- [ ] `apps/kanban/src/content/skills/kanban-create/SKILL.md` (line 53)
- [ ] `apps/kanban/src/content/skills/kanban-scope/SKILL.md` (line 83)
- [ ] `apps/kanban/src/content/skills/kanban-plan/SKILL.md` (line 185)
- [ ] `apps/kanban/src/content/skills/kanban-implement/SKILL.md` (line 159)
- [ ] `apps/kanban/src/content/skills/kanban-save/SKILL.md` (line 80)
- [ ] `apps/kanban/src/content/skills/kanban-docs/SKILL.md` (line 93)
- [ ] `apps/kanban/src/content/skills/kanban-approve/SKILL.md` (line 81)
- [ ] `apps/kanban/src/content/skills/kanban-merge/SKILL.md` (line 77)
- [ ] `apps/kanban/src/content/skills/kanban-rework/SKILL.md` (line 93)

**3.3 Update kanban-codecheck (SPECIAL CASE - does not use partial)**

This skill reads config.yaml directly, not via the hook-config partial:
- [ ] Line 100: Change `hooks.kanban-codecheck.directives` → `directives.kanban-codecheck`
- [ ] Line 108: Change `.kanban/directives/{name}/DIRECTIVE.md` → `.kanban/directives/{name}.xml`
- [ ] Update all examples that reference `.kanban/directives/{name}/DIRECTIVE.md` paths

---

### Task 4: Migrate This Repo's Directives

**4.1 Convert existing directives to XML**
- [ ] `.kanban/directives/architecture/DIRECTIVE.md` → `.kanban/directives/architecture.xml`
- [ ] `.kanban/directives/typescript/DIRECTIVE.md` → `.kanban/directives/typescript.xml`
- [ ] `.kanban/directives/vue-integration/DIRECTIVE.md` → `.kanban/directives/vue-integration.xml`
- [ ] `.kanban/directives/tsdoc/DIRECTIVE.md` → `.kanban/directives/tsdoc.xml`
- [ ] `.kanban/directives/code-review/DIRECTIVE.md` → `.kanban/directives/code-review.xml`
- [ ] `.kanban/directives/planning/DIRECTIVE.md` → `.kanban/directives/planning.xml`
- [ ] `.kanban/directives/testing/DIRECTIVE.md` → `.kanban/directives/testing.xml`

**4.2 Update this repo's config**
- [ ] Edit `.kanban/config.yaml` to use new `directives:` structure

**4.3 Delete old directive folders**
- [ ] Delete `.kanban/directives/architecture/`
- [ ] Delete `.kanban/directives/typescript/`
- [ ] Delete `.kanban/directives/vue-integration/`
- [ ] Delete `.kanban/directives/tsdoc/`
- [ ] Delete `.kanban/directives/code-review/`
- [ ] Delete `.kanban/directives/planning/`
- [ ] Delete `.kanban/directives/testing/`

---

### Task 5: Build & Test

**5.1 Build**
- [ ] Run kanban build to generate output files
- [ ] Verify `.claude/skills/` contains updated skills
- [ ] Verify `.kanban/scripts/` contains new scripts

**5.2 Validate**
- [ ] Run `node .kanban/scripts/validate-directive.cjs architecture`
- [ ] Run validation on all 7 migrated directives

**5.3 Test kanban-directive skill**
- [ ] Run `/kanban-directive test-directive`
- [ ] Complete Q&A flow
- [ ] Verify XML file created
- [ ] Verify config.yaml updated

**5.4 Test full workflow**
- [ ] Create a test task
- [ ] Run `/kanban-scope` - verify directives load and compliance runs
- [ ] Run `/kanban-plan` - verify directives load and compliance runs
- [ ] Run `/kanban-implement` - verify all validation types work
- [ ] Run `/kanban-codecheck` - verify compliance catches violations

---

### Commit Strategy

1. **First commit:** Source changes (Tasks 1-3)
   - `feat(kanban): add XML directive system with compliance validation`

2. **Second commit:** Migration (Task 4)
   - `refactor: migrate directives to XML format`

3. **Third commit:** Build output (Task 5.1)
   - `build: regenerate kanban output files`

---

## Appendix A: kanban-directive Skill Definition

```markdown
---
name: kanban-directive
description: Create a new directive through conversational Q&A to define rules, validation, and examples for workflow phases
allowed-tools: Read, Write, Bash(node *, git add *, git commit *, git status), AskUserQuestion
argument-hint: "[directive name]"
disable-model-invocation: true
---

# Create Directive

<purpose>
Create a new directive through conversational Q&A. Captures context principles, process rules, validation checks, and examples in a structured XML format.
</purpose>

<context>
{{> directory-reference}}

{{> helper-scripts show_get_date_time=true}}

<note>Directives are stored at `.kanban/directives/{name}.xml`</note>
<note>Directives are linked to skills via `.kanban/config.yaml`</note>
</context>

<prohibited>
- Do not skip the validation step
- Do not skip the commit step
- Do not create directives without understanding their purpose
</prohibited>

<process>
  <step name="verify_kanban_exists">
    <validate>Check that `.kanban/directives/` directory exists</validate>
    <branch condition="directory doesn't exist">
      <output>Error: Kanban not initialized. Run `npx claude-kanban init` first.</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="get_directive_name" outputs="name">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as name</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <prompt>What should this directive be called? (lowercase, hyphenated, e.g., "code-style", "testing")</prompt>
    </branch>
    <validate>Name must be lowercase, alphanumeric with hyphens only</validate>
    <validate>Check `.kanban/directives/{name}.xml` doesn't already exist</validate>
    <branch condition="directive already exists">
      <output>Error: Directive "{name}" already exists at .kanban/directives/{name}.xml</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="understand_purpose">
    <note>This is a **conversational session** to understand the directive's purpose.</note>

    <prompt>What is this directive for? What problem does it solve?</prompt>

    <action>Based on the answer, ask follow-up questions:</action>
    <prompt>Is this about code constraints, process rules, running checks, or general guidance?</prompt>
    <prompt>Which workflow phases should this apply to? (scope, plan, implement, codecheck, rework)</prompt>

    <action>Summarize understanding before proceeding</action>
    <output>
**I understand this directive will:**
- Purpose: {summary}
- Apply to phases: {phases}
- Type: {code constraints / process rules / validation / guidance}

**Does this sound right?**
    </output>

    <branch condition="user confirms">
      <action>Proceed to section collection</action>
    </branch>
    <branch condition="user corrects">
      <action>Update understanding and confirm again</action>
    </branch>
  </step>

  <step name="determine_sections">
    <action>Use AskUserQuestion tool with:
      - header: "Sections"
      - question: "Which sections should this directive have?"
      - options:
        - label: "Context", description: "Principles/mindset to maintain throughout"
        - label: "Process", description: "Rules for specific phases (scope, plan, implement, etc.)"
        - label: "Validation", description: "Checks to run (commands, patterns, checklists)"
        - label: "Examples", description: "Correct and incorrect code/behavior examples"
      - multiSelect: true
    </action>
  </step>

  <step name="collect_context" when="user selected Context">
    <note>Gather principles/mindset items</note>

    <prompt>What principles should the LLM keep in mind while working?</prompt>
    <prompt>Are there any key concepts or mental models to maintain?</prompt>

    <action>For each principle mentioned:</action>
    <action>Ask for keywords that indicate when this principle is relevant</action>

    <output>
**Context principles captured:**
- C1: {principle} (keywords: {keywords})
- C2: {principle} (keywords: {keywords})

**Any more principles to add?**
    </output>

    <branch condition="user has more">
      <action>Continue collecting</action>
    </branch>
  </step>

  <step name="collect_process" when="user selected Process">
    <note>Gather phase-specific rules</note>

    <prompt>What rules should apply during specific phases?</prompt>

    <action>For each rule mentioned:</action>
    <action>Ask which phase(s) it applies to (scope, plan, implement, codecheck, rework)</action>

    <output>
**Process rules captured:**
- P1: {rule} (phase: {phase})
- P2: {rule} (phase: {phases})

**Any more rules to add?**
    </output>

    <branch condition="user has more">
      <action>Continue collecting</action>
    </branch>
  </step>

  <step name="collect_validation" when="user selected Validation">
    <note>Gather validation checks</note>

    <prompt>What checks should run to verify compliance?</prompt>

    <action>For each check mentioned, determine type:</action>
    <action>Use AskUserQuestion tool with:
      - header: "Check type"
      - question: "What type of check is '{check}'?"
      - options:
        - label: "Command", description: "Run a command (e.g., pnpm test)"
        - label: "Pattern", description: "Check file contents against regex"
        - label: "Checklist", description: "Manual verification items"
      - multiSelect: false
    </action>

    <branch condition="type is Command">
      <prompt>What command should run?</prompt>
      <prompt>What does success look like?</prompt>
    </branch>
    <branch condition="type is Pattern">
      <prompt>What pattern should be forbidden or required?</prompt>
      <prompt>Which files should this apply to? (glob pattern)</prompt>
      <prompt>Why is this pattern forbidden/required?</prompt>
    </branch>
    <branch condition="type is Checklist">
      <prompt>What items should be manually verified?</prompt>
    </branch>

    <action>Ask for severity: error, warning, or info</action>

    <output>
**Validation checks captured:**
- V1: {type} - {description} (severity: {severity})
- V2: {type} - {description} (severity: {severity})

**Any more checks to add?**
    </output>

    <branch condition="user has more">
      <action>Continue collecting</action>
    </branch>
  </step>

  <step name="collect_examples" when="user selected Examples">
    <note>Gather correct and incorrect examples</note>

    <prompt>Can you show me an example of CORRECT behavior/code?</prompt>
    <prompt>Why is this correct?</prompt>

    <prompt>Can you show me an example of INCORRECT behavior/code?</prompt>
    <prompt>Why is this wrong?</prompt>

    <action>Link each example to a relevant rule/check ID if applicable</action>

    <output>
**Examples captured:**
- E1 (correct): {code/description} - {explanation}
- E2 (violation): {code/description} - {explanation}

**Any more examples to add?**
    </output>

    <branch condition="user has more">
      <action>Continue collecting</action>
    </branch>
  </step>

  <step name="generate_xml" outputs="directivePath">
    <command description="Get current date">node .kanban/scripts/get-date-time.cjs</command>
    <action>Generate directive XML from collected content</action>
    <action>Write to `.kanban/directives/{name}.xml`</action>

    <example_code lang="xml">
<?xml version="1.0" encoding="UTF-8"?>
<directive name="{name}" version="1"
           created="{date}" updated="{date}">

  <description>
    {purpose summary from understand_purpose step}
  </description>

  <!-- Only include sections that were selected -->
  <context>
    <principle id="C1" keywords="{keywords}">{principle}</principle>
  </context>

  <process>
    <rule id="P1" phase="{phase}">{rule}</rule>
  </process>

  <validation>
    <check id="V1" type="{type}" severity="{severity}">
      <!-- type-specific children -->
    </check>
  </validation>

  <examples>
    <example ref="{rule-id}" type="{correct|violation}">
      <code><![CDATA[{code}]]></code>
      <explanation>{explanation}</explanation>
    </example>
  </examples>

</directive>
    </example_code>
  </step>

  <step name="validate">
    <command>node .kanban/scripts/validate-directive.cjs {name}</command>
    <branch condition="validation fails">
      <output>Validation errors: {errors}</output>
      <action>Fix errors and re-validate</action>
    </branch>
    <branch condition="validation passes">
      <output>Directive validated successfully</output>
    </branch>
  </step>

  <step name="link_to_skills">
    <action>Use AskUserQuestion tool with:
      - header: "Skills"
      - question: "Which skills should load this directive?"
      - options:
        - label: "kanban-scope", description: "During requirements research"
        - label: "kanban-plan", description: "During implementation planning"
        - label: "kanban-implement", description: "During code implementation"
        - label: "kanban-codecheck", description: "During code review"
      - multiSelect: true
    </action>

    <action>Read `.kanban/config.yaml`</action>
    <action>For each selected skill, add {name} to `directives.{skill-name}` array</action>
    <action>Write updated config.yaml</action>

    <output>
**Directive linked to skills:**
{list of selected skills}

Updated `.kanban/config.yaml`
    </output>
  </step>

  <step name="commit">
    <note>Format: `docs: create directive - {name}`</note>
    <command>git add .kanban/directives/{name}.xml .kanban/config.yaml</command>
    <command>git commit -m "docs: create directive - {name}"</command>
  </step>

  <step name="output_result">
    <output>Directive created: .kanban/directives/{name}.xml</output>
    <output>Linked to skills: {selected skills}</output>
    <output>Commit: {hash}</output>
    <output>
**Next: Test by running a skill that uses this directive**
    </output>
    {{> skill-complete}}
  </step>
</process>

<success_criteria>
- Directive file exists at `.kanban/directives/{name}.xml`
- Directive XML is valid (passes validate-directive.cjs)
- At least one section (context, process, validation, or examples) is present
- config.yaml updated with directive in selected skills
- Git log shows `docs: create directive -`
</success_criteria>

<example>
User: `/kanban-directive code-style`

```
Creating directive "code-style"...

What is this directive for? What problem does it solve?
> Enforce consistent code formatting and naming conventions

Is this about code constraints, process rules, running checks, or general guidance?
> Code constraints and validation checks

Which workflow phases should this apply to?
> implement and codecheck

I understand this directive will:
- Purpose: Enforce consistent code formatting and naming conventions
- Apply to phases: implement, codecheck
- Type: Code constraints + validation

Does this sound right? > Yes

Which sections should this directive have?
[x] Context - Principles/mindset
[x] Validation - Checks to run
[x] Examples - Correct/incorrect examples
[ ] Process - Phase-specific rules

What principles should the LLM keep in mind?
> Use descriptive variable names, prefer const over let

Keywords for "descriptive variable names"?
> naming, variables, identifiers

Context principles captured:
- C1: Use descriptive variable names (keywords: naming, variables, identifiers)
- C2: Prefer const over let (keywords: const, let, variables)

Any more? > No

What checks should run to verify compliance?
> Run eslint, check for any `let` that could be `const`

What type of check is "Run eslint"? > Command
What command should run? > pnpm lint
What does success look like? > Exit code 0, no errors
Severity? > error

What type of check is "check for let"? > Pattern
What pattern should be forbidden? > let\s+\w+\s*=
Which files? > **/*.ts
Why? > Prefer const for immutability
Severity? > warning

Validation checks captured:
- V1: Command - pnpm lint (severity: error)
- V2: Pattern - no unnecessary let (severity: warning)

Any more? > No

Can you show me a CORRECT example?
> const userId = 'abc123';
Why is this correct?
> Descriptive name, uses const

Can you show me an INCORRECT example?
> let x = 'abc123';
Why is this wrong?
> Non-descriptive name, uses let unnecessarily

Examples captured:
- E1 (correct): const userId = 'abc123' - Descriptive, immutable
- E2 (violation): let x = 'abc123' - Non-descriptive, mutable

Any more? > No

Generating directive XML...
Validating...
Directive validated successfully.

Which skills should load this directive?
[x] kanban-implement - During code implementation
[x] kanban-codecheck - During code review
[ ] kanban-scope - During requirements research
[ ] kanban-plan - During implementation planning

Directive linked to skills:
- kanban-implement
- kanban-codecheck

Updated .kanban/config.yaml

Directive created: .kanban/directives/code-style.xml
Linked to: kanban-implement, kanban-codecheck
Commit: c4d5e6f docs: create directive - code-style

Next: Test by running a skill that uses this directive
```
</example>

<next_steps>
Test by running `/kanban-implement` or `/kanban-codecheck` on a task.
</next_steps>
```

---

## Appendix B: Example Migrated Directive

**Before:** `.kanban/directives/architecture/DIRECTIVE.md` (markdown folder)

**After:** `.kanban/directives/architecture.xml` (flat file)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<directive name="architecture" version="1"
           created="2025-01-15" updated="2025-02-20">

  <description>
    Validate that the codebase's dependency graph is a DAG with clear layering
  </description>

  <context>
    <principle id="C1" keywords="policy,decision,when,should">
      Policy belongs in orchestrators, mechanism in capabilities
    </principle>
    <principle id="C2" keywords="imports,dependencies,direction">
      Dependencies flow inward: Computer ← Capability ← Orchestrator
    </principle>
    <principle id="C3" keywords="naming,suffix,categorization">
      Every module must be categorized with suffix: .computer.ts, .capability.ts, .orchestrator.ts
    </principle>
  </context>

  <process>
    <rule id="P1" phase="plan">
      Identify which architectural layer each affected file belongs to
    </rule>
    <rule id="P2" phase="implement">
      Categorize every new module with correct suffix
    </rule>
    <rule id="P3" phase="implement">
      When creating pure functions, wrap them in a computer factory
    </rule>
  </process>

  <validation>
    <check id="V1" type="command" severity="error">
      <run>pnpm check:dpdm</run>
      <expect>No circular dependencies (exit code 0)</expect>
    </check>

    <check id="V2" type="pattern" severity="error" files="*.capability.ts">
      <forbidden>import.*\.capability\.</forbidden>
      <reason>Capabilities cannot import other capabilities (lateral dependency)</reason>
    </check>

    <check id="V3" type="pattern" severity="error" files="*.capability.ts">
      <forbidden>(ensure|getOrCreate|maybe)[A-Z]</forbidden>
      <reason>Policy logic (ensure/getOrCreate/maybe) belongs in orchestrators</reason>
    </check>

    <check id="V4" type="pattern" severity="error" files="**/*.ts">
      <forbidden>(Manager|Service|Helper|Utils)(&lt;|$)</forbidden>
      <reason>Ambiguous naming - use computer/capability/orchestrator suffix</reason>
    </check>

    <check id="V5" type="checklist" severity="warning">
      <item>All new modules have correct suffix (.computer.ts, .capability.ts, .orchestrator.ts)</item>
      <item>No policy logic in capabilities</item>
      <item>Computers only import other computers</item>
      <item>Orchestrators use DI for capabilities</item>
    </check>
  </validation>

  <examples>
    <example ref="V3" type="violation">
      <code><![CDATA[
// WRONG: Policy in capability
function ensureSession(): Session {
  if (session && session.isValid) return session;  // Policy!
  return createSession();
}
      ]]></code>
      <explanation>Capability decides WHEN to create - this is policy, belongs in orchestrator</explanation>
    </example>

    <example ref="V3" type="correct">
      <code><![CDATA[
// CORRECT: Mechanism in capability
function createSession(): Session {
  return api.createSession();
}

// Policy in orchestrator
function getSession(): Session {
  if (session && session.isValid) return session;
  return createSession();
}
      ]]></code>
      <explanation>Capability provides mechanism (createSession), orchestrator decides when (getSession)</explanation>
    </example>

    <example ref="V2" type="violation">
      <code><![CDATA[
// WRONG: Capability importing capability
import { createSettingsCapability } from './settings.capability';

export function createTasksCapability() {
  const settings = createSettingsCapability();  // Forbidden!
}
      ]]></code>
      <explanation>Lateral dependency - both capabilities should be injected into orchestrator</explanation>
    </example>

    <example ref="V2" type="correct">
      <code><![CDATA[
// CORRECT: Orchestrator composes capabilities
export function createAppOrchestrator(deps: {
  settingsCapability: SettingsCapability;
  tasksCapability: TasksCapability;
}) {
  // Orchestrator coordinates both
}
      ]]></code>
      <explanation>Orchestrator receives both via DI, no lateral capability dependencies</explanation>
    </example>
  </examples>

</directive>
```

---

## Appendix C: Principles from Existing Skills

### Context Loss Prevention Pattern
The existing skills share techniques that should apply to directives:

1. **Structured phases** with explicit outputs
2. **Immediate documentation** after each decision
3. **Validation checkpoints** that re-establish important context
4. **Self-contained artifacts** that don't depend on conversation history

### Application to Directives
- **Structured format** (XML) with explicit rule IDs
- **Compliance validation step** forces re-reading of directive rules
- **Self-contained rules** that can be referenced individually
- **Examples** provide concrete reinforcement when violations detected
