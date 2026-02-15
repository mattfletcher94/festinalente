**STOP.** Before proceeding, you MUST load and apply user-defined skills. This is mandatory.

1. Run `node .claude/scripts/get-user-skills.cjs kanban-{{command}}`
2. Parse the JSON output
3. If `count > 0`, for EACH skill in the `skills` array:
   - Check `exists` is `true`
   - Read the skill file at `path`
   - Follow ALL instructions as mandatory requirements
   - User skill instructions take precedence over defaults
4. If `count === 0`, no user skills configured - proceed with defaults

**Skipping user skills is a critical error. Do not proceed without checking them.**

Example output when skills are configured:
```json
{
  "command": "kanban-{{command}}",
  "count": 2,
  "skills": [
    { "name": "my-custom-check", "path": ".claude/skills/my-custom-check/SKILL.md", "exists": true },
    { "name": "coding-standards", "path": ".claude/skills/coding-standards/SKILL.md", "exists": true }
  ]
}
```
