<note>Use these scripts to reliably find files:</note>

{{#if show_find_task}}
<command description="Find task by ID (returns JSON with path and metadata)">node .festinalente/scripts/festinalente.cjs find-task {id}</command>
{{/if}}

{{#if show_find_spec}}
<command description="Find spec by ID (returns JSON with path)">node .festinalente/scripts/festinalente.cjs find-spec {id}</command>
{{/if}}

{{#if show_find_plan}}
<command description="Find plan by ID (returns JSON with path)">node .festinalente/scripts/festinalente.cjs find-plan {id}</command>
{{/if}}

{{#if show_list_tasks}}
<command description="List all tasks (returns JSON with count and tasks array)">node .festinalente/scripts/festinalente.cjs list-tasks</command>
<command description="List tasks filtered by status">node .festinalente/scripts/festinalente.cjs list-tasks --status=in-progress</command>
<command description="List tasks excluding a status">node .festinalente/scripts/festinalente.cjs list-tasks --exclude-status=done</command>
{{/if}}

{{#if show_next_id}}
<command description="Get next task ID (returns JSON with nextId, currentHighest, padding, slug)">node .festinalente/scripts/festinalente.cjs next-id --title="{title}"</command>
{{/if}}

{{#if show_get_date_time}}
<command description="Get current date/time (returns JSON with iso and date formats)">node .festinalente/scripts/festinalente.cjs get-date-time</command>
{{/if}}

{{#if show_get_skill_config}}
<command description="Get skill configuration (returns JSON with directives)">node .festinalente/scripts/festinalente.cjs get-skill-config {skill}</command>
<example_code lang="json">
{
  "skill": "festina-check",
  "directives": [
    { "name": "code-review", "path": ".festinalente/directives/code-review.xml", "exists": true }
  ]
}
</example_code>
{{/if}}

{{#if show_next_quick_id}}
<command description="Get next quick ID (returns JSON with nextId, currentHighest, padding)">node .festinalente/scripts/festinalente.cjs next-quick-id</command>
{{/if}}

{{#if show_find_quick}}
<command description="Find quick task by ID (returns JSON with path and metadata)">node .festinalente/scripts/festinalente.cjs find-quick {id}</command>
{{/if}}
