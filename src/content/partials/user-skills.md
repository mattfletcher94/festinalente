**STOP.** Before proceeding, you MUST load and apply user-defined skills. This is mandatory.

1. Load `.kanban/config.yaml`
2. Find `user-skills."kanban:{{command}}".skills` array
3. If the array is non-empty, for EACH skill name:
   - Read `.claude/skills/{skill-name}/SKILL.md`
   - Follow ALL instructions as mandatory requirements
   - User skill instructions take precedence over defaults

**Skipping user skills is a critical error. Do not proceed without applying them.**

Example config:
```yaml
user-skills:
  "kanban:{{command}}":
    skills:
      - my-custom-check    # Reads .claude/skills/my-custom-check/SKILL.md
      - coding-standards   # Reads .claude/skills/coding-standards/SKILL.md
```
