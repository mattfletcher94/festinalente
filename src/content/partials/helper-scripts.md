<note>Use these scripts to reliably find files:</note>

{{#if show_find_task}}
<command description="Find task by ID (returns JSON with path and metadata)">node .kanban/scripts/find-task.cjs {id}</command>
{{/if}}

{{#if show_find_spec}}
<command description="Find spec by ID (returns JSON with path)">node .kanban/scripts/find-spec.cjs {id}</command>
{{/if}}

{{#if show_find_plan}}
<command description="Find plan by ID (returns JSON with path)">node .kanban/scripts/find-plan.cjs {id}</command>
{{/if}}

{{#if show_list_tasks}}
<command description="List all tasks (returns JSON with count and tasks array)">node .kanban/scripts/list-tasks.cjs</command>
<command description="List tasks filtered by status">node .kanban/scripts/list-tasks.cjs --status=in-progress</command>
{{/if}}

{{#if show_next_id}}
<command description="Get next task ID (returns JSON with nextId, currentHighest, padding)">node .kanban/scripts/next-id.cjs</command>
{{/if}}

{{#if show_get_date_time}}
<command description="Get current date/time (returns JSON with iso and date formats)">node .kanban/scripts/get-date-time.cjs</command>
{{/if}}

{{#if show_get_hook_config}}
<command description="Get hook configuration (returns JSON with directives and context docs)">node .kanban/scripts/get-hook-config.cjs {hook}</command>
<example_code lang="json">
{
  "hook": "kanban-codecheck",
  "directives": [
    { "name": "check-typescript", "path": ".kanban/directives/check-typescript/DIRECTIVE.md", "exists": true }
  ],
  "product": [],
  "engineering": []
}
</example_code>
{{/if}}
