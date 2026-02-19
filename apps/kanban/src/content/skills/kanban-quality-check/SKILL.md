---
name: kanban-quality-check
description: Audit all documentation and generate quality report
allowed-tools: Read, Bash(node *)
---

# Skill: Quality Check

<purpose>
Audit all product and engineering documentation, identify quality issues, and generate a report.
</purpose>

<context>
<note>**Quality Checks:**</note>
- `has-tldr`: tldr field exists and has >10 chars (error)
- `has-summary`: summary field exists and has >50 chars (error)
- `has-keywords`: keywords array has >=2 items (warning)
- `has-overview`: body contains "## Overview" section (error)
- `has-examples`: body contains code blocks (warning)
- `has-boundaries`: boundary field or "## Boundaries" section exists (warning)
- `not-too-short`: body has >300 chars (warning)
- `not-too-long`: body has <5000 chars (warning)
</context>

<process>
  <step name="run_quality_checks">
    <command>node .kanban/scripts/validate-docs.cjs --type=product</command>
    <action>Parse JSON output</action>
    <action>Store product results</action>

    <command>node .kanban/scripts/validate-docs.cjs --type=engineering</command>
    <action>Parse JSON output</action>
    <action>Store engineering results</action>
  </step>

  <step name="generate_report">
    <output>
Quality Report
════════════════════════════════════════════════════════════════

**Product Documentation:**
- Total: {product.totalDocs}
- Passing: {product.passing}
- Warnings: {product.warnings}
- Errors: {product.errors}

**Engineering Documentation:**
- Total: {engineering.totalDocs}
- Passing: {engineering.passing}
- Warnings: {engineering.warnings}
- Errors: {engineering.errors}
    </output>

    <branch condition="errors > 0">
      <output>
ERRORS (must fix):
────────────────────────────────────────
      </output>
      <action>For each doc with status='error':</action>
      <output>- {doc.id}: {failing checks with severity='error'}</output>
    </branch>

    <branch condition="warnings > 0">
      <output>
WARNINGS (should fix):
────────────────────────────────────────
      </output>
      <action>For each doc with status='warning':</action>
      <output>- {doc.id}: {failing checks with severity='warning'}</output>
    </branch>

    <branch condition="errors == 0 AND warnings == 0">
      <output>All documentation passes quality checks!</output>
    </branch>
  </step>

  <step name="suggest_next_steps">
    <branch condition="errors > 0 OR warnings > 0">
      <output>
To fix these issues interactively:
```
/clear
/kanban-improve-docs
```
      </output>
    </branch>
  </step>
</process>

<success_criteria>
- Quality report generated
- All docs checked
- Issues categorized by severity
- Next steps shown if issues found
</success_criteria>

<example>
User: `/kanban-quality-check`

```
Quality Report
════════════════════════════════════════════════════════════════

**Product Documentation:**
- Total: 8
- Passing: 5
- Warnings: 2
- Errors: 1

**Engineering Documentation:**
- Total: 6
- Passing: 4
- Warnings: 2
- Errors: 0

ERRORS (must fix):
────────────────────────────────────────
- auth/login: missing tldr, missing Overview section

WARNINGS (should fix):
────────────────────────────────────────
- auth/register: no code examples
- users/profile: only 1 keyword
- systems/api: no boundaries defined
- patterns/middleware: content too short

To fix these issues interactively:
/clear
/kanban-improve-docs
```
</example>
