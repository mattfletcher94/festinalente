<command>node .festinalente/scripts/festinalente.cjs get-skill-config festina-{{skill}}</command>
<action>Parse the JSON output</action>

<branch condition="directives.length > 0">
  <warning>Directives are MANDATORY. You MUST follow them.</warning>
  <action>For EACH directive where `exists` is `true`:</action>
  <action>Read the directive XML file at `path`</action>
  <action>Parse and apply:</action>
  <action>- `<context>` principles: Maintain as ongoing mindset</action>
  <note>The `keywords` attribute on context principles is metadata for LLM relevance — use keywords to recognize when a principle applies to the current work.</note>
  <action>- `<process>` rules where the phase attribute, split on comma and trimmed, includes "{{skill}}" as an exact element (e.g. phase="plan,implement" matches "plan" and "implement" but NOT "plan-review"): Follow as requirements</action>
  <action>- `<override>` sections where the phase attribute, split on comma and trimmed, includes "{{skill}}" as an exact element: Apply step replacements</action>
  <action>- `<verification>` commands: Used by festina-plan to populate task &lt;verify&gt; elements and festina-implement to run step checks. Other skills can ignore this section.</action>

  <branch condition="directive has <override> section for phase={{skill}}">
    <output>
**DIRECTIVE OVERRIDE ACTIVE: {directive.name}**

The following skill steps are REPLACED by this directive:

{For each &lt;skip&gt; element:}
**SKIP STEP: `{step}`** - Do NOT execute this step when you reach it in the skill process.

**REPLACEMENT:** Execute directive rules {override.instead.rules} instead.

**Reason:** {override.reason}

**CRITICAL:** When you encounter any skipped step in the skill's &lt;process&gt;,
you MUST skip it entirely and follow the directive's replacement rules instead.
    </output>
  </branch>
  <note>`<validation>` checks will run in directive_compliance step</note>
  <note>`<examples>` will be shown if violations are found</note>
  <note>Directives are loaded in config.yaml array order. All matching phase rules from all loaded directives apply additively. Avoid mapping two directives that both override the same phase.</note>
</branch>

<example_code lang="json">
{
  "skill": "festina-{{skill}}",
  "directives": [
    { "name": "architecture", "path": ".festinalente/directives/architecture.xml", "exists": true }
  ]
}
</example_code>
