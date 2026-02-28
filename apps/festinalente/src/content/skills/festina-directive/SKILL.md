---
name: festina-directive
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

<note>Directives are stored at `.festinalente/directives/{name}.xml`</note>
<note>Directives are linked to skills via `.festinalente/config.yaml`</note>
</context>

<prohibited>
- Do not skip the validation step
- Do not skip the commit step
- Do not create directives without understanding their purpose
</prohibited>

<process>
  <step name="verify_festina_exists">
    <validate>Check that `.festinalente/directives/` directory exists</validate>
    <branch condition="directory doesn't exist">
      <output>Error: Festina Lente not initialized. Run `npx festinalente init` first.</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="get_directive_name" outputs="name">
    <branch condition="$ARGUMENTS provided">
      <action>Use $ARGUMENTS as name</action>
    </branch>
    <branch condition="$ARGUMENTS not provided">
      <action>Use AskUserQuestion tool with:
        - header: "Name"
        - question: "What should this directive be called? (lowercase, hyphenated, e.g., 'code-style', 'testing')"
        - options:
          - label: "code-style", description: "For code formatting and naming conventions"
          - label: "testing", description: "For test coverage and patterns"
          - label: "security", description: "For security practices and checks"
        - multiSelect: false
      </action>
      <note>User can select "Other" to type a custom name</note>
    </branch>
    <validate>Name must be lowercase, alphanumeric with hyphens only</validate>
    <validate>Check `.festinalente/directives/{name}.xml` doesn't already exist</validate>
    <branch condition="directive already exists">
      <output>Error: Directive "{name}" already exists at .festinalente/directives/{name}.xml</output>
      <action>Exit</action>
    </branch>
  </step>

  <step name="understand_purpose">
    <note>This is a **conversational session** to understand the directive's purpose.</note>

    <action>Use AskUserQuestion tool with:
      - header: "Purpose"
      - question: "What is this directive for? What problem does it solve?"
      - options:
        - label: "Code quality", description: "Enforce formatting, naming, patterns"
        - label: "Testing", description: "Test coverage and test patterns"
        - label: "Security", description: "Security practices and checks"
        - label: "Process", description: "Workflow and process rules"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe a custom purpose</note>

    <action>Based on the answer, ask follow-up questions:</action>
    <action>Use AskUserQuestion tool with:
      - header: "Type"
      - question: "Is this about code constraints, process rules, running checks, or general guidance?"
      - options:
        - label: "Code constraints", description: "Rules about code structure/style"
        - label: "Process rules", description: "Rules about workflow steps"
        - label: "Validation", description: "Automated checks to run"
        - label: "Guidance", description: "General principles and advice"
      - multiSelect: true
    </action>

    <action>Use AskUserQuestion tool with:
      - header: "Phases"
      - question: "Which workflow phases should this apply to?"
      - options:
        - label: "scope", description: "During requirements research"
        - label: "plan", description: "During implementation planning"
        - label: "implement", description: "During coding"
        - label: "check", description: "During code review"
      - multiSelect: true
    </action>

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

    <action>Use AskUserQuestion tool with:
      - header: "Principles"
      - question: "What principles should the LLM keep in mind while working?"
      - options:
        - label: "Skip", description: "Move to next question"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe principles</note>

    <action>Use AskUserQuestion tool with:
      - header: "Concepts"
      - question: "Are there any key concepts or mental models to maintain?"
      - options:
        - label: "Skip", description: "Move to next question"
        - label: "None", description: "No specific mental models"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe concepts</note>

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

    <action>Use AskUserQuestion tool with:
      - header: "Rules"
      - question: "What rules should apply during specific phases?"
      - options:
        - label: "Skip", description: "Move to next section"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe phase rules</note>

    <action>For each rule mentioned:</action>
    <action>Ask which phase(s) it applies to (scope, plan, implement, check, rework)</action>

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

    <action>Use AskUserQuestion tool with:
      - header: "Checks"
      - question: "What checks should run to verify compliance?"
      - options:
        - label: "Lint command", description: "Run a linter (eslint, prettier, etc.)"
        - label: "Test command", description: "Run tests (jest, vitest, etc.)"
        - label: "Custom check", description: "Define a custom check"
        - label: "Skip", description: "Move to next section"
      - multiSelect: false
    </action>
    <note>User can select "Other" to describe custom checks</note>

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
      <action>Use AskUserQuestion tool with:
        - header: "Command"
        - question: "What command should run?"
        - options:
          - label: "pnpm lint", description: "Run the lint command"
          - label: "pnpm test", description: "Run the test command"
          - label: "pnpm build", description: "Run the build command"
        - multiSelect: false
      </action>
      <note>User can select "Other" to specify a custom command</note>

      <action>Use AskUserQuestion tool with:
        - header: "Success"
        - question: "What does success look like?"
        - options:
          - label: "Exit code 0", description: "Command exits successfully"
          - label: "No errors", description: "No error output"
        - multiSelect: false
      </action>
      <note>User can select "Other" to describe success criteria</note>
    </branch>
    <branch condition="type is Pattern">
      <action>Use AskUserQuestion tool with:
        - header: "Pattern"
        - question: "What pattern should be forbidden or required?"
        - options:
          - label: "Skip", description: "Move to next question"
        - multiSelect: false
      </action>
      <note>User can select "Other" to specify a regex pattern</note>

      <action>Use AskUserQuestion tool with:
        - header: "Files"
        - question: "Which files should this apply to? (glob pattern)"
        - options:
          - label: "**/*.ts", description: "All TypeScript files"
          - label: "**/*.tsx", description: "All React TSX files"
          - label: "src/**/*", description: "All source files"
        - multiSelect: false
      </action>
      <note>User can select "Other" to specify a custom glob</note>

      <action>Use AskUserQuestion tool with:
        - header: "Reason"
        - question: "Why is this pattern forbidden/required?"
        - options:
          - label: "Skip", description: "Move to next question"
        - multiSelect: false
      </action>
      <note>User can select "Other" to explain the reason</note>
    </branch>
    <branch condition="type is Checklist">
      <action>Use AskUserQuestion tool with:
        - header: "Checklist"
        - question: "What items should be manually verified?"
        - options:
          - label: "Skip", description: "Move to next section"
        - multiSelect: false
      </action>
      <note>User can select "Other" to list checklist items</note>
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

    <action>Use AskUserQuestion tool with:
      - header: "Good Example"
      - question: "Can you show me an example of CORRECT behavior/code?"
      - options:
        - label: "Skip", description: "Skip correct example"
      - multiSelect: false
    </action>
    <note>User can select "Other" to provide a correct example</note>

    <action>Use AskUserQuestion tool with:
      - header: "Why Good"
      - question: "Why is this correct?"
      - options:
        - label: "Skip", description: "Move to next question"
      - multiSelect: false
    </action>
    <note>User can select "Other" to explain why it's correct</note>

    <action>Use AskUserQuestion tool with:
      - header: "Bad Example"
      - question: "Can you show me an example of INCORRECT behavior/code?"
      - options:
        - label: "Skip", description: "Skip incorrect example"
      - multiSelect: false
    </action>
    <note>User can select "Other" to provide an incorrect example</note>

    <action>Use AskUserQuestion tool with:
      - header: "Why Bad"
      - question: "Why is this wrong?"
      - options:
        - label: "Skip", description: "Move to next section"
      - multiSelect: false
    </action>
    <note>User can select "Other" to explain why it's wrong</note>

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
    <command description="Get current date">node .festinalente/scripts/festinalente.cjs get-date-time</command>
    <action>Generate directive XML from collected content</action>
    <action>Write to `.festinalente/directives/{name}.xml`</action>

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
    <command>node .festinalente/scripts/festinalente.cjs validate-directive {name}</command>
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
        - label: "festina-scope", description: "During requirements research"
        - label: "festina-plan", description: "During implementation planning"
        - label: "festina-implement", description: "During code implementation"
        - label: "festina-check", description: "During code review"
      - multiSelect: true
    </action>

    <action>Read `.festinalente/config.yaml`</action>
    <action>For each selected skill, add {name} to `directives.{skill-name}` array</action>
    <action>Write updated config.yaml</action>

    <output>
**Directive linked to skills:**
{list of selected skills}

Updated `.festinalente/config.yaml`
    </output>
  </step>

  <step name="commit">
    <note>Format: `docs: create directive - {name}`</note>
    <command>git add .festinalente/directives/{name}.xml .festinalente/config.yaml</command>
    <command>git commit -m "docs: create directive - {name}"</command>
  </step>

  <step name="output_result">
    <output>Directive created: .festinalente/directives/{name}.xml</output>
    <output>Linked to skills: {selected skills}</output>
    <output>Commit: {hash}</output>
    <output>
**Next: Test by running a skill that uses this directive**
    </output>
    {{> skill-complete}}
  </step>
</process>

<success_criteria>
- Directive file exists at `.festinalente/directives/{name}.xml`
- Directive XML is valid (passes validate-directive.cjs)
- At least one section (context, process, validation, or examples) is present
- config.yaml updated with directive in selected skills
- Git log shows `docs: create directive -`
</success_criteria>

<example>
User: `/festina-directive code-style`

```
Creating directive "code-style"...

What is this directive for? What problem does it solve?
> Enforce consistent code formatting and naming conventions

Is this about code constraints, process rules, running checks, or general guidance?
> Code constraints and validation checks

Which workflow phases should this apply to?
> implement and check

I understand this directive will:
- Purpose: Enforce consistent code formatting and naming conventions
- Apply to phases: implement, check
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
[x] festina-implement - During code implementation
[x] festina-check - During code review
[ ] festina-scope - During requirements research
[ ] festina-plan - During implementation planning

Directive linked to skills:
- festina-implement
- festina-check

Updated .festinalente/config.yaml

Directive created: .festinalente/directives/code-style.xml
Linked to: festina-implement, festina-check
Commit: c4d5e6f docs: create directive - code-style

Next: Test by running a skill that uses this directive
```
</example>

<next_steps>
Test by running `/festina-implement` or `/festina-check` on a task.
</next_steps>
