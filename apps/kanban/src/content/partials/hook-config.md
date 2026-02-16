<step name="load_hook_config">
  <command>node .kanban/scripts/get-hook-config.cjs kanban-{{command}}</command>
  <action>Parse the JSON output</action>

  <branch condition="directives.length > 0">
    <warning>Directives are MANDATORY. You MUST follow them.</warning>
    <action>For EACH directive where `exists` is `true`:</action>
    <action>Read the directive file at `path`</action>
    <action>Follow ALL instructions as mandatory requirements</action>
  </branch>

  <branch condition="product.length > 0 OR engineering.length > 0">
    <note>Context docs are for guidance, not mandatory.</note>
    <action>Read any product/engineering docs where `exists` is `true`</action>
    <action>Use these for additional context as needed</action>
  </branch>
</step>

<example_code lang="json">
{
  "hook": "kanban-{{command}}",
  "directives": [
    { "name": "my-directive", "path": ".kanban/directives/my-directive/DIRECTIVE.md", "exists": true }
  ],
  "product": [],
  "engineering": []
}
</example_code>
