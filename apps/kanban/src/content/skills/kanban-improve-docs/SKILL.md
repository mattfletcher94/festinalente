---
name: kanban-improve-docs
description: Interactively fix quality issues in documentation
allowed-tools: Read, Write, Bash(node *, git add *, git commit *), AskUserQuestion
---

# Skill: Improve Docs

<purpose>
Interactively fix quality issues in product and engineering documentation.
</purpose>

<context>
<note>**Quality Checks:**</note>
- `has-tldr`: tldr field exists and has >10 chars
- `has-summary`: summary field exists and has >50 chars
- `has-keywords`: keywords array has >=2 items
- `has-overview`: body contains "## Overview" section
- `has-examples`: body contains code blocks
- `has-boundaries`: boundary field or "## Boundaries" section exists
- `not-too-short`: body has >300 chars
- `not-too-long`: body has <5000 chars
</context>

<process>
  <step name="run_quality_checks">
    <command>node .kanban/scripts/validate-docs.cjs</command>
    <action>Parse JSON output</action>
    <action>Filter to docs with errors or warnings</action>

    <branch condition="no issues found">
      <output>All documentation passes quality checks!</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="present_issues">
    <output>
Found {count} docs with quality issues:

ERRORS ({error_count}):
{list of docs with errors}

WARNINGS ({warning_count}):
{list of docs with warnings}
    </output>

    <action>Use AskUserQuestion with:
      - header: "Fix docs"
      - question: "Which docs would you like to improve?"
      - options:
        - label: "All errors (Recommended)", description: "Fix all docs with errors first"
        - label: "All issues", description: "Fix all errors and warnings"
        - label: "Select specific", description: "Choose which docs to fix"
      - multiSelect: false
    </action>
  </step>

  <step name="fix_issues">
    <action>For each selected doc:</action>

    <substep name="read_doc">
      <action>Read the doc file</action>
      <action>Identify failing checks</action>
    </substep>

    <substep name="fix_tldr" when="has-tldr failed">
      <action>Read the doc content</action>
      <action>Use AskUserQuestion tool with:
        - header: "TL;DR"
        - question: "The tldr should be a single sentence (max 100 chars). What should the tldr be?"
        - options:
          - label: "Generate", description: "Auto-generate based on doc content"
          - label: "Skip", description: "I'll add this later"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a custom tldr</note>
      <action>Update frontmatter with new tldr</action>
    </substep>

    <substep name="fix_summary" when="has-summary failed">
      <action>Read the doc content</action>
      <action>Use AskUserQuestion tool with:
        - header: "Summary"
        - question: "The summary should be 2-3 sentences explaining this doc (for LLM discovery). What should the summary be?"
        - options:
          - label: "Generate", description: "Auto-generate based on doc content"
          - label: "Skip", description: "I'll add this later"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a custom summary</note>
      <action>Update frontmatter with new summary</action>
    </substep>

    <substep name="fix_keywords" when="has-keywords failed">
      <action>Read the doc content</action>
      <action>Suggest keywords based on content</action>
      <action>Use AskUserQuestion tool with:
        - header: "Keywords"
        - question: "Suggested keywords: {suggestions}. Are these good?"
        - options:
          - label: "Use suggested", description: "Use the suggested keywords"
          - label: "Skip", description: "I'll add keywords later"
        - multiSelect: false
      </action>
      <note>User can select "Other" to specify different keywords</note>
      <action>Update frontmatter with keywords</action>
    </substep>

    <substep name="fix_overview" when="has-overview failed">
      <action>Read the doc content</action>
      <action>Use AskUserQuestion tool with:
        - header: "Overview"
        - question: "This doc is missing an Overview section. Can you describe what this doc covers and why it exists?"
        - options:
          - label: "Generate", description: "Auto-generate based on doc content"
          - label: "Skip", description: "I'll add this later"
        - multiSelect: false
      </action>
      <note>User can select "Other" to provide the overview content</note>
      <action>Add ## Overview section with content</action>
    </substep>

    <substep name="fix_examples" when="has-examples failed">
      <action>Read the doc content</action>
      <action>Use AskUserQuestion tool with:
        - header: "Examples"
        - question: "This doc has no code examples. Can you provide a typical usage example?"
        - options:
          - label: "Generate", description: "Auto-generate a basic example"
          - label: "Skip", description: "I'll add examples later"
        - multiSelect: false
      </action>
      <note>User can select "Other" to provide example code</note>
      <action>Add example code block</action>
    </substep>

    <substep name="fix_boundaries" when="has-boundaries failed">
      <action>Read the doc content</action>
      <action>Use AskUserQuestion tool with:
        - header: "Boundaries"
        - question: "What does this doc NOT cover? (This helps prevent search false positives)"
        - options:
          - label: "Generate", description: "Auto-generate based on doc content"
          - label: "Skip", description: "I'll add this later"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe boundaries</note>
      <action>Update boundary field or add ## Boundaries section</action>
    </substep>

    <substep name="fix_too_short" when="not-too-short failed">
      <action>Read the doc content</action>
      <action>Use AskUserQuestion tool with:
        - header: "Expand"
        - question: "This doc is too short. What additional details should we add?"
        - options:
          - label: "Generate", description: "Auto-expand based on topic"
          - label: "Skip", description: "I'll expand this later"
        - multiSelect: false
      </action>
      <note>User can select "Other" to provide additional details</note>
      <action>Expand content based on response</action>
    </substep>

    <substep name="save_doc">
      <action>Write updated doc</action>
      <output>Updated {doc.id}</output>
    </substep>
  </step>

  <step name="verify_fixes">
    <command>node .kanban/scripts/validate-docs.cjs</command>
    <action>Parse JSON output</action>
    <action>Check if fixed docs now pass</action>

    <branch condition="all fixed docs now pass">
      <output>All selected docs now pass quality checks!</output>
    </branch>
    <branch condition="some still have issues">
      <output>Some issues remain:</output>
      <action>List remaining issues</action>
      <action>Use AskUserQuestion tool with:
        - header: "Continue"
        - question: "Would you like to fix these remaining issues now?"
        - options:
          - label: "Yes", description: "Continue fixing issues"
          - label: "No", description: "Skip, commit what we have"
        - multiSelect: false
      </action>
    </branch>
  </step>

  <step name="commit">
    <command>git add .kanban/product/ .kanban/engineering/</command>
    <command>git commit -m "docs: improve documentation quality"</command>
    <output>Documentation improvements committed.</output>
  </step>
</process>

<success_criteria>
- Quality issues identified
- User guided through fixes
- Docs updated with improvements
- Changes committed
</success_criteria>

<example>
User: `/kanban-improve-docs`

```
Found 3 docs with quality issues:

ERRORS (1):
- auth/login: missing tldr, missing Overview section

WARNINGS (2):
- auth/register: no code examples
- users/profile: only 1 keyword

Which docs would you like to improve?
[User selects: All errors]

Fixing auth/login...

Reading auth/login.md...
Issues: missing tldr, missing Overview section

The tldr should be a single sentence (max 100 chars).
What should the tldr be?
> Authenticates users with email and password, returns JWT token

This doc is missing an Overview section.
Can you describe what this doc covers and why it exists?
> This feature handles user login. It validates credentials against the database
> and returns a JWT token for subsequent authenticated requests.

Updated auth/login

Verifying fixes...
All selected docs now pass quality checks!

[d3e4f5g] docs: improve documentation quality
```
</example>
