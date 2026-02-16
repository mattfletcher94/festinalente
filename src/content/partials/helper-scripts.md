<note>Use these scripts to reliably find files:</note>

{{#if show_find_task}}
<command description="Find task by ID (returns JSON with path and metadata)">node .claude/scripts/find-task.cjs {id}</command>
{{/if}}

{{#if show_find_spec}}
<command description="Find spec by ID (returns JSON with path)">node .claude/scripts/find-spec.cjs {id}</command>
{{/if}}

{{#if show_find_plan}}
<command description="Find plan by ID (returns JSON with path)">node .claude/scripts/find-plan.cjs {id}</command>
{{/if}}

{{#if show_list_tasks}}
<command description="List all tasks (returns JSON with count and tasks array)">node .claude/scripts/list-tasks.cjs</command>
<command description="List tasks filtered by status">node .claude/scripts/list-tasks.cjs --status=in-progress</command>
{{/if}}

{{#if show_next_id}}
<command description="Get next task ID (returns JSON with nextId, currentHighest, padding)">node .claude/scripts/next-id.cjs</command>
{{/if}}

{{#if show_get_date_time}}
<command description="Get current date/time (returns JSON with iso and date formats)">node .claude/scripts/get-date-time.cjs</command>
{{/if}}

{{#if show_get_user_skills}}
<command description="Get user-defined skills for a command (returns JSON with skill paths)">node .claude/scripts/get-user-skills.cjs {command}</command>
<example_code lang="json">
{
  "command": "kanban-codecheck",
  "count": 2,
  "skills": [
    { "name": "check-typescript", "path": ".claude/skills/check-typescript/SKILL.md", "exists": true }
  ]
}
</example_code>
{{/if}}
