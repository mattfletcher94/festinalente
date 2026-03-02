<command>node .festinalente/scripts/festinalente.cjs get-skill-config festina-{{skill}}</command>
<action>Parse the JSON output</action>

<branch condition="directives.length > 0">
  <warning>Directives are MANDATORY. You MUST follow them.</warning>
  <action>For EACH directive where `exists` is `true`:</action>
  <action>Read the directive XML file at `path`</action>
  <action>Parse and apply:</action>
  <action>- `<context>` principles: Maintain as ongoing mindset</action>
  <action>- `<process>` rules where phase="{{skill}}": Follow as requirements</action>
  <action>- `<override>` sections where phase="{{skill}}": Apply step replacements</action>
  <action>- `<verification>` commands: Note for use in task `<verify>` elements</action>

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
</branch>

<example_code lang="json">
{
  "skill": "festina-{{skill}}",
  "directives": [
    { "name": "architecture", "path": ".festinalente/directives/architecture.xml", "exists": true }
  ]
}
</example_code>
