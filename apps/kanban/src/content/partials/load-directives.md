<command>node .kanban/scripts/get-skill-config.cjs kanban-{{skill}}</command>
<action>Parse the JSON output</action>

<branch condition="directives.length > 0">
  <warning>Directives are MANDATORY. You MUST follow them.</warning>
  <action>For EACH directive where `exists` is `true`:</action>
  <action>Read the directive XML file at `path`</action>
  <action>Parse and apply:</action>
  <action>- `<context>` principles: Maintain as ongoing mindset</action>
  <action>- `<process>` rules where phase="{{skill}}": Follow as requirements</action>
  <action>- `<verification>` commands: Note for use in task `<verify>` elements</action>
  <note>`<validation>` checks will run in directive_compliance step</note>
  <note>`<examples>` will be shown if violations are found</note>
</branch>

<example_code lang="json">
{
  "skill": "kanban-{{skill}}",
  "directives": [
    { "name": "architecture", "path": ".kanban/directives/architecture.xml", "exists": true }
  ]
}
</example_code>
