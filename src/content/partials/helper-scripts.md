## Helper Scripts

Use these scripts to reliably find files:

```bash
{{#if show_find_task}}
# Find task by ID (returns JSON with path and metadata)
node .claude/scripts/find-task.cjs {id}

{{/if}}
{{#if show_find_spec}}
# Find spec by ID (returns JSON with path)
node .claude/scripts/find-spec.cjs {id}

{{/if}}
{{#if show_find_plan}}
# Find plan by ID (returns JSON with path)
node .claude/scripts/find-plan.cjs {id}

{{/if}}
{{#if show_list_tasks}}
# List all tasks (returns JSON with count and tasks array)
node .claude/scripts/list-tasks.cjs

# List tasks filtered by status
node .claude/scripts/list-tasks.cjs --status=in-progress

{{/if}}
{{#if show_next_id}}
# Get next task ID (returns JSON with nextId, currentHighest, padding)
node .claude/scripts/next-id.cjs

{{/if}}
{{#if show_get_date_time}}
# Get current date/time (returns JSON with iso and date formats)
node .claude/scripts/get-date-time.cjs
{{/if}}
```
