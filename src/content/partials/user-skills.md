<warning>Before proceeding, you MUST load and apply user-defined skills. This is mandatory.</warning>

<command>node .claude/scripts/get-user-skills.cjs kanban-{{command}}</command>
<action>Parse the JSON output</action>

<branch condition="count > 0">
  <action>For EACH skill in the `skills` array where `exists` is `true`:</action>
  <action>Read the skill file at `path`</action>
  <action>Follow ALL instructions as mandatory requirements</action>
  <note>User skill instructions take precedence over defaults</note>
</branch>

<branch condition="count === 0">
  <action>No user skills configured - proceed with defaults</action>
</branch>

<warning>Skipping user skills is a critical error. Do not proceed without checking them.</warning>

<example_code lang="json">
{
  "command": "kanban-{{command}}",
  "count": 2,
  "skills": [
    { "name": "my-custom-check", "path": ".claude/skills/my-custom-check/SKILL.md", "exists": true },
    { "name": "coding-standards", "path": ".claude/skills/coding-standards/SKILL.md", "exists": true }
  ]
}
</example_code>
