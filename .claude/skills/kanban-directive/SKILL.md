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
<note>
- **`.claude/skills/kanban-*/`** — Installed kanban skills — READ ONLY
- **`.kanban/`** — Project data and config — READ/WRITE
- **`.kanban/tasks/{id}/`** — Task folder containing `task.xml`, `spec.xml`, `plan.xml`
- **`.kanban/scripts/`** — Helper scripts for kanban operations
- **`.kanban/templates/`** — Document templates
- **`.kanban/workflow.yaml`** — Workflow config (columns, labels, transitions)
- **`.kanban/directives/`** — User-defined directives (custom instructions for skills)
</note>

<note>Use these scripts to reliably find files:</note>






<command description="Get current date/time (returns JSON with iso and date formats)">node .kanban/scripts/get-date-time.cjs</command>


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
    ## Final Validation
    
    Before completing, validate all task XML:
    
    <command description="Validate XML in all task files">node .kanban/scripts/validate-xml.cjs</command>
    
    If validation fails, fix the reported errors before completing.
    
    <output>[KANBAN_COMPLETE]</output>
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
