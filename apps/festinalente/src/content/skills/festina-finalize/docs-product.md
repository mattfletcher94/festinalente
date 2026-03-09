# Phase 2: Product Documentation Reference

This file contains detailed guidance for updating product documentation during `/festina-finalize`.

## 1. Analyze Product Doc Impact

Determine which product docs need attention:

```
1. Read task's <affects> element from task.xml
2. If affects has IDs:
   - Run: node .festinalente/scripts/festinalente.cjs check-product {affects IDs}
   - Parse the JSON output
3. For each doc ID in affects:
   - Read the doc file if it exists
   - Check frontmatter for `stub: true`
   - Categorize into:
     - stubDocs: Have `stub: true` (need completing)
     - existingDocs: Exist without stub (need updating)
     - missingDocs: Don't exist (need creating)
```

### Search for Unlisted Impacts

```
1. Read task description, spec, and implementation context
2. Run: node .festinalente/scripts/festinalente.cjs search-product {keywords from title/description}
3. Parse results
4. If high-scoring docs NOT in affects:
   - Output: "Suggest adding to affects: {doc IDs}"
```

### Present Analysis to User

```
Output:
Product Doc Analysis for Task {taskId}:
Will COMPLETE (stub exists): {id} - stub created during /festina-create
Will UPDATE (doc exists): {id} - {summary}
Will CREATE (new doc needed): {id}
Unaffected (internal change): {reason if applicable}

Use AskUserQuestion:
  - header: "Product docs"
  - question: "Proceed with product documentation updates?"
  - options:
    - label: "Yes (Recommended)", description: "Update/create product docs as analyzed"
    - label: "No", description: "Skip product documentation updates"
  - multiSelect: false
```

## 2. Load Smart Context

Before writing docs, load similar docs for quality reference:

```
1. Run: node .festinalente/scripts/festinalente.cjs select-context {taskId} --tier=standard --max=3 --type=product
2. Parse JSON output
3. For each doc returned:
   - Note the structure and quality patterns
   - Use as reference for formatting and detail level
```

Context tiers:
- `minimal`: Only tldr (~50 tokens)
- `standard`: tldr + summary + boundary (~200 tokens)
- `full`: Entire doc content (~500-1000 tokens)

## 3. Update Existing Docs

For docs that already exist and need updating:

```
1. Read current doc at .festinalente/product/{path}.md
2. Identify sections needing changes based on implementation
3. Make MINIMAL, focused updates:
   - Only change what THIS task implemented
   - Preserve existing content that's still accurate
   - Don't rewrite entire doc
```

### Verification Prompt

```
1. Read implemented code for this task
2. Compare to doc content
3. Use AskUserQuestion:
   - header: "Verify"
   - question: "Does this doc accurately reflect the implementation?"
   - options:
     - label: "Yes", description: "Doc is accurate"
     - label: "Needs correction", description: "Some parts need to be fixed"
   - multiSelect: false

4. If "Needs correction":
   - Ask user what needs correction
   - Make corrections
   - Re-verify with user
```

### Diagram Updates

Update diagrams when:
- Implementation changed architecture → Update Architecture diagram
- Data flow changed → Update Data Flow diagram
- UI changed → Update ASCII mockup
- New relationships added → Update relationship diagrams

## 4. Complete Stub Docs

For docs with `stub: true` that need completing:

### Remove Stub Markers

```
1. Remove `stub: true` from frontmatter
2. Remove `task: {taskId}` from frontmatter (was added during create)
```

### Required Frontmatter Fields

Fill ALL of these:

| Field | Description | Example |
|-------|-------------|---------|
| `tldr` | Single sentence, max 100 chars | "Toggle to skip all permission prompts" |
| `summary` | One sentence for LLM discovery | "User-facing setting that disables permission dialogs" |
| `keywords` | 3-5 search terms | [yolo, permissions, skip, auto-approve] |
| `aliases` | Alternative names users might use | [skip permissions, dangerous mode] |
| `boundary` | What this does NOT cover | "Does not affect Claude's internal safety checks" |
| `updated` | Current date | 2026-02-27 |

### Required Content Sections

Every completed doc needs:

1. **TL;DR blockquote** at top
   ```markdown
   > {tldr content repeated as blockquote}
   ```

2. **Overview** section with summary at end
   - What is this feature
   - Why it exists
   - High-level description

3. **How It Works** section with key workflows
   - Step-by-step explanation
   - User interactions
   - System behavior

4. **Examples** section with code snippets
   - Pull from actual implementation
   - Show realistic usage
   - Include both simple and complex cases

5. **Boundaries** section
   - What this feature does NOT do
   - Common misconceptions
   - Related features (with links)

### Diagram Completion

Analyze implemented code to generate appropriate diagrams:

```
1. Review code flow:
   - If multi-step process → sequenceDiagram
   - If branching logic → flowchart

2. Check for UI components:
   - If UI exists → ASCII mockup

3. Trace data flow:
   - If data transforms → Data Flow diagram

4. Check database models:
   - If models exist → erDiagram
```

## 4b. Transform Intent Docs

For docs that have Intent/Requirements/Boundaries body structure (created by /festina-define):

### Detect Intent Sections

```
1. For each doc in the affects list:
   - Read the doc file
   - Check if it contains an "## Intent" heading
   - If yes: this is a greenfield-defined doc that needs transformation
```

### Rewrite Intent to Overview/How It Works

```
1. Read the implemented code for features described in the doc
2. Transform the body sections:
   - "## Intent" → "## Overview" (rewrite based on what was actually built, not what was planned)
   - "## Requirements" → "## How It Works" (describe actual behavior from implementation)
   - "## Boundaries" → Keep as-is (boundaries should still be accurate)
3. Preserve all frontmatter fields unchanged
4. Verify rewritten content matches the implementation, not just the original intent
```

### Verification

```
1. Use AskUserQuestion:
   - header: "Intent Rewrite"
   - question: "Does this rewrite accurately reflect the implementation?"
   - options:
     - label: "Yes", description: "Rewrite is accurate"
     - label: "Needs correction", description: "Some parts need fixing"
   - multiSelect: false
2. If needs correction: ask what, fix, re-verify
```

## 5. Create New Docs

For docs that don't exist and aren't stubs:

### Setup

```
1. Create domain folder if needed: .festinalente/product/{domain}/
2. Run: node .festinalente/scripts/festinalente.cjs get-date-time
3. Use date field from output
```

### For Features

Use template: `.festinalente/templates/product-feature.md`

Fill ALL frontmatter:
- `id: {domain}/{feature}`
- `type: feature`
- `title: {Human-readable title}`
- `tldr:` (see above)
- `summary:` (see above)
- `keywords:` (see above)
- `aliases:` (see above)
- `boundary:` (see above)
- `references:` IDs of docs this one mentions
- `uses:` IDs of systems/patterns this depends on
- `updated:` Current date

Fill sections: Overview, How It Works, Examples, Boundaries, Limitations

### For Concepts

Use template: `.festinalente/templates/product-concept.md`

Same frontmatter fields as features.

Fill sections: Definition, Examples, Rules & Constraints, Boundaries

### Scope Focus

**CRITICAL:** Keep scope focused on THIS feature/concept only. Don't document related features unless they're in the `affects` list.

## 6. Handle Internal Changes

For tasks that don't affect user-facing behavior:

```
1. Check if:
   - affects is empty, AND
   - labels include [bug, refactor, chore]

2. Analyze if any product behavior actually changed

3. If no user-facing changes:
   - Output: "No product doc updates needed - internal change"
   - Log reason
   - Proceed without doc changes
```

## 7. Update Domain Index

When new docs are created in a domain:

```
1. Check if .festinalente/product/{domain}/_index.md exists

2. If exists:
   - Read the _index.md file
   - Add new doc to appropriate section (features list or concepts list)
   - Add one-line description matching the doc's tldr

3. If doesn't exist:
   - Consider creating one if multiple docs now exist in domain
```

### Example _index.md Entry

```markdown
## Features

- **[yolo-mode](yolo-mode.md)** - Toggle to skip all permission prompts
- **[settings-panel](settings-panel.md)** - Configure Claude Code preferences
```

## 8. Update Glossary

When new terms are introduced:

```
1. Identify any new terms introduced by this feature
2. Check if terms exist in .festinalente/glossary.yaml
3. If new terms found:
   - Read glossary.yaml
   - Add new entries with:
     - term: The canonical name
     - aliases: Alternative names/spellings
     - definition: Brief explanation
   - Write updated glossary
   - Output: "Added to glossary: {terms}"
```

### Example Glossary Entry

```yaml
- term: "Yolo mode"
  aliases: ["skip permissions", "dangerous mode", "auto-approve"]
  definition: "Mode that auto-approves all permission requests"
```

## 9. Validate Docs

After creating or updating docs:

```
1. Run: node .festinalente/scripts/festinalente.cjs validate-docs {changed doc paths}

2. If passes:
   - Output: "Quality check passed"

3. If fails:
   - Output: "Quality issues found:"
   - List each issue
   - Fix the issues
   - Re-run validation
   - Repeat until passes
```

## Summary Flow

```
1. Check affects field in task
   └─ If empty + internal labels: skip docs

2. Categorize docs: stub / existing / missing

3. Search for unlisted impacts

4. Present analysis, get user approval

5. Load smart context for reference

6. For each doc:
   ├─ Existing: minimal updates + verify
   ├─ Stub: complete all fields/sections
   └─ Missing: create from template

6b. Intent docs: rewrite Intent→Overview/How-It-Works from implementation

7. Update domain _index.md

8. Update glossary if new terms

9. Run validation

10. Proceed to complete
```
